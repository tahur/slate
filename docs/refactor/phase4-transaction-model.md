# Phase 4 Transaction Model

Date: February 13, 2026

## Scope Completed

1. Standard transaction entrypoint is implemented in `src/lib/server/platform/db/tx.ts`:
   - `runInTx`
   - `runInExistingOrNewTx`
2. Sync-only callback enforcement for better-sqlite3 is implemented in the transaction wrapper.
3. Posting/reversal operations run through shared transaction boundaries in `src/lib/server/services/posting-engine.ts`.
4. Critical write routes use `runInTx` consistently.
5. Static transaction guard implemented in `scripts/check-sync-transactions.mjs`:
   - blocks direct `db.transaction(...)` usage outside the tx wrapper
   - blocks async transaction callbacks
6. Data integrity guard implemented in `scripts/check-integrity.mjs`:
   - journal imbalance checks
   - orphan link checks
   - allocation drift checks
   - invalid negative/overpaid balances
7. Phase 4 aggregate guard added in `scripts/check-phase4-transaction-model.mjs`.

## Rules (SQLite + better-sqlite3)

1. Transaction callbacks must be synchronous.
2. No Promise-returning work inside transaction callbacks.
3. External I/O (email/HTTP/files/queue) must run after commit.
4. Domain write workflows should require `tx` or use `runInExistingOrNewTx`.
5. Ledger posting/reversal must share transaction boundaries with document-state mutations.

## Completion Gate

1. `npm run check:phase4` passes.
2. `npm run ci:guardrails` includes `check:phase4`.
3. CI workflow includes Phase 4 guardrail step in `.github/workflows/ci.yml`.

## Deploy Readiness Note

Phase 4 exit criteria are met:
1. No async transaction misuse in guarded code paths.
2. Integrity guard is mandatory in CI through Phase 4 aggregate guard.
