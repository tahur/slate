# Phase 7 Test Architecture

Date: February 13, 2026

## Scope Completed

1. Added Phase 6 contract suite in `scripts/check-phase6-contracts.mjs`:
   - validates typed error -> HTTP mapping behavior
   - validates structured error payload requirements (`error`, `code`, `traceId`)
   - validates strict report query contract behavior
   - validates route/API adoption of centralized error helpers
2. Added Phase 7 critical suite in `scripts/check-phase7-critical-tests.mjs`:
   - unit tests for GST math scenarios (inclusive/exclusive, intra/inter-state)
   - unit tests for invoice-level tax total aggregation
   - invariant enforcement checks for posting pipeline (`validateNewEntry`)
   - scenario checks for cancellation reversal path, allocation caps, credit-availability checks
   - idempotency race coverage checks for all create/write entry points
   - API contract checks for report handlers
   - integrity reconciliation execution via `scripts/check-integrity.mjs`
3. Wired new test gates into package scripts:
   - `npm run check:phase6`
   - `npm run check:phase7`
4. Elevated CI guardrails in `package.json` and `.github/workflows/ci.yml`:
   - money + phase1 + phase6 + tx + phase7 + integrity
5. Updated refactor governance CI policy in `docs/refactor/governance.md`.

## CI Commands

1. `npm run check`
2. `npm run build`
3. `npm run ci:guardrails`

Expanded guardrail set:
1. `npm run check:money`
2. `npm run check:phase1`
3. `npm run check:phase6`
4. `npm run check:tx`
5. `npm run check:phase7`
6. `npm run check:integrity`

## Residual Risk Note

1. The current project uses deterministic Node guard suites instead of a separate external test runner.
2. For the current SQLite modular-monolith stage, these suites are deploy-gating and provide stability checks for critical accounting and API contracts.
