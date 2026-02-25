CREATE TABLE IF NOT EXISTS "quotations" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"customer_id" text NOT NULL,
	"quotation_number" text NOT NULL,
	"reference_number" text,
	"subject" text,
	"quotation_date" text NOT NULL,
	"valid_until" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"subtotal" numeric(14, 2) DEFAULT 0 NOT NULL,
	"discount_type" text,
	"discount_value" numeric(14, 4) DEFAULT 0,
	"discount_amount" numeric(14, 2) DEFAULT 0,
	"taxable_amount" numeric(14, 2) DEFAULT 0 NOT NULL,
	"cgst" numeric(14, 2) DEFAULT 0,
	"sgst" numeric(14, 2) DEFAULT 0,
	"igst" numeric(14, 2) DEFAULT 0,
	"total" numeric(14, 2) DEFAULT 0 NOT NULL,
	"is_inter_state" boolean DEFAULT false,
	"prices_include_gst" boolean DEFAULT false,
	"notes" text,
	"terms" text,
	"converted_invoice_id" text,
	"idempotency_key" text,
	"sent_at" text,
	"accepted_at" text,
	"declined_at" text,
	"expired_at" text,
	"created_at" text DEFAULT NOW()::text,
	"updated_at" text DEFAULT NOW()::text,
	"created_by" text,
	"updated_by" text,
	CONSTRAINT "quotations_org_id_quotation_number_unique" UNIQUE("org_id","quotation_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "quotation_items" (
	"id" text PRIMARY KEY NOT NULL,
	"quotation_id" text NOT NULL,
	"item_id" text,
	"description" text NOT NULL,
	"hsn_code" text,
	"quantity" numeric(14, 4) DEFAULT 1 NOT NULL,
	"unit" text DEFAULT 'nos',
	"rate" numeric(14, 4) NOT NULL,
	"gst_rate" numeric(14, 4) DEFAULT 18 NOT NULL,
	"cgst" numeric(14, 2) DEFAULT 0,
	"sgst" numeric(14, 2) DEFAULT 0,
	"igst" numeric(14, 2) DEFAULT 0,
	"amount" numeric(14, 2) NOT NULL,
	"total" numeric(14, 2) NOT NULL,
	"sort_order" integer DEFAULT 0
);
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'quotations_org_id_organizations_id_fk'
	) THEN
		ALTER TABLE "quotations"
		ADD CONSTRAINT "quotations_org_id_organizations_id_fk"
		FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'quotations_customer_id_customers_id_fk'
	) THEN
		ALTER TABLE "quotations"
		ADD CONSTRAINT "quotations_customer_id_customers_id_fk"
		FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'quotations_converted_invoice_id_invoices_id_fk'
	) THEN
		ALTER TABLE "quotations"
		ADD CONSTRAINT "quotations_converted_invoice_id_invoices_id_fk"
		FOREIGN KEY ("converted_invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'quotations_created_by_users_id_fk'
	) THEN
		ALTER TABLE "quotations"
		ADD CONSTRAINT "quotations_created_by_users_id_fk"
		FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'quotations_updated_by_users_id_fk'
	) THEN
		ALTER TABLE "quotations"
		ADD CONSTRAINT "quotations_updated_by_users_id_fk"
		FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'quotation_items_quotation_id_quotations_id_fk'
	) THEN
		ALTER TABLE "quotation_items"
		ADD CONSTRAINT "quotation_items_quotation_id_quotations_id_fk"
		FOREIGN KEY ("quotation_id") REFERENCES "public"."quotations"("id") ON DELETE cascade ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'quotation_items_item_id_items_id_fk'
	) THEN
		ALTER TABLE "quotation_items"
		ADD CONSTRAINT "quotation_items_item_id_items_id_fk"
		FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE no action ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_quotations_org" ON "quotations" USING btree ("org_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_quotations_org_customer" ON "quotations" USING btree ("org_id","customer_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_quotations_org_status" ON "quotations" USING btree ("org_id","status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_quotations_org_date" ON "quotations" USING btree ("org_id","quotation_date");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_quotations_org_idempotency" ON "quotations" USING btree ("org_id","idempotency_key");
