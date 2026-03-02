import { pgTable, text, numeric, index, unique, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { organizations } from './organizations';
import { customers } from './customers';
import { credit_notes } from './credit_notes';
import { payment_accounts } from './payment_accounts';
import { payment_methods } from './payment_methods';
import { journal_entries } from './journals';
import { users } from './users';

export const refunds = pgTable(
    'refunds',
    {
        id: text('id').primaryKey(),
        org_id: text('org_id')
            .notNull()
            .references(() => organizations.id),
        customer_id: text('customer_id')
            .notNull()
            .references(() => customers.id),
        credit_note_id: text('credit_note_id')
            .notNull()
            .references(() => credit_notes.id),

        refund_number: text('refund_number').notNull(),
        refund_date: text('refund_date').notNull(),
        amount: numeric('amount', { precision: 14, scale: 2, mode: 'number' }).notNull(),

        payment_mode: text('payment_mode').notNull(),
        source_account_id: text('source_account_id').references(() => payment_accounts.id),
        payment_method_id: text('payment_method_id').references(() => payment_methods.id),
        reference: text('reference'),
        notes: text('notes'),

        status: text('status').default('posted').notNull(), // posted, voided
        journal_entry_id: text('journal_entry_id').references(() => journal_entries.id),

        idempotency_key: text('idempotency_key'),

        created_at: text('created_at').default(sql`NOW()::text`),
        created_by: text('created_by').references(() => users.id)
    },
    (t) => ({
        unq: unique().on(t.org_id, t.refund_number),
        orgIdx: index('idx_refunds_org').on(t.org_id),
        customerIdx: index('idx_refunds_org_customer').on(t.org_id, t.customer_id),
        creditNoteIdx: index('idx_refunds_credit_note').on(t.credit_note_id),
        journalEntryIdx: index('idx_refunds_journal_entry').on(t.journal_entry_id),
        idempotencyIdx: uniqueIndex('idx_refunds_org_idempotency').on(t.org_id, t.idempotency_key)
    })
);
