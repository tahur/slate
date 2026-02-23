import { pgTable, text, numeric, index, unique, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { organizations } from './organizations';
import { vendors } from './vendors';
import { users } from './users';
import { journal_entries } from './journals';
import { payment_accounts } from './payment_accounts';
import { payment_methods } from './payment_methods';
import { expenses } from './expenses';

export const supplier_payments = pgTable(
    'supplier_payments',
    {
        id: text('id').primaryKey(),
        org_id: text('org_id')
            .notNull()
            .references(() => organizations.id),
        vendor_id: text('vendor_id')
            .notNull()
            .references(() => vendors.id),

        supplier_payment_number: text('supplier_payment_number').notNull(), // SPY-2026-0001

        payment_date: text('payment_date').notNull(),
        amount: numeric('amount', { precision: 14, scale: 2, mode: 'number' }).notNull(),
        payment_mode: text('payment_mode').notNull(), // cash, bank, upi, cheque
        reference: text('reference'),
        notes: text('notes'),
        reason_snapshot: text('reason_snapshot'),

        paid_from: text('paid_from').notNull(), // Payment account ID
        payment_account_id: text('payment_account_id').references(() => payment_accounts.id),
        payment_method_id: text('payment_method_id').references(() => payment_methods.id),

        journal_entry_id: text('journal_entry_id').references(() => journal_entries.id),

        idempotency_key: text('idempotency_key'),

        created_at: text('created_at').default(sql`NOW()::text`),
        created_by: text('created_by').references(() => users.id)
    },
    (t) => ({
        unq: unique().on(t.org_id, t.supplier_payment_number),
        orgIdx: index('idx_supplier_payments_org').on(t.org_id),
        vendorIdx: index('idx_supplier_payments_org_vendor').on(t.org_id, t.vendor_id),
        journalEntryIdx: index('idx_supplier_payments_journal_entry').on(t.journal_entry_id),
        idempotencyIdx: uniqueIndex('idx_supplier_payments_org_idempotency').on(t.org_id, t.idempotency_key)
    })
);

export const supplier_payment_allocations = pgTable(
    'supplier_payment_allocations',
    {
        id: text('id').primaryKey(),
        supplier_payment_id: text('supplier_payment_id')
            .notNull()
            .references(() => supplier_payments.id),
        expense_id: text('expense_id')
            .notNull()
            .references(() => expenses.id),
        amount: numeric('amount', { precision: 14, scale: 2, mode: 'number' }).notNull(),
        created_at: text('created_at').default(sql`NOW()::text`)
    },
    (t) => ({
        paymentIdx: index('idx_supplier_pa_payment').on(t.supplier_payment_id),
        expenseIdx: index('idx_supplier_pa_expense').on(t.expense_id)
    })
);

export const supplier_credits = pgTable(
    'supplier_credits',
    {
        id: text('id').primaryKey(),
        org_id: text('org_id')
            .notNull()
            .references(() => organizations.id),
        vendor_id: text('vendor_id')
            .notNull()
            .references(() => vendors.id),
        supplier_payment_id: text('supplier_payment_id').references(() => supplier_payments.id),
        source_type: text('source_type').notNull().default('payment_excess'),

        amount: numeric('amount', { precision: 14, scale: 2, mode: 'number' }).notNull(),
        balance: numeric('balance', { precision: 14, scale: 2, mode: 'number' }).notNull(),

        notes: text('notes'),
        created_at: text('created_at').default(sql`NOW()::text`)
    },
    (t) => ({
        vendorIdx: index('idx_supplier_credits_vendor').on(t.org_id, t.vendor_id),
        sourcePaymentIdx: index('idx_supplier_credits_payment').on(t.supplier_payment_id)
    })
);

