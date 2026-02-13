# Phase 2 Tax Engine Consolidation

Date: February 13, 2026

## Scope Completed

1. Canonical GST computation is centralized in `src/lib/tax/gst.ts`:
   - `calculateLineTax`
   - `calculateInvoiceTaxTotals`
   - `resolvePricesIncludeGst`
2. Invoice create/update workflows now use the canonical GST engine via:
   - `src/lib/server/modules/invoicing/application/workflows.ts`
3. Invoice client-side totals helper now uses canonical GST helpers via:
   - `src/routes/(app)/invoices/new/schema.ts`
4. Expense creation tax split/total now uses canonical GST line calculation via:
   - `src/routes/(app)/expenses/new/+page.server.ts`
5. Golden tax scenario suite added:
   - `scripts/check-phase2-tax-consolidation.mjs`
   - covers inclusive/exclusive, intra/inter-state, mixed-rate totals, discount scenarios (discounted-rate cases), and global/invoice GST mode resolution.

## Completion Gate

1. `npm run check:phase2` passes.
2. `npm run ci:guardrails` includes `check:phase2`.
3. CI workflow includes Phase 2 guardrail step in `.github/workflows/ci.yml`.

## Deploy Readiness Note

Phase 2 exit criteria are met for the current product scope:
1. One canonical GST pipeline is in active use for invoice and expense posting paths.
2. Golden GST scenarios are enforced in CI.
