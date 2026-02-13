# Contributing to Slate

Thanks for contributing to Slate.

This project is an accounting system, so correctness and safety take priority over speed.

## 1. Read First

Before coding, read:
1. `docs/README.md`
2. `docs/FOSS_CONTRIBUTOR_PLAYBOOK.md`
3. `docs/ARCHITECTURE.md`
4. `docs/ACCOUNTING_INVARIANTS.md`
5. `docs/TESTING_AND_SAFETY_GUARDRAILS.md`
6. `docs/refactor/governance.md`

## 2. Local Setup

```bash
npm install
cp .env.example .env
npm run dev
```

## 3. Contribution Workflow

1. Create a branch from `main`:
   - `feature/<scope>-<short-name>` or `fix/<scope>-<short-name>`
2. Keep changes small and vertical (one behavior change per PR where possible).
3. Prefer module workflows over route-heavy business logic.
4. Add or update tests/guardrails when behavior changes.
5. Update docs when contracts, flows, or safety policy change.

## 4. Non-Negotiable Safety Rules

1. Never bypass ledger posting/reversal primitives for accounting state transitions.
2. Never allow over-allocation of payments or over-application of credits.
3. Never trust client money values without DB-verified checks.
4. Never return raw stack traces to clients.
5. Never break org-level data isolation.
6. Never use async transaction callbacks with `better-sqlite3`.

## 5. Code Standards

1. Route files orchestrate; domain logic belongs in module workflows.
2. Reuse shared money/tax utilities; avoid ad-hoc inline arithmetic.
3. Use typed domain errors and centralized error mappers.
4. Use `runInTx`/`runInExistingOrNewTx` for writes.
5. Keep implementation KISS and DRY.

## 6. Required Validation Before PR

Run full suite:

```bash
npm run ci
```

Or run targeted checks during iteration:

```bash
npm run check
npm run build
npm run check:money
npm run check:phase1
npm run check:phase2
npm run check:phase3
npm run check:phase4
npm run check:phase6
npm run check:phase7
npm run check:phase8
npm run check:phase9
```

## 7. Pull Request Checklist

Before requesting review, confirm:
1. All checks pass locally.
2. Financial invariants are preserved.
3. Transaction boundaries are explicit and safe.
4. Error responses are sanitized and structured.
5. Docs reflect behavior changes.
6. Migration notes are included if schema changed.

## 8. Human and LLM Contributor Contract

All contributors (human or LLM-assisted) must:
1. Reference changed files explicitly.
2. List commands run for validation.
3. State assumptions and edge cases.
4. Avoid hidden behavior changes.
5. Prefer deterministic, testable implementation over speculative abstraction.

For LLM-assisted contributions, reviewers should require:
1. exact file/line references for key changes
2. explicit statement that guardrails were executed
3. no fabricated files, commands, or test output

## 9. Reporting Issues

1. Use GitHub Issues for bugs/feature requests.
2. For security issues, follow `SECURITY.md`.
3. Include reproduction steps, expected behavior, and actual behavior.

## 10. License

By contributing, you agree that your contributions are licensed under the project license (`LICENSE`).
