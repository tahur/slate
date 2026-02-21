CREATE TABLE "organizations" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"city" text,
	"state_code" text NOT NULL,
	"pincode" text,
	"phone" text,
	"email" text,
	"gstin" text,
	"pan" text,
	"logo_url" text,
	"currency" text DEFAULT 'INR',
	"fy_start_month" integer DEFAULT 4,
	"invoice_notes_default" text,
	"invoice_terms_default" text,
	"bank_name" text,
	"branch" text,
	"account_number" text,
	"ifsc" text,
	"upi_id" text,
	"signature_url" text,
	"prices_include_gst" boolean DEFAULT false,
	"created_at" text DEFAULT NOW()::text,
	"updated_at" text DEFAULT NOW()::text
);
--> statement-breakpoint
CREATE TABLE "auth_accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"expires_at" timestamp,
	"password" text,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false,
	"name" text NOT NULL,
	"image" text,
	"role" text DEFAULT 'admin',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp,
	"updated_at" timestamp,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "fiscal_years" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"name" text NOT NULL,
	"start_date" text NOT NULL,
	"end_date" text NOT NULL,
	"is_current" boolean DEFAULT false,
	"is_locked" boolean DEFAULT false,
	"locked_at" text,
	"locked_by" text,
	"created_at" text DEFAULT NOW()::text
);
--> statement-breakpoint
CREATE TABLE "number_series" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"module" text NOT NULL,
	"prefix" text NOT NULL,
	"current_number" integer DEFAULT 0,
	"fy_year" text NOT NULL,
	"reset_on_fy" boolean DEFAULT true,
	CONSTRAINT "number_series_org_id_module_fy_year_unique" UNIQUE("org_id","module","fy_year")
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"action" text NOT NULL,
	"changed_fields" text,
	"user_id" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" text DEFAULT NOW()::text
);
--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"account_code" text NOT NULL,
	"account_name" text NOT NULL,
	"account_type" text NOT NULL,
	"parent_id" text,
	"is_system" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"description" text,
	"balance" numeric(14, 2) DEFAULT 0,
	"created_at" text DEFAULT NOW()::text,
	CONSTRAINT "accounts_org_id_account_code_unique" UNIQUE("org_id","account_code")
);
--> statement-breakpoint
CREATE TABLE "journal_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"entry_number" text NOT NULL,
	"entry_date" text NOT NULL,
	"reference_type" text NOT NULL,
	"reference_id" text,
	"narration" text,
	"total_debit" numeric(14, 2) NOT NULL,
	"total_credit" numeric(14, 2) NOT NULL,
	"status" text DEFAULT 'posted',
	"reversed_by" text,
	"created_at" text DEFAULT NOW()::text,
	"created_by" text,
	CONSTRAINT "journal_entries_org_id_entry_number_unique" UNIQUE("org_id","entry_number"),
	CONSTRAINT "entry_balanced" CHECK (ROUND(total_debit::numeric, 2) = ROUND(total_credit::numeric, 2))
);
--> statement-breakpoint
CREATE TABLE "journal_lines" (
	"id" text PRIMARY KEY NOT NULL,
	"journal_entry_id" text NOT NULL,
	"account_id" text NOT NULL,
	"debit" numeric(14, 2) DEFAULT 0,
	"credit" numeric(14, 2) DEFAULT 0,
	"party_type" text,
	"party_id" text,
	"narration" text,
	CONSTRAINT "debit_positive" CHECK (debit >= 0),
	CONSTRAINT "credit_positive" CHECK (credit >= 0),
	CONSTRAINT "single_sided_entry" CHECK ((debit > 0 AND credit = 0) OR (debit = 0 AND credit > 0))
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"name" text NOT NULL,
	"company_name" text,
	"email" text,
	"phone" text,
	"billing_address" text,
	"city" text,
	"state_code" text,
	"pincode" text,
	"gstin" text,
	"gst_treatment" text DEFAULT 'unregistered' NOT NULL,
	"place_of_supply" text,
	"payment_terms" integer DEFAULT 0,
	"balance" numeric(14, 2) DEFAULT 0,
	"status" text DEFAULT 'active',
	"created_at" text DEFAULT NOW()::text,
	"updated_at" text DEFAULT NOW()::text,
	"created_by" text,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "items" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"type" text DEFAULT 'service' NOT NULL,
	"sku" text,
	"name" text NOT NULL,
	"description" text,
	"hsn_code" text,
	"gst_rate" numeric(14, 4) DEFAULT 18 NOT NULL,
	"rate" numeric(14, 4) DEFAULT 0 NOT NULL,
	"unit" text DEFAULT 'nos',
	"min_quantity" numeric(14, 4) DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" text DEFAULT NOW()::text,
	"updated_at" text DEFAULT NOW()::text,
	"created_by" text,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "invoice_items" (
	"id" text PRIMARY KEY NOT NULL,
	"invoice_id" text NOT NULL,
	"item_id" text,
	"description" text NOT NULL,
	"hsn_code" text,
	"quantity" numeric(14, 4) DEFAULT 1 NOT NULL,
	"unit" text DEFAULT 'nos',
	"rate" numeric(14, 4) NOT NULL,
	"gst_rate" numeric(14, 4) DEFAULT 18 NOT NULL,
	"cgst" numeric(14, 2) DEFAULT 0,
	"sgst" numeric(14, 2) DEFAULT 0,
	"igst" numeric(14, 2) DEFAULT 0,
	"amount" numeric(14, 2) NOT NULL,
	"total" numeric(14, 2) NOT NULL,
	"sort_order" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"customer_id" text NOT NULL,
	"invoice_number" text NOT NULL,
	"order_number" text,
	"invoice_date" text NOT NULL,
	"due_date" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"subtotal" numeric(14, 2) DEFAULT 0 NOT NULL,
	"discount_type" text,
	"discount_value" numeric(14, 4) DEFAULT 0,
	"discount_amount" numeric(14, 2) DEFAULT 0,
	"taxable_amount" numeric(14, 2) DEFAULT 0 NOT NULL,
	"cgst" numeric(14, 2) DEFAULT 0,
	"sgst" numeric(14, 2) DEFAULT 0,
	"igst" numeric(14, 2) DEFAULT 0,
	"total" numeric(14, 2) DEFAULT 0 NOT NULL,
	"amount_paid" numeric(14, 2) DEFAULT 0,
	"balance_due" numeric(14, 2) DEFAULT 0 NOT NULL,
	"is_inter_state" boolean DEFAULT false,
	"prices_include_gst" boolean DEFAULT false,
	"tds_rate" numeric(14, 4) DEFAULT 0,
	"tds_amount" numeric(14, 2) DEFAULT 0,
	"eway_bill_no" text,
	"eway_bill_date" text,
	"vehicle_number" text,
	"transporter_name" text,
	"currency" text DEFAULT 'INR',
	"exchange_rate" numeric(14, 4) DEFAULT 1,
	"base_currency_total" numeric(14, 2),
	"notes" text,
	"terms" text,
	"journal_entry_id" text,
	"idempotency_key" text,
	"issued_at" text,
	"cancelled_at" text,
	"created_at" text DEFAULT NOW()::text,
	"updated_at" text DEFAULT NOW()::text,
	"created_by" text,
	"updated_by" text,
	CONSTRAINT "invoices_org_id_invoice_number_unique" UNIQUE("org_id","invoice_number")
);
--> statement-breakpoint
CREATE TABLE "customer_advances" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"customer_id" text NOT NULL,
	"payment_id" text,
	"amount" numeric(14, 2) NOT NULL,
	"balance" numeric(14, 2) NOT NULL,
	"notes" text,
	"created_at" text DEFAULT NOW()::text
);
--> statement-breakpoint
CREATE TABLE "payment_allocations" (
	"id" text PRIMARY KEY NOT NULL,
	"payment_id" text NOT NULL,
	"invoice_id" text NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"created_at" text DEFAULT NOW()::text
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"customer_id" text NOT NULL,
	"payment_number" text NOT NULL,
	"payment_date" text NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"payment_mode" text NOT NULL,
	"reference" text,
	"notes" text,
	"deposit_to" text NOT NULL,
	"journal_entry_id" text,
	"idempotency_key" text,
	"created_at" text DEFAULT NOW()::text,
	"created_by" text,
	CONSTRAINT "payments_org_id_payment_number_unique" UNIQUE("org_id","payment_number")
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"expense_number" text NOT NULL,
	"expense_date" text NOT NULL,
	"category" text NOT NULL,
	"vendor_id" text,
	"vendor_name" text,
	"description" text,
	"amount" numeric(14, 2) NOT NULL,
	"gst_rate" numeric(14, 4) DEFAULT 0,
	"cgst" numeric(14, 2) DEFAULT 0,
	"sgst" numeric(14, 2) DEFAULT 0,
	"igst" numeric(14, 2) DEFAULT 0,
	"total" numeric(14, 2) NOT NULL,
	"paid_through" text NOT NULL,
	"reference" text,
	"receipt_url" text,
	"journal_entry_id" text,
	"idempotency_key" text,
	"created_at" text DEFAULT NOW()::text,
	"updated_at" text DEFAULT NOW()::text,
	"created_by" text,
	CONSTRAINT "expenses_org_id_expense_number_unique" UNIQUE("org_id","expense_number")
);
--> statement-breakpoint
CREATE TABLE "credit_notes" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"customer_id" text NOT NULL,
	"invoice_id" text,
	"credit_note_number" text NOT NULL,
	"credit_note_date" text NOT NULL,
	"subtotal" numeric(14, 2) NOT NULL,
	"cgst" numeric(14, 2) DEFAULT 0,
	"sgst" numeric(14, 2) DEFAULT 0,
	"igst" numeric(14, 2) DEFAULT 0,
	"total" numeric(14, 2) NOT NULL,
	"balance" numeric(14, 2) DEFAULT 0,
	"reason" text NOT NULL,
	"notes" text,
	"status" text DEFAULT 'issued',
	"journal_entry_id" text,
	"idempotency_key" text,
	"created_at" text DEFAULT NOW()::text,
	"created_by" text,
	CONSTRAINT "credit_notes_org_id_credit_note_number_unique" UNIQUE("org_id","credit_note_number")
);
--> statement-breakpoint
CREATE TABLE "credit_allocations" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"invoice_id" text NOT NULL,
	"credit_note_id" text,
	"advance_id" text,
	"amount" numeric(14, 2) NOT NULL,
	"created_at" text DEFAULT NOW()::text,
	CONSTRAINT "ca_amount_positive" CHECK (amount > 0),
	CONSTRAINT "ca_single_source" CHECK ((credit_note_id IS NOT NULL AND advance_id IS NULL) OR (credit_note_id IS NULL AND advance_id IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "vendors" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"name" text NOT NULL,
	"company_name" text,
	"display_name" text,
	"email" text,
	"phone" text,
	"website" text,
	"billing_address" text,
	"city" text,
	"state_code" text,
	"pincode" text,
	"country" text DEFAULT 'India',
	"gstin" text,
	"gst_treatment" text DEFAULT 'unregistered',
	"pan" text,
	"payment_terms" integer DEFAULT 30,
	"balance" numeric(14, 2) DEFAULT 0,
	"tds_applicable" boolean DEFAULT false,
	"tds_section" text,
	"is_active" boolean DEFAULT true,
	"notes" text,
	"created_at" text DEFAULT NOW()::text,
	"updated_at" text DEFAULT NOW()::text,
	"created_by" text,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "app_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"smtp_host" text,
	"smtp_port" integer DEFAULT 587,
	"smtp_user" text,
	"smtp_pass" text,
	"smtp_from" text,
	"smtp_secure" boolean DEFAULT false,
	"smtp_enabled" boolean DEFAULT false,
	"created_at" text DEFAULT NOW()::text,
	"updated_at" text DEFAULT NOW()::text
);
--> statement-breakpoint
CREATE TABLE "payment_modes" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"mode_key" text NOT NULL,
	"label" text NOT NULL,
	"linked_account_id" text,
	"is_default" boolean DEFAULT false,
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" text DEFAULT NOW()::text
);
--> statement-breakpoint
ALTER TABLE "auth_accounts" ADD CONSTRAINT "auth_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fiscal_years" ADD CONSTRAINT "fiscal_years_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fiscal_years" ADD CONSTRAINT "fiscal_years_locked_by_users_id_fk" FOREIGN KEY ("locked_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "number_series" ADD CONSTRAINT "number_series_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_lines" ADD CONSTRAINT "journal_lines_journal_entry_id_journal_entries_id_fk" FOREIGN KEY ("journal_entry_id") REFERENCES "public"."journal_entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_lines" ADD CONSTRAINT "journal_lines_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_journal_entry_id_journal_entries_id_fk" FOREIGN KEY ("journal_entry_id") REFERENCES "public"."journal_entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_advances" ADD CONSTRAINT "customer_advances_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_advances" ADD CONSTRAINT "customer_advances_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_advances" ADD CONSTRAINT "customer_advances_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_journal_entry_id_journal_entries_id_fk" FOREIGN KEY ("journal_entry_id") REFERENCES "public"."journal_entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_journal_entry_id_journal_entries_id_fk" FOREIGN KEY ("journal_entry_id") REFERENCES "public"."journal_entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_notes" ADD CONSTRAINT "credit_notes_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_notes" ADD CONSTRAINT "credit_notes_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_notes" ADD CONSTRAINT "credit_notes_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_notes" ADD CONSTRAINT "credit_notes_journal_entry_id_journal_entries_id_fk" FOREIGN KEY ("journal_entry_id") REFERENCES "public"."journal_entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_notes" ADD CONSTRAINT "credit_notes_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_allocations" ADD CONSTRAINT "credit_allocations_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_allocations" ADD CONSTRAINT "credit_allocations_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_allocations" ADD CONSTRAINT "credit_allocations_credit_note_id_credit_notes_id_fk" FOREIGN KEY ("credit_note_id") REFERENCES "public"."credit_notes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_allocations" ADD CONSTRAINT "credit_allocations_advance_id_customer_advances_id_fk" FOREIGN KEY ("advance_id") REFERENCES "public"."customer_advances"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_settings" ADD CONSTRAINT "app_settings_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_modes" ADD CONSTRAINT "payment_modes_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_modes" ADD CONSTRAINT "payment_modes_linked_account_id_accounts_id_fk" FOREIGN KEY ("linked_account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_audit_entity" ON "audit_log" USING btree ("org_id","entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "idx_audit_date" ON "audit_log" USING btree ("org_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_accounts_org" ON "accounts" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "idx_journals_org" ON "journal_entries" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "idx_journals_date" ON "journal_entries" USING btree ("org_id","entry_date");--> statement-breakpoint
CREATE INDEX "idx_journal_lines_account" ON "journal_lines" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "idx_journal_lines_party" ON "journal_lines" USING btree ("party_type","party_id");--> statement-breakpoint
CREATE INDEX "idx_journal_lines_entry" ON "journal_lines" USING btree ("journal_entry_id");--> statement-breakpoint
CREATE INDEX "idx_customers_org" ON "customers" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "idx_items_org" ON "items" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "idx_items_org_type" ON "items" USING btree ("org_id","type");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_items_org_sku" ON "items" USING btree ("org_id","sku");--> statement-breakpoint
CREATE INDEX "idx_invoices_org" ON "invoices" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "idx_invoices_org_customer" ON "invoices" USING btree ("org_id","customer_id");--> statement-breakpoint
CREATE INDEX "idx_invoices_org_status" ON "invoices" USING btree ("org_id","status");--> statement-breakpoint
CREATE INDEX "idx_invoices_org_date" ON "invoices" USING btree ("org_id","invoice_date");--> statement-breakpoint
CREATE INDEX "idx_invoices_journal_entry" ON "invoices" USING btree ("journal_entry_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_invoices_org_idempotency" ON "invoices" USING btree ("org_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "idx_advances_customer" ON "customer_advances" USING btree ("org_id","customer_id");--> statement-breakpoint
CREATE INDEX "idx_pa_payment" ON "payment_allocations" USING btree ("payment_id");--> statement-breakpoint
CREATE INDEX "idx_pa_invoice" ON "payment_allocations" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "idx_payments_org" ON "payments" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "idx_payments_org_customer" ON "payments" USING btree ("org_id","customer_id");--> statement-breakpoint
CREATE INDEX "idx_payments_journal_entry" ON "payments" USING btree ("journal_entry_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_payments_org_idempotency" ON "payments" USING btree ("org_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "idx_expenses_org" ON "expenses" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "idx_expenses_journal_entry" ON "expenses" USING btree ("journal_entry_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_expenses_org_idempotency" ON "expenses" USING btree ("org_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "idx_credit_notes_invoice" ON "credit_notes" USING btree ("invoice_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_credit_notes_org_idempotency" ON "credit_notes" USING btree ("org_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "idx_ca_invoice" ON "credit_allocations" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "idx_ca_credit_note" ON "credit_allocations" USING btree ("credit_note_id");--> statement-breakpoint
CREATE INDEX "idx_ca_advance" ON "credit_allocations" USING btree ("advance_id");--> statement-breakpoint
CREATE INDEX "idx_vendors_org" ON "vendors" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "idx_vendors_org_name" ON "vendors" USING btree ("org_id","name");--> statement-breakpoint
CREATE INDEX "idx_vendors_org_active" ON "vendors" USING btree ("org_id","is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_app_settings_org_unique" ON "app_settings" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "idx_payment_modes_org" ON "payment_modes" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "idx_invoices_org_status_due" ON "invoices" USING btree ("org_id","status","due_date");--> statement-breakpoint
CREATE INDEX "idx_credit_notes_org_customer_status_balance" ON "credit_notes" USING btree ("org_id","customer_id","status","balance");--> statement-breakpoint
CREATE INDEX "idx_invoices_open_by_due_date" ON "invoices" ("org_id","due_date") WHERE status IN ('issued','partially_paid') AND balance_due > 0;--> statement-breakpoint
CREATE INDEX "idx_invoices_org_status_date_desc" ON "invoices" USING btree ("org_id","status","invoice_date" DESC);--> statement-breakpoint
CREATE INDEX "idx_audit_org_created_desc" ON "audit_log" USING btree ("org_id","created_at" DESC);