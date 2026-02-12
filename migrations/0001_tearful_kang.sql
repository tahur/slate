PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_auth_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`expires_at` integer,
	`password` text,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_auth_accounts`("id", "user_id", "account_id", "provider_id", "access_token", "refresh_token", "expires_at", "password", "created_at", "updated_at") SELECT "id", "user_id", "account_id", "provider_id", "access_token", "refresh_token", "expires_at", "password", "created_at", "updated_at" FROM `auth_accounts`;--> statement-breakpoint
DROP TABLE `auth_accounts`;--> statement-breakpoint
ALTER TABLE `__new_auth_accounts` RENAME TO `auth_accounts`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer,
	`updated_at` integer,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_sessions`("id", "expires_at", "token", "created_at", "updated_at", "ip_address", "user_agent", "user_id") SELECT "id", "expires_at", "token", "created_at", "updated_at", "ip_address", "user_agent", "user_id" FROM `sessions`;--> statement-breakpoint
DROP TABLE `sessions`;--> statement-breakpoint
ALTER TABLE `__new_sessions` RENAME TO `sessions`;--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_token_unique` ON `sessions` (`token`);--> statement-breakpoint
CREATE TABLE `__new_users` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false,
	`name` text NOT NULL,
	`image` text,
	`role` text DEFAULT 'admin',
	`is_active` integer DEFAULT true,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`org_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_users`("id", "org_id", "email", "email_verified", "name", "image", "role", "is_active", "created_at", "updated_at") SELECT "id", "org_id", "email", "email_verified", "name", "image", "role", "is_active", "created_at", "updated_at" FROM `users`;--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
ALTER TABLE `__new_users` RENAME TO `users`;--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `__new_verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
INSERT INTO `__new_verification`("id", "identifier", "value", "expires_at", "created_at", "updated_at") SELECT "id", "identifier", "value", "expires_at", "created_at", "updated_at" FROM `verification`;--> statement-breakpoint
DROP TABLE `verification`;--> statement-breakpoint
ALTER TABLE `__new_verification` RENAME TO `verification`;--> statement-breakpoint
ALTER TABLE `organizations` ADD `prices_include_gst` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `invoices` ADD `prices_include_gst` integer DEFAULT false;