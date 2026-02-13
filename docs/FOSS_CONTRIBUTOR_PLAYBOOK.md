# Slate FOSS Contributor Playbook

Version: 1.0
Date: February 13, 2026
Audience: Human contributors and LLM coding agents

## 1. Project Philosophy

Slate is a business-first, correctness-first accounting system.

Core principles:
1. Business-first UX: users operate with invoices/payments/expenses, while the system enforces accounting correctness.
2. Ledger integrity over convenience: posted accounting entries are immutable; corrections are reversal-based.
3. KISS + DRY: keep implementations simple, centralize shared logic, avoid premature abstraction.
4. Safety gates before velocity: no change is accepted unless guardrails pass.
5. Modular monolith by design: extract clear module boundaries before considering microservices.

## 2. High-Level Architecture

Slate runs as a modular monolith on SvelteKit.

Runtime stack:
1. Frontend: Svelte 5 + SvelteKit routes.
2. Server: SvelteKit server `load`/`actions`/`+server.ts` endpoints.
3. Persistence: SQLite via `better-sqlite3` + Drizzle ORM.
4. Core business domains: invoicing, receivables, reporting, ledger/posting.
5. Platform primitives: errors, transactions, observability, guardrails.

## 3. Layered Model

Use this boundary model when contributing:
1. `routes` layer:
   - transport, auth checks, input parsing, response mapping
2. `modules/*/application` layer:
   - use-case orchestration and transaction-aware business logic
3. `modules/*/infra` layer:
   - query helpers and DB read/write primitives
4. `platform/*` layer:
   - cross-cutting concerns (errors, tx wrappers, observability)

Representative files:
1. Invoicing workflows: `src/lib/server/modules/invoicing/application/workflows.ts`
2. Receivables workflows: `src/lib/server/modules/receivables/application/workflows.ts`
3. Reporting workflows: `src/lib/server/modules/reporting/application/gst-reports.ts`
4. Transaction wrapper: `src/lib/server/platform/db/tx.ts`
5. Error mapping: `src/lib/server/platform/errors/*`
6. Observability: `src/lib/server/platform/observability/*`

## 4. How Data Flows Through the System

Write flow pattern:
1. Route action validates/authenticates.
2. Route opens transaction using `runInTx` (or calls service expecting tx).
3. Module workflow applies business rules + invariant checks.
4. Posting engine writes journal entries for accounting events.
5. Route logs activity and returns response.
6. Non-critical observability/events are recorded for diagnostics.

Read/report flow pattern:
1. Route parses query contract.
2. Reporting module builds response from infra query helpers.
3. Report cache may serve/refresh based on org + period keys.
4. Endpoint returns JSON/CSV/PDF output.

## 5. Governance Model

Authoritative governance file:
1. `docs/refactor/governance.md`

Community policy files:
1. `CONTRIBUTING.md`
2. `SECURITY.md`
3. `CODE_OF_CONDUCT.md`

Key policies:
1. `main` must stay releasable.
2. PRs are small and vertical.
3. CI gates are mandatory before merge.
4. Type safety baseline target is zero check errors.
5. Rollback-first policy for P0/P1 regressions.

## 6. Contribution Workflow (Human + LLM)

### 6.1 Before coding

1. Read impacted domain docs in `docs/` and `docs/refactor/`.
2. Identify invariant risks (ledger balance, idempotency, transaction boundaries).
3. Choose the smallest safe change set.

### 6.2 During coding

1. Keep route files thin; put business logic into module workflows.
2. Use `runInTx` for writes; never use async transaction callbacks.
3. Use centralized error mapping helpers (`failActionFromError`, `jsonFromError`).
4. Reuse tax and money helpers; avoid ad-hoc math.
5. Keep org isolation on every query path.

### 6.3 Before PR/merge

1. Run full checks:

```bash
npm run ci
```

2. If needed, run specific checks:

```bash
npm run check:phase8
npm run check:phase9
```

3. Update docs when behavior or contracts change.

## 7. LLM Contributor Contract

If you use an LLM to contribute:
1. Require file-level references in explanations.
2. Require exact commands used for validation.
3. Require explicit statement of assumptions.
4. Reject output that bypasses guardrails or weakens invariants.
5. Ensure no client-sensitive stack traces are exposed.

## 8. Safety-Critical Rules (Non-Negotiable)

1. Debits must equal credits for every posted entry.
2. Posted journal entries are immutable.
3. Cancel paths must reverse ledger state, not patch around it.
4. Payment allocations cannot exceed payment amount or invoice balance.
5. Credit application must verify DB-available balance at write time.
6. Idempotency must be race-safe (DB uniqueness + app checks).

Reference: `docs/ACCOUNTING_INVARIANTS.md`

## 9. What Was Added in the Revamp

For full implementation details across phases 0-9:
1. `docs/REVAMP_IMPLEMENTATION_SUMMARY.md`
2. `revamp.md`
3. `docs/refactor/phase2-tax-engine.md` through `docs/refactor/phase9-performance-scale.md`

## 10. Where to Start as a New Contributor

1. Read `docs/README.md`.
2. Run app and checks locally:

```bash
npm install
npm run dev
npm run ci
```

3. Pick one domain area and trace one complete flow end-to-end:
   - invoice create -> issue -> settlement -> reporting
