import { sqliteTable, text, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { organizations } from './organizations';
import { invoices } from './invoices';
import { credit_notes } from './credit_notes';
import { customer_advances } from './payments';

export const credit_allocations = sqliteTable('credit_allocations', {
    id: text('id').primaryKey(),
    org_id: text('org_id')
        .notNull()
        .references(() => organizations.id),

    // Destination
    invoice_id: text('invoice_id')
        .notNull()
        .references(() => invoices.id),

    // Source (One of these should be set)
    credit_note_id: text('credit_note_id').references(() => credit_notes.id),
    advance_id: text('advance_id').references(() => customer_advances.id),

    amount: real('amount').notNull(),

    created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`)
});
