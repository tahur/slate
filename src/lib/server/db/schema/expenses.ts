import { sqliteTable, text, real, index, unique } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { organizations } from './organizations';
import { users } from './users';
import { journal_entries } from './journals';
import { vendors } from './vendors';

export const expenses = sqliteTable(
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
        amount: real('amount').notNull(),
        gst_rate: real('gst_rate').default(0),
        cgst: real('cgst').default(0),
        sgst: real('sgst').default(0),
        igst: real('igst').default(0),
        total: real('total').notNull(),

        // Payment
        paid_through: text('paid_through').notNull(), // Account ID (Cash, Bank)
        reference: text('reference'),

        // Attachments
        receipt_url: text('receipt_url'),

        // Journal
        journal_entry_id: text('journal_entry_id').references(() => journal_entries.id),

        // Idempotency (prevents duplicate submissions)
        idempotency_key: text('idempotency_key'),

        // Audit
        created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
        updated_at: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
        created_by: text('created_by').references(() => users.id)
    },
    (t) => ({
        unq: unique().on(t.org_id, t.expense_number),
        orgIdx: index('idx_expenses_org').on(t.org_id)
    })
);
