# Phase 6 Error Model and API Contracts

Date: February 13, 2026

## Scope Completed

1. Introduced typed domain error classes in `src/lib/server/platform/errors/domain.ts`.
2. Introduced centralized error-to-HTTP mapping in `src/lib/server/platform/errors/http.ts`.
3. Added global server `handleError` sanitization + trace ID logging in `src/hooks.server.ts`.
4. Added typed `App.Error` contract fields (`code`, `traceId`) in `src/app.d.ts`.
5. Added SvelteKit action helper `failActionFromError` in `src/lib/server/platform/errors/sveltekit.ts`.
6. Added JSON endpoint helper `jsonFromError` in `src/lib/server/platform/errors/sveltekit.ts`.
7. Converted invoicing/receivables workflows to throw typed domain errors instead of stringly `Error`.
8. Replaced string-message branching with centralized error mapping in critical routes:
   - `src/routes/(app)/invoices/new/+page.server.ts`
   - `src/routes/(app)/invoices/[id]/+page.server.ts`
   - `src/routes/(app)/payments/new/+page.server.ts`
   - `src/routes/(app)/credit-notes/new/+page.server.ts`
9. Migrated remaining CRUD actions to centralized mapping in:
   - `src/routes/setup/+page.server.ts`
   - `src/routes/(app)/items/new/+page.server.ts`
   - `src/routes/(app)/items/[id]/+page.server.ts`
   - `src/routes/(app)/vendors/new/+page.server.ts`
   - `src/routes/(app)/vendors/[id]/+page.server.ts`
   - `src/routes/(app)/customers/new/+page.server.ts`
   - `src/routes/(app)/customers/[id]/+page.server.ts`
   - `src/routes/(app)/settings/+page.server.ts`
   - `src/routes/(app)/expenses/new/+page.server.ts`
10. Added strict report API request contracts in `src/lib/server/modules/reporting/application/gst-reports.ts`:
   - `parseDateRangeQueryFromUrl`
   - `parseGstr1CsvSectionFromUrl`
11. Migrated report/invoice/customer API endpoints to `jsonFromError` for stable status+payload contracts.

## Current Behavior

1. Unhandled server errors now emit a trace ID in server logs.
2. Client-visible unhandled errors are sanitized to structured payloads:
   - `message`
   - `code`
   - `traceId`
3. Domain errors can now be mapped consistently to HTTP semantics across both page actions and API handlers.
4. Report export APIs now reject malformed query parameters with typed `ValidationError` payloads.

## Completion Gate

1. Phase 6 contract suite: `npm run check:phase6` (see `scripts/check-phase6-contracts.mjs`).
2. CI guardrail integration:
   - `.github/workflows/ci.yml`
   - `package.json` `ci:guardrails`
3. Deploy criterion met for Phase 6:
   - no raw stack leakage from route/API catches
   - typed error status mapping validated
   - structured error payload contract validated
