ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "credits_applied" numeric(14,2) DEFAULT 0;--> statement-breakpoint

UPDATE "invoices" i
SET "amount_paid" = COALESCE((
  SELECT ROUND(SUM(pa.amount)::numeric, 2)
  FROM "payment_allocations" pa
  WHERE pa."invoice_id" = i."id"
), 0);--> statement-breakpoint

UPDATE "invoices" i
SET "credits_applied" = COALESCE((
  SELECT ROUND(SUM(ca.amount)::numeric, 2)
  FROM "credit_allocations" ca
  WHERE ca."invoice_id" = i."id"
), 0);--> statement-breakpoint

UPDATE "invoices"
SET "balance_due" = GREATEST(
  0,
  ROUND(("total" - COALESCE("amount_paid", 0) - COALESCE("credits_applied", 0))::numeric, 2)
);--> statement-breakpoint

UPDATE "invoices"
SET "status" = CASE
  WHEN "balance_due" <= 0.01 AND COALESCE("amount_paid", 0) > 0.01 THEN 'paid'
  WHEN "balance_due" <= 0.01 AND COALESCE("amount_paid", 0) <= 0.01 AND COALESCE("credits_applied", 0) > 0.01 THEN 'adjusted'
  WHEN "balance_due" > 0.01 AND (COALESCE("amount_paid", 0) > 0.01 OR COALESCE("credits_applied", 0) > 0.01) THEN 'partially_paid'
  ELSE 'issued'
END
WHERE "status" NOT IN ('draft', 'cancelled');--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "refunds" (
  "id" text PRIMARY KEY,
  "org_id" text NOT NULL REFERENCES "organizations"("id"),
  "customer_id" text NOT NULL REFERENCES "customers"("id"),
  "credit_note_id" text NOT NULL REFERENCES "credit_notes"("id"),
  "refund_number" text NOT NULL,
  "refund_date" text NOT NULL,
  "amount" numeric(14,2) NOT NULL,
  "payment_mode" text NOT NULL,
  "source_account_id" text REFERENCES "payment_accounts"("id"),
  "payment_method_id" text REFERENCES "payment_methods"("id"),
  "reference" text,
  "notes" text,
  "status" text NOT NULL DEFAULT 'posted',
  "journal_entry_id" text REFERENCES "journal_entries"("id"),
  "idempotency_key" text,
  "created_at" text DEFAULT NOW()::text,
  "created_by" text REFERENCES "users"("id"),
  CONSTRAINT "refunds_org_refund_number_unq" UNIQUE("org_id", "refund_number")
);--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "idx_refunds_org" ON "refunds"("org_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_refunds_org_customer" ON "refunds"("org_id", "customer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_refunds_credit_note" ON "refunds"("credit_note_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_refunds_journal_entry" ON "refunds"("journal_entry_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_refunds_org_idempotency" ON "refunds"("org_id", "idempotency_key");
