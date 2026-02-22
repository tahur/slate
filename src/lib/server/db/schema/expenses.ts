import { pgTable, text, numeric, index, unique, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { organizations } from './organizations';
import { users } from './users';
import { journal_entries } from './journals';
import { vendors } from './vendors';
import { payment_accounts } from './payment_accounts';
import { payment_methods } from './payment_methods';

export const expenses = pgTable(
    'expenses',
    {
        id: text('id').primaryKey(),
        org_id: text('org_id')
            .notNull()
            .references(() => organizations.id),

        // Numbers
        expense_number: text('expense_number').notNull(), // EXP-2026-0001

        // Details
        expense_date: text('expense_date').notNull(),
        category: text('category').notNull(), // Account ID from Chart of Accounts
        vendor_id: text('vendor_id').references(() => vendors.id), // Link to vendor
        vendor_name: text('vendor_name'), // Denormalized or for quick entry without vendor
        description: text('description'),

        // Amounts
        amount: numeric('amount', { precision: 14, scale: 2, mode: 'number' }).notNull(),
        gst_rate: numeric('gst_rate', { precision: 14, scale: 4, mode: 'number' }).default(0),
        cgst: numeric('cgst', { precision: 14, scale: 2, mode: 'number' }).default(0),
        sgst: numeric('sgst', { precision: 14, scale: 2, mode: 'number' }).default(0),
        igst: numeric('igst', { precision: 14, scale: 2, mode: 'number' }).default(0),
        total: numeric('total', { precision: 14, scale: 2, mode: 'number' }).notNull(),

        // Payment
        paid_through: text('paid_through').notNull(), // Account ID (Cash, Bank)
        payment_account_id: text('payment_account_id').references(() => payment_accounts.id),
        payment_method_id: text('payment_method_id').references(() => payment_methods.id),
        reference: text('reference'),

        // Attachments
        receipt_url: text('receipt_url'),

        // Journal
        journal_entry_id: text('journal_entry_id').references(() => journal_entries.id),

        // Idempotency (prevents duplicate submissions)
        idempotency_key: text('idempotency_key'),

        // Audit
        created_at: text('created_at').default(sql`NOW()::text`),
        updated_at: text('updated_at').default(sql`NOW()::text`),
        created_by: text('created_by').references(() => users.id)
    },
    (t) => ({
        unq: unique().on(t.org_id, t.expense_number),
        orgIdx: index('idx_expenses_org').on(t.org_id),
        journalEntryIdx: index('idx_expenses_journal_entry').on(t.journal_entry_id),
        idempotencyIdx: uniqueIndex('idx_expenses_org_idempotency').on(t.org_id, t.idempotency_key)
    })
);
