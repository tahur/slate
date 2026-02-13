PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_journal_lines` (
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
	CONSTRAINT "single_sided_entry" CHECK((debit > 0 AND credit = 0) OR (debit = 0 AND credit > 0))
);
--> statement-breakpoint
INSERT INTO `__new_journal_lines`("id", "journal_entry_id", "account_id", "debit", "credit", "party_type", "party_id", "narration") SELECT "id", "journal_entry_id", "account_id", "debit", "credit", "party_type", "party_id", "narration" FROM `journal_lines`;--> statement-breakpoint
DROP TABLE `journal_lines`;--> statement-breakpoint
ALTER TABLE `__new_journal_lines` RENAME TO `journal_lines`;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_journal_lines_account` ON `journal_lines` (`account_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_journal_lines_party` ON `journal_lines` (`party_type`,`party_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_journal_lines_entry` ON `journal_lines` (`journal_entry_id`);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `idx_items_org_sku` ON `items` (`org_id`,`sku`);--> statement-breakpoint
WITH `invoices_dedupe` AS (
    SELECT `rowid`
    FROM (
        SELECT
            `rowid`,
            ROW_NUMBER() OVER (
                PARTITION BY `org_id`, `idempotency_key`
                ORDER BY `created_at`, `rowid`
            ) AS `rn`
        FROM `invoices`
        WHERE `idempotency_key` IS NOT NULL
    )
    WHERE `rn` > 1
)
UPDATE `invoices`
SET `idempotency_key` = NULL
WHERE `rowid` IN (SELECT `rowid` FROM `invoices_dedupe`);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `idx_invoices_org_idempotency` ON `invoices` (`org_id`,`idempotency_key`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_pa_payment` ON `payment_allocations` (`payment_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_pa_invoice` ON `payment_allocations` (`invoice_id`);--> statement-breakpoint
WITH `payments_dedupe` AS (
    SELECT `rowid`
    FROM (
        SELECT
            `rowid`,
            ROW_NUMBER() OVER (
                PARTITION BY `org_id`, `idempotency_key`
                ORDER BY `created_at`, `rowid`
            ) AS `rn`
        FROM `payments`
        WHERE `idempotency_key` IS NOT NULL
    )
    WHERE `rn` > 1
)
UPDATE `payments`
SET `idempotency_key` = NULL
WHERE `rowid` IN (SELECT `rowid` FROM `payments_dedupe`);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `idx_payments_org_idempotency` ON `payments` (`org_id`,`idempotency_key`);--> statement-breakpoint
WITH `expenses_dedupe` AS (
    SELECT `rowid`
    FROM (
        SELECT
            `rowid`,
            ROW_NUMBER() OVER (
                PARTITION BY `org_id`, `idempotency_key`
                ORDER BY `created_at`, `rowid`
            ) AS `rn`
        FROM `expenses`
        WHERE `idempotency_key` IS NOT NULL
    )
    WHERE `rn` > 1
)
UPDATE `expenses`
SET `idempotency_key` = NULL
WHERE `rowid` IN (SELECT `rowid` FROM `expenses_dedupe`);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `idx_expenses_org_idempotency` ON `expenses` (`org_id`,`idempotency_key`);--> statement-breakpoint
WITH `credit_notes_dedupe` AS (
    SELECT `rowid`
    FROM (
        SELECT
            `rowid`,
            ROW_NUMBER() OVER (
                PARTITION BY `org_id`, `idempotency_key`
                ORDER BY `created_at`, `rowid`
            ) AS `rn`
        FROM `credit_notes`
        WHERE `idempotency_key` IS NOT NULL
    )
    WHERE `rn` > 1
)
UPDATE `credit_notes`
SET `idempotency_key` = NULL
WHERE `rowid` IN (SELECT `rowid` FROM `credit_notes_dedupe`);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `idx_credit_notes_org_idempotency` ON `credit_notes` (`org_id`,`idempotency_key`);--> statement-breakpoint
CREATE TABLE `__new_credit_allocations` (
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
	FOREIGN KEY (`advance_id`) REFERENCES `customer_advances`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "ca_amount_positive" CHECK(amount > 0),
	CONSTRAINT "ca_single_source" CHECK((credit_note_id IS NOT NULL AND advance_id IS NULL) OR (credit_note_id IS NULL AND advance_id IS NOT NULL))
);
--> statement-breakpoint
INSERT INTO `__new_credit_allocations`("id", "org_id", "invoice_id", "credit_note_id", "advance_id", "amount", "created_at") SELECT "id", "org_id", "invoice_id", "credit_note_id", "advance_id", "amount", "created_at" FROM `credit_allocations`;--> statement-breakpoint
DROP TABLE `credit_allocations`;--> statement-breakpoint
ALTER TABLE `__new_credit_allocations` RENAME TO `credit_allocations`;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_ca_invoice` ON `credit_allocations` (`invoice_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_ca_credit_note` ON `credit_allocations` (`credit_note_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_ca_advance` ON `credit_allocations` (`advance_id`);--> statement-breakpoint
CREATE TABLE `__new_journal_entries` (
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
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "entry_balanced" CHECK(ROUND(total_debit, 2) = ROUND(total_credit, 2))
);
--> statement-breakpoint
INSERT INTO `__new_journal_entries`("id", "org_id", "entry_number", "entry_date", "reference_type", "reference_id", "narration", "total_debit", "total_credit", "status", "reversed_by", "created_at", "created_by") SELECT "id", "org_id", "entry_number", "entry_date", "reference_type", "reference_id", "narration", "total_debit", "total_credit", "status", "reversed_by", "created_at", "created_by" FROM `journal_entries`;--> statement-breakpoint
DROP TABLE `journal_entries`;--> statement-breakpoint
ALTER TABLE `__new_journal_entries` RENAME TO `journal_entries`;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_journals_org` ON `journal_entries` (`org_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_journals_date` ON `journal_entries` (`org_id`,`entry_date`);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `journal_entries_org_id_entry_number_unique` ON `journal_entries` (`org_id`,`entry_number`);--> statement-breakpoint
PRAGMA foreign_keys=ON;
