ALTER TABLE "auth_accounts" RENAME COLUMN "expires_at" TO "access_token_expires_at";--> statement-breakpoint
ALTER TABLE "auth_accounts" ADD COLUMN "id_token" text;--> statement-breakpoint
ALTER TABLE "auth_accounts" ADD COLUMN "refresh_token_expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "auth_accounts" ADD COLUMN "scope" text;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD COLUMN "item_notes" text;