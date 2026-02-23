ALTER TABLE IF EXISTS "payments" ADD COLUMN IF NOT EXISTS "reason_snapshot" text;
--> statement-breakpoint
ALTER TABLE IF EXISTS "expenses" ADD COLUMN IF NOT EXISTS "payment_status" text DEFAULT 'paid';
--> statement-breakpoint
UPDATE "expenses"
SET "payment_status" = CASE
	WHEN "paid_through" IS NULL THEN 'unpaid'
	ELSE 'paid'
END
WHERE "payment_status" IS NULL;
--> statement-breakpoint
ALTER TABLE IF EXISTS "expenses" ALTER COLUMN "payment_status" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE IF EXISTS "expenses" ALTER COLUMN "paid_through" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE IF EXISTS "expenses" ADD COLUMN IF NOT EXISTS "reason_snapshot" text;
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'expenses_payment_status_check'
	) THEN
		ALTER TABLE "expenses"
		ADD CONSTRAINT "expenses_payment_status_check"
		CHECK ("payment_status" IN ('paid', 'unpaid'));
	END IF;
END $$;
