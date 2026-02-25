ALTER TABLE "auth_accounts" ADD COLUMN IF NOT EXISTS "id_token" text;--> statement-breakpoint
ALTER TABLE "auth_accounts" ADD COLUMN IF NOT EXISTS "access_token_expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "auth_accounts" ADD COLUMN IF NOT EXISTS "refresh_token_expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "auth_accounts" ADD COLUMN IF NOT EXISTS "scope" text;--> statement-breakpoint
ALTER TABLE "auth_accounts" DROP COLUMN IF EXISTS "expires_at";
