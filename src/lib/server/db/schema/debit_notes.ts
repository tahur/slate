import { pgTable, text, numeric, index, unique, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { organizations } from './organizations';
import { vendors } from './vendors';
import { expenses } from './expenses';
import { accounts } from './accounts';
import { journal_entries } from './journals';
import { users } from './users';

export const debit_notes = pgTable(
    'debit_notes',
    {
        id: text('id').primaryKey(),
        org_id: text('org_id')
            .notNull()
            .references(() => organizations.id),
        vendor_id: text('vendor_id')
            .notNull()
            .references(() => vendors.id),
        expense_id: text('expense_id').references(() => expenses.id), // Optional: linked to original expense
        expense_account_id: text('expense_account_id').references(() => accounts.id), // Which expense account to reverse

        debit_note_number: text('debit_note_number').notNull(), // DN-2026-0001
        debit_note_date: text('debit_note_date').notNull(),

        // Amounts
        subtotal: numeric('subtotal', { precision: 14, scale: 2, mode: 'number' }).notNull(),
        cgst: numeric('cgst', { precision: 14, scale: 2, mode: 'number' }).default(0),
        sgst: numeric('sgst', { precision: 14, scale: 2, mode: 'number' }).default(0),
        igst: numeric('igst', { precision: 14, scale: 2, mode: 'number' }).default(0),
        total: numeric('total', { precision: 14, scale: 2, mode: 'number' }).notNull(),
        balance: numeric('balance', { precision: 14, scale: 2, mode: 'number' }).default(0),

        reason: text('reason').notNull(), // return, damaged, discount, quality, other
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
        unq: unique().on(t.org_id, t.debit_note_number),
        vendorStatusBalanceIdx: index('idx_debit_notes_org_vendor_status_balance').on(
            t.org_id,
            t.vendor_id,
            t.status,
            t.balance
        ),
        expenseIdx: index('idx_debit_notes_expense').on(t.expense_id),
        idempotencyIdx: uniqueIndex('idx_debit_notes_org_idempotency').on(t.org_id, t.idempotency_key)
    })
);
