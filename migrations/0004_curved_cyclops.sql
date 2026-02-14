CREATE TABLE `payment_modes` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`mode_key` text NOT NULL,
	`label` text NOT NULL,
	`linked_account_id` text,
	`is_default` integer DEFAULT false,
	`sort_order` integer DEFAULT 0,
	`is_active` integer DEFAULT true,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`org_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`linked_account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_payment_modes_org` ON `payment_modes` (`org_id`);--> statement-breakpoint
ALTER TABLE `items` ADD `min_quantity` real DEFAULT 1 NOT NULL;--> statement-breakpoint
CREATE INDEX `idx_invoices_journal_entry` ON `invoices` (`journal_entry_id`);--> statement-breakpoint
CREATE INDEX `idx_payments_journal_entry` ON `payments` (`journal_entry_id`);--> statement-breakpoint
CREATE INDEX `idx_expenses_journal_entry` ON `expenses` (`journal_entry_id`);--> statement-breakpoint
CREATE INDEX `idx_credit_notes_invoice` ON `credit_notes` (`invoice_id`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_vendors` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`name` text NOT NULL,
	`company_name` text,
	`display_name` text,
	`email` text,
	`phone` text,
	`website` text,
	`billing_address` text,
	`city` text,
	`state_code` text,
	`pincode` text,
	`country` text DEFAULT 'India',
	`gstin` text,
	`gst_treatment` text DEFAULT 'unregistered',
	`pan` text,
	`payment_terms` integer DEFAULT 30,
	`balance` real DEFAULT 0,
	`tds_applicable` integer DEFAULT 0,
	`tds_section` text,
	`is_active` integer DEFAULT 1,
	`notes` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	`created_by` text,
	`updated_by` text,
	FOREIGN KEY (`org_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_vendors`("id", "org_id", "name", "company_name", "display_name", "email", "phone", "website", "billing_address", "city", "state_code", "pincode", "country", "gstin", "gst_treatment", "pan", "payment_terms", "balance", "tds_applicable", "tds_section", "is_active", "notes", "created_at", "updated_at", "created_by", "updated_by") SELECT "id", "org_id", "name", "company_name", "display_name", "email", "phone", "website", "billing_address", "city", "state_code", "pincode", "country", "gstin", "gst_treatment", "pan", "payment_terms", "balance", "tds_applicable", "tds_section", "is_active", "notes", "created_at", "updated_at", "created_by", "updated_by" FROM `vendors`;--> statement-breakpoint
DROP TABLE `vendors`;--> statement-breakpoint
ALTER TABLE `__new_vendors` RENAME TO `vendors`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `idx_vendors_org` ON `vendors` (`org_id`);--> statement-breakpoint
CREATE INDEX `idx_vendors_org_name` ON `vendors` (`org_id`,`name`);--> statement-breakpoint
CREATE INDEX `idx_vendors_org_active` ON `vendors` (`org_id`,`is_active`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_app_settings_org_unique` ON `app_settings` (`org_id`);