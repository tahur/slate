CREATE TABLE `password_reset_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `items` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`type` text DEFAULT 'service' NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`hsn_code` text,
	`gst_rate` real DEFAULT 18 NOT NULL,
	`rate` real DEFAULT 0 NOT NULL,
	`unit` text DEFAULT 'nos',
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	`created_by` text,
	`updated_by` text,
	FOREIGN KEY (`org_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_items_org` ON `items` (`org_id`);--> statement-breakpoint
CREATE INDEX `idx_items_org_type` ON `items` (`org_id`,`type`);--> statement-breakpoint
CREATE TABLE `app_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`smtp_host` text,
	`smtp_port` integer DEFAULT 587,
	`smtp_user` text,
	`smtp_pass` text,
	`smtp_from` text,
	`smtp_secure` integer DEFAULT false,
	`smtp_enabled` integer DEFAULT false,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`org_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `invoice_items` ADD `item_id` text REFERENCES items(id);--> statement-breakpoint
ALTER TABLE `invoices` ADD `idempotency_key` text;--> statement-breakpoint
ALTER TABLE `payments` ADD `idempotency_key` text;--> statement-breakpoint
ALTER TABLE `expenses` ADD `idempotency_key` text;--> statement-breakpoint
ALTER TABLE `credit_notes` ADD `idempotency_key` text;