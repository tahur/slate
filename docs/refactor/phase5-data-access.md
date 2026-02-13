# Phase 5 Data Access Simplification

Date: February 13, 2026

## Decision

Keep Drizzle as the only query layer for the SQLite modular monolith.

Do not introduce a generic repository abstraction in this phase.

## Rules

1. Extract repeated query fragments into module-level `infra/queries.ts` files.
2. Keep business decisions in `application/workflows.ts`; keep query primitives in `infra/queries.ts`.
3. Only add typed DTO/result mappers when the same shape is reused in 2+ call sites.
4. Repository interfaces require an ADR and one trigger:
   - non-SQLite backend migration,
   - cross-storage adapter requirement,
   - proven testability gap not solvable with current Drizzle usage.

## Implemented Slice

1. Added invoicing query helpers in `src/lib/server/modules/invoicing/infra/queries.ts`.
2. Added receivables query helpers in `src/lib/server/modules/receivables/infra/queries.ts`.
3. Refactored invoicing workflows to use helper lookups and customer-balance delta helper.
4. Refactored receivables workflows to use helper lookups and shared invoice/customer settlement update helpers.
5. Refactored payment-create route read paths to reuse receivables query helpers for:
   - customer list,
   - deposit account list,
   - unpaid invoice list.
6. Added reporting query helpers and aggregation service:
   - `src/lib/server/modules/reporting/infra/gst-queries.ts`
   - `src/lib/server/modules/reporting/application/gst-reports.ts`
7. Refactored all GSTR1/GSTR3B route handlers (page/json/csv/pdf) to use shared reporting helpers.
8. Added shared pagination parser at `src/lib/server/platform/db/pagination.ts` and applied it to `src/routes/(app)/activity-log/+page.server.ts`.

## Validation

1. `npm run check` passes.
2. `npm run build` passes.
3. `npm run ci:guardrails` passes.
4. `npm run check:integrity` passes.
