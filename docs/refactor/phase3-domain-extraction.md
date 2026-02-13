# Phase 3 Domain Extraction

Date: February 13, 2026

## Scope Completed

1. Invoicing write workflows are centralized in:
   - `src/lib/server/modules/invoicing/application/workflows.ts`
   - create, issue, update draft, cancel, delete draft
2. Receivables write workflows are centralized in:
   - `src/lib/server/modules/receivables/application/workflows.ts`
   - payment receipt, allocation validation, credit application, settlement, credit note issuance
3. Module query helpers were extracted into infra layer:
   - `src/lib/server/modules/invoicing/infra/queries.ts`
   - `src/lib/server/modules/receivables/infra/queries.ts`
4. Reporting query/service extraction completed:
   - `src/lib/server/modules/reporting/infra/gst-queries.ts`
   - `src/lib/server/modules/reporting/application/gst-reports.ts`
5. Critical routes now orchestrate module workflows instead of owning posting/ledger internals:
   - `src/routes/(app)/invoices/new/+page.server.ts`
   - `src/routes/(app)/invoices/[id]/+page.server.ts`
   - `src/routes/(app)/payments/new/+page.server.ts`
   - `src/routes/(app)/credit-notes/new/+page.server.ts`

## Completion Gate

1. `npm run check:phase3` passes.
2. `npm run ci:guardrails` includes `check:phase3`.
3. CI workflow includes Phase 3 guardrail step in `.github/workflows/ci.yml`.

## Deploy Readiness Note

Phase 3 exit criteria are met for critical accounting write flows:
1. Business write logic is in module application workflows.
2. Route handlers are orchestration-focused for those flows.
