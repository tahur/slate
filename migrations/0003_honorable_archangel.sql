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
INSERT INTO `__new_vendors`(
	`id`,
	`org_id`,
	`name`,
	`company_name`,
	`display_name`,
	`email`,
	`phone`,
	`website`,
	`billing_address`,
	`city`,
	`state_code`,
	`pincode`,
	`country`,
	`gstin`,
	`gst_treatment`,
	`pan`,
	`payment_terms`,
	`balance`,
	`tds_applicable`,
	`tds_section`,
	`is_active`,
	`notes`,
	`created_at`,
	`updated_at`,
	`created_by`,
	`updated_by`
)
SELECT
	`id`,
	`org_id`,
	`name`,
	`company_name`,
	`display_name`,
	`email`,
	`phone`,
	`website`,
	`billing_address`,
	`city`,
	`state_code`,
	`pincode`,
	`country`,
	`gstin`,
	`gst_treatment`,
	`pan`,
	`payment_terms`,
	`balance`,
	`tds_applicable`,
	`tds_section`,
	`is_active`,
	`notes`,
	`created_at`,
	`updated_at`,
	`created_by`,
	`updated_by`
FROM `vendors`;
--> statement-breakpoint
DROP TABLE `vendors`;--> statement-breakpoint
ALTER TABLE `__new_vendors` RENAME TO `vendors`;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_vendors_org` ON `vendors` (`org_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_vendors_org_name` ON `vendors` (`org_id`,`name`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_vendors_org_active` ON `vendors` (`org_id`,`is_active`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_invoices_journal_entry` ON `invoices` (`journal_entry_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_payments_journal_entry` ON `payments` (`journal_entry_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_expenses_journal_entry` ON `expenses` (`journal_entry_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_credit_notes_invoice` ON `credit_notes` (`invoice_id`);--> statement-breakpoint
WITH `app_settings_dedupe` AS (
	SELECT `rowid`
	FROM (
		SELECT
			`rowid`,
			ROW_NUMBER() OVER (
				PARTITION BY `org_id`
				ORDER BY COALESCE(`updated_at`, `created_at`) DESC, `rowid` DESC
			) AS `rn`
		FROM `app_settings`
		WHERE `org_id` IS NOT NULL
	)
	WHERE `rn` > 1
)
DELETE FROM `app_settings`
WHERE `rowid` IN (SELECT `rowid` FROM `app_settings_dedupe`);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `idx_app_settings_org_unique` ON `app_settings` (`org_id`);--> statement-breakpoint
PRAGMA foreign_keys=ON;
