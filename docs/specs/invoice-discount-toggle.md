# Invoice Discount Toggle
## Safe Implementation Spec (v1)

This spec adds invoice-level discount support to the invoice form with a simple toggle between:

- percentage discount (`%`)
- absolute discount (`amount`)

The goal is to keep the UX simple while keeping GST math, PDF output, and stored totals consistent.

---

## 1) Scope

### In scope

- Add invoice form controls for invoice-level discount
- Support two discount modes:
  - percent
  - absolute amount
- Persist discount fields already present in `invoices`
- Recompute totals safely for:
  - GST exclusive pricing
  - GST inclusive pricing
- Show discount on:
  - invoice create/edit form
  - invoice detail page
  - invoice PDF
- Keep posting/accounting consistent with discounted totals

### Out of scope

- line-item level discounts
- multiple stacked discounts
- coupon/promo systems
- quotation parity in the first pass

---

## 2) Product Rules

### 2.1 Discount model

Discount is **invoice-level only**.

User can choose:

- `%` mode: `discount_value` is a percentage
- `amount` mode: `discount_value` is a currency amount

Stored fields:

- `discount_type`: `percent | amount | null`
- `discount_value`: raw user-entered value
- `discount_amount`: resolved currency amount actually applied

### 2.2 Discount basis

Discount is applied against the invoice subtotal basis before final totals are derived.

In current app terms:

- `subtotal` = sum of line amounts as entered in the form
- for GST-exclusive pricing, this is pre-tax
- for GST-inclusive pricing, this is gross line total including GST

### 2.3 Validation rules

- no discount => `discount_type = null`, `discount_value = 0`, `discount_amount = 0`
- percent discount must be `>= 0` and `<= 100`
- absolute discount must be `>= 0`
- resolved `discount_amount` must never exceed subtotal
- if subtotal is `0`, discount must resolve to `0`

### 2.4 Rounding

All money values use existing `round2` semantics.

Rules:

- raw percent may use up to 4 decimals
- resolved `discount_amount` is rounded to 2 decimals
- final invoice tax components and total must still reconcile exactly

---

## 3) GST Behavior

### 3.1 GST exclusive pricing

This is the simpler case.

Flow:

1. calculate raw line amounts
2. compute invoice subtotal
3. resolve discount
4. reduce taxable base by discount
5. compute GST on discounted taxable amount

Result:

- discount reduces taxable amount
- GST is calculated on post-discount value

### 3.2 GST inclusive pricing

In inclusive mode, user-entered prices already include GST.

Required behavior:

- entered discount must reduce the final amount payable
- discount must be proportionally split between taxable value and tax value

Flow:

1. calculate raw inclusive line totals
2. compute invoice subtotal
3. resolve discount
4. compute discounted gross subtotal
5. re-apportion the discount across lines by their contribution to subtotal
6. recompute taxable and tax components from discounted line amounts

Result:

- final total is reduced by discount
- GST is reduced proportionally, not left unchanged

### 3.3 Why this rule

This keeps both user expectation and GST reporting correct:

- user sees discount reduce the actual payable amount
- tax liability also reduces appropriately

---

## 4) UX Specification

## 4.1 Form controls

Add a compact invoice totals control block near the totals summary.

Suggested fields:

- `Add discount` switch or inline row
- mode toggle:
  - `%`
  - `Amount`
- numeric input:
  - percent value if `%`
  - INR amount if `Amount`

### 4.2 Default behavior

- discount row is collapsed or visually muted by default
- default mode can be `%`
- default value is `0`

### 4.3 Live summary

The totals section should show:

- Subtotal
- Discount
- Taxable Amount
- CGST/SGST or IGST
- Total

Rules:

- discount row appears only if `discount_amount > 0`
- label should be explicit:
  - `Discount (10%)`
  - `Discount`

### 4.4 Editing behavior

When editing a draft invoice:

- form must hydrate from saved `discount_type`, `discount_value`, and `discount_amount`
- switching modes should preserve user intent when reasonable

Safe rule:

- switching mode resets entered value to `0`
- do not silently convert `10%` into a rupee amount or vice versa in v1

This avoids confusing hidden recalculation.

---

## 5) Calculation Contract

## 5.1 New helper

Introduce a helper dedicated to invoice pricing instead of overloading current GST helper.

Suggested file:

- `src/lib/tax/invoice-pricing.ts`

Suggested input:

```ts
type DiscountInput = {
  type: 'percent' | 'amount' | null;
  value: number;
};
```

Suggested output:

```ts
type InvoicePricingBreakdown = {
  subtotal: number;
  discountType: 'percent' | 'amount' | null;
  discountValue: number;
  discountAmount: number;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
  lines: ...
};
```

## 5.2 Resolution rules

### Percent mode

```text
discount_amount = subtotal * (discount_value / 100)
```

Cap to subtotal.

### Amount mode

```text
discount_amount = min(discount_value, subtotal)
```

### No discount

```text
discount_amount = 0
```

## 5.3 Distribution rules

Discount should be distributed proportionally across lines using line share of subtotal.

Why:

- keeps GST breakdown correct
- avoids one arbitrary line absorbing the full discount
- makes line totals and invoice totals reconcilable

Implementation note:

- distribute using proportional shares
- apply remainder correction on the last eligible line to eliminate rounding drift

---

## 6) Server Contract

## 6.1 Invoice create/update workflows

Files:

- `src/lib/server/modules/invoicing/application/workflows.ts`
- `src/routes/(app)/invoices/new/+page.server.ts`
- `src/routes/(app)/invoices/[id]/+page.server.ts`

Add fields to workflow inputs:

- `discountType?: 'percent' | 'amount' | null`
- `discountValue?: number`

Server must:

1. parse and validate discount input
2. compute authoritative totals on server
3. persist:
   - `discount_type`
   - `discount_value`
   - `discount_amount`
4. use discounted totals for:
   - invoice row
   - journal posting
   - customer balance updates

### Important

Server is source of truth.

Never trust client-calculated discount amount, tax, or total.

---

## 7) Persistence

No schema migration is required for invoices because fields already exist:

- `discount_type`
- `discount_value`
- `discount_amount`

However, current create/update logic does not populate them. That logic must be added.

---

## 8) PDF and Detail Page

Files:

- `src/routes/(app)/invoices/[id]/+page.svelte`
- `src/lib/pdf/invoice-template.ts`

Required changes:

- show discount row if `discount_amount > 0`
- show final total after discount
- keep tax rows consistent with discounted amounts

PDF layout rule:

- discount should appear in totals summary, not hidden in notes

Suggested order:

1. Subtotal
2. Discount
3. Taxable Amount
4. CGST/SGST or IGST
5. Total

---

## 9) Form Schema

Files:

- `src/routes/(app)/invoices/new/schema.ts`
- optionally mirrored later in quotation schema

Add:

```ts
discount_type: z.enum(['percent', 'amount']).nullable().optional(),
discount_value: z.coerce.number().min(0).default(0),
```

Client schema should validate shape only.
Final financial validation still belongs on server.

---

## 10) Reporting and Downstream Effects

Because invoice `total`, `taxable_amount`, and tax fields are stored post-discount:

- dashboard sales remain correct
- GST reports remain correct
- receivables remain correct
- PDF remains correct

No special settlement changes are needed as long as invoice `total` is already discounted before issuance.

---

## 11) Edge Cases

Must handle:

1. `0%` discount => no visible effect
2. `100%` discount => allowed only if total becomes zero and downstream issuance rules allow it
3. amount greater than subtotal => reject or cap server-side; reject is preferred
4. GST rate `0%` lines mixed with taxed lines
5. inclusive pricing with mixed GST rates
6. draft edit after discount saved
7. invoice PDF regeneration after discount

### Recommendation

Reject, do not silently cap, when user-entered amount exceeds subtotal.

Reason:

- safer
- easier to explain
- avoids hidden data mutation

---

## 12) Implementation Plan

## Phase 1: Core Math

1. add invoice pricing helper with discount support
2. update invoice create/update workflows to use it
3. persist discount fields

## Phase 2: Invoice Form

1. add discount toggle UI to new invoice page
2. add live total summary row
3. add same UI to draft edit page

## Phase 3: Invoice Display

1. update invoice detail page
2. update PDF template

## Phase 4: Test Sweep

1. exclusive GST + percent discount
2. exclusive GST + amount discount
3. inclusive GST + percent discount
4. inclusive GST + amount discount
5. mixed GST rates
6. over-discount rejection
7. draft edit persistence

## Phase 5: Optional Parity

Mirror the same behavior into quotations because:

- quotation schema already has discount fields
- invoice and quotation UX should not diverge long-term

This should be a follow-up, not part of invoice v1 unless requested.

---

## 13) High-Risk Tests

1. invoice subtotal `1000`, GST 18%, exclusive, `10%` discount
   - taxable = `900`
   - tax = `162`
   - total = `1062`

2. invoice subtotal `1000`, GST 18%, exclusive, amount discount `100`
   - taxable = `900`
   - tax = `162`
   - total = `1062`

3. invoice subtotal `1180`, GST 18%, inclusive, amount discount `118`
   - total = `1062`
   - taxable/tax split must reduce proportionally

4. mixed 5% and 18% lines with invoice-level discount
   - discount must be proportionally distributed
   - total tax must reconcile exactly

5. discount amount > subtotal
   - rejected with user-facing validation

---

## 14) File Map

### Core

- `src/lib/tax/gst.ts`
- `src/lib/tax/invoice-pricing.ts` (new recommended)

### Invoice workflows

- `src/lib/server/modules/invoicing/application/workflows.ts`
- `src/routes/(app)/invoices/new/+page.server.ts`
- `src/routes/(app)/invoices/[id]/+page.server.ts`

### Invoice form UI

- `src/routes/(app)/invoices/new/schema.ts`
- `src/routes/(app)/invoices/new/+page.svelte`
- `src/routes/(app)/invoices/[id]/edit/+page.svelte`

### Invoice display

- `src/routes/(app)/invoices/[id]/+page.svelte`
- `src/lib/pdf/invoice-template.ts`

---

## 15) Release Guardrails

Ship only when:

1. `npm run check` passes
2. `npm run build` passes
3. discount math is covered in unit tests
4. manual QA confirms inclusive and exclusive GST paths
5. PDF total matches on-screen total exactly

