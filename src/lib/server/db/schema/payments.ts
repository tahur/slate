import { sqliteTable, text, real, index, unique } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { organizations } from './organizations';
import { customers } from './customers';
import { users } from './users';
import { journal_entries } from './journals';
import { invoices } from './invoices';

export const payments = sqliteTable(
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
        amount: real('amount').notNull(),
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
        created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
        created_by: text('created_by').references(() => users.id)
    },
    (t) => ({
        unq: unique().on(t.org_id, t.payment_number),
        orgIdx: index('idx_payments_org').on(t.org_id),
        custIdx: index('idx_payments_org_customer').on(t.org_id, t.customer_id)
    })
);

export const payment_allocations = sqliteTable('payment_allocations', {
    id: text('id').primaryKey(),
    payment_id: text('payment_id')
        .notNull()
        .references(() => payments.id),
    invoice_id: text('invoice_id')
        .notNull()
        .references(() => invoices.id),
    amount: real('amount').notNull(),
    created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`)
});

export const customer_advances = sqliteTable(
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

        amount: real('amount').notNull(),
        balance: real('balance').notNull(), // Remaining unapplied amount

        notes: text('notes'),

        created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`)
    },
    (t) => ({
        custIdx: index('idx_advances_customer').on(t.org_id, t.customer_id)
    })
);
