CREATE TABLE IF NOT EXISTS "payment_accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"label" text NOT NULL,
	"kind" text NOT NULL,
	"ledger_code" text NOT NULL,
	"bank_name" text,
	"account_number_last4" text,
	"ifsc" text,
	"upi_id" text,
	"card_label" text,
	"is_active" boolean DEFAULT true,
	"is_default_receive" boolean DEFAULT false,
	"is_default_pay" boolean DEFAULT false,
	"sort_order" integer DEFAULT 0,
	"created_at" text DEFAULT NOW()::text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payment_methods" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"method_key" text NOT NULL,
	"label" text NOT NULL,
	"direction" text DEFAULT 'both',
	"is_default" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"created_at" text DEFAULT NOW()::text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payment_method_account_map" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"payment_method_id" text NOT NULL,
	"payment_account_id" text NOT NULL,
	"is_default" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_at" text DEFAULT NOW()::text
);
--> statement-breakpoint
ALTER TABLE IF EXISTS "payments" ADD COLUMN IF NOT EXISTS "payment_account_id" text;
--> statement-breakpoint
ALTER TABLE IF EXISTS "payments" ADD COLUMN IF NOT EXISTS "payment_method_id" text;
--> statement-breakpoint
ALTER TABLE IF EXISTS "expenses" ADD COLUMN IF NOT EXISTS "payment_account_id" text;
--> statement-breakpoint
ALTER TABLE IF EXISTS "expenses" ADD COLUMN IF NOT EXISTS "payment_method_id" text;
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'payment_accounts_org_id_organizations_id_fk'
	) THEN
		ALTER TABLE "payment_accounts"
		ADD CONSTRAINT "payment_accounts_org_id_organizations_id_fk"
		FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'payment_methods_org_id_organizations_id_fk'
	) THEN
		ALTER TABLE "payment_methods"
		ADD CONSTRAINT "payment_methods_org_id_organizations_id_fk"
		FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'payment_method_account_map_org_id_organizations_id_fk'
	) THEN
		ALTER TABLE "payment_method_account_map"
		ADD CONSTRAINT "payment_method_account_map_org_id_organizations_id_fk"
		FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'payment_method_account_map_payment_method_id_payment_methods_id_fk'
	) THEN
		ALTER TABLE "payment_method_account_map"
		ADD CONSTRAINT "payment_method_account_map_payment_method_id_payment_methods_id_fk"
		FOREIGN KEY ("payment_method_id") REFERENCES "public"."payment_methods"("id") ON DELETE no action ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'payment_method_account_map_payment_account_id_payment_accounts_id_fk'
	) THEN
		ALTER TABLE "payment_method_account_map"
		ADD CONSTRAINT "payment_method_account_map_payment_account_id_payment_accounts_id_fk"
		FOREIGN KEY ("payment_account_id") REFERENCES "public"."payment_accounts"("id") ON DELETE no action ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'payments_payment_account_id_payment_accounts_id_fk'
	) THEN
		ALTER TABLE "payments"
		ADD CONSTRAINT "payments_payment_account_id_payment_accounts_id_fk"
		FOREIGN KEY ("payment_account_id") REFERENCES "public"."payment_accounts"("id") ON DELETE no action ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'payments_payment_method_id_payment_methods_id_fk'
	) THEN
		ALTER TABLE "payments"
		ADD CONSTRAINT "payments_payment_method_id_payment_methods_id_fk"
		FOREIGN KEY ("payment_method_id") REFERENCES "public"."payment_methods"("id") ON DELETE no action ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'expenses_payment_account_id_payment_accounts_id_fk'
	) THEN
		ALTER TABLE "expenses"
		ADD CONSTRAINT "expenses_payment_account_id_payment_accounts_id_fk"
		FOREIGN KEY ("payment_account_id") REFERENCES "public"."payment_accounts"("id") ON DELETE no action ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'expenses_payment_method_id_payment_methods_id_fk'
	) THEN
		ALTER TABLE "expenses"
		ADD CONSTRAINT "expenses_payment_method_id_payment_methods_id_fk"
		FOREIGN KEY ("payment_method_id") REFERENCES "public"."payment_methods"("id") ON DELETE no action ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_payment_accounts_org" ON "payment_accounts" USING btree ("org_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_payment_accounts_org_active" ON "payment_accounts" USING btree ("org_id","is_active");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_payment_accounts_org_label" ON "payment_accounts" USING btree ("org_id","label");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_payment_methods_org" ON "payment_methods" USING btree ("org_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_payment_methods_org_active" ON "payment_methods" USING btree ("org_id","is_active");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_payment_methods_org_key" ON "payment_methods" USING btree ("org_id","method_key");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_payment_method_map_org" ON "payment_method_account_map" USING btree ("org_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_payment_method_map_method" ON "payment_method_account_map" USING btree ("payment_method_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_payment_method_map_account" ON "payment_method_account_map" USING btree ("payment_account_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_payment_method_map_unique" ON "payment_method_account_map" USING btree ("org_id","payment_method_id","payment_account_id");
--> statement-breakpoint
DO $$
BEGIN
	IF to_regclass('public.payment_modes') IS NOT NULL THEN
		INSERT INTO "payment_methods" (
			"id",
			"org_id",
			"method_key",
			"label",
			"direction",
			"is_default",
			"is_active",
			"sort_order",
			"created_at"
		)
		SELECT
			pm."id",
			pm."org_id",
			pm."mode_key",
			pm."label",
			'both',
			COALESCE(pm."is_default", false),
			COALESCE(pm."is_active", true),
			COALESCE(pm."sort_order", 0),
			COALESCE(pm."created_at", NOW()::text)
		FROM "payment_modes" pm
		ON CONFLICT DO NOTHING;

		INSERT INTO "payment_accounts" (
			"id",
			"org_id",
			"label",
			"kind",
			"ledger_code",
			"is_active",
			"is_default_receive",
			"is_default_pay",
			"sort_order",
			"created_at"
		)
		SELECT DISTINCT
			acc."id",
			pm."org_id",
			COALESCE(NULLIF(acc."account_name", ''), 'Account') || ' - ' || acc."account_code",
			CASE WHEN acc."account_code" = '1000' THEN 'cash' ELSE 'bank' END,
			CASE WHEN acc."account_code" = '1000' THEN '1000' ELSE '1100' END,
			true,
			false,
			false,
			COALESCE(pm."sort_order", 0),
			NOW()::text
		FROM "payment_modes" pm
		INNER JOIN "accounts" acc
			ON acc."id" = pm."linked_account_id"
			AND acc."org_id" = pm."org_id"
		ON CONFLICT DO NOTHING;

		INSERT INTO "payment_method_account_map" (
			"id",
			"org_id",
			"payment_method_id",
			"payment_account_id",
			"is_default",
			"is_active",
			"created_at"
		)
		SELECT
			md5(pm."org_id" || ':' || pm."id" || ':' || pm."linked_account_id"),
			pm."org_id",
			pm."id",
			pm."linked_account_id",
			true,
			true,
			NOW()::text
		FROM "payment_modes" pm
		INNER JOIN "payment_methods" m
			ON m."id" = pm."id"
		INNER JOIN "payment_accounts" pa
			ON pa."id" = pm."linked_account_id"
		WHERE pm."linked_account_id" IS NOT NULL
		ON CONFLICT DO NOTHING;
	END IF;
END $$;
--> statement-breakpoint
UPDATE "payments" p
SET "payment_method_id" = pm."id"
FROM "payment_methods" pm
WHERE p."payment_method_id" IS NULL
	AND p."org_id" = pm."org_id"
	AND p."payment_mode" = pm."method_key";
--> statement-breakpoint
UPDATE "payments" p
SET "payment_account_id" = pa."id"
FROM "payment_accounts" pa
WHERE p."payment_account_id" IS NULL
	AND p."org_id" = pa."org_id"
	AND p."deposit_to" = pa."id";
--> statement-breakpoint
UPDATE "expenses" e
SET "payment_account_id" = pa."id"
FROM "payment_accounts" pa
WHERE e."payment_account_id" IS NULL
	AND e."org_id" = pa."org_id"
	AND e."paid_through" = pa."id";
--> statement-breakpoint
DROP TABLE IF EXISTS "payment_modes" CASCADE;
