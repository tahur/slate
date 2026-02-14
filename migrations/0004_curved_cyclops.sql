CREATE TABLE IF NOT EXISTS `payment_modes` (
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
CREATE INDEX IF NOT EXISTS `idx_payment_modes_org` ON `payment_modes` (`org_id`);
