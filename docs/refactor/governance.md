# Refactor Governance

Date: February 13, 2026

## Scope

This document defines Phase 0 execution governance for the refactor program.

## Branch Policy

1. `main` must stay releasable.
2. Refactor work uses `refactor/*` branches.
3. PRs should be small, vertical, and include tests/guardrail updates when behavior changes.

## CI Gate Policy

Required for every PR:
1. `npm run check`
2. `npm run build`
3. `npm run check:money`
4. `npm run check:phase1`
5. `npm run check:phase2`
6. `npm run check:phase3`
7. `npm run check:phase4`
8. `npm run check:phase6`
9. `npm run check:phase7`
10. `npm run check:phase8`
11. `npm run check:phase9`

## TypeScript Baseline Policy

1. Baseline is `0` (`npm run check` on February 13, 2026).
2. Any regression above zero blocks feature merges until restored.
3. Typecheck status is tracked in baseline metrics and release notes.

## Money Math Policy

1. Use shared helpers for money arithmetic (`round2`, `MONEY_EPSILON`, domain tax helpers).
2. Literal `0.01` is disallowed outside epsilon declarations.
3. Guardrail script: `npm run check:money`.

## Rollback Policy

1. Every refactor PR must be revert-safe.
2. If P0/P1 regressions are detected after merge:
   - revert offending PR first,
   - re-open fix in isolated branch,
   - re-run full CI before re-merge.
3. Data migrations must include:
   - pre-migration backup,
   - post-migration invariant check.
