CREATE TABLE `organizations` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`address` text,
	`city` text,
	`state_code` text NOT NULL,
	`pincode` text,
	`phone` text,
	`email` text,
	`gstin` text,
	`pan` text,
	`logo_url` text,
	`currency` text DEFAULT 'INR',
	`fy_start_month` integer DEFAULT 4,
	`invoice_notes_default` text,
	`invoice_terms_default` text,
	`bank_name` text,
	`branch` text,
	`account_number` text,
	`ifsc` text,
	`upi_id` text,
	`signature_url` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`name` text NOT NULL,
	`role` text DEFAULT 'admin',
	`is_active` integer DEFAULT true,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`org_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `fiscal_years` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`name` text NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text NOT NULL,
	`is_current` integer DEFAULT false,
	`is_locked` integer DEFAULT false,
	`locked_at` text,
	`locked_by` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`org_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`locked_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `number_series` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`module` text NOT NULL,
	`prefix` text NOT NULL,
	`current_number` integer DEFAULT 0,
	`fy_year` text NOT NULL,
	`reset_on_fy` integer DEFAULT true,
	FOREIGN KEY (`org_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `number_series_org_id_module_fy_year_unique` ON `number_series` (`org_id`,`module`,`fy_year`);--> statement-breakpoint
CREATE TABLE `audit_log` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`action` text NOT NULL,
	`changed_fields` text,
	`user_id` text NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_audit_entity` ON `audit_log` (`org_id`,`entity_type`,`entity_id`);--> statement-breakpoint
CREATE INDEX `idx_audit_date` ON `audit_log` (`org_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`account_code` text NOT NULL,
	`account_name` text NOT NULL,
	`account_type` text NOT NULL,
	`parent_id` text,
	`is_system` integer DEFAULT false,
	`is_active` integer DEFAULT true,
	`description` text,
	`balance` real DEFAULT 0,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`org_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_accounts_org` ON `accounts` (`org_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `accounts_org_id_account_code_unique` ON `accounts` (`org_id`,`account_code`);--> statement-breakpoint
CREATE TABLE `journal_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`entry_number` text NOT NULL,
	`entry_date` text NOT NULL,
	`reference_type` text NOT NULL,
	`reference_id` text,
	`narration` text,
	`total_debit` real NOT NULL,
	`total_credit` real NOT NULL,
	`status` text DEFAULT 'posted',
	`reversed_by` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`created_by` text,
	FOREIGN KEY (`org_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_journals_org` ON `journal_entries` (`org_id`);--> statement-breakpoint
CREATE INDEX `idx_journals_date` ON `journal_entries` (`org_id`,`entry_date`);--> statement-breakpoint
CREATE UNIQUE INDEX `journal_entries_org_id_entry_number_unique` ON `journal_entries` (`org_id`,`entry_number`);--> statement-breakpoint
CREATE TABLE `journal_lines` (
	`id` text PRIMARY KEY NOT NULL,
	`journal_entry_id` text NOT NULL,
	`account_id` text NOT NULL,
	`debit` real DEFAULT 0,
	`credit` real DEFAULT 0,
	`party_type` text,
	`party_id` text,
	`narration` text,
	FOREIGN KEY (`journal_entry_id`) REFERENCES `journal_entries`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "debit_positive" CHECK(debit >= 0),
	CONSTRAINT "credit_positive" CHECK(credit >= 0),
	CONSTRAINT "single_sided_entry" CHECK(NOT (debit > 0 AND credit > 0))
);
--> statement-breakpoint
CREATE INDEX `idx_journal_lines_account` ON `journal_lines` (`account_id`);--> statement-breakpoint
CREATE INDEX `idx_journal_lines_party` ON `journal_lines` (`party_type`,`party_id`);--> statement-breakpoint
CREATE INDEX `idx_journal_lines_entry` ON `journal_lines` (`journal_entry_id`);--> statement-breakpoint
CREATE TABLE `customers` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`name` text NOT NULL,
	`company_name` text,
	`email` text,
	`phone` text,
	`billing_address` text,
	`city` text,
	`state_code` text,
	`pincode` text,
	`gstin` text,
	`gst_treatment` text DEFAULT 'unregistered' NOT NULL,
	`place_of_supply` text,
	`payment_terms` integer DEFAULT 0,
	`balance` real DEFAULT 0,
	`status` text DEFAULT 'active',
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	`created_by` text,
	`updated_by` text,
	FOREIGN KEY (`org_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_customers_org` ON `customers` (`org_id`);--> statement-breakpoint
CREATE TABLE `invoice_items` (
	`id` text PRIMARY KEY NOT NULL,
	`invoice_id` text NOT NULL,
	`description` text NOT NULL,
	`hsn_code` text,
	`quantity` real DEFAULT 1 NOT NULL,
	`unit` text DEFAULT 'nos',
	`rate` real NOT NULL,
	`gst_rate` real DEFAULT 18 NOT NULL,
	`cgst` real DEFAULT 0,
	`sgst` real DEFAULT 0,
	`igst` real DEFAULT 0,
	`amount` real NOT NULL,
	`total` real NOT NULL,
	`sort_order` integer DEFAULT 0,
	FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`customer_id` text NOT NULL,
	`invoice_number` text NOT NULL,
	`order_number` text,
	`invoice_date` text NOT NULL,
	`due_date` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`subtotal` real DEFAULT 0 NOT NULL,
	`discount_type` text,
	`discount_value` real DEFAULT 0,
	`discount_amount` real DEFAULT 0,
	`taxable_amount` real DEFAULT 0 NOT NULL,
	`cgst` real DEFAULT 0,
	`sgst` real DEFAULT 0,
	`igst` real DEFAULT 0,
	`total` real DEFAULT 0 NOT NULL,
	`amount_paid` real DEFAULT 0,
	`balance_due` real DEFAULT 0 NOT NULL,
	`is_inter_state` integer DEFAULT false,
	`tds_rate` real DEFAULT 0,
	`tds_amount` real DEFAULT 0,
	`eway_bill_no` text,
	`eway_bill_date` text,
	`vehicle_number` text,
	`transporter_name` text,
	`currency` text DEFAULT 'INR',
	`exchange_rate` real DEFAULT 1,
	`base_currency_total` real,
	`notes` text,
	`terms` text,
	`journal_entry_id` text,
	`issued_at` text,
	`cancelled_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	`created_by` text,
	`updated_by` text,
	FOREIGN KEY (`org_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`journal_entry_id`) REFERENCES `journal_entries`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_invoices_org` ON `invoices` (`org_id`);--> statement-breakpoint
CREATE INDEX `idx_invoices_org_customer` ON `invoices` (`org_id`,`customer_id`);--> statement-breakpoint
CREATE INDEX `idx_invoices_org_status` ON `invoices` (`org_id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_invoices_org_date` ON `invoices` (`org_id`,`invoice_date`);--> statement-breakpoint
CREATE UNIQUE INDEX `invoices_org_id_invoice_number_unique` ON `invoices` (`org_id`,`invoice_number`);--> statement-breakpoint
CREATE TABLE `customer_advances` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`customer_id` text NOT NULL,
	`payment_id` text,
	`amount` real NOT NULL,
	`balance` real NOT NULL,
	`notes` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`org_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`payment_id`) REFERENCES `payments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_advances_customer` ON `customer_advances` (`org_id`,`customer_id`);--> statement-breakpoint
CREATE TABLE `payment_allocations` (
	`id` text PRIMARY KEY NOT NULL,
	`payment_id` text NOT NULL,
	`invoice_id` text NOT NULL,
	`amount` real NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`payment_id`) REFERENCES `payments`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`customer_id` text NOT NULL,
	`payment_number` text NOT NULL,
	`payment_date` text NOT NULL,
	`amount` real NOT NULL,
	`payment_mode` text NOT NULL,
	`reference` text,
	`notes` text,
	`deposit_to` text NOT NULL,
	`journal_entry_id` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`created_by` text,
	FOREIGN KEY (`org_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`journal_entry_id`) REFERENCES `journal_entries`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_payments_org` ON `payments` (`org_id`);--> statement-breakpoint
CREATE INDEX `idx_payments_org_customer` ON `payments` (`org_id`,`customer_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `payments_org_id_payment_number_unique` ON `payments` (`org_id`,`payment_number`);--> statement-breakpoint
CREATE TABLE `expenses` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`expense_number` text NOT NULL,
	`expense_date` text NOT NULL,
	`category` text NOT NULL,
	`vendor_id` text,
	`vendor_name` text,
	`description` text,
	`amount` real NOT NULL,
	`gst_rate` real DEFAULT 0,
	`cgst` real DEFAULT 0,
	`sgst` real DEFAULT 0,
	`igst` real DEFAULT 0,
	`total` real NOT NULL,
	`paid_through` text NOT NULL,
	`reference` text,
	`receipt_url` text,
	`journal_entry_id` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	`created_by` text,
	FOREIGN KEY (`org_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`vendor_id`) REFERENCES `vendors`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`journal_entry_id`) REFERENCES `journal_entries`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_expenses_org` ON `expenses` (`org_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `expenses_org_id_expense_number_unique` ON `expenses` (`org_id`,`expense_number`);--> statement-breakpoint
CREATE TABLE `credit_notes` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`customer_id` text NOT NULL,
	`invoice_id` text,
	`credit_note_number` text NOT NULL,
	`credit_note_date` text NOT NULL,
	`subtotal` real NOT NULL,
	`cgst` real DEFAULT 0,
	`sgst` real DEFAULT 0,
	`igst` real DEFAULT 0,
	`total` real NOT NULL,
	`balance` real DEFAULT 0,
	`reason` text NOT NULL,
	`notes` text,
	`status` text DEFAULT 'issued',
	`journal_entry_id` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`created_by` text,
	FOREIGN KEY (`org_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`journal_entry_id`) REFERENCES `journal_entries`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `credit_notes_org_id_credit_note_number_unique` ON `credit_notes` (`org_id`,`credit_note_number`);--> statement-breakpoint
CREATE TABLE `credit_allocations` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`invoice_id` text NOT NULL,
	`credit_note_id` text,
	`advance_id` text,
	`amount` real NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`org_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`credit_note_id`) REFERENCES `credit_notes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`advance_id`) REFERENCES `customer_advances`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `vendors` (
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
	`updated_by` text
);
