# UI Polish + Mobile Optimization Plan

Date: February 24, 2026  
Status: Proposed (MCP paused)

## 1. Goal

Polish the app UI with a clean minimal direction and fix mobile usability gaps, especially table-heavy screens.  
Use existing shadcn-style primitives in this repo wherever possible, then patch gaps with small reusable wrappers/utilities.

## 2. What to Polish First (high-impact)

1. Table-heavy list and detail screens on phone widths.
2. Two-column form sections that stay 2 columns on mobile.
3. Large desktop paddings (`px-6`, `p-6`, `p-8`) that feel cramped on small screens.
4. Non-standard controls (raw `<select>`, raw `<textarea>`, manual tab navigation/modals) where native app primitives already exist.

## 3. Current Hotspot Audit (repo facts)

1. `10` files under `src/routes/(app)` still use raw `<table>`.
2. `12` files use shadcn table primitives (`<Table>`), but several lack horizontal wrappers.
3. `24` files use `grid-cols-2`; multiple form pages set two columns at base breakpoint.
4. `10` files still use native `<select>`.
5. `9` files still use native `<textarea>`.
6. `4` files use custom absolute-position dropdown menus (state/HSN/unit style menus).
7. `2` invoice pages use a custom portal combobox (`ItemCombobox`) for line items.
8. Dropdown stack is mixed today: `9` files use shadcn `Select`, `10` files use native `<select>`.

## 4. Shadcn/Primitive Inventory We Can Reuse

Available in `src/lib/components/ui`:
1. `table`, `scroll-area`
2. `tabs`
3. `select`
4. `textarea`
5. `sheet`
6. `alert-dialog`
7. `button`, `input`, `card`, `badge`, `tooltip`, `checkbox`, `sidebar`

Plan decision:
1. Prefer these existing primitives first.
2. Add only thin wrappers where the primitive alone is not enough (for example, table container behavior).

## 5. Detailed Work Plan

## Phase 0 - Baseline + rules (0.5 day)

1. Freeze visual baseline screenshots for key screens at `360px`, `390px`, `768px`, and desktop.
2. Define mobile standards:
   - primary touch targets at least `h-9/h-10`
   - icon-only actions (delete/edit/row tools) must be at least `44x44px`
   - no clipped table content
   - no forced horizontal scroll for core transactional flows unless data density requires it
3. Set navigation direction for this cycle:
   - primary mobile nav remains Sheet-based hamburger
   - no bottom tab bar in v1 rollout
4. Confirm scope excludes MCP work for this cycle.

## Phase 1 - Foundation utilities (0.5-1 day)

1. Add a reusable table wrapper primitive:
   - New component: `src/lib/components/ui/table/table-container.svelte`
   - Behavior: `overflow-x-auto`, optional sticky first/last columns, consistent scrollbar spacing, and mobile-first typography defaults.
   - Typography default: `text-sm` on mobile with optional dense mode for larger breakpoints (`md:text-[0.8125rem]`) when needed.
2. Add responsive layout utilities in `src/app.css`:
   - compact mobile page paddings
   - standard stacked form grid utility (`1 col` on mobile, `2 col` from `sm/md`)
3. Add dropdown consistency primitives:
   - shared `Select` trigger/content class presets for cross-OS parity
   - optional `SelectField` wrapper for common labeled select patterns
4. Add shared touch-target utility and button size variant for icon actions (`44x44px` minimum).
5. Export wrapper via `src/lib/components/ui/table/index.ts`.

Expected result:
1. One reusable way to make tables phone-safe.
2. Fewer one-off responsive classes.

## Phase 2 - Table modernization (3-4 days)

### Track A: Critical list tables (first)

Files:
1. `src/routes/(app)/invoices/+page.svelte`
2. `src/routes/(app)/payments/+page.svelte`
3. `src/routes/(app)/expenses/+page.svelte`
4. `src/routes/(app)/credit-notes/+page.svelte`
5. `src/routes/(app)/vendor-payments/+page.svelte`
6. `src/routes/(app)/accounts/+page.svelte`
7. `src/routes/(app)/journals/+page.svelte`

Changes:
1. Wrap `<Table>` in `TableContainer`.
2. Add predictable table min-widths.
3. For the 3 highest-traffic flows (Invoices, Payments, Expenses), add mobile card/list rendering under `sm` to avoid horizontal scanning.
4. Define strict card content contracts (3-4 lines max):
   - Invoices card: `invoice_number`, `customer_name`, `total`, `status badge`, `due_date` with overdue highlight.
   - Payments card: `receipt_number`, `customer_name`, `amount`, `payment method`, `payment_date` (reference optional/truncated).
   - Expenses card: `expense_number`, `category/supplier`, `total`, `payment status`, `expense_date` (balance due when credit).
5. Keep `sm+` table view as source of truth, sharing the same filter/sort/data pipeline as mobile cards.

### Track B: Raw table migrations

Files:
1. `src/routes/(app)/customers/[id]/+page.svelte`
2. `src/routes/(app)/vendors/[id]/+page.svelte`
3. `src/routes/(app)/payments/[id]/+page.svelte`
4. `src/routes/(app)/expenses/[id]/+page.svelte`
5. `src/routes/(app)/vendor-payments/[id]/+page.svelte`
6. `src/routes/(app)/credit-notes/[id]/+page.svelte`
7. `src/routes/(app)/invoices/[id]/+page.svelte`
8. `src/routes/(app)/invoices/new/+page.svelte`
9. `src/routes/(app)/invoices/[id]/edit/+page.svelte`
10. `src/routes/(app)/reports/aging/+page.svelte`

Changes:
1. Replace raw `<table>` with shadcn table primitives.
2. Standardize header/body cell spacing and semantic token classes.
3. Apply wrapper/min-width behavior consistently.

### Track C: Report tables

Files:
1. `src/routes/(app)/reports/gstr1/+page.svelte`
2. `src/routes/(app)/reports/gstr3b/+page.svelte`
3. `src/routes/(app)/reports/cashbook/+page.svelte`
4. `src/routes/(app)/reports/ledger/+page.svelte`

Changes:
1. Keep horizontal scroll approach (reports are dense by nature).
2. Improve readability via sticky left context columns where feasible.
3. Tighten number alignment and condensed meta text for mobile.

## Phase 3 - Form layout mobile pass (1-2 days)

Priority files (base `grid-cols-2`):
1. `src/routes/(app)/payments/new/+page.svelte`
2. `src/routes/(app)/vendor-payments/new/+page.svelte`
3. `src/routes/(app)/expenses/new/+page.svelte`
4. `src/routes/(app)/credit-notes/new/+page.svelte`

Secondary files:
1. `src/routes/(app)/invoices/new/+page.svelte`
2. `src/routes/(app)/invoices/[id]/edit/+page.svelte`
3. `src/routes/(app)/customers/new/+page.svelte`
4. `src/routes/(app)/vendors/new/+page.svelte`
5. `src/routes/(app)/items/new/+page.svelte`

Changes:
1. Make form grids stack on mobile (`grid-cols-1`, promote to `sm/md:grid-cols-2`).
2. Reduce fixed panel widths pressure (`md:w-96`) when keyboard opens on small screens.
3. Normalize bottom action bars for small screens (single-column button flow when needed).
4. Handle invoice line-items as dedicated mobile UX:
   - files: `src/routes/(app)/invoices/new/+page.svelte`, `src/routes/(app)/invoices/[id]/edit/+page.svelte`
   - under `sm`, replace mini-table editing with per-line stacked editor cards
   - line layout target: description, qty/unit/rate group, GST + amount summary, remove action with 44px tap target
   - keep table editor for `sm+`

## Phase 4 - Replace native controls with existing primitives (1-2 days)

### Native select -> `Select` primitive

Candidate files:
1. `src/routes/(app)/payments/new/+page.svelte`
2. `src/routes/(app)/vendor-payments/new/+page.svelte`
3. `src/routes/(app)/expenses/new/+page.svelte`
4. `src/routes/(app)/credit-notes/new/+page.svelte`
5. `src/routes/(app)/activity-log/+page.svelte`
6. `src/routes/(app)/reports/cashbook/+page.svelte`
7. `src/routes/(app)/reports/ledger/+page.svelte`
8. `src/routes/(app)/settings/+page.svelte`

Notes:
1. Keep hidden input bindings where server actions rely on classic form submission.
2. Retain native control only when searchable combobox behavior is required and no equivalent primitive exists yet.

### Dropdown consistency track (Linux + macOS parity)

Files/patterns:
1. Custom absolute dropdowns:
   - `src/routes/(app)/customers/new/+page.svelte`
   - `src/routes/(app)/vendors/new/+page.svelte`
   - `src/routes/(app)/items/new/+page.svelte`
   - `src/routes/(app)/items/[id]/+page.svelte`
2. Custom portal combobox:
   - `src/lib/components/ItemCombobox.svelte`
   - consumers: `src/routes/(app)/invoices/new/+page.svelte`, `src/routes/(app)/invoices/[id]/edit/+page.svelte`

Changes:
1. Replace custom absolute dropdowns with shadcn `Select` where search is not required.
2. For searchable dropdowns, keep custom behavior but standardize panel/input styling with shared tokens and surface/border/shadow classes.
3. Ensure consistent trigger height, focus ring, hover, selected state, and chevron icon sizing across OS/browser.
4. Eliminate remaining native browser default styling mismatches (`appearance`, default arrows, dark form-control rendering).
5. Keep dropdown width/position behavior stable across Linux Chromium/Firefox and macOS Safari/Chrome.

### Native textarea -> `Textarea` primitive

Candidate files:
1. `src/routes/(app)/payments/new/+page.svelte`
2. `src/routes/(app)/vendor-payments/new/+page.svelte`
3. `src/routes/(app)/expenses/new/+page.svelte`
4. `src/routes/(app)/invoices/new/+page.svelte`
5. `src/routes/(app)/invoices/[id]/edit/+page.svelte`
6. `src/routes/(app)/vendors/new/+page.svelte`
7. `src/routes/(app)/settings/+page.svelte`

### Manual tab nav -> `Tabs` primitive

Primary file:
1. `src/routes/(app)/settings/+page.svelte`

Changes:
1. Replace custom tab row with `Tabs`.
2. Keep horizontal scroll behavior for many tabs.

## Phase 5 - Mobile navigation + modal/sheet consistency (1-1.5 days)

Navigation strategy:
1. Keep Sheet-based hamburger menu as the default mobile navigation pattern in this cycle.
2. Improve Sheet nav ergonomics:
   - `44x44px` minimum tap rows for nav links and logout
   - stronger active-state visibility
   - better section spacing and scroll behavior
3. Defer bottom tab bar to optional v2 experiment after baseline rollout and usage feedback.

Manual overlay candidates:
1. `src/routes/(app)/settings/+page.svelte`
2. `src/routes/(app)/customers/[id]/+page.svelte`
3. `src/routes/(app)/vendors/[id]/+page.svelte`
4. `src/routes/(app)/items/[id]/+page.svelte`
5. `src/routes/(app)/expenses/[id]/+page.svelte`
6. `src/routes/(app)/invoices/[id]/+page.svelte`

Changes:
1. Move edit/drawer-like overlays to `Sheet` (better on mobile).
2. Keep destructive confirmations on `AlertDialog`.

## Phase 6 - List-page polish (0.5-1 day)

Files:
1. `src/routes/(app)/customers/+page.svelte`
2. `src/routes/(app)/vendors/+page.svelte`
3. `src/routes/(app)/items/+page.svelte`

Changes:
1. Summary cards: `grid-cols-1` on mobile, scale up at `sm/md`.
2. Header action groups wrap cleanly.
3. Reduce metadata clutter on small screens with priority ordering.

## Phase 7 - QA + guardrails (1 day)

1. Add lint checks:
   - detect raw `<table>` in app routes (allowlist only where intentional)
   - detect non-primitive `<textarea>` and `<select>` where replacement is mandated
   - detect icon-only action controls below `44x44px` target (or enforce shared utility/size variant usage)
2. Regression checks:
   - `npm run check`
   - `npm run lint:buttons`
   - `npm run build`
3. Manual mobile QA:
   - iPhone SE/mini width equivalent
   - iPhone 12/13/14 width equivalent
   - Android common width equivalent
   - landscape checks for table/report pages
4. Manual desktop cross-OS QA:
   - macOS: Safari + Chrome
   - Linux: Chrome/Chromium + Firefox
   - verify dropdown trigger/content visuals, scrollbars, hover/highlight, and selected item rendering

## 6. Delivery Order (recommended)

1. Phase 1 first (foundation).
2. Phase 2 Track A (Invoices/Payments/Expenses list pages).
3. Phase 3 (forms with forced 2-col mobile).
4. Phase 4 (control replacement).
5. Phase 2 Track B/C and Phase 5/6.
6. Phase 7 final QA and docs sync.

## 7. Definition of Done

1. All high-traffic table screens are phone-usable without clipping.
2. No critical form remains forced two-column on mobile.
3. Settings uses `Tabs` primitive and modal behavior is mobile-safe.
4. Mobile navigation is stable via Sheet pattern with usable touch targets.
5. Dropdowns render consistently on macOS and Linux across supported browsers.
6. Core raw controls are replaced by existing primitives where practical.
7. UI lint/build checks pass and style guide gets updated with new mobile patterns.

## 8. Revised Timeline Estimate

1. Total expected delivery: ~10-13 working days.
2. Phase 2 Track A includes +1 day to account for new mobile card-view component work.
3. Dropdown cross-OS normalization and QA adds ~1 day buffer.
