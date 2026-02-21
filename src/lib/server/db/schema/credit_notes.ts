import { pgTable, text, numeric, index, unique, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { organizations } from './organizations';
import { customers } from './customers';
import { invoices } from './invoices';
import { journal_entries } from './journals';
import { users } from './users';

export const credit_notes = pgTable(
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
        subtotal: numeric('subtotal', { precision: 14, scale: 2, mode: 'number' }).notNull(),
        cgst: numeric('cgst', { precision: 14, scale: 2, mode: 'number' }).default(0),
        sgst: numeric('sgst', { precision: 14, scale: 2, mode: 'number' }).default(0),
        igst: numeric('igst', { precision: 14, scale: 2, mode: 'number' }).default(0),
        total: numeric('total', { precision: 14, scale: 2, mode: 'number' }).notNull(),
        balance: numeric('balance', { precision: 14, scale: 2, mode: 'number' }).default(0),

        reason: text('reason').notNull(), // return, discount, error, etc.
        notes: text('notes'),

        status: text('status').default('issued'), // issued, applied, cancelled

        // Journal
        journal_entry_id: text('journal_entry_id').references(() => journal_entries.id),

        // Idempotency (prevents duplicate submissions)
        idempotency_key: text('idempotency_key'),

        // Audit
        created_at: text('created_at').default(sql`NOW()::text`),
        created_by: text('created_by').references(() => users.id)
    },
    (t) => ({
        unq: unique().on(t.org_id, t.credit_note_number),
        customerStatusBalanceIdx: index('idx_credit_notes_org_customer_status_balance').on(
            t.org_id,
            t.customer_id,
            t.status,
            t.balance
        ),
        invoiceIdx: index('idx_credit_notes_invoice').on(t.invoice_id),
        idempotencyIdx: uniqueIndex('idx_credit_notes_org_idempotency').on(t.org_id, t.idempotency_key)
    })
);
