# Testing and Safety Guardrails

Version: 1.0
Date: February 13, 2026

This document explains how to validate Slate safely before merging or deploying changes.

## 1. Test Philosophy

1. Correctness beats speed for accounting paths.
2. Guardrails are not optional; they are release gates.
3. Any change affecting money, posting, or state transitions must pass all relevant checks.

## 2. Main Commands

### Full pipeline

```bash
npm run ci
```

Runs:
1. typecheck (`npm run check`)
2. production build (`npm run build`)
3. safety guardrails (`npm run ci:guardrails`)

### Guardrail-only suite

```bash
npm run ci:guardrails
```

## 3. Guardrail Matrix

Current mandatory guardrails:
1. `npm run check:money`
   - money math policy checks (rounding/epsilon usage)
2. `npm run check:phase1`
   - safety-critical regression checks (cancellation, allocation, idempotency basics)
3. `npm run check:phase2`
   - tax engine consolidation and golden GST scenarios
4. `npm run check:phase3`
   - domain extraction boundaries (routes orchestrate, workflows own logic)
5. `npm run check:phase4`
   - transaction model checks + integrity checks
6. `npm run check:phase6`
   - error model and API contract checks
7. `npm run check:phase7`
   - critical scenario tests (invariants, cancellation/retry/idempotency)
8. `npm run check:phase8`
   - observability/ops checks + backup/restore drill verification
9. `npm run check:phase9`
   - performance/index guardrails and p95 budgets

Additional useful checks:
1. `npm run check:tx`
   - explicit sync-transaction static guard
2. `npm run check:integrity`
   - DB integrity drift/orphan/imbalance checks

## 4. When to Run What

1. Any server-side change: run `npm run ci`.
2. Route/contract/error changes: ensure `check:phase6` and `check:phase7` pass.
3. Accounting/write-flow changes: ensure `check:phase1`, `check:phase4`, `check:phase7` pass.
4. Reporting/tax changes: ensure `check:phase2`, `check:phase9` pass.
5. Observability/ops changes: ensure `check:phase8` passes.

## 5. CI Enforcement

The GitHub workflow enforces required checks in:
1. `.github/workflows/ci.yml`

Governance policy source:
1. `docs/refactor/governance.md`

## 6. Failure Triage

If a guardrail fails:
1. Reproduce locally with the single failing command.
2. Fix root cause, not the symptom.
3. Re-run `npm run ci`.
4. Include failure/fix summary in PR notes.

## 7. Safety Checklist for PR Authors

Before asking for review, confirm:
1. All required checks pass.
2. No route introduced domain-heavy write logic.
3. Transaction boundaries remain wrapper-based (`runInTx`).
4. Error responses remain sanitized and structured.
5. Accounting invariants are preserved and tested.

## 8. Example Local Validation Workflow

```bash
npm run check
npm run build
npm run ci:guardrails
```

If all pass, the change is ready for review.
