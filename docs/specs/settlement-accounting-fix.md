# Settlement, Credit Notes, Refunds, and Invoice Cancellation
## Safe Implementation Spec (v2)

This document replaces the earlier draft with a safer implementation plan focused on:

1. Cash-vs-credit settlement truth
2. GST-safe credit note and cancellation flows
3. Refund safety (idempotency + constraints)
4. No operational dead-ends for users
5. Full status-model blast-radius coverage (`adjusted`)

---

## 1) Scope

### In scope

- Fix settlement model so `amount_paid` means cash only
- Add `credits_applied` tracking on invoices
- Add `adjusted` invoice status and propagate to all affected queries/UI
- Upgrade credit note creation (GST breakdown + invoice link + validation)
- Replace invoice cancellation with credit-note-based reversal logic
- Add refund workflow with a dedicated `refunds` table
- Close critical loopholes around over-crediting, cancellation safety, and duplicate money operations

### Out of scope for this spec

- Full discount feature rollout (move to a separate spec after this ships)

---

## 2) Domain Rules (Must Always Hold)

### Invoice settlement truth

For non-draft invoices:

```text
balance_due = total - amount_paid - credits_applied
```

- `amount_paid`: cash received only (from `payments` / `payment_allocations`)
- `credits_applied`: non-cash settlement only (credit notes + advances via `credit_allocations`)
- `balance_due`: remaining receivable

### Credit note truth

- `credit_notes.total`: total credit issued
- `credit_notes.balance`: remaining usable/refundable credit
- `credit_notes.status`:
  - `issued` => balance > 0
  - `applied` => balance <= epsilon
  - `cancelled` => document voided

### Customer balance truth

`customers.balance` remains receivable-oriented:

- invoice issued: increase
- payment received: decrease
- credit note issued: decrease
- refund posted: increase

A negative balance means we owe customer value.

---

## 3) Status Model

Invoice statuses:

- `draft`
- `issued`
- `partially_paid`
- `paid`
- `adjusted` (fully settled with credits, no cash)
- `cancelled`

### Settlement status rules

- if `balance_due <= epsilon` and `amount_paid > epsilon` => `paid`
- if `balance_due <= epsilon` and `amount_paid <= epsilon` and `credits_applied > epsilon` => `adjusted`
- if `balance_due > epsilon` and (`amount_paid > epsilon` or `credits_applied > epsilon`) => `partially_paid`
- if `balance_due > epsilon` and both paid/credits are 0 => `issued`

### Collectible statuses (used by dashboard/aging/reminders)

- `issued`
- `partially_paid`

Never treat `paid`, `adjusted`, `cancelled`, `draft` as collectible.

---

## 4) Schema Changes

## 4.1 `invoices` table

**File:** `src/lib/server/db/schema/invoices.ts`

Add:

```ts
credits_applied: numeric('credits_applied', { precision: 14, scale: 2, mode: 'number' }).default(0),
```

Update comment:

```ts
// draft, issued, partially_paid, paid, adjusted, cancelled
```

## 4.2 `refunds` table (new)

**File:** `src/lib/server/db/schema/refunds.ts` (new)

```ts
export const refunds = pgTable('refunds', {
  id: text('id').primaryKey(),
  org_id: text('org_id').notNull().references(() => organizations.id),
  customer_id: text('customer_id').notNull().references(() => customers.id),
  credit_note_id: text('credit_note_id').notNull().references(() => credit_notes.id),

  refund_number: text('refund_number').notNull(),
  refund_date: text('refund_date').notNull(),
  amount: numeric('amount', { precision: 14, scale: 2, mode: 'number' }).notNull(),

  payment_mode: text('payment_mode').notNull(),
  source_account_id: text('source_account_id').references(() => payment_accounts.id),
  payment_method_id: text('payment_method_id').references(() => payment_methods.id),
  reference: text('reference'),
  notes: text('notes'),

  status: text('status').default('posted').notNull(), // posted, voided
  journal_entry_id: text('journal_entry_id').references(() => journal_entries.id),

  idempotency_key: text('idempotency_key'),
  created_at: text('created_at').default(sql`NOW()::text`),
  created_by: text('created_by').references(() => users.id)
}, (t) => ({
  refundNumberUnq: unique().on(t.org_id, t.refund_number),
  idempotencyUnq: uniqueIndex('idx_refunds_org_idempotency').on(t.org_id, t.idempotency_key)
}));
```

---

## 5) Migration and Backfill (Safe)

**Never backfill by subtracting `credits_applied` from existing `amount_paid` blindly.**
Recompute from source tables.

```sql
ALTER TABLE invoices ADD COLUMN credits_applied NUMERIC(14,2) DEFAULT 0;

-- 1) Cash paid from payment allocations
UPDATE invoices i
SET amount_paid = COALESCE((
  SELECT ROUND(SUM(pa.amount)::numeric, 2)
  FROM payment_allocations pa
  WHERE pa.invoice_id = i.id
), 0);

-- 2) Credits applied from credit allocations (credit notes + advances)
UPDATE invoices i
SET credits_applied = COALESCE((
  SELECT ROUND(SUM(ca.amount)::numeric, 2)
  FROM credit_allocations ca
  WHERE ca.invoice_id = i.id
), 0);

-- 3) Recompute balance
UPDATE invoices
SET balance_due = GREATEST(0, ROUND((total - COALESCE(amount_paid, 0) - COALESCE(credits_applied, 0))::numeric, 2));

-- 4) Recompute statuses for non-draft/non-cancelled
UPDATE invoices
SET status = CASE
  WHEN balance_due <= 0.01 AND COALESCE(amount_paid, 0) > 0.01 THEN 'paid'
  WHEN balance_due <= 0.01 AND COALESCE(amount_paid, 0) <= 0.01 AND COALESCE(credits_applied, 0) > 0.01 THEN 'adjusted'
  WHEN balance_due > 0.01 AND (COALESCE(amount_paid, 0) > 0.01 OR COALESCE(credits_applied, 0) > 0.01) THEN 'partially_paid'
  ELSE 'issued'
END
WHERE status NOT IN ('draft', 'cancelled');
```

---

## 6) Settlement Engine Rewrite

**File:** `src/lib/server/modules/receivables/infra/queries.ts`

Replace `setInvoiceSettlementStateInTx()` signature:

```ts
setInvoiceSettlementStateInTx(
  tx,
  invoiceId,
  invoiceTotal,
  newAmountPaid,
  newCreditsApplied,
  epsilon,
  nowIso
)
```

Behavior:

- normalize/cap values with `round2`
- compute `balance_due = total - amount_paid - credits_applied`
- derive status using section 3 rules
- update invoice row with all 4 fields

### Callers to update

**File:** `src/lib/server/modules/receivables/application/workflows.ts`

- `recordInvoicePaymentInTx()` => increments `amount_paid` only
- `applyCreditsToInvoiceInTx()` => increments `credits_applied` only
- `settleInvoiceInTx()` => increments both based on applied components
- `createCustomerPaymentInTx()` => increments `amount_paid` only per allocation

### Type/query updates

- Add `credits_applied` to settlement row types
- Add `credits_applied` in settlement-related SELECTs

---

## 7) Credit Note Creation (Safe Validation)

## 7.1 Input contract

**File:** `src/lib/server/modules/receivables/application/workflows.ts`

`createCreditNoteInTx()` input must include:

- `invoiceId?: string`
- `subtotal`, `cgst`, `sgst`, `igst`, `total`
- normalized reason (`return|damaged|discount|writeoff|cancellation|other`)

## 7.2 Reason normalization

UI may still send `Return`, `Damaged`, `Writeoff`, etc.

Server must normalize before validation:

```ts
const reasonMap: Record<string, string> = {
  return: 'return',
  damaged: 'damaged',
  discount: 'discount',
  writeoff: 'writeoff',
  cancellation: 'cancellation',
  other: 'other'
};
```

Reject if not in canonical set.

## 7.3 Amount cap rules

### If `invoice_id` is present (primary path)

Cap against that invoice only:

```text
max_credit_for_invoice = invoice.total - sum(non-cancelled credit_notes.total where invoice_id = X)
```

Reject if requested total exceeds remaining invoice credit capacity.

### If `invoice_id` is absent (fallback path)

Apply global cap:

```text
total_non_cancelled_credits_for_customer + new_credit <= total_non_cancelled_invoices_for_customer
```

---

## 8) Invoice Cancellation (Credit-Note-Based, No Dead-End)

**Core rule:** issued invoices are reversed by credit note documents, not silent deletion.

## 8.1 Scenarios

- `draft` => hard delete (existing behavior)
- `issued|partially_paid|paid|adjusted` => cancellation workflow below
- `cancelled` => idempotent no-op / 400

## 8.2 Cancellation algorithm (single transaction)

**File:** `src/routes/(app)/invoices/[id]/+page.server.ts` + receivables workflows

1. Lock invoice row `FOR UPDATE`
2. Gather settlement components:
   - `cashPaid = amount_paid`
   - `creditsApplied = credits_applied`
   - `appliedCreditNotesTotal = SUM(credit_allocations.amount where credit_note_id is not null)`
   - `appliedAdvancesTotal = SUM(credit_allocations.amount where advance_id is not null)`
3. Compute cancellation document amount:

```text
cancellation_total = invoice.total - appliedCreditNotesTotal
```

- if `< -epsilon`: fail integrity check
- if `<= epsilon`: no new cancellation CN needed (already fully reversed via prior CNs)
4. If `cancellation_total > epsilon`, create cancellation credit note:
   - `reason = cancellation`
   - `invoice_id = invoice.id`
   - GST values proportional to cancellation ratio
5. Set cancellation CN balance without synthetic `credit_allocations` rows:

```text
auto_offset = min(invoice.balance_due, cancellation_total)
cn.balance = cancellation_total - auto_offset
cn.status = cn.balance <= epsilon ? 'applied' : 'issued'
```

6. Mark invoice `cancelled`, set `cancelled_at`, set `balance_due = 0`
   - keep historical `amount_paid` and `credits_applied` unchanged
7. If user selected `refund_now` and cancellation CN has balance > 0, call `recordRefundInTx()` in same transaction
8. Audit log with structured fields:
   - previous status
   - cancellation credit note id/number
   - `cashPaid`, `appliedCreditNotesTotal`, `appliedAdvancesTotal`
   - `refundRecorded` boolean

## 8.3 Why no cancellation `credit_allocations` row

Do **not** insert synthetic settlement allocations for cancellation auto-offset.

Reason: cancellation offset is document-state transition, not payment-settlement event. Mixing these semantics in `credit_allocations` causes reporting ambiguity.

---

## 9) Refund Workflow

## 9.1 Posting rule

**File:** `src/lib/server/services/posting-engine.ts`

Add `postRefund()`:

- Debit AR (`1200`) by refund amount
- Credit cash/bank source account by refund amount

## 9.2 `recordRefundInTx()`

**File:** `src/lib/server/modules/receivables/application/workflows.ts`

Flow:

1. Lock credit note `FOR UPDATE`
2. Validate:
   - status not cancelled
   - refund amount > 0
   - refund amount <= `credit_note.balance + epsilon`
3. Resolve payment method/account mapping
4. Generate refund number
5. Post journal via `postRefund()`
6. Insert refunds row (with idempotency key)
7. Reduce `credit_note.balance`; set status to `applied` if reaches zero
8. Increase `customers.balance` by refund amount
9. Audit log + domain event

---

## 10) Cancel Credit Note (Safe Constraints)

Add `cancelCreditNoteInTx()` with safeguards.

Rules:

1. Reject if already cancelled
2. Reject if any posted refunds exist for this credit note
3. For all settlement allocations from this CN:
   - lock each target invoice
   - reduce `credits_applied`
   - recompute settlement state via `setInvoiceSettlementStateInTx()`
4. Delete those allocation rows
5. Reverse CN journal entry
6. Increase customer balance by CN total
7. Mark CN cancelled (balance=0)

Additional protection:

- If CN reason is `cancellation` and linked invoice is already cancelled, reject CN cancellation in normal UI (admin-only manual recovery outside product flow).

---

## 11) UI/UX Changes

## 11.1 Invoice pages

- Add context menu action: “Issue Credit Note”
- Replace cancel logic with cancellation dialog:
  - explains CN creation
  - for positive remaining credit: choose `Refund now` or `Keep as credit`
- Amount summary should show:
  - Cash Received
  - Credits Applied
  - Balance Due
- Add cancelled banner with linked cancellation CN

## 11.2 Credit note pages

- Add Credit Notes item in sidebar
- New CN page supports:
  - `?invoice=...` prefill
  - customer lock when invoice-linked
  - GST proportional preview
- List page adds `Balance` column and “available / partially used / fully applied” cues
- Detail page adds:
  - linked invoice block
  - settlement allocation history
  - refunds history
  - actions: record refund / cancel note (when allowed)

## 11.3 Status badges

Add `adjusted` everywhere statuses render:

- invoice detail
- invoice list
- customer pages
- reusable status badge component

---

## 12) Status Blast-Radius Checklist (Mandatory)

Before merge, update all status-dependent logic including:

- receivables settlement guards
- “open invoice” queries
- dashboard metrics and due lists
- aging and receivables reports
- activity log action vocabulary
- UI status badges and filters

Search targets include current logic paths similar to:

- `NOT IN ('draft','cancelled','paid')`
- checks like `status === 'paid' || status === 'cancelled'`

All such checks must be reviewed for `adjusted` behavior.

---

## 13) Implementation Plan (Phased)

## Phase 1: Schema + Backfill

1. Add `credits_applied` to invoices
2. Add `refunds` table + unique/idempotency constraints
3. Backfill using source-of-truth aggregation (payments + allocations)
4. Verification SQL must return zero mismatches

## Phase 2: Settlement Engine

1. Rewrite `setInvoiceSettlementStateInTx()`
2. Update 4 callers
3. Add `credits_applied` to all relevant types/queries
4. Add `adjusted` to status rendering and audit action typing

## Phase 3: Credit Note Creation Safety

1. Upgrade `createCreditNoteInTx()` input (GST + invoice link)
2. Add reason normalization
3. Add per-invoice and global cap checks
4. Wire prefill from invoice/customer params

## Phase 4: Cancellation Rewrite

1. Replace current `cancelInvoiceInTx()` path with cancellation CN flow
2. Compute cancellation amount net of already-applied CNs
3. Set CN remaining balance from auto-offset math
4. Add optional in-transaction refund

## Phase 5: Refund + CN Cancellation

1. Implement `postRefund()` and `recordRefundInTx()`
2. Implement `cancelCreditNoteInTx()` with allocation reversal and restrictions

## Phase 6: UI + Reporting Sweep

1. Invoice detail/list/customer pages update
2. Credit notes list/detail/new page update
3. Dashboard + reports status sweep
4. PDF updates for payment/credit split

---

## 14) Verification Queries

```sql
-- A) Invoice settlement invariant
SELECT id, invoice_number, total, amount_paid, credits_applied, balance_due,
       ROUND((total - (COALESCE(amount_paid,0) + COALESCE(credits_applied,0) + COALESCE(balance_due,0)))::numeric, 2) AS diff
FROM invoices
WHERE status NOT IN ('draft', 'cancelled')
  AND ABS(total - (COALESCE(amount_paid,0) + COALESCE(credits_applied,0) + COALESCE(balance_due,0))) > 0.01;

-- B) credits_applied must equal allocations
SELECT i.id, i.invoice_number, i.credits_applied,
       COALESCE(SUM(ca.amount), 0) AS actual_credits
FROM invoices i
LEFT JOIN credit_allocations ca ON ca.invoice_id = i.id
GROUP BY i.id, i.invoice_number, i.credits_applied
HAVING ABS(COALESCE(i.credits_applied,0) - COALESCE(SUM(ca.amount),0)) > 0.01;

-- C) No paid invoice with zero cash paid
SELECT id, invoice_number, status, amount_paid, credits_applied
FROM invoices
WHERE status = 'paid' AND COALESCE(amount_paid, 0) <= 0.01;
```

---

## 15) High-Risk Tests (Must Pass)

1. Credit-only full settlement => invoice `adjusted`, `amount_paid` unchanged
2. Cash-only full settlement => invoice `paid`
3. Mixed settlement => `partially_paid` or `paid` as expected
4. Cancellation with prior applied credit notes => cancellation CN amount is net-of-prior-CN, no GST over-reversal
5. Cancellation with cash paid => remaining CN balance equals refundable amount
6. Refund duplicate submit (same idempotency key) => one refund only
7. Refund > credit note balance => rejected
8. Credit note creation with invoice link exceeding per-invoice cap => rejected
9. Dashboard due metrics exclude `adjusted`
10. Aging report excludes `adjusted` from collectible buckets

---

## 16) File Map

### Core

- `src/lib/server/db/schema/invoices.ts`
- `src/lib/server/db/schema/refunds.ts` (new)
- `src/lib/server/db/schema/index.ts`
- `migrations/*_credits_applied_refunds.sql`

### Receivables and accounting

- `src/lib/server/modules/receivables/infra/queries.ts`
- `src/lib/server/modules/receivables/application/workflows.ts`
- `src/lib/server/services/posting-engine.ts`

### Invoice flows

- `src/lib/server/modules/invoicing/application/workflows.ts`
- `src/routes/(app)/invoices/[id]/+page.server.ts`
- `src/routes/(app)/invoices/[id]/+page.svelte`
- `src/routes/(app)/invoices/+page.svelte`

### Credit note flows

- `src/routes/(app)/credit-notes/new/+page.server.ts`
- `src/routes/(app)/credit-notes/new/+page.svelte`
- `src/routes/(app)/credit-notes/+page.server.ts`
- `src/routes/(app)/credit-notes/+page.svelte`
- `src/routes/(app)/credit-notes/[id]/+page.server.ts`
- `src/routes/(app)/credit-notes/[id]/+page.svelte`

### Shared UI/reporting

- `src/lib/components/layout/sidebar.svelte`
- `src/lib/components/ui/badge/StatusBadge.svelte`
- `src/lib/server/services/dashboard.ts`
- `src/routes/(app)/reports/aging/+page.server.ts`
- `src/lib/pdf/invoice-template.ts`

---

## 17) Release Guardrails

Ship only when all are true:

1. `npm run check` passes
2. `npm run build` passes
3. Backfill queries are clean in staging data snapshot
4. Cancellation, refund, and CN cap integration tests pass
5. Manual QA on paid + partially-paid + adjusted + cancelled invoice journeys complete

