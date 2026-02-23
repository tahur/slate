CREATE TABLE IF NOT EXISTS "supplier_payments" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"vendor_id" text NOT NULL,
	"supplier_payment_number" text NOT NULL,
	"payment_date" text NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"payment_mode" text NOT NULL,
	"reference" text,
	"notes" text,
	"reason_snapshot" text,
	"paid_from" text NOT NULL,
	"payment_account_id" text,
	"payment_method_id" text,
	"journal_entry_id" text,
	"idempotency_key" text,
	"created_at" text DEFAULT NOW()::text,
	"created_by" text,
	CONSTRAINT "supplier_payments_org_id_supplier_payment_number_unique" UNIQUE("org_id","supplier_payment_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "supplier_payment_allocations" (
	"id" text PRIMARY KEY NOT NULL,
	"supplier_payment_id" text NOT NULL,
	"expense_id" text NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"created_at" text DEFAULT NOW()::text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "supplier_credits" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"vendor_id" text NOT NULL,
	"supplier_payment_id" text,
	"source_type" text DEFAULT 'payment_excess' NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"balance" numeric(14, 2) NOT NULL,
	"notes" text,
	"created_at" text DEFAULT NOW()::text
);
--> statement-breakpoint
ALTER TABLE IF EXISTS "expenses" ADD COLUMN IF NOT EXISTS "amount_settled" numeric(14, 2) DEFAULT 0;
--> statement-breakpoint
ALTER TABLE IF EXISTS "expenses" ADD COLUMN IF NOT EXISTS "balance_due" numeric(14, 2) DEFAULT 0;
--> statement-breakpoint
ALTER TABLE IF EXISTS "expenses" ADD COLUMN IF NOT EXISTS "credit_applied" numeric(14, 2) DEFAULT 0;
--> statement-breakpoint
UPDATE "expenses"
SET
	"amount_settled" = CASE
		WHEN "payment_status" = 'paid' THEN "total"
		ELSE COALESCE("amount_settled", 0)
	END;
--> statement-breakpoint
UPDATE "expenses"
SET
	"balance_due" = GREATEST(
		ROUND(("total" - COALESCE("amount_settled", 0))::numeric, 2),
		0
	);
--> statement-breakpoint
UPDATE "expenses"
SET "credit_applied" = COALESCE("credit_applied", 0);
--> statement-breakpoint
ALTER TABLE IF EXISTS "expenses" ALTER COLUMN "amount_settled" SET DEFAULT 0;
--> statement-breakpoint
ALTER TABLE IF EXISTS "expenses" ALTER COLUMN "balance_due" SET DEFAULT 0;
--> statement-breakpoint
ALTER TABLE IF EXISTS "expenses" ALTER COLUMN "credit_applied" SET DEFAULT 0;
--> statement-breakpoint
ALTER TABLE IF EXISTS "expenses" ALTER COLUMN "amount_settled" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE IF EXISTS "expenses" ALTER COLUMN "balance_due" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE IF EXISTS "expenses" ALTER COLUMN "credit_applied" SET NOT NULL;
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'supplier_payments_org_id_organizations_id_fk'
	) THEN
		ALTER TABLE "supplier_payments"
		ADD CONSTRAINT "supplier_payments_org_id_organizations_id_fk"
		FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'supplier_payments_vendor_id_vendors_id_fk'
	) THEN
		ALTER TABLE "supplier_payments"
		ADD CONSTRAINT "supplier_payments_vendor_id_vendors_id_fk"
		FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'supplier_payments_payment_account_id_payment_accounts_id_fk'
	) THEN
		ALTER TABLE "supplier_payments"
		ADD CONSTRAINT "supplier_payments_payment_account_id_payment_accounts_id_fk"
		FOREIGN KEY ("payment_account_id") REFERENCES "public"."payment_accounts"("id") ON DELETE no action ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'supplier_payments_payment_method_id_payment_methods_id_fk'
	) THEN
		ALTER TABLE "supplier_payments"
		ADD CONSTRAINT "supplier_payments_payment_method_id_payment_methods_id_fk"
		FOREIGN KEY ("payment_method_id") REFERENCES "public"."payment_methods"("id") ON DELETE no action ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'supplier_payments_journal_entry_id_journal_entries_id_fk'
	) THEN
		ALTER TABLE "supplier_payments"
		ADD CONSTRAINT "supplier_payments_journal_entry_id_journal_entries_id_fk"
		FOREIGN KEY ("journal_entry_id") REFERENCES "public"."journal_entries"("id") ON DELETE no action ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'supplier_payments_created_by_users_id_fk'
	) THEN
		ALTER TABLE "supplier_payments"
		ADD CONSTRAINT "supplier_payments_created_by_users_id_fk"
		FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'supplier_payment_allocations_supplier_payment_id_supplier_payments_id_fk'
	) THEN
		ALTER TABLE "supplier_payment_allocations"
		ADD CONSTRAINT "supplier_payment_allocations_supplier_payment_id_supplier_payments_id_fk"
		FOREIGN KEY ("supplier_payment_id") REFERENCES "public"."supplier_payments"("id") ON DELETE no action ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'supplier_payment_allocations_expense_id_expenses_id_fk'
	) THEN
		ALTER TABLE "supplier_payment_allocations"
		ADD CONSTRAINT "supplier_payment_allocations_expense_id_expenses_id_fk"
		FOREIGN KEY ("expense_id") REFERENCES "public"."expenses"("id") ON DELETE no action ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'supplier_credits_org_id_organizations_id_fk'
	) THEN
		ALTER TABLE "supplier_credits"
		ADD CONSTRAINT "supplier_credits_org_id_organizations_id_fk"
		FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'supplier_credits_vendor_id_vendors_id_fk'
	) THEN
		ALTER TABLE "supplier_credits"
		ADD CONSTRAINT "supplier_credits_vendor_id_vendors_id_fk"
		FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'supplier_credits_supplier_payment_id_supplier_payments_id_fk'
	) THEN
		ALTER TABLE "supplier_credits"
		ADD CONSTRAINT "supplier_credits_supplier_payment_id_supplier_payments_id_fk"
		FOREIGN KEY ("supplier_payment_id") REFERENCES "public"."supplier_payments"("id") ON DELETE no action ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_supplier_payments_org" ON "supplier_payments" USING btree ("org_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_supplier_payments_org_vendor" ON "supplier_payments" USING btree ("org_id","vendor_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_supplier_payments_journal_entry" ON "supplier_payments" USING btree ("journal_entry_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_supplier_payments_org_idempotency" ON "supplier_payments" USING btree ("org_id","idempotency_key");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_supplier_pa_payment" ON "supplier_payment_allocations" USING btree ("supplier_payment_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_supplier_pa_expense" ON "supplier_payment_allocations" USING btree ("expense_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_supplier_credits_vendor" ON "supplier_credits" USING btree ("org_id","vendor_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_supplier_credits_payment" ON "supplier_credits" USING btree ("supplier_payment_id");
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'supplier_payments_amount_positive'
	) THEN
		ALTER TABLE "supplier_payments"
		ADD CONSTRAINT "supplier_payments_amount_positive"
		CHECK ("amount" > 0);
	END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'supplier_payment_allocations_amount_positive'
	) THEN
		ALTER TABLE "supplier_payment_allocations"
		ADD CONSTRAINT "supplier_payment_allocations_amount_positive"
		CHECK ("amount" > 0);
	END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'supplier_credits_amount_positive'
	) THEN
		ALTER TABLE "supplier_credits"
		ADD CONSTRAINT "supplier_credits_amount_positive"
		CHECK ("amount" > 0);
	END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'supplier_credits_balance_non_negative'
	) THEN
		ALTER TABLE "supplier_credits"
		ADD CONSTRAINT "supplier_credits_balance_non_negative"
		CHECK ("balance" >= 0);
	END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'expenses_amount_settled_non_negative'
	) THEN
		ALTER TABLE "expenses"
		ADD CONSTRAINT "expenses_amount_settled_non_negative"
		CHECK ("amount_settled" >= 0);
	END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'expenses_balance_due_non_negative'
	) THEN
		ALTER TABLE "expenses"
		ADD CONSTRAINT "expenses_balance_due_non_negative"
		CHECK ("balance_due" >= 0);
	END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'expenses_credit_applied_non_negative'
	) THEN
		ALTER TABLE "expenses"
		ADD CONSTRAINT "expenses_credit_applied_non_negative"
		CHECK ("credit_applied" >= 0);
	END IF;
END $$;
