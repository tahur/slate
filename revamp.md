# Slate Refactor Revamp Plan

Version: 1.0  
Date: February 13, 2026  
Owner: Engineering (CTO Track)  
Status: Phase 0 through Phase 9 completed on February 13, 2026 (Phase 7 completed for critical deploy scope).

## 1. Purpose

This document is the execution blueprint for refactoring Slate into a cleaner, safer, and easier-to-scale system using DRY and KISS principles.

The goal is to improve maintainability, correctness, and delivery speed without disrupting existing users.

## 2. Executive Decision

### Architecture Choice

Use a **modular monolith** now, not microservices yet.

Why:
1. Current stack is SvelteKit + SQLite + Drizzle in one process.
2. Accounting workflows are transaction-heavy and consistency-critical.
3. Microservices add distributed transaction complexity too early.
4. Team and product maturity are better served by clear in-process module boundaries first.

### Microservices Later (Only If Triggered)

Re-evaluate service extraction when at least 2 of these are true:
1. Separate teams own domains independently.
2. Background/reporting/notification workloads need independent scaling.
3. Database write throughput or lock contention becomes a bottleneck.
4. Release cadence is blocked by monolith coupling.

## 3. Refactor Objectives

1. Keep accounting invariants mathematically safe and test-enforced.
2. Remove duplicated business logic from routes.
3. Standardize transaction boundaries and idempotency behavior.
4. Enforce consistent error handling and no sensitive leakage.
5. Improve developer velocity via clear module boundaries and contracts.

## 4. Current State Snapshot

Based on repository inspection:
1. Stack: SvelteKit 2, Svelte 5, Drizzle ORM, better-sqlite3, Better Auth, Zod.
2. Route/server surface is broad (many `+page.server.ts` and `+server.ts` handlers).
3. Core accounting logic exists in `src/lib/server/services/posting-engine.ts`.
4. Business workflows are still partly route-centric in places, causing duplication risk.
5. Schema has strong checks in some areas, but invariant and workflow enforcement still needs systematic coverage and tests.
6. Type-safety baseline check on February 13, 2026: `npm run check` -> `0 errors, 0 warnings` (historically this was much higher and should still be tracked as a regression KPI).

## 5. Design Principles (DRY + KISS)

1. One business rule, one home: no duplicated posting/allocation/cancellation logic in routes.
2. Routes orchestrate only: parse input, call application service, map response.
3. Services own transactions: never split a domain transaction across multiple route-level writes.
4. Explicit data contracts: no implicit shape passing from forms to domain.
5. Prefer simple modules over generic frameworks.
6. Avoid premature abstractions; abstract only after second real duplication.

## 6. Target Architecture

### 6.1 Layering

1. `routes` layer: transport + auth guard + validation wiring.
2. `application` layer: use-case orchestration and transaction boundary.
3. `domain` layer: accounting/business rules and invariants.
4. `infrastructure` layer: repositories, db adapters, external adapters.

No domain logic in UI or route handlers.

### 6.2 Domain Modules

1. `identity`: auth/session, setup, org access.
2. `invoicing`: draft, issue, cancel, numbering.
3. `receivables`: payments, allocations, advances, credit application.
4. `payables`: expenses and vendor-side posting.
5. `ledger`: journal posting/reversal, balance integrity.
6. `tax`: GST calculation rules, inclusive/exclusive handling.
7. `reporting`: statements, GST reports, PnL pipelines.
8. `platform`: idempotency, audit, observability, error mapping.

### 6.3 Suggested Folder Blueprint

```text
src/lib/server/
  modules/
    invoicing/
      application/
      domain/
      infra/
      tests/
    receivables/
      application/
      domain/
      infra/
      tests/
    ledger/
      application/
      domain/
      infra/
      tests/
    tax/
      domain/
      tests/
  platform/
    db/
    errors/
    idempotency/
    observability/
    security/
```

## 7. Phase-Wise Implementation Plan

### Phase 0: Baseline and Control Gates (Week 1)

Status: Completed on February 13, 2026.

Goals:
1. Freeze behavior before structural changes.
2. Define measurable safety gates.

Work:
1. Add ADR documenting modular monolith decision.
2. Capture baseline metrics: typecheck, build time, test count, key flow latency.
3. Add explicit TS baseline policy:
   - record daily `npm run check` count in refactor tracking
   - if errors regress above 0, block new feature PRs until baseline is restored
4. Add CI gates in two steps:
   - immediate hard gate: build + invariant tests + critical integration tests
   - hard `npm run check` gate (already enabled because baseline is 0)
5. Add rule: no new business logic directly in route files.
6. Add money-math guardrail check in CI (lint or static script) so money arithmetic uses shared helpers (`round2`, `MONEY_EPSILON`) instead of ad-hoc inline math.

Exit Criteria:
1. CI is required for merges.
2. TS gate policy and rollback policy are documented.
3. Refactor branch policy is documented.

Completion Evidence:
1. CI pipeline and guardrails in `.github/workflows/ci.yml`.
2. ADR and governance docs in `docs/adr/0001-modular-monolith.md` and `docs/refactor/governance.md`.
3. Baseline snapshot in `docs/refactor/baseline-2026-02-13.md`.
4. Guard scripts in `scripts/check-money-math.mjs` and `scripts/check-phase1-regressions.mjs`.

### Phase 1: Safety-Critical Hardening (Weeks 1-2)

Status: Completed on February 13, 2026.

Goals:
1. Close high-risk accounting and security gaps.

Work:
1. Enforce cancellation through ledger reversal APIs only.
2. Enforce payment allocation ceiling (`sum(allocations) <= payment.amount`) with transactional checks.
3. Enforce credit application availability checks from DB state, not client payload.
4. Enforce DB-level uniqueness for idempotency keys where missing.
5. Remove/guard unauthenticated debug surfaces.
6. Normalize server error responses to avoid stack leakage.
7. Fix auth API mismatches in forgot/reset password flows.

Exit Criteria:
1. All P0 issues closed.
2. All P1 safety issues either closed or tracked with mitigation and owner.
3. Regression tests exist for each fixed incident.

Completion Evidence:
1. Reversal-only cancel path enforced via invoicing workflow and posting engine.
2. Allocation and credit-application hard guards are in place with transactional checks.
3. Idempotency uniqueness checks and SQLite conflict handling are in place.
4. Forgot/reset password flow API mismatch resolved.
5. `npm run ci` passes (`check`, `build`, `check:money`, `check:phase1`).

### Phase 2: Tax Engine Consolidation (Weeks 2-3)

Status: Completed on February 13, 2026.

Goals:
1. Centralize GST inclusive/exclusive logic before domain extraction.

Work:
1. Create `tax` domain utility with explicit functions:
   - line tax compute
   - subtotal/tax/total derivation
   - inclusive to exclusive conversion
2. Ensure global and invoice-level GST settings resolve deterministically.
3. Remove duplicate ad-hoc tax math from routes/services.
4. Add golden tests for inclusive/exclusive + intra/inter-state + discount scenarios.

Exit Criteria:
1. One canonical tax computation pipeline is used by invoice and credit flows.
2. Golden tax test suite passes and is in CI.

Completion Evidence:
1. Canonical GST engine is active in `src/lib/tax/gst.ts` (`calculateLineTax`, `calculateInvoiceTaxTotals`, `resolvePricesIncludeGst`).
2. Invoice create/update workflows use canonical GST math via `src/lib/server/modules/invoicing/application/workflows.ts`.
3. Expense create flow uses canonical GST line math via `src/routes/(app)/expenses/new/+page.server.ts`.
4. Golden tax scenario suite added and gated in CI via `scripts/check-phase2-tax-consolidation.mjs` (`npm run check:phase2`).
5. Phase 2 completion notes documented in `docs/refactor/phase2-tax-engine.md`.

### Phase 3: Domain Extraction (Weeks 3-5)

Status: Completed on February 13, 2026.

Goals:
1. Move business logic from routes into module services using the new tax module.

Work:
1. Extract invoice create/issue/cancel use-cases into `modules/invoicing/application`.
2. Extract payment receive/apply into `modules/receivables/application`.
3. Extract credit note issue/apply into receivables + ledger interactions.
4. Keep routes thin and deterministic.

Exit Criteria:
1. Route handlers contain only input mapping + service calls + response mapping.
2. Duplicate logic in route files reduced by at least 50%.

Completion Evidence:
1. Invoicing workflows centralized in `src/lib/server/modules/invoicing/application/workflows.ts` (create, issue, update draft, cancel, delete draft).
2. Receivables workflows centralized in `src/lib/server/modules/receivables/application/workflows.ts` (record/apply/settle payments and credits, credit note issuance).
3. Critical write routes orchestrate module workflows instead of posting-engine internals:
   - `src/routes/(app)/invoices/new/+page.server.ts`
   - `src/routes/(app)/invoices/[id]/+page.server.ts`
   - `src/routes/(app)/payments/new/+page.server.ts`
   - `src/routes/(app)/credit-notes/new/+page.server.ts`
4. Domain extraction guardrail added and gated in CI via `scripts/check-phase3-domain-extraction.mjs` (`npm run check:phase3`).
5. Phase 3 completion notes documented in `docs/refactor/phase3-domain-extraction.md`.

### Phase 4: Data and Transaction Model Unification (Weeks 5-6)

Status: Completed on February 13, 2026.

Goals:
1. Make transaction behavior predictable and safe for SQLite/better-sqlite3 constraints.

Work:
1. Standardize transaction wrapper utility and usage pattern.
2. Codify sync-safe transaction rules for better-sqlite3.
3. Ensure posting/reversal/number-series operations share consistent boundary conventions.
4. Add integrity scripts for orphan links, imbalance detection, and allocation drift.

Exit Criteria:
1. No async transaction callback misuse.
2. Integrity check script runs clean on staging data.

Completion Evidence:
1. Transaction boundaries standardized via `src/lib/server/platform/db/tx.ts` (`runInTx`, `runInExistingOrNewTx`).
2. Sync-safe transaction misuse guard exists in `scripts/check-sync-transactions.mjs`.
3. Integrity guard exists in `scripts/check-integrity.mjs` (orphan links, imbalance, allocation drift, invalid balances).
4. Phase 4 aggregate guard added and gated in CI via `scripts/check-phase4-transaction-model.mjs` (`npm run check:phase4`).
5. Transaction model completion notes documented in `docs/refactor/phase4-transaction-model.md`.

### Phase 5: Data Access Simplification (Weeks 6-7)

Status: Completed on February 13, 2026.

Goals:
1. Reduce query duplication while keeping KISS and avoiding unnecessary abstraction.

Work:
1. Keep Drizzle as the primary data access layer for this SQLite modular monolith.
2. Move repeated query fragments into module-level query helpers (`queries.ts` style).
3. Add typed DTO mappers only where shape reuse is real (2+ call sites).
4. Add repository abstraction only if one of these triggers is true:
   - approved non-SQLite backend migration
   - cross-storage adapter requirement
   - testability gap that cannot be solved with current Drizzle patterns

Exit Criteria:
1. Query reuse and pagination patterns are standardized.
2. No generic repository layer is introduced without an ADR and trigger criteria.

Progress Update:
1. Invoicing module query fragments were extracted into `src/lib/server/modules/invoicing/infra/queries.ts` and consumed by `src/lib/server/modules/invoicing/application/workflows.ts`.
2. Receivables module query fragments were extracted into `src/lib/server/modules/receivables/infra/queries.ts` and consumed by `src/lib/server/modules/receivables/application/workflows.ts`.
3. Shared read/query fragments for payment creation are now reused by `src/routes/(app)/payments/new/+page.server.ts` via receivables query helpers.
4. GSTR1/GSTR3B report data-loading query duplication was centralized via `src/lib/server/modules/reporting/infra/gst-queries.ts` and `src/lib/server/modules/reporting/application/gst-reports.ts`.
5. Pagination parsing is standardized with `src/lib/server/platform/db/pagination.ts` and applied in `src/routes/(app)/activity-log/+page.server.ts`.
6. Phase 5 conventions and completion scope are documented in `docs/refactor/phase5-data-access.md`.

### Phase 6: Error Model and API Contracts (Weeks 7-8)

Status: Completed on February 13, 2026.

Goals:
1. Make failures explicit, safe, and debuggable.

Work:
1. Introduce typed domain errors (`ValidationError`, `InvariantError`, `ConflictError`, etc.).
2. Add centralized HTTP error mapping.
3. Add request/response schema contracts for critical endpoints.
4. Add trace IDs in error logs and responses (non-sensitive).

Exit Criteria:
1. No raw stack traces sent to client.
2. All critical workflows return structured error payloads.

Completion Evidence:
1. Typed domain error model added in `src/lib/server/platform/errors/domain.ts`.
2. Centralized HTTP error mapping added in `src/lib/server/platform/errors/http.ts`.
3. Global unhandled-error sanitization + trace ID logging added in `src/hooks.server.ts`.
4. App error payload contract updated in `src/app.d.ts` (`message`, `code`, `traceId`).
5. SvelteKit action error helper added in `src/lib/server/platform/errors/sveltekit.ts` and exported via `src/lib/server/platform/errors/index.ts`.
6. Invoicing/receivables workflows now throw typed domain errors (validation/not found/conflict/invariant) instead of stringly `Error` branches.
7. Critical accounting routes now use centralized action error mapping instead of message-string matching:
   - `src/routes/(app)/invoices/new/+page.server.ts`
   - `src/routes/(app)/invoices/[id]/+page.server.ts`
   - `src/routes/(app)/payments/new/+page.server.ts`
   - `src/routes/(app)/credit-notes/new/+page.server.ts`
8. JSON endpoint error helper (`jsonFromError`) now standardizes API error payloads with `error`, `code`, and `traceId`.
9. Remaining CRUD actions were migrated to centralized action error mapping (setup/items/vendors/customers/settings/expenses).
10. Report API request contracts were added in `src/lib/server/modules/reporting/application/gst-reports.ts` (`parseDateRangeQueryFromUrl`, `parseGstr1CsvSectionFromUrl`).
11. Report export, customer statement, customer credits, and invoice PDF endpoints now use centralized API error mapping.
12. Phase 6 contract guard suite added in `scripts/check-phase6-contracts.mjs` and wired into CI as `npm run check:phase6`.
13. Phase 6 completion notes documented in `docs/refactor/phase6-error-model.md`.

### Phase 7: Test Architecture (Weeks 8-10)

Status: Completed for critical deploy scope on February 13, 2026.

Goals:
1. Make refactors safe by default.

Work:
1. Unit tests for domain math and invariants.
2. Transactional integration tests for invoice/payment/credit flows.
3. Contract tests for API handlers.
4. Scenario tests for cancellation/reversal and retry/idempotency races.

Exit Criteria:
1. Coverage target for critical modules >= 80% line and branch coverage.
2. Required invariant test suite green in CI.

Completion Evidence (Critical Scope):
1. Phase 6 contract suite implemented in `scripts/check-phase6-contracts.mjs` (error/status payload contracts + report query contract checks).
2. Phase 7 critical suite implemented in `scripts/check-phase7-critical-tests.mjs` (GST math unit tests, invariant enforcement checks, idempotency/cancellation scenario checks, and integrity invocation).
3. CI guardrails expanded in `package.json` and `.github/workflows/ci.yml`:
   - `check:money`
   - `check:phase1`
   - `check:phase6`
   - `check:tx`
   - `check:phase7`
   - `check:integrity`
4. Test architecture notes documented in `docs/refactor/phase7-test-architecture.md`.
5. Governance updated in `docs/refactor/governance.md` with the expanded mandatory CI gate set.

### Phase 8: Observability, Audit, and Ops (Weeks 10-11)

Status: Completed on February 13, 2026.

Goals:
1. Improve production diagnostics and auditability.

Work:
1. Structured logs with event names and correlation IDs.
2. Domain event logging for accounting state transitions.
3. Health endpoint and startup checks.
4. Backup/restore runbook with periodic restore verification.

Exit Criteria:
1. Operational playbook exists and is tested.
2. Critical flows are traceable in logs end-to-end.

Completion Evidence:
1. Structured request context + JSON logger added in:
   - `src/lib/server/platform/observability/context.ts`
   - `src/lib/server/platform/observability/logger.ts`
2. Request correlation propagation added in `src/hooks.server.ts`:
   - `request_started` / `request_completed` logs
   - `x-request-id` response header
   - mapped request-failure logs with correlation IDs
3. Startup checks added in `src/lib/server/db/index.ts` and exposed via `getStartupCheckSnapshot`.
4. Health endpoint added at `src/routes/api/health/+server.ts` with DB ping and startup snapshot.
5. Domain event logs added across accounting transitions:
   - `src/lib/server/services/posting-engine.ts`
   - `src/lib/server/modules/invoicing/application/workflows.ts`
   - `src/lib/server/modules/receivables/application/workflows.ts`
6. Backup/restore runbook and drill automation added:
   - `docs/ops/backup-restore-runbook.md`
   - `scripts/verify-backup-restore.mjs`
7. Phase 8 guardrail added and gated in CI:
   - `scripts/check-phase8-observability-ops.mjs`
   - `npm run check:phase8`
8. Phase 8 completion notes documented in `docs/refactor/phase8-observability-ops.md`.

### Phase 9: Performance and Scale Readiness (Weeks 11-12)

Status: Completed on February 13, 2026.

Goals:
1. Reduce latency and lock contention.

Work:
1. Index review and query plan audit.
2. Cache/report generation strategies where appropriate.
3. Background job pipeline for heavy report/PDF generation if needed.

Exit Criteria:
1. P95 latency targets documented and met for top workflows.
2. No high-frequency N+1 or full-scan regressions in hot paths.

Completion Evidence:
1. Report cache strategy implemented in:
   - `src/lib/server/platform/observability/report-cache.ts`
   - `src/lib/server/modules/reporting/application/gst-reports.ts`
2. Cache invalidation wired to critical write flows:
   - `src/routes/(app)/invoices/new/+page.server.ts`
   - `src/routes/(app)/invoices/[id]/+page.server.ts`
   - `src/routes/(app)/credit-notes/new/+page.server.ts`
   - `src/routes/(app)/expenses/new/+page.server.ts`
3. Performance guardrail added in `scripts/check-phase9-performance.mjs`:
   - query-plan index usage checks for hot queries
   - p95 latency budget checks for top DB workflows
4. Phase 9 guardrail gated in CI via `npm run check:phase9`.
5. Phase 9 completion notes documented in `docs/refactor/phase9-performance-scale.md`.

## 8. Microservice Readiness Roadmap (Post-Refactor)

Do not split core accounting first.

Possible extraction order:
1. Notifications (email/WhatsApp)
2. Report/PDF generation workers
3. External integrations

Keep ledger + receivables + invoicing in the monolith until:
1. transaction boundaries are fully explicit,
2. event contracts are stable,
3. outbox/eventing model is implemented.

## 9. Data Integrity Program

1. Add periodic integrity jobs:
   - journal balance reconciliation
   - subledger vs GL reconciliation
   - number-series gap detection
2. Add migration safety checklist:
   - preflight snapshot
   - reversible migration script
   - post-migration invariant verification
3. Add immutable audit rules:
   - no update/delete on posted journal entries in service layer
   - reversal-only correction path

## 10. Coding Standards for Refactor Work

1. Each module exposes use-cases through a public API file.
2. Routes may not import raw table schemas directly.
3. Money calculations must use shared helpers (for example `round2`, compare helpers with `MONEY_EPSILON`, and centralized tax helpers).
4. Keep `number` + SQLite `REAL` for now; Decimal migration is deferred unless an ADR approves a full data-model migration.
5. No inline raw money arithmetic in business services.
6. Every service method declares transaction expectation:
   - `inTx` required
   - standalone transaction allowed
7. Every complex branch has at least one test.

## 11. Delivery Governance

### 11.1 Branching

1. `main`: releasable.
2. `refactor/*`: phase branches.
3. Small vertical PRs, each with tests and migration notes.

### 11.2 Definition of Done (DoD) per PR

1. Typecheck/build/tests pass.
2. No duplicated business rule introduced.
3. Error handling conforms to centralized model.
4. Added or updated tests for changed behavior.
5. Docs updated when behavior changes.

### 11.3 Required Review Checklist

1. Invariant safety verified.
2. Transaction boundary verified.
3. Idempotency behavior verified.
4. Org isolation checks verified on every query path.
5. No sensitive data in client-visible errors/logs.

## 12. KPIs to Track

Engineering KPIs:
1. Typecheck errors (target: 0 ongoing).
2. Mean PR size and merge time.
3. Defect escape rate (P0/P1 per release).

System KPIs:
1. Invoice issue success rate.
2. Payment allocation failure rate.
3. Invariant violation count.
4. P95 request latency on top 5 workflows.

Product/Operational KPIs:
1. Crash-free sessions.
2. Restore drill success rate.
3. Time to detect and resolve accounting incidents.

## 13. Risk Register

1. Risk: Hidden coupling between routes and services.  
   Mitigation: contract tests + phased extraction.
2. Risk: Migration mistakes on production SQLite file.  
   Mitigation: backup + restore drill + post-check scripts.
3. Risk: Refactor slows feature delivery.  
   Mitigation: parallel track with fixed allocation (for example 70% stability, 30% features).
4. Risk: Over-abstraction.  
   Mitigation: enforce KISS review rule and module-specific ADRs.

## 14. First 4-Week Execution Backlog

Week 1:
1. ADR + CI gates + baseline metrics.
2. Close all open safety-critical items and lock TS gate policy.

Week 2:
1. Tax engine centralization.
2. Remove duplicate tax math and align all routes.

Week 3:
1. Extract invoice issue/cancel flow into module service.
2. Add integration tests for draft -> issue -> cancel -> reverse.

Week 4:
1. Extract payment receive/allocation and credit application flow.
2. Add race/idempotency tests.

## 15. Immediate Next Build Steps

1. Keep Phase 0-9 guardrails mandatory in CI.
2. Track production KPIs weekly (invoice success, invariant violations, p95 latency).
3. Re-evaluate microservice extraction triggers only when roadmap thresholds are met.

## 16. Completion Record

As of February 13, 2026:

1. **Phase 0 completed**
   - ADR added: `docs/adr/0001-modular-monolith.md`
   - Governance and rollback policy documented: `docs/refactor/governance.md`
   - Baseline metrics documented: `docs/refactor/baseline-2026-02-13.md`
   - CI gates added: `.github/workflows/ci.yml`
   - Money math guardrail added: `scripts/check-money-math.mjs`

2. **Phase 1 completed**
   - Invoice cancellation enforces ledger reversal.
   - Allocation and credit-availability guardrails enforced in transactional paths.
   - DB-backed idempotency uniqueness with race-safe conflict handling implemented.
   - Forgot/reset password API mismatch fixed.
   - Sensitive error-response surface tightened.
   - Regression guardrail added: `scripts/check-phase1-regressions.mjs`

3. **Phase 2 completed**
   - Canonical GST engine active in invoice and expense flows.
   - Golden tax scenario guardrail added: `scripts/check-phase2-tax-consolidation.mjs`
   - Phase doc: `docs/refactor/phase2-tax-engine.md`

4. **Phase 3 completed**
   - Invoicing and receivables write workflows extracted to module application layer.
   - Critical write routes now orchestrate workflows.
   - Domain extraction guardrail added: `scripts/check-phase3-domain-extraction.mjs`
   - Phase doc: `docs/refactor/phase3-domain-extraction.md`

5. **Phase 4 completed**
   - Standardized transaction wrapper and sync transaction rules enforced.
   - Integrity checks are guardrailed.
   - Aggregate phase guard added: `scripts/check-phase4-transaction-model.mjs`
   - Phase doc: `docs/refactor/phase4-transaction-model.md`

6. **Phase 5 completed**
   - Data access simplification completed with module-level query helpers.
   - Phase doc: `docs/refactor/phase5-data-access.md`

7. **Phase 6 completed**
   - Typed domain errors and centralized HTTP/action/API error mapping completed.
   - Contract guardrail added: `scripts/check-phase6-contracts.mjs`
   - Phase doc: `docs/refactor/phase6-error-model.md`

8. **Phase 7 completed (critical deploy scope)**
   - Critical test architecture guardrails completed.
   - Guardrail: `scripts/check-phase7-critical-tests.mjs`
   - Phase doc: `docs/refactor/phase7-test-architecture.md`

9. **Phase 8 completed**
   - Structured request/domain logging and correlation IDs implemented.
   - Health endpoint + startup checks implemented.
   - Backup/restore runbook and restore drill automation implemented.
   - Guardrail: `scripts/check-phase8-observability-ops.mjs`
   - Phase doc: `docs/refactor/phase8-observability-ops.md`

10. **Phase 9 completed**
   - Report caching and invalidation for GST reports implemented.
   - Query-plan and p95 latency guardrails implemented.
   - Guardrail: `scripts/check-phase9-performance.mjs`
   - Phase doc: `docs/refactor/phase9-performance-scale.md`

---

This plan is intentionally execution-oriented.  
Phases 0-9 are complete; keep CI guardrails mandatory for all future changes.
