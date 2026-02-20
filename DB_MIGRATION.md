# SQLite → Supabase Postgres Migration

## Overview

Migrate from SQLite (better-sqlite3) to Supabase Postgres. This eliminates data loss on container restarts, removes Litestream dependency, and fixes stale session issues.

**Scope**: ~55 files modified, 210 files untouched (79% of codebase). All changes are mechanical — no business logic changes.

---

## Prerequisites

1. Create a Supabase project at https://supabase.com
2. Get the connection string from: Project Settings → Database → Connection String (URI)
3. Note the `DATABASE_URL` — format: `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`
4. Use the **Transaction pooler** (port 6543) for SvelteKit server-side code

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

In all 17 files listed below, make these changes:

```diff
- import { sqliteTable, text, integer, real, index, unique, uniqueIndex, check } from 'drizzle-orm/sqlite-core';
+ import { pgTable, text, integer, numeric, boolean, timestamp, index, unique, uniqueIndex, check } from 'drizzle-orm/pg-core';
```

Only import the types each file actually uses. The files are:

1. `accounts.ts`
2. `app_settings.ts`
3. `audit_log.ts`
4. `credit_allocations.ts`
5. `credit_notes.ts`
6. `customers.ts`
7. `expenses.ts`
8. `fiscal_years.ts`
9. `invoices.ts`
10. `items.ts`
11. `journals.ts`
12. `number_series.ts`
13. `organizations.ts`
14. `payment_modes.ts`
15. `payments.ts`
16. `users.ts`
17. `vendors.ts`

### 2b. Replace `sqliteTable` → `pgTable` in every table definition

Find and replace all occurrences across all schema files:
```diff
- export const invoices = sqliteTable('invoices', {
+ export const invoices = pgTable('invoices', {
```

### 2c. Column type mapping

Apply these type changes across ALL schema files:

| SQLite (current) | Postgres (target) | Notes |
|---|---|---|
| `text('col')` | `text('col')` | No change |
| `text('id').primaryKey()` | `text('id').primaryKey()` | No change |
| `integer('col')` | `integer('col')` | No change |
| `integer('col', { mode: 'boolean' })` | `boolean('col')` | Import `boolean` from pg-core |
| `integer('col', { mode: 'timestamp' })` | `timestamp('col', { mode: 'date' })` | Import `timestamp` from pg-core |
| `real('col')` | `numeric('col', { precision: 12, scale: 2 })` | For money/amounts. Import `numeric` from pg-core |

### 2d. Default value changes

```diff
- created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
+ created_at: timestamp('created_at', { mode: 'string' }).defaultNow(),
```

If a column stores timestamps as ISO strings (which this app does), use:
```typescript
created_at: text('created_at').default(sql`NOW()::text`),
```
OR switch to proper timestamps:
```typescript
created_at: timestamp('created_at', { mode: 'string' }).defaultNow(),
```

**IMPORTANT**: Check how timestamps are used in the app. If they're stored/read as strings (`text` columns with ISO format), the safest migration is to keep them as `text()` and change `CURRENT_TIMESTAMP` → `NOW()::text`. This avoids touching every timestamp read/write in the app.

### 2e. CHECK constraints

SQLite uses `check()` in the table definition. Postgres uses the same Drizzle `check()` API — no changes needed for the constraint logic itself. But verify the SQL expressions are Postgres-compatible:

```typescript
// These should work as-is in both:
check('positive_amount', sql`${table.amount} >= 0`)
check('single_sided', sql`(${table.debit} = 0 OR ${table.credit} = 0)`)
```

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
    max: 10,              // connection pool size
    idle_timeout: 20,     // close idle connections after 20s
    connect_timeout: 10,  // connection timeout 10s
});

export const db = drizzle(client, { schema });

// Startup check
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

// Graceful shutdown
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

**IMPORTANT**: `runStartupChecks()` is now async. Find where it's called (likely at module init) and await it. If it runs at import time, move it to a `hooks.server.ts` init block or a top-level await.

---

## Step 4: Rewrite Transaction Wrapper

**File:** `src/lib/server/platform/db/tx.ts`

Replace the ENTIRE file with:

```typescript
import { db, type Tx } from '$lib/server/db';

type TxCallback<T> = (tx: Tx) => Promise<T>;

/**
 * Run a callback inside a Postgres transaction.
 */
export async function runInTx<T>(callback: TxCallback<T>): Promise<T> {
    return db.transaction(async (tx) => callback(tx));
}

/**
 * Reuse an existing transaction when provided, otherwise open a new one.
 */
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

### 4b. Update ALL callers of `runInTx` and `runInExistingOrNewTx`

Every function that calls `runInTx()` or `runInExistingOrNewTx()` must now `await` the result. Search for all usages:

```bash
grep -rn "runInTx\|runInExistingOrNewTx" src/
```

Each call site changes:
```diff
- const result = runInTx((tx) => {
+ const result = await runInTx(async (tx) => {
    // ... all db calls inside also need await
- });
+ });
```

---

## Step 5: Remove `.sync()` Calls

There are exactly 9 `.sync()` calls. These are SQLite-specific synchronous query wrappers. Remove all of them and add `await`:

**Files with `.sync()` calls:**

1. `src/lib/server/modules/invoicing/infra/queries.ts` — lines 9, 16
2. `src/lib/server/modules/receivables/application/workflows.ts` — line 718
3. `src/lib/server/modules/receivables/infra/queries.ts` — lines 36, 54, 62, 76, 82, 88

**Pattern:**
```diff
- export function findInvoiceById(tx: Tx, orgId: string, invoiceId: string) {
-     return tx.query.invoices.findFirst({
+ export async function findInvoiceById(tx: Tx, orgId: string, invoiceId: string) {
+     return await tx.query.invoices.findFirst({
          where: and(eq(invoices.id, invoiceId), eq(invoices.org_id, orgId)),
-     }).sync();
+     });
  }
```

Make each function `async` and remove `.sync()`.

---

## Step 6: Remove `.run()`, `.all()`, `.get()` Calls

These are better-sqlite3 execution methods. With Postgres driver, Drizzle queries return Promises directly.

**Search for these patterns:**
```bash
grep -rn "\.run()\|\.all()\|\.get()" src/lib/server/
```

**Changes:**

| SQLite pattern | Postgres pattern |
|---|---|
| `db.insert(table).values(data).run()` | `await db.insert(table).values(data)` |
| `db.update(table).set(data).where(cond).run()` | `await db.update(table).set(data).where(cond)` |
| `db.delete(table).where(cond).run()` | `await db.delete(table).where(cond)` |
| `db.select().from(table).all()` | `await db.select().from(table)` |
| `db.select().from(table).get()` | `(await db.select().from(table).limit(1))[0]` |

**Key files to check:**
- `src/lib/server/seed.ts` — has `.run()`, `.all()`, `.get()` calls
- Any server route files using these patterns
- `src/lib/server/services/*.ts`

---

## Step 7: Add `await` to All Database Calls

All `db.select()`, `db.insert()`, `db.update()`, `db.delete()`, `db.query.*` calls across ~27 files need `await`.

Since all SvelteKit `load()` functions and form `actions` are already `async`, this is straightforward — just add `await` before each `db.` call.

**Search pattern to find all call sites:**
```bash
grep -rn "db\.\(select\|insert\|update\|delete\|query\)" src/routes/ src/lib/server/
```

**Example changes in a typical +page.server.ts:**
```diff
  export const load = async ({ locals }) => {
-     const items = db.select().from(itemsTable).where(eq(itemsTable.org_id, orgId));
+     const items = await db.select().from(itemsTable).where(eq(itemsTable.org_id, orgId));
      return { items };
  };
```

---

## Step 8: Update Auth Configuration

**File:** `src/lib/server/auth.ts`

Single line change:
```diff
  database: drizzleAdapter(db, {
-     provider: 'sqlite',
+     provider: 'pg',
      schema: { ... }
  }),
```

---

## Step 9: Update Error Handling

**File:** `src/lib/server/utils/sqlite-errors.ts`

Rename to `src/lib/server/utils/db-errors.ts` and update:

```diff
  export function isUniqueConstraintError(error: unknown): boolean {
      if (!(error instanceof Error)) return false;
-     const sqliteCode = (error as MaybeSqliteError).code;
-     if (sqliteCode === 'SQLITE_CONSTRAINT_UNIQUE' || sqliteCode === 'SQLITE_CONSTRAINT_PRIMARYKEY') {
-         return true;
-     }
-     const message = getErrorMessage(error);
-     return message.includes('UNIQUE constraint failed');
+     const pgCode = (error as any).code;
+     if (pgCode === '23505') return true;
+     const message = getErrorMessage(error);
+     return message.includes('duplicate key value violates unique constraint');
  }
```

Then update ALL import paths across the codebase:
```bash
grep -rn "sqlite-errors" src/
```
Change each import from `'$lib/server/utils/sqlite-errors'` → `'$lib/server/utils/db-errors'`

---

## Step 10: Update Health Check

**File:** `src/routes/api/health/+server.ts`

Replace the `pingDatabase` function:

```diff
- import { getStartupCheckSnapshot, sqlite } from '$lib/server/db';
+ import { getStartupCheckSnapshot, db } from '$lib/server/db';
+ import { sql } from 'drizzle-orm';

- function pingDatabase() {
+ async function pingDatabase() {
      const started = Date.now();
      try {
-         const row = sqlite.prepare('SELECT 1 as ok').get() as { ok?: number } | undefined;
+         const result = await db.execute(sql`SELECT 1 as ok`);
          return {
-             ok: row?.ok === 1,
+             ok: true,
              latencyMs: Date.now() - started
          };
      } catch (error) {
          // ...
      }
  }

  export const GET: RequestHandler = async ({ locals }) => {
-     const dbPing = pingDatabase();
+     const dbPing = await pingDatabase();
      const startup = getStartupCheckSnapshot();
-     const healthy = dbPing.ok && startup.foreignKeysEnabled && startup.quickCheck.toLowerCase() === 'ok';
+     const healthy = dbPing.ok && startup.connectionOk;
```

---

## Step 11: Update Drizzle Config

**File:** `drizzle.config.ts`

```diff
  export default {
      schema: './src/lib/server/db/schema/index.ts',
      out: './migrations',
-     dialect: 'sqlite',
+     dialect: 'postgresql',
      dbCredentials: {
-         url: 'data/slate.db'
+         url: process.env.DATABASE_URL || ''
      }
  } satisfies Config;
```

---

## Step 12: Update Environment Variables

**File:** `.env.example`

```diff
  # Required
  BETTER_AUTH_SECRET=change-me-to-a-random-64-char-hex
  ORIGIN=http://localhost:3000

- # Database (default: data/slate.db)
- # SLATE_DB_PATH=data/slate.db
+ # Database (Supabase Postgres)
+ DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres

- # Litestream backup (optional)
- # LITESTREAM_REPLICA_URL=gcs://your-bucket/slate.db
```

**File:** `.env` (local development)

Add the actual Supabase connection string:
```
DATABASE_URL=postgresql://postgres.[your-ref]:[your-password]@aws-0-[region].pooler.supabase.com:6543/postgres
```

---

## Step 13: Update Seed File

**File:** `src/lib/server/seed.ts`

Make all functions async and remove `.run()`, `.all()`, `.get()`:

```diff
- export function seedChartOfAccounts(orgId: string, tx?: Tx) {
+ export async function seedChartOfAccounts(orgId: string, tx?: Tx) {
      const values = INDIAN_COA_TEMPLATE.map((acc) => ({ ... }));
-     (tx || db).insert(accounts).values(values).run();
+     await (tx || db).insert(accounts).values(values);
  }

- export function seedPaymentModes(orgId: string, tx?: Tx) {
+ export async function seedPaymentModes(orgId: string, tx?: Tx) {
      const runner = tx || db;
-     const orgAccounts = runner.select(...).from(accounts).where(...).all();
+     const orgAccounts = await runner.select(...).from(accounts).where(...);
      // ...
-     runner.insert(payment_modes).values(values).run();
+     await runner.insert(payment_modes).values(values);
  }

- export function hasPaymentModes(orgId: string): boolean {
+ export async function hasPaymentModes(orgId: string): Promise<boolean> {
-     const row = db.select(...).from(payment_modes).where(...).limit(1).get();
+     const rows = await db.select(...).from(payment_modes).where(...).limit(1);
+     const row = rows[0];
      return !!row;
  }
```

Then update ALL callers of these functions to `await` them.

---

## Step 14: Clean Up Docker & Litestream

### 14a. Delete Litestream config
```bash
rm litestream.yml
```

### 14b. Update Dockerfile

Remove these lines/sections:
- `ENV SLATE_DB_PATH=/app/data/slate.db`
- `RUN apt-get install ... libstdc++6` (better-sqlite3 runtime dep)
- `mkdir -p /app/data`
- `COPY litestream.yml /etc/litestream.yml`
- `ADD https://github.com/benbjohnson/litestream/...`
- `RUN tar -C /usr/local/bin -xzf /tmp/litestream.tar.gz`

Add:
- `ENV DATABASE_URL=` (set via secrets/env at deploy time)

### 14c. Update entrypoint script
Check `scripts/docker-entrypoint.sh` — if it launches Litestream as a wrapper, simplify it to just run the Node server directly.

---

## Step 15: Generate Fresh Migrations

```bash
# Delete old SQLite migrations
rm -rf migrations/

# Generate new Postgres migrations
npx drizzle-kit generate

# Push schema to Supabase (for dev/testing)
npx drizzle-kit push
```

---

## Step 16: Remove Stale Cookie Workaround (Optional)

**File:** `src/hooks.server.ts` (lines ~155-162)

The stale session cookie fix was needed because SQLite lost data on container restarts. With Postgres, sessions persist properly. You can optionally remove:

```typescript
// Clean up stale cookie-cache cookies from before cookieCache was disabled.
if (event.cookies.get('better-auth.session_data')) {
    event.cookies.delete('better-auth.session_data', { path: '/' });
}
if (event.cookies.get('__Secure-better-auth.session_data')) {
    event.cookies.delete('__Secure-better-auth.session_data', { path: '/' });
}
```

Keep it for now if existing users may still have old cookies. Remove after a few weeks.

---

## Verification Checklist

After completing all steps, verify:

1. **Build passes**: `npx vite build` completes without errors
2. **Schema push**: `npx drizzle-kit push` creates all tables in Supabase
3. **Signup flow**: Create a new account → org setup → verify data in Supabase dashboard
4. **CRUD operations**: Create/read/update/delete items, customers, invoices
5. **Invoice creation**: Full flow — select customer, add line items, save → verify in DB
6. **PDF generation**: Download invoice PDF — should work unchanged
7. **Payments**: Record a payment, verify journal entries created
8. **Reports**: GST reports, P&L, aging — all query-heavy pages
9. **Auth**: Login, logout, password reset
10. **Health check**: `GET /api/health` returns ok
11. **No `.sync()` calls**: `grep -rn "\.sync()" src/` returns nothing
12. **No `better-sqlite3` imports**: `grep -rn "better-sqlite3" src/` returns nothing
13. **No `sqliteTable` references**: `grep -rn "sqliteTable" src/` returns nothing

---

## Files Changed Summary

| Category | Files | Change Type |
|---|---|---|
| Schema definitions | 17 files in `src/lib/server/db/schema/` | Import + type swaps |
| DB connection | `src/lib/server/db/index.ts` | Full rewrite |
| Transaction wrapper | `src/lib/server/platform/db/tx.ts` | Full rewrite |
| Auth config | `src/lib/server/auth.ts` | 1 line change |
| Error handling | `src/lib/server/utils/sqlite-errors.ts` | Rename + update codes |
| Health check | `src/routes/api/health/+server.ts` | Async + remove SQLite checks |
| Seed data | `src/lib/server/seed.ts` | Add async/await |
| Query files (`.sync()`) | 3 files in `src/lib/server/modules/` | Remove `.sync()`, add async |
| Server routes | ~27 files in `src/routes/` | Add `await` to db calls |
| Drizzle config | `drizzle.config.ts` | Dialect + credentials |
| Environment | `.env.example`, `.env` | New DATABASE_URL |
| Docker | `Dockerfile` | Remove SQLite/Litestream |
| Litestream | `litestream.yml` | Delete |
| Package | `package.json` | Swap dependencies |

**Total: ~55 files modified, ~210 files untouched**
