# SQLite → Supabase Postgres Migration

## Overview

Migrate from SQLite (better-sqlite3) to Supabase Postgres. This eliminates data loss on container restarts, removes Litestream dependency, and fixes stale session issues.

**Scope**: ~55 files modified, 210 files untouched (79% of codebase).

**Risk acknowledgment**: This is NOT a purely mechanical migration. The sync→async transaction conversion touches core money flows (invoice creation, payment allocation, journal posting). Every transaction callback in the posting engine, receivables workflows, and invoicing workflows changes behavior from synchronous to asynchronous. Test every financial flow end-to-end.

---

## Prerequisites

1. Create a Supabase project at https://supabase.com
2. Get the connection string: Project Settings → Database → Connection String (URI)
3. Format: `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`
4. Use the **Transaction pooler** (port 6543) for SvelteKit server-side code
5. Supabase has native SvelteKit SSR support via `@supabase/ssr` — but we only use Supabase as a **Postgres host**. Auth stays with better-auth (already works with Postgres via `provider: 'pg'`). No need to install `@supabase/supabase-js` or `@supabase/ssr`.

---

## Phase 0: Data Migration Strategy (BEFORE any code changes)

### 0a. Export existing SQLite data

If production data exists, export it BEFORE any schema changes:

```bash
# Dump all data as SQL INSERT statements
sqlite3 data/slate.db .dump > backup_full.sql

# Or export each table as CSV for Postgres COPY
sqlite3 -header -csv data/slate.db "SELECT * FROM organizations;" > export/organizations.csv
sqlite3 -header -csv data/slate.db "SELECT * FROM users;" > export/users.csv
# ... repeat for all 23 tables
```

### 0b. Data type conversion plan

SQLite stores everything loosely typed. When importing to Postgres:

| SQLite column type | Stored as | Postgres target | Conversion needed |
|---|---|---|---|
| `text` (timestamps) | `"2024-03-15 10:30:00"` | `timestamptz` | Cast: `TO_TIMESTAMP(col, 'YYYY-MM-DD HH24:MI:SS')` |
| `integer` (timestamps) | Unix epoch ms | `timestamptz` | Cast: `TO_TIMESTAMP(col / 1000)` |
| `integer` (booleans) | `0` or `1` | `boolean` | Cast: `col::boolean` or `col = 1` |
| `real` (money) | IEEE 754 float | `numeric(15,2)` | Cast: `ROUND(col::numeric, 2)` |
| `real` (quantities) | IEEE 754 float | `numeric(10,4)` | Cast: `ROUND(col::numeric, 4)` |
| `real` (rates/percentages) | IEEE 754 float | `numeric(10,4)` | Cast: `ROUND(col::numeric, 4)` |

### 0c. Import script template

After Postgres schema is created (Step 15), import data:

```bash
# Use pgloader for automatic SQLite→Postgres migration
pgloader sqlite:///path/to/slate.db postgresql://user:pass@host:6543/postgres

# OR use a manual approach:
# 1. Create schema via drizzle-kit push
# 2. Import CSVs via psql \copy
# 3. Verify row counts match
```

### 0d. Data validation after import

```sql
-- Compare row counts
SELECT 'organizations' as tbl, count(*) FROM organizations
UNION ALL SELECT 'users', count(*) FROM users
UNION ALL SELECT 'invoices', count(*) FROM invoices
UNION ALL SELECT 'payments', count(*) FROM payments
-- ... all tables

-- Verify money precision (spot check)
SELECT id, total, balance_due FROM invoices
WHERE ABS(total - ROUND(total, 2)) > 0.001;

-- Verify journal balance invariant
SELECT je.id, je.total_debit, je.total_credit,
       ABS(je.total_debit - je.total_credit) as diff
FROM journal_entries je
WHERE ABS(je.total_debit - je.total_credit) > 0.01;
```

---

## Phase 1: Money Type Strategy (CRITICAL — decide before coding)

### The problem

The app has **53 `real()` columns** storing money, quantities, and rates. SQLite `real` = IEEE 754 double (float). The app already uses `decimal.js` for application-level arithmetic, but:

1. **Database-level arithmetic** exists in `posting-engine.ts`:
   ```typescript
   .set({ balance: sql`ROUND(${accounts.balance} + ${balanceChange}, 2)` })
   ```
2. **CHECK constraints** use `ROUND()` on floats:
   ```typescript
   check('entry_balanced', sql`ROUND(total_debit, 2) = ROUND(total_credit, 2)`)
   ```
3. **Integrity check scripts** use `ROUND()` extensively

### The decision: Use `numeric(15,2)` for money, `numeric(10,4)` for rates/quantities

| Column purpose | Examples | Postgres type |
|---|---|---|
| Money amounts | `total`, `amount`, `balance`, `cgst`, `sgst`, `igst`, `subtotal`, `amount_paid`, `balance_due`, `tds_amount`, `base_currency_total` | `numeric('col', { precision: 15, scale: 2 })` |
| Rates/percentages | `gst_rate`, `tds_rate`, `exchange_rate`, `discount_value` (when %) | `numeric('col', { precision: 10, scale: 4 })` |
| Quantities | `quantity`, `min_quantity` | `numeric('col', { precision: 10, scale: 4 })` |

### Runtime impact

- `decimal.js` arithmetic is already safe — no changes needed there
- Drizzle returns `string` for Postgres `numeric` columns by default — you MUST coerce to `number` at read time OR configure Drizzle's `numeric` mode
- Use `{ mode: 'number' }` on numeric columns to get JS numbers back:
  ```typescript
  total: numeric('total', { precision: 15, scale: 2, mode: 'number' }).default(0),
  ```
- **Verify**: after migration, run the full integrity check to confirm all journal entries still balance

### SQL arithmetic changes

```diff
# posting-engine.ts — ROUND() behavior changes with numeric
- .set({ balance: sql`ROUND(${accounts.balance} + ${balanceChange}, 2)` })
+ .set({ balance: sql`ROUND(${accounts.balance} + ${balanceChange}, 2)` })
# No change needed — ROUND() with numeric is actually MORE accurate than with float
```

### CHECK constraint changes

```diff
# journals.ts — CHECK constraints
- check('entry_balanced', sql`ROUND(total_debit, 2) = ROUND(total_credit, 2)`)
+ check('entry_balanced', sql`total_debit = total_credit`)
# With numeric(15,2), values are already exact to 2 decimals. ROUND() is redundant but harmless.
```

---

## Phase 2: Timestamp Strategy (decide ONE approach)

### Current state

The app uses TWO different timestamp patterns:

1. **Business tables** (invoices, customers, etc.): `text('created_at').default(sql\`CURRENT_TIMESTAMP\`)`
   - Stored as ISO 8601 text strings: `"2024-03-15 10:30:00"`
   - Read/written as strings throughout the app

2. **Auth tables** (users, sessions): `integer('created_at', { mode: 'timestamp' })`
   - Stored as Unix epoch integers
   - better-auth manages these internally

### The decision: Keep text timestamps as text, convert auth timestamps

**Business tables**: Keep as `text()` to avoid touching every timestamp read/write. Change only the default:
```diff
- created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
+ created_at: text('created_at').default(sql`NOW()::text`),
```

**Auth tables**: Convert to proper Postgres timestamps. better-auth with `provider: 'pg'` expects this:
```diff
- created_at: integer('created_at', { mode: 'timestamp' }),
+ created_at: timestamp('created_at', { mode: 'date' }).defaultNow(),
```

**Rationale**: Touching every timestamp in business logic is high-risk for no benefit. Text timestamps work fine in Postgres. Auth tables are managed by better-auth internally, so they must match what better-auth expects for Postgres.

---

## Step 1: Update Dependencies

```bash
npm uninstall better-sqlite3 @types/better-sqlite3
npm install postgres
```

**package.json changes:**
- Remove: `"better-sqlite3": "^12.6.2"` from dependencies
- Remove: `"@types/better-sqlite3": "^7.6.13"` from devDependencies
- Add: `"postgres": "^3.4.5"` to dependencies

---

## Step 2: Update All 17 Schema Files

**Directory:** `src/lib/server/db/schema/`

### 2a. Replace imports in EVERY schema file

```diff
- import { sqliteTable, text, integer, real, index, unique, uniqueIndex, check } from 'drizzle-orm/sqlite-core';
+ import { pgTable, text, integer, numeric, boolean, timestamp, index, unique, uniqueIndex, check } from 'drizzle-orm/pg-core';
```

Only import the types each file actually uses. The 17 files:
`accounts.ts`, `app_settings.ts`, `audit_log.ts`, `credit_allocations.ts`, `credit_notes.ts`, `customers.ts`, `expenses.ts`, `fiscal_years.ts`, `invoices.ts`, `items.ts`, `journals.ts`, `number_series.ts`, `organizations.ts`, `payment_modes.ts`, `payments.ts`, `users.ts`, `vendors.ts`

### 2b. Replace `sqliteTable` → `pgTable`

Find and replace all occurrences across all schema files.

### 2c. Column type mapping

| SQLite (current) | Postgres (target) | Notes |
|---|---|---|
| `text('col')` | `text('col')` | No change |
| `text('id').primaryKey()` | `text('id').primaryKey()` | No change |
| `integer('col')` | `integer('col')` | No change |
| `integer('col', { mode: 'boolean' })` | `boolean('col')` | Import `boolean` from pg-core |
| `integer('col', { mode: 'timestamp' })` | `timestamp('col', { mode: 'date' }).defaultNow()` | Auth tables only |
| `real('col')` for money | `numeric('col', { precision: 15, scale: 2, mode: 'number' })` | See Phase 1 |
| `real('col')` for rates | `numeric('col', { precision: 10, scale: 4, mode: 'number' })` | See Phase 1 |
| `real('col')` for quantities | `numeric('col', { precision: 10, scale: 4, mode: 'number' })` | See Phase 1 |

### 2d. Default value changes

Business table timestamps:
```diff
- created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
+ created_at: text('created_at').default(sql`NOW()::text`),
```

### 2e. CHECK constraints

With `numeric(15,2)`, values are exact. `ROUND()` in CHECK constraints is redundant but harmless. Keep as-is — they'll work correctly in Postgres.

---

## Step 3: Rewrite Database Connection

**File:** `src/lib/server/db/index.ts`

Replace the ENTIRE file with:

```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { env } from '$env/dynamic/private';
import { logger } from '$lib/server/platform/observability';

const connectionString = env.DATABASE_URL;
if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is required');
}

const client = postgres(connectionString, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
});

export const db = drizzle(client, { schema });

export interface StartupCheckSnapshot {
    checkedAt: string;
    connectionOk: boolean;
}

let startupCheckSnapshot: StartupCheckSnapshot;

export async function runStartupChecks(): Promise<StartupCheckSnapshot> {
    try {
        await client`SELECT 1`;
        startupCheckSnapshot = {
            checkedAt: new Date().toISOString(),
            connectionOk: true,
        };
        logger.info('startup_checks_passed', { ...startupCheckSnapshot });
        return startupCheckSnapshot;
    } catch (err) {
        logger.error('startup_checks_failed', {}, err);
        throw new Error('Database connection failed');
    }
}

export function getStartupCheckSnapshot(): StartupCheckSnapshot {
    return startupCheckSnapshot;
}

export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

process.on('SIGTERM', async () => {
    logger.info('sigterm_received', { action: 'closing_pool' });
    try {
        await client.end();
        logger.info('db_pool_closed');
    } catch (err) {
        logger.error('shutdown_failed', {}, err);
    }
    process.exit(0);
});
```

**IMPORTANT**: `runStartupChecks()` is now async. Find where it's called and await it.

---

## Step 4: Rewrite Transaction Wrapper

**File:** `src/lib/server/platform/db/tx.ts`

Replace the ENTIRE file with:

```typescript
import { db, type Tx } from '$lib/server/db';

type TxCallback<T> = (tx: Tx) => Promise<T>;

export async function runInTx<T>(callback: TxCallback<T>): Promise<T> {
    return db.transaction(async (tx) => callback(tx));
}

export async function runInExistingOrNewTx<T>(
    tx: Tx | undefined,
    callback: TxCallback<T>
): Promise<T> {
    if (tx) {
        return callback(tx);
    }
    return runInTx(callback);
}
```

### 4b. Update ALL callers

Every `runInTx()` / `runInExistingOrNewTx()` call must become `await runInTx(async (tx) => { ... })`.

```bash
grep -rn "runInTx\|runInExistingOrNewTx" src/
```

**Pay extra attention to these critical money-flow callers:**
- `src/lib/server/modules/invoicing/application/workflows.ts` — invoice creation, posting
- `src/lib/server/modules/receivables/application/workflows.ts` — payment allocation, credit notes
- `src/lib/server/services/posting-engine.ts` — journal entry creation
- `src/routes/setup/+page.server.ts` — org setup with seed data

All transaction callbacks must become `async` and all db calls inside them must be `await`ed.

---

## Step 5: Remove `.sync()` Calls (9 instances)

**Files:**
1. `src/lib/server/modules/invoicing/infra/queries.ts` — lines 9, 16
2. `src/lib/server/modules/receivables/application/workflows.ts` — line 718
3. `src/lib/server/modules/receivables/infra/queries.ts` — lines 36, 54, 62, 76, 82, 88

```diff
- export function findInvoiceById(tx: Tx, orgId: string, invoiceId: string) {
-     return tx.query.invoices.findFirst({ ... }).sync();
+ export async function findInvoiceById(tx: Tx, orgId: string, invoiceId: string) {
+     return await tx.query.invoices.findFirst({ ... });
  }
```

---

## Step 6: Remove `.run()`, `.all()`, `.get()` Calls

```bash
grep -rn "\.run()\|\.all()\|\.get()" src/lib/server/
```

| SQLite | Postgres |
|---|---|
| `.run()` | Remove (Drizzle returns Promise) |
| `.all()` | Remove (default return is array) |
| `.get()` | `const rows = await ...; const row = rows[0];` |

---

## Step 7: Add `await` to All Database Calls (~27 files)

```bash
grep -rn "db\.\(select\|insert\|update\|delete\|query\)" src/routes/ src/lib/server/
```

All SvelteKit `load()` and `actions` are already `async` — just add `await`.

---

## Step 8: Update Auth Configuration

**File:** `src/lib/server/auth.ts`

```diff
- provider: 'sqlite',
+ provider: 'pg',
```

---

## Step 9: Update Error Handling

**File:** `src/lib/server/utils/sqlite-errors.ts` → rename to `db-errors.ts`

```diff
- if (sqliteCode === 'SQLITE_CONSTRAINT_UNIQUE' || sqliteCode === 'SQLITE_CONSTRAINT_PRIMARYKEY') {
+ const pgCode = (error as any).code;
+ if (pgCode === '23505') return true;

- return message.includes('UNIQUE constraint failed');
+ return message.includes('duplicate key value violates unique constraint');
```

Update all imports: `grep -rn "sqlite-errors" src/` → change to `db-errors`.

---

## Step 10: Update Health Check

**File:** `src/routes/api/health/+server.ts`

- Replace `sqlite.prepare('SELECT 1').get()` → `await db.execute(sql\`SELECT 1\`)`
- Make `pingDatabase()` async
- Remove SQLite-specific checks (pragmas, WAL, foreignKeys)

---

## Step 11: Update Drizzle Config

**File:** `drizzle.config.ts`

```diff
- dialect: 'sqlite',
- dbCredentials: { url: 'data/slate.db' }
+ dialect: 'postgresql',
+ dbCredentials: { url: process.env.DATABASE_URL || '' }
```

---

## Step 12: Update Environment Variables

**`.env.example`:**
```diff
- # SLATE_DB_PATH=data/slate.db
- # LITESTREAM_REPLICA_URL=gcs://your-bucket/slate.db
+ DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
```

---

## Step 13: Update Seed File

**File:** `src/lib/server/seed.ts`

Make all functions `async`, remove `.run()`, `.all()`, `.get()`, and update all callers.

---

## Step 14: Update CI/Tooling Scripts (CRITICAL — do not skip)

### 14a. `scripts/check-sync-transactions.mjs`

This CI script ENFORCES sync transactions (line 54: `asyncPattern = /\.transaction\s*\(\s*async\b/g`). It will **fail the build** after migration because Postgres transactions ARE async.

**Action:** Rewrite to enforce the OPPOSITE — all transaction callbacks MUST be async:

```javascript
// OLD: blocks async transaction callbacks
const asyncPattern = /\.transaction\s*\(\s*async\b/g;
// NEW: blocks SYNC transaction callbacks (should always be async now)
const syncPattern = /\.transaction\s*\(\s*\(/g; // non-async arrow
```

Or simply delete this check and rely on TypeScript types to enforce async callbacks.

### 14b. `scripts/migrate.mjs`

Currently uses `better-sqlite3` and `drizzle-orm/better-sqlite3/migrator`. Rewrite for Postgres:

```javascript
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';

const client = postgres(process.env.DATABASE_URL);
const db = drizzle(client);
await migrate(db, { migrationsFolder: './migrations' });
await client.end();
```

### 14c. `scripts/check-integrity.mjs`

Uses SQLite-specific patterns:
- `pragma('integrity_check')` → Replace with `SELECT 1` connection test
- `ROUND(COALESCE(...), 2)` → Works in Postgres but verify behavior with `numeric` type
- `sqlite.prepare(...)` → Use `postgres` client directly

**Rewrite all queries to use `postgres` package directly.** The accounting invariant checks (balanced journals, non-negative amounts) are critical and MUST work in Postgres.

### 14d. `scripts/verify-backup-restore.mjs`

Uses `VACUUM INTO` (SQLite-specific). Delete this file and replace with Postgres backup/restore script (see Step 17).

### 14e. `scripts/check-phase9-performance.mjs`

Uses `EXPLAIN QUERY PLAN` (SQLite). Replace with `EXPLAIN ANALYZE` (Postgres) with different output parsing.

### 14f. `scripts/docker-entrypoint.sh`

Currently runs Litestream restore on startup (lines 10-42). Rewrite to:
1. Run `scripts/migrate.mjs` (Postgres migrations)
2. Start the Node server directly (no Litestream wrapper)

### 14g. Update `docs/ARCHITECTURE.md` (line 86)

```diff
- 1. Transaction callbacks must be synchronous for `better-sqlite3`.
- 2. Async work must stay outside DB transaction callbacks.
+ 1. Transaction callbacks are async (Postgres).
+ 2. All database calls inside transactions must be awaited.
```

---

## Step 15: Generate Fresh Migrations

```bash
# Delete old SQLite migrations
rm -rf migrations/

# Generate new Postgres migrations from updated schema
npx drizzle-kit generate

# Push schema to Supabase (dev/testing)
npx drizzle-kit push
```

**If migrating existing data**, do the data import (Phase 0) AFTER `drizzle-kit push` creates the tables but BEFORE running the app.

---

## Step 16: Clean Up Docker & Litestream

### 16a. Delete Litestream config
```bash
rm litestream.yml
```

### 16b. Update Dockerfile

Remove:
- `ENV SLATE_DB_PATH=...`
- `RUN apt-get install ... libstdc++6` (better-sqlite3 dep)
- `mkdir -p /app/data`
- `COPY litestream.yml ...`
- `ADD https://github.com/benbjohnson/litestream/...`
- `RUN tar -C /usr/local/bin ...`

Add:
- `ENV DATABASE_URL=` (set via secrets at deploy time)

---

## Step 17: Postgres Backup & Restore Runbook (replaces Litestream)

Supabase handles backups automatically (daily snapshots on Pro plan). For additional safety:

### Manual backup
```bash
# Via Supabase CLI
supabase db dump -p [project-ref] --data-only > backup_$(date +%Y%m%d).sql

# Via pg_dump
pg_dump $DATABASE_URL --data-only --format=custom > backup_$(date +%Y%m%d).dump
```

### Restore
```bash
# Via psql
psql $DATABASE_URL < backup.sql

# Via pg_restore (custom format)
pg_restore --clean --if-exists -d $DATABASE_URL backup.dump
```

### Automated backup script (replaces verify-backup-restore.mjs)

Create `scripts/backup-postgres.sh`:
```bash
#!/bin/bash
set -euo pipefail
BACKUP_DIR="${BACKUP_DIR:-./backups}"
mkdir -p "$BACKUP_DIR"
FILENAME="$BACKUP_DIR/slate_$(date +%Y%m%d_%H%M%S).dump"
pg_dump "$DATABASE_URL" --format=custom > "$FILENAME"
echo "Backup saved: $FILENAME"
# Keep last 7 days
find "$BACKUP_DIR" -name "slate_*.dump" -mtime +7 -delete
```

---

## Step 18: Remove Stale Cookie Workaround (Optional)

**File:** `src/hooks.server.ts` (lines ~155-162)

Keep for now if existing users may have old cookies. Remove after a few weeks.

---

## Verification Checklist

### Build & Schema
- [ ] `npx vite build` passes
- [ ] `npx drizzle-kit push` creates all tables in Supabase
- [ ] `grep -rn "\.sync()" src/` returns nothing
- [ ] `grep -rn "better-sqlite3" src/` returns nothing
- [ ] `grep -rn "sqliteTable" src/` returns nothing
- [ ] `grep -rn "sqlite-errors" src/` returns nothing
- [ ] `grep -rn "real(" src/lib/server/db/schema/` returns nothing

### Functional (test EVERY financial flow)
- [ ] Signup → org setup → seed data created in Supabase
- [ ] Create customer → verify in Supabase dashboard
- [ ] Create item with HSN code → verify saved
- [ ] Create invoice → line items → GST calculation → save
- [ ] Verify journal entries created with balanced debits/credits
- [ ] Record payment → verify allocation + journal entries
- [ ] Create credit note → verify balance updates
- [ ] Download invoice PDF → verify unchanged
- [ ] GST reports (GSTR-1, GSTR-3B) → verify calculations
- [ ] P&L report → verify account balances
- [ ] Aging report → verify outstanding amounts
- [ ] Login, logout, password reset

### Integrity (run AFTER data import if migrating)
- [ ] All journal entries balance: `total_debit = total_credit`
- [ ] No negative money amounts where not expected
- [ ] Invoice `balance_due = total - amount_paid`
- [ ] Customer balances match sum of outstanding invoices
- [ ] `GET /api/health` returns ok

### CI/Scripts
- [ ] `scripts/check-sync-transactions.mjs` updated or removed
- [ ] `scripts/migrate.mjs` works with Postgres
- [ ] `scripts/check-integrity.mjs` works with Postgres
- [ ] `docs/ARCHITECTURE.md` updated (sync→async rule)

---

## Files Changed Summary

| Category | Files | Change Type |
|---|---|---|
| Schema definitions | 17 files in `src/lib/server/db/schema/` | Import + type swaps + numeric precision |
| DB connection | `src/lib/server/db/index.ts` | Full rewrite |
| Transaction wrapper | `src/lib/server/platform/db/tx.ts` | Full rewrite (sync→async) |
| Auth config | `src/lib/server/auth.ts` | `provider: 'pg'` |
| Error handling | `src/lib/server/utils/sqlite-errors.ts` | Rename + Postgres error codes |
| Health check | `src/routes/api/health/+server.ts` | Async + remove SQLite checks |
| Seed data | `src/lib/server/seed.ts` | Async conversion |
| Query files (`.sync()`) | 3 files in `src/lib/server/modules/` | Remove `.sync()`, add async |
| Server routes | ~27 files in `src/routes/` | Add `await` to db calls |
| Drizzle config | `drizzle.config.ts` | Dialect + credentials |
| Environment | `.env.example`, `.env` | `DATABASE_URL` |
| Docker | `Dockerfile` | Remove SQLite/Litestream |
| Litestream | `litestream.yml` | Delete |
| Package | `package.json` | Swap dependencies |
| CI script | `scripts/check-sync-transactions.mjs` | Invert or remove sync check |
| Migration script | `scripts/migrate.mjs` | Rewrite for Postgres |
| Integrity script | `scripts/check-integrity.mjs` | Rewrite for Postgres |
| Backup script | `scripts/verify-backup-restore.mjs` | Replace with `backup-postgres.sh` |
| Performance script | `scripts/check-phase9-performance.mjs` | Replace EXPLAIN QUERY PLAN → EXPLAIN ANALYZE |
| Entrypoint | `scripts/docker-entrypoint.sh` | Remove Litestream, add migrate |
| Architecture docs | `docs/ARCHITECTURE.md` | Update sync→async rule |

**Total: ~60 files modified, ~205 files untouched**

---

## Risk Matrix

| Risk | Severity | Mitigation |
|---|---|---|
| Sync→async transaction race conditions | HIGH | Test every money flow. Run integrity checks after each test. |
| `real()` → `numeric()` precision drift | HIGH | Use `mode: 'number'` on all numeric columns. Run parallel comparison. |
| CHECK constraint `ROUND()` behavior | MEDIUM | With numeric type, ROUND() is exact. Test journal entry creation. |
| Timestamp format mismatch | MEDIUM | Keep business timestamps as text. Only convert auth tables. |
| Data loss during migration | HIGH | Full SQLite backup before ANY changes. Verify row counts after import. |
| CI breaks (check-sync-transactions) | LOW | Update script BEFORE merging async changes. |
| Backup model gap (no Litestream) | MEDIUM | Supabase daily snapshots + manual pg_dump script. |
