# Binary-Inspired App Revamp Plan

Date: February 24, 2026  
Status: Proposed (planning only)

## 1. Objective

Refresh the authenticated app UI to match the clean, minimal feel you like on `binary.so`, while preserving Slate's existing workflows and data behavior.

## 2. Reference Notes

Source reviewed: https://binary.so/  
Inference from source: visual direction appears to be high-contrast minimal UI, restrained color usage, tight typography, and clear primary actions.

## 3. Current State Snapshot (this repo)

1. App shell + pages already use token-driven theme architecture (`src/app.css` + `docs/STYLE_GUIDE.md`), which is good for a controlled revamp.
2. Scope is large: `38` authenticated pages under `src/routes/(app)`.
3. UI usage is broad: `176` `<Button>` usages and many custom button-like classes (`466` matches from a broad scan).
4. Existing style guardrail is already catching issues (`npm run lint:buttons` currently fails in `src/routes/(app)/settings/+page.svelte`).

## 4. Guardrails and Constraints

1. Keep revamp token-first, not one-off per page.
2. Do not change domain/business logic.
3. Preserve accessibility: keyboard focus, contrast, and readable states.
4. Keep responsive behavior stable on mobile + desktop.

## 5. Implementation Plan

## Phase 0 - Lock visual direction (0.5 day)

1. Finalize a "Binary-inspired" mini style spec for app UI:
   - Neutral base (ink/surface/line/muted)
   - Single accent for primary actions
   - Compact radii and subtle borders
   - Tight text scale and button rhythm
2. Confirm exact palette and typography before code changes.

Deliverable: approved mini style spec (colors, type scale, spacing, radius, shadows).

## Phase 1 - Token refresh (0.5-1 day)

1. Update semantic tokens in `src/app.css` (`surface-*`, `text-*`, `border-*`, `primary`, sidebar tokens).
2. Keep token names stable so existing classes still compile.
3. Remove stale/deprecated token definitions where safe.

Deliverable: app-level palette/typography baseline is updated through tokens only.

## Phase 2 - Core primitives refresh (1 day)

1. Update shared primitives so style changes propagate globally:
   - `src/lib/components/ui/button/button.svelte`
   - `src/lib/components/ui/input/input.svelte`
   - `src/lib/components/ui/select/*`
   - `src/lib/components/ui/card/*`
   - `src/lib/components/ui/sidebar/*`
2. Standardize hover, focus ring, disabled, and destructive states.
3. Ensure button text/height/spacing align with new minimal style.

Deliverable: consistent controls across app with no page-by-page overrides needed for basics.

## Phase 3 - App shell polish (0.5 day)

1. Refresh:
   - `src/routes/(app)/+layout.svelte`
   - `src/lib/components/layout/header.svelte`
   - `src/lib/components/layout/sidebar.svelte`
2. Tune nav density, active states, header spacing, and page background contrast.

Deliverable: shell looks and feels cohesive before deeper page migration.

## Phase 4 - Page migration in waves (2-3 days)

Wave A (highest traffic first):
1. Dashboard, invoices, customers, payments, expenses.

Wave B:
1. Vendors, items, credit notes, vendor payments.

Wave C:
1. Reports + settings + remaining long-tail screens.

Work per wave:
1. Replace raw palette/shadcn-in-page classes with semantic tokens.
2. Normalize header, table, empty state, and action bar patterns.
3. Reduce visual noise (fewer mixed text sizes, fewer conflicting border/background styles).

Deliverable: unified visual language across all authenticated pages.

## Phase 5 - QA and enforceability (0.5-1 day)

1. Extend lint checks:
   - Keep `scripts/check-button-classes.js`
   - Add/extend checks for forbidden raw color classes in app pages
2. Run validation:
   - `npm run check`
   - `npm run lint:buttons`
   - `npm run build`
3. Do manual responsive + accessibility pass on key flows.

Deliverable: revamp is regression-safe and enforceable for future contributors.

## Phase 6 - Rollout and freeze (0.5 day)

1. Ship behind normal branch review with before/after screenshots.
2. Update `docs/STYLE_GUIDE.md` with any token/value changes and new examples.
3. Freeze ad-hoc styling: all new UI changes must follow updated tokens/patterns.

Deliverable: stable post-revamp baseline.

## 6. Success Criteria

1. App visually matches the chosen minimal direction across shell + major pages.
2. No failing lint/build checks.
3. No accessibility regressions in keyboard/focus/contrast.
4. Fewer page-level color overrides and fewer hardcoded utility color classes.
5. Style guide reflects final implementation.

## 7. Proposed Execution Order

1. Approve style spec (Phase 0)
2. Tokens + primitives (Phases 1-2)
3. Shell polish (Phase 3)
4. Page waves (Phase 4)
5. QA + docs + release (Phases 5-6)
