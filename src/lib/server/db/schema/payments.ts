import { pgTable, text, numeric, index, unique, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { organizations } from './organizations';
import { customers } from './customers';
import { users } from './users';
import { journal_entries } from './journals';
import { invoices } from './invoices';

export const payments = pgTable(
    'payments',
    {
        id: text('id').primaryKey(),
        org_id: text('org_id')
            .notNull()
            .references(() => organizations.id),
        customer_id: text('customer_id')
            .notNull()
            .references(() => customers.id),

        // Numbers
        payment_number: text('payment_number').notNull(), // PAY-2026-0001

        // Details
        payment_date: text('payment_date').notNull(),
        amount: numeric('amount', { precision: 14, scale: 2, mode: 'number' }).notNull(),
        payment_mode: text('payment_mode').notNull(), // cash, bank, upi, cheque
        reference: text('reference'), // Cheque no, UTR, etc.
        notes: text('notes'),

        // Account
        deposit_to: text('deposit_to').notNull(), // Account ID (Cash, Bank)

        // Journal
        journal_entry_id: text('journal_entry_id').references(() => journal_entries.id),

        // Idempotency (prevents duplicate submissions)
        idempotency_key: text('idempotency_key'),

        // Audit
        created_at: text('created_at').default(sql`NOW()::text`),
        created_by: text('created_by').references(() => users.id)
    },
    (t) => ({
        unq: unique().on(t.org_id, t.payment_number),
        orgIdx: index('idx_payments_org').on(t.org_id),
        custIdx: index('idx_payments_org_customer').on(t.org_id, t.customer_id),
        journalEntryIdx: index('idx_payments_journal_entry').on(t.journal_entry_id),
        idempotencyIdx: uniqueIndex('idx_payments_org_idempotency').on(t.org_id, t.idempotency_key)
    })
);

export const payment_allocations = pgTable(
    'payment_allocations',
    {
        id: text('id').primaryKey(),
        payment_id: text('payment_id')
            .notNull()
            .references(() => payments.id),
        invoice_id: text('invoice_id')
            .notNull()
            .references(() => invoices.id),
        amount: numeric('amount', { precision: 14, scale: 2, mode: 'number' }).notNull(),
        created_at: text('created_at').default(sql`NOW()::text`)
    },
    (t) => ({
        paymentIdx: index('idx_pa_payment').on(t.payment_id),
        invoiceIdx: index('idx_pa_invoice').on(t.invoice_id)
    })
);

export const customer_advances = pgTable(
    'customer_advances',
    {
        id: text('id').primaryKey(),
        org_id: text('org_id')
            .notNull()
            .references(() => organizations.id),
        customer_id: text('customer_id')
            .notNull()
            .references(() => customers.id),
        payment_id: text('payment_id').references(() => payments.id), // Source payment

        amount: numeric('amount', { precision: 14, scale: 2, mode: 'number' }).notNull(),
        balance: numeric('balance', { precision: 14, scale: 2, mode: 'number' }).notNull(), // Remaining unapplied amount

        notes: text('notes'),

        created_at: text('created_at').default(sql`NOW()::text`)
    },
    (t) => ({
        custIdx: index('idx_advances_customer').on(t.org_id, t.customer_id)
    })
);
