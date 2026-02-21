import { pgTable, text, numeric, index, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { organizations } from './organizations';
import { invoices } from './invoices';
import { credit_notes } from './credit_notes';
import { customer_advances } from './payments';

export const credit_allocations = pgTable(
    'credit_allocations',
    {
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

        amount: numeric('amount', { precision: 14, scale: 2, mode: 'number' }).notNull(),

        created_at: text('created_at').default(sql`NOW()::text`)
    },
    (t) => ({
        invoiceIdx: index('idx_ca_invoice').on(t.invoice_id),
        creditNoteIdx: index('idx_ca_credit_note').on(t.credit_note_id),
        advanceIdx: index('idx_ca_advance').on(t.advance_id),
        amountPositive: check('ca_amount_positive', sql`amount > 0`),
        singleSource: check(
            'ca_single_source',
            sql`(credit_note_id IS NOT NULL AND advance_id IS NULL) OR (credit_note_id IS NULL AND advance_id IS NOT NULL)`
        )
    })
);
