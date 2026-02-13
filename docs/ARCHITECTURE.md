# Slate Architecture

Version: 3.0  
Date: February 13, 2026  
Audience: maintainers, contributors, and LLM coding agents

This document is the source of truth for how Slate is structured and how critical financial workflows run.

## 1. System Model

Slate is a modular monolith:
1. One deployable SvelteKit app.
2. One SQLite database.
3. Clear in-process module boundaries.
4. No distributed transactions.

Why this model:
1. Financial workflows are consistency-critical.
2. SQLite + `better-sqlite3` favors simple synchronous transaction boundaries.
3. The team can move faster with explicit module boundaries before any service split.

## 2. Engineering Philosophy

1. Business-first UX: users act in invoices/payments/expenses, not debits/credits.
2. Accounting invariants first: correctness is non-negotiable.
3. Reversal-first corrections: no mutable posted ledgers.
4. KISS + DRY: keep logic centralized and explicit.
5. Guardrails over trust: CI checks enforce policy.

## 3. Runtime Architecture

### 3.1 Request lifecycle

1. Request enters `src/hooks.server.ts`.
2. `requestId` is generated and stored in request context.
3. Session is resolved through Better Auth.
4. Route `load`/`actions`/API handler executes.
5. Logs are emitted (`request_started`, `request_completed`, `request_failed`).
6. Error mapping sanitizes public payloads and hides sensitive stack traces.

### 3.2 Layering model

1. `routes/*`:
   - transport wiring, auth guards, form/query parsing, response mapping
2. `src/lib/server/modules/*/application`:
   - use-case orchestration and transaction-safe business logic
3. `src/lib/server/modules/*/infra`:
   - repeated query helpers and DB data-access primitives
4. `src/lib/server/services/*`:
   - shared accounting primitives (posting engine, number series, PDF, audit)
5. `src/lib/server/platform/*`:
   - cross-cutting concerns (tx wrappers, errors, observability)
6. `src/lib/server/db/*`:
   - schema, connection, startup checks

### 3.3 Current module map

1. `modules/invoicing`:
   - draft/create/issue/cancel workflows
2. `modules/receivables`:
   - payments, allocations, customer credit application
3. `modules/reporting`:
   - GST report query orchestration + cache invalidation
4. `platform/db`:
   - transaction wrappers for `better-sqlite3`
5. `platform/errors`:
   - typed domain errors and HTTP/action mappers
6. `platform/observability`:
   - request context, logger, report cache

## 4. Persistence and Transaction Semantics

### 4.1 SQLite baseline

Startup safety checks in `src/lib/server/db/index.ts` enforce:
1. `journal_mode = WAL`
2. `foreign_keys = ON`
3. `quick_check = ok`
4. ping query success

### 4.2 Transaction rule

All write workflows must use `runInTx`/`runInExistingOrNewTx` from `src/lib/server/platform/db/tx.ts`.

Important rule:
1. Transaction callbacks must be synchronous for `better-sqlite3`.
2. Async work must stay outside DB transaction callbacks.

This prevents runtime failures like "Transaction function cannot return a promise".

## 5. Money, Tax, and Precision

1. Money math must use shared helpers from `src/lib/utils/currency.ts`.
2. Comparison tolerances use epsilon (`MONEY_EPSILON`) where needed.
3. GST computation is centralized in `src/lib/tax/gst.ts`.
4. Invoicing workflows call canonical tax utilities, not ad-hoc math.

## 6. Core Financial Workflows

### 6.1 Invoice create/issue

Primary application workflow:
1. Parse line items and tax mode.
2. Resolve org/customer tax context.
3. Calculate totals via centralized GST utility.
4. Insert invoice + lines.
5. If issued:
   - post journal via posting engine,
   - update invoice `journal_entry_id`,
   - update customer balance,
   - emit domain event.

Reference: `src/lib/server/modules/invoicing/application/workflows.ts`

### 6.2 Invoice cancel

Safety rule:
1. Cancellation must reverse accounting via ledger reversal flow.
2. Direct status mutation without reversal is forbidden.

### 6.3 Payment and allocation

Primary safety controls:
1. Allocations are deduped per invoice.
2. Allocation totals are bounded by payment amount.
3. Invoice settlement state is updated transactionally.
4. Customer balance is adjusted in the same transaction.

Reference: `src/lib/server/modules/receivables/application/workflows.ts`

### 6.4 Credit application

Safety rule:
1. Requested credit amounts are validated against DB-verified available balances in transaction scope.
2. Client payload is treated as intent, never source of truth.

## 7. Accounting Invariant Model

Critical invariants are enforced through DB constraints, posting logic, and guardrails:
1. Debits equal credits per posted entry.
2. Posted journal entries are immutable.
3. Correction path is reversal-based.
4. Payment/credit applications cannot over-apply.
5. Idempotency is race-safe (app checks plus DB uniqueness).

See `docs/ACCOUNTING_INVARIANTS.md`.

## 8. Error and API Contract Model

1. Domain errors are typed (`ValidationError`, `InvariantError`, `ConflictError`, etc.).
2. `mapErrorToHttp` converts internal errors to safe public payloads.
3. `failActionFromError` and `jsonFromError` standardize SvelteKit error responses.
4. Public responses include `traceId` for diagnostics.
5. Raw stack traces are never returned to clients.

References:
1. `src/lib/server/platform/errors/domain.ts`
2. `src/lib/server/platform/errors/http.ts`
3. `src/lib/server/platform/errors/sveltekit.ts`

## 9. Observability and Health

1. Structured JSON logs with request context (`requestId`, path, user/org IDs).
2. Domain event logging for business transitions.
3. `/api/health` returns DB ping status, startup check snapshot, and report cache stats.
4. Health responses include `cache-control: no-store`.
5. `x-request-id` is propagated for tracing.

See `docs/HEALTH_AND_OPERATIONS.md`.

## 10. Guardrails and CI

Release gates:
1. `npm run check`
2. `npm run build`
3. `npm run ci:guardrails`

Guardrail scripts enforce phase-specific constraints:
1. money math usage
2. phase 1-9 safety checks
3. transaction sync-callback policy
4. integrity checks

See:
1. `docs/TESTING_AND_SAFETY_GUARDRAILS.md`
2. `docs/refactor/governance.md`

## 11. Deployment and Operations

1. App deploys as one Node process (SvelteKit adapter-node build).
2. SQLite is file-backed (`SLATE_DB_PATH`).
3. Backup/restore runbook is documented and validated by restore drill script.
4. Production incidents are diagnosed with trace IDs + health snapshot + integrity checks.

See `docs/ops/backup-restore-runbook.md`.

## 12. Contributor Rules for Safe Changes

1. Keep route handlers thin.
2. Put business write logic in module workflows.
3. Use transaction wrappers for writes.
4. Use shared money/tax helpers.
5. Preserve org isolation in every query path.
6. Run required checks before merge.
7. Update docs when behavior/contracts change.

## 13. Related Documents

1. `docs/FOSS_CONTRIBUTOR_PLAYBOOK.md`
2. `docs/TESTING_AND_SAFETY_GUARDRAILS.md`
3. `docs/HEALTH_AND_OPERATIONS.md`
4. `docs/REVAMP_IMPLEMENTATION_SUMMARY.md`
5. `docs/refactor/governance.md`
6. `revamp.md`
