import { sqliteTable, text, real, unique } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { organizations } from './organizations';
import { customers } from './customers';
import { invoices } from './invoices';
import { journal_entries } from './journals';
import { users } from './users';

export const credit_notes = sqliteTable(
    'credit_notes',
    {
        id: text('id').primaryKey(),
        org_id: text('org_id')
            .notNull()
            .references(() => organizations.id),
        customer_id: text('customer_id')
            .notNull()
            .references(() => customers.id),
        invoice_id: text('invoice_id').references(() => invoices.id), // Optional: linked to original invoice

        credit_note_number: text('credit_note_number').notNull(), // CN-2026-0001
        credit_note_date: text('credit_note_date').notNull(),

        // Amounts
        subtotal: real('subtotal').notNull(),
        cgst: real('cgst').default(0),
        sgst: real('sgst').default(0),
        igst: real('igst').default(0),
        total: real('total').notNull(),
        balance: real('balance').default(0),

        reason: text('reason').notNull(), // return, discount, error, etc.
        notes: text('notes'),

        status: text('status').default('issued'), // issued, applied, cancelled

        // Journal
        journal_entry_id: text('journal_entry_id').references(() => journal_entries.id),

        // Audit
        created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
        created_by: text('created_by').references(() => users.id)
    },
    (t) => ({
        unq: unique().on(t.org_id, t.credit_note_number)
    })
);
