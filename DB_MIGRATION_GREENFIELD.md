# SQLite -> Supabase Postgres Migration (Greenfield Branch)

## Purpose

This is a **new-branch, no-data** migration plan.

- We are not migrating existing SQLite data.
- We are not defining rollback for live data.
- We are replacing local persistence from SQLite + Litestream to Supabase Postgres.

This document is intentionally separate from `DB_MIGRATION.md`.

---

## Assumptions

1. You will run this work in a dedicated branch (example: `feat/postgres-migration-greenfield`).
2. There is no production dataset that must be preserved.
3. You can recreate users/org data after migration.
4. Supabase project and `DATABASE_URL` are available.

---

## Success Criteria

1. App boots and serves with Postgres.
2. Setup/signup/login flows work.
3. Core flows work: invoices, payments, expenses, credit notes, GST reports, PDFs.
4. `npm run check`, `npm run build`, and guardrails pass after guardrails are updated for Postgres.
5. No SQLite runtime references remain in app runtime paths.

---

## Phase 0: Branch + Env

1. Create branch:
   - `git checkout -b feat/postgres-migration-greenfield`
2. Add Postgres env locally:
   - `DATABASE_URL=postgresql://...`
3. Keep `ORIGIN` and Better Auth settings unchanged.

---

## Phase 0.5: Supabase Project Settings

1. Use Supabase **Transaction pooler** connection string (`:6543`) for app runtime.
2. Driver defaults for Supabase should be explicit:

```ts
import postgres from 'postgres';

const client = postgres(process.env.DATABASE_URL!, {
  ssl: 'require',
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
  prepare: false // important for Supabase transaction pooler
});
```

3. RLS policy decision must be explicit before testing:
   - If the app uses direct privileged DB connection only, keep tables accessible for server role.
   - If any path uses Supabase API roles (`anon`/`authenticated`), add policies (or disable RLS intentionally) for all touched tables.
   - Do not leave mixed/implicit RLS behavior.

---

## Phase 1: Dependencies and Core Config

1. Replace DB dependency:
   - remove `better-sqlite3` and `@types/better-sqlite3`
   - add `postgres`
2. Update `drizzle.config.ts`:
   - `dialect: 'postgresql'`
   - `dbCredentials.url = process.env.DATABASE_URL || ''`
3. Update `.env.example`:
   - remove `SLATE_DB_PATH`
   - add `DATABASE_URL` example
   - remove Litestream env examples

---

## Phase 2: DB Runtime Layer

1. Rewrite `src/lib/server/db/index.ts` to:
   - use `drizzle-orm/postgres-js`
   - create pooled postgres client
   - use explicit Supabase-safe config (`ssl`, `max`, `idle_timeout`, `prepare: false`)
   - run startup checks with `SELECT 1`
   - expose `db`, `Tx`, `getStartupCheckSnapshot()`
2. Rewrite `src/lib/server/platform/db/tx.ts`:
   - `runInTx` must be async
   - `runInExistingOrNewTx` must be async
3. Update Better Auth adapter provider in `src/lib/server/auth.ts`:
   - `provider: 'pg'`
   - keep `drizzleAdapter(db, ...)` wired to the shared `db` from `src/lib/server/db/index.ts`
   - do not create a second/independent client inside auth module
4. Update health endpoint `src/routes/api/health/+server.ts`:
   - no SQLite `prepare/get`
   - async ping via Drizzle/SQL

---

## Phase 2.5: Cloudflare Workers Target (Supabase + CF)

If deployment target is Cloudflare Workers (not Node), track this explicitly.

1. Current codebase is Node-oriented (`adapter-node`, Node APIs in server runtime).
2. Workers migration implications:
   - switch runtime adapter to Cloudflare-compatible adapter
   - remove/replace runtime Node-only APIs (`fs`, `path`, signal handlers, Node async-hooks assumptions)
   - use a Workers-compatible Postgres connection strategy
3. Recommended execution:
   - complete Postgres migration on Node runtime first
   - then perform a separate Workers compatibility pass
4. Minimum files likely affected for Workers pass:
   - `svelte.config.js`
   - `src/lib/server/db/index.ts`
   - `src/lib/server/platform/observability/context.ts`
   - `Dockerfile` and `docker-compose.yml` (if Workers becomes deployment target)

---

## Phase 3: Schema Migration (SQLite Core -> PG Core)

Target directory: `src/lib/server/db/schema/`

1. Replace `sqliteTable` with `pgTable`.
2. Replace imports from `drizzle-orm/sqlite-core` to `drizzle-orm/pg-core`.
3. Type conversion policy for this greenfield cut:
   - IDs and string fields: `text`
   - `integer(..., { mode: 'boolean' })` -> `boolean`
   - All `real()` money/rate/quantity columns -> `numeric` with `mode: 'number'`:
     - Money amounts (subtotal, total, cgst, sgst, igst, balance, etc.): `numeric('col', { precision: 14, scale: 2, mode: 'number' })`
     - Rates (rate, gst_rate, tds_rate, exchange_rate): `numeric('col', { precision: 14, scale: 4, mode: 'number' })`
     - Quantities (quantity, min_quantity): `numeric('col', { precision: 14, scale: 4, mode: 'number' })`
   - `mode: 'number'` ensures Drizzle returns JS `number` — no runtime code changes needed
   - `decimal.js` + `round2()` continue to handle all arithmetic and rounding as-is
   - 53+ columns across 10 schema files need this change (invoices, invoice_items, payments, payment_allocations, expenses, credit_notes, credit_allocations, accounts, journals, journal_lines, items)
4. Timestamp policy:
   - keep business date fields (`invoice_date`, `due_date`, etc.) as `text` unless you are ready to refactor all date handling
   - move audit fields (`created_at`, `updated_at`) to `timestamp(...).defaultNow()` or keep `text` with `NOW()::text`
   - apply one policy consistently
5. Validate unique indexes, foreign keys, and check constraints compile in PG.

---

## Phase 4: Query/API Call Conversion

Postgres Drizzle calls are async. Remove SQLite execution methods.

1. Remove `.sync()`, `.run()`, `.all()`, `.get()` usage.
2. Add `await` to all DB calls in:
   - routes
   - workflows
   - infra query helpers
   - services
   - seed utilities
3. Update all `runInTx` callsites:
   - `runInTx(...)` -> `await runInTx(async (tx) => ...)`
4. Update helper signatures from sync to async where needed.
5. Explicitly convert seed code to async:
   - `src/lib/server/seed.ts`
   - `scripts/seed_customers_vendors.ts` (if this script remains in use)

### Phase 4 Minimum File Inventory

At minimum, expect changes in these files:

1. Transaction wrapper + callers:
   - `src/lib/server/platform/db/tx.ts`
   - `src/routes/setup/+page.server.ts`
   - `src/routes/(app)/invoices/new/+page.server.ts`
   - `src/routes/(app)/payments/new/+page.server.ts`
   - `src/routes/(app)/expenses/new/+page.server.ts`
   - `src/routes/(app)/credit-notes/new/+page.server.ts`
   - `src/routes/(app)/invoices/[id]/+page.server.ts`
2. SQLite execution method removals:
   - `src/lib/server/modules/invoicing/infra/queries.ts`
   - `src/lib/server/modules/receivables/infra/queries.ts`
   - `src/lib/server/modules/receivables/application/workflows.ts`
   - `src/lib/server/modules/invoicing/application/workflows.ts`
   - `src/lib/server/services/posting-engine.ts`
   - `src/lib/server/services/number-series.ts`
   - `src/lib/server/services/audit.ts`
   - `src/lib/server/seed.ts`
3. Error/idempotency imports and behavior:
   - `src/lib/server/utils/sqlite-errors.ts` (rename target)
   - `src/routes/(app)/invoices/new/+page.server.ts`
   - `src/routes/(app)/payments/new/+page.server.ts`
   - `src/routes/(app)/expenses/new/+page.server.ts`
   - `src/routes/(app)/credit-notes/new/+page.server.ts`
4. Core infra:
   - `src/lib/server/db/index.ts`
   - `src/lib/server/auth.ts`
   - `src/routes/api/health/+server.ts`

---

## Phase 5: Error Handling and Idempotency

1. Rename `src/lib/server/utils/sqlite-errors.ts` -> `src/lib/server/utils/db-errors.ts`.
2. Use PG unique violation detection:
   - SQLSTATE `23505`
   - prefer constraint-name checks when possible
3. Update imports in all create/update routes using idempotency and uniqueness handling.

---

## Phase 6: Scripts and Guardrails (Required)

Current guardrails/scripts are SQLite-coupled and must be updated, not skipped.

1. Update `scripts/check-sync-transactions.mjs`:
   - remove failure rule that forbids async transaction callbacks
   - keep rule that enforces wrapper usage (`runInTx`)
2. Replace SQLite-only scripts:
   - `scripts/migrate.mjs`
   - `scripts/verify-backup-restore.mjs`
   - `scripts/check-integrity.mjs`
   - `scripts/check-phase9-performance.mjs` (if DB-engine specific assumptions exist)
3. Update phase docs that enforce SQLite sync-callback behavior:
   - `docs/ARCHITECTURE.md`
   - `docs/refactor/phase4-transaction-model.md`
   - contributor docs/guardrails docs where needed

---

## Phase 7: Docker and Runtime Ops

1. Remove Litestream from:
   - `Dockerfile`
   - `scripts/docker-entrypoint.sh`
   - `litestream.yml`
   - `docker-compose.yml` env/volume assumptions tied to SQLite file path
2. Replace DB env usage:
   - remove `SLATE_DB_PATH`
   - require `DATABASE_URL`
3. Keep migration-on-start behavior but implemented for Postgres migrations.

---

## Phase 8: Migrations Bootstrap (No Data Path)

Because this is greenfield:

1. Remove old SQLite migration artifacts.
2. Generate fresh Postgres migrations.
3. Push schema to Supabase.
4. Run first boot and complete setup in app UI.

---

## Validation Checklist

1. Static:
   - `npm run check`
   - `npm run build`
2. Guardrails:
   - `npm run ci:guardrails` (after scripts are migrated to Postgres semantics)
3. Runtime:
   - `/register` -> `/setup` -> `/dashboard`
   - create/issue invoice
   - record payment + allocation
   - create expense
   - create credit note
   - run GST report endpoints (JSON/CSV/PDF)
   - download invoice PDF
   - verify `/api/health` returns healthy
4. Codebase grep sanity:
   - no `better-sqlite3` in runtime app code
   - no `sqliteTable`
   - no `.sync()/.run()/.get()/.all()` leftovers

---

## Explicitly Out of Scope

1. Migrating historical SQLite data.
2. Rollback plan for production data.
3. Dual-write or dual-read compatibility.

---

## Recommended Execution Order (Short)

1. Phase 1-2 (foundation)
2. Phase 3-4 (schema + async conversion)
3. Phase 5 (errors/idempotency)
4. Phase 6 (guardrails/scripts)
5. Phase 7-8 (container + bootstrap)
6. Validation checklist
