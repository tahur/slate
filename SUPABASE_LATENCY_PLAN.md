# Supabase Latency Improvement Plan (SvelteKit + Drizzle)

## Goal

Reduce user-facing page/action latency from ~3-7s down to:

- `p95 < 1200ms` for major GET pages (`/dashboard`, `/invoices`, `/invoices/[id]`)
- `p95 < 1500ms` for write actions (`/invoices/new`, `issue`, `payments/new`)

This plan is for current architecture: SvelteKit server routes + Drizzle + `postgres` driver.

---

## Current Findings

From runtime logs and code:

1. Slow requests are real on DB-heavy routes (not only frontend hydration warning).
2. Invoice actions failed earlier in posting SQL and added retry/wait noise; fixed separately.
3. `dashboard` and invoice detail routes do many DB round-trips.
4. Current Supabase endpoint is `ap-northeast-1` pooler; region mismatch can add large RTT.
5. App uses Supabase transaction pooler semantics (`prepare: false`) which is correct for `:6543`.

---

## Important Decision: "Native Supabase connector for Svelte"

Supabase has an official Svelte/SvelteKit path (`@supabase/supabase-js` + `@supabase/ssr`), but:

- It is best for auth/session, RLS-based client/server API usage, and simple reads.
- This app needs multi-step accounting transactions and strict DB transaction control.
- Full migration away from Drizzle SQL to Supabase API is **not recommended** for core write flows.

### Recommended architecture

1. Keep core ledger/invoice/payment writes on Drizzle + Postgres driver.
2. Optionally use Supabase API/RPC only for selected read paths later.

---

## Phase 1 (Immediate, Highest Impact): Region + Connection Strategy

### 1.1 Region alignment

- If users are mostly in India, create Supabase project in `ap-south-1` (or nearest).
- If users are mostly US, use nearest US region.
- Since this is greenfield/no-data, region move is cheap now.

Expected impact: often the biggest latency reduction.

### 1.2 Runtime connection approach (fixed) + tuning flexibility

- Keep current runtime approach unchanged:
  - Supabase transaction pooler URL (`:6543`)
  - `prepare: false`
- Keep migrations on direct DB endpoint (`5432`) via `DATABASE_URL_MIGRATION`.
- Add runtime tuning via env vars (no connector/endpoint change):
  - `DB_POOL_MAX` (default `10`)
  - `DB_IDLE_TIMEOUT` (default `20`)
  - `DB_CONNECT_TIMEOUT` (default `10`)
  - `DB_PREPARE` (default `false`; keep `false` for pooler)

This gives flexibility without changing connection architecture.

### 1.3 Local development mode

- Use local Postgres for daily development to avoid network RTT noise.
- Use Supabase only for integration/staging validation.

---

## Phase 2 (Code Optimization): Reduce Round-Trips

### 2.1 Dashboard query consolidation

Current `src/lib/server/services/dashboard.ts` executes many sequential selects.

Actions:

1. Merge cash/bank/GST/payables aggregates into 1-2 SQL queries using filtered sums.
2. Keep monthly + alerts in parallel, but reduce per-helper sequential awaits.
3. Add short server cache (15-30s per org) for dashboard payload.

### 2.2 Invoice detail N+1 removal

Current `src/routes/(app)/invoices/[id]/+page.server.ts` enriches credit allocations with per-row lookups.

Actions:

1. Replace per-allocation `findFirst` calls with batched joins/maps.
2. Fetch credit note/payment reference data in one pass.

Expected impact: large improvement on invoice view load.

---

## Phase 3 (Database): Add Missing Composite/Partial Indexes

Add and validate indexes for high-frequency filters/sorts:

1. Open invoices by due date:
   - `(org_id, due_date)` partial where `status in ('issued','partially_paid')` and `balance_due > 0`
2. Credit note lookup for invoice settlement:
   - `(org_id, customer_id, status, balance)`
3. Optional invoice list acceleration:
   - `(org_id, status, invoice_date desc)` depending on list queries

Use `EXPLAIN ANALYZE` before/after for each target query.

---

## Phase 4 (Supabase Native Features)

1. Enable and inspect `pg_stat_statements` for real top queries.
2. Use Supabase query performance tooling/index advisor.
3. If read-heavy + geo-distributed users:
   - evaluate Supabase read replicas near users.
4. If DB CPU/IO is saturated:
   - scale compute tier before deep app rewrites.

---

## Phase 5 (Validation and Rollout)

### 5.1 Measurement script

Track p50/p95 for:

- `/dashboard`
- `/invoices`
- `/invoices/[id]`
- `POST /invoices/new`
- `POST /invoices/[id]?/issue`

### 5.2 Go/No-Go criteria

- `p95` target met for 24h test window.
- No increase in failed actions.
- Guardrails/check/build all pass.

---

## Execution Order (Recommended)

1. Phase 1 (region + pool tuning)
2. Phase 2 (dashboard + invoice N+1 fixes)
3. Phase 3 (indexes)
4. Phase 4 (Supabase performance tooling + optional replicas)
5. Phase 5 validation gate

---

## First Sprint Scope (2-3 days)

1. Region decision + pool tuning benchmark (`DB_POOL_MAX`, `DB_IDLE_TIMEOUT`).
2. Refactor `dashboard.ts` to fewer queries.
3. Refactor invoice detail load to remove N+1.
4. Add 2 high-impact indexes.
5. Capture before/after latency report.
