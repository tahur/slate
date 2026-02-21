import { pgTable, text, integer, numeric, boolean, unique, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { organizations } from './organizations';
import { customers } from './customers';
import { users } from './users';
import { journal_entries } from './journals';
import { items } from './items';

export const invoices = pgTable(
    'invoices',
    {
        id: text('id').primaryKey(),
        org_id: text('org_id')
            .notNull()
            .references(() => organizations.id),
        customer_id: text('customer_id')
            .notNull()
            .references(() => customers.id),

        // Numbers
        invoice_number: text('invoice_number').notNull(), // INV-2026-0001
        order_number: text('order_number'), // Customer PO reference

        // Dates
        invoice_date: text('invoice_date').notNull(),
        due_date: text('due_date').notNull(),

        // Status
        status: text('status').default('draft').notNull(),
        // draft, issued, partially_paid, paid, cancelled

        // Amounts
        subtotal: numeric('subtotal', { precision: 14, scale: 2, mode: 'number' }).default(0).notNull(),
        discount_type: text('discount_type'), // percent, fixed
        discount_value: numeric('discount_value', { precision: 14, scale: 4, mode: 'number' }).default(0),
        discount_amount: numeric('discount_amount', { precision: 14, scale: 2, mode: 'number' }).default(0),
        taxable_amount: numeric('taxable_amount', { precision: 14, scale: 2, mode: 'number' }).default(0).notNull(),
        cgst: numeric('cgst', { precision: 14, scale: 2, mode: 'number' }).default(0),
        sgst: numeric('sgst', { precision: 14, scale: 2, mode: 'number' }).default(0),
        igst: numeric('igst', { precision: 14, scale: 2, mode: 'number' }).default(0),
        total: numeric('total', { precision: 14, scale: 2, mode: 'number' }).default(0).notNull(),
        amount_paid: numeric('amount_paid', { precision: 14, scale: 2, mode: 'number' }).default(0),
        balance_due: numeric('balance_due', { precision: 14, scale: 2, mode: 'number' }).default(0).notNull(),

        // GST
        is_inter_state: boolean('is_inter_state').default(false), // 0 = intra, 1 = inter
        prices_include_gst: boolean('prices_include_gst').default(false),

        // TDS (Phase 2 - columns added for future)
        tds_rate: numeric('tds_rate', { precision: 14, scale: 4, mode: 'number' }).default(0),
        tds_amount: numeric('tds_amount', { precision: 14, scale: 2, mode: 'number' }).default(0),

        // E-Way Bill (Phase 2 - for goods > ₹50k interstate)
        eway_bill_no: text('eway_bill_no'),
        eway_bill_date: text('eway_bill_date'),
        vehicle_number: text('vehicle_number'),
        transporter_name: text('transporter_name'),

        // Multi-currency (Phase 3 - future-proof)
        currency: text('currency').default('INR'),
        exchange_rate: numeric('exchange_rate', { precision: 14, scale: 4, mode: 'number' }).default(1),
        base_currency_total: numeric('base_currency_total', { precision: 14, scale: 2, mode: 'number' }), // Converted to org currency

        // Content
        notes: text('notes'),
        terms: text('terms'),

        // Journal reference
        journal_entry_id: text('journal_entry_id').references(() => journal_entries.id),

        // Idempotency (prevents duplicate submissions)
        idempotency_key: text('idempotency_key'),

        // Audit
        issued_at: text('issued_at'),
        cancelled_at: text('cancelled_at'),
        created_at: text('created_at').default(sql`NOW()::text`),
        updated_at: text('updated_at').default(sql`NOW()::text`),
        created_by: text('created_by').references(() => users.id),
        updated_by: text('updated_by').references(() => users.id)
    },
    (t) => ({
        unq: unique().on(t.org_id, t.invoice_number),
        orgIdx: index('idx_invoices_org').on(t.org_id),
        custIdx: index('idx_invoices_org_customer').on(t.org_id, t.customer_id),
        statusIdx: index('idx_invoices_org_status').on(t.org_id, t.status),
        dateIdx: index('idx_invoices_org_date').on(t.org_id, t.invoice_date),
        dueStatusIdx: index('idx_invoices_org_status_due').on(t.org_id, t.status, t.due_date),
        journalEntryIdx: index('idx_invoices_journal_entry').on(t.journal_entry_id),
        idempotencyIdx: uniqueIndex('idx_invoices_org_idempotency').on(t.org_id, t.idempotency_key)
    })
);

export const invoice_items = pgTable('invoice_items', {
    id: text('id').primaryKey(),
    invoice_id: text('invoice_id')
        .notNull()
        .references(() => invoices.id, { onDelete: 'cascade' }),

    // Catalog reference (null for ad-hoc items)
    item_id: text('item_id').references(() => items.id),

    // Item details
    description: text('description').notNull(),
    hsn_code: text('hsn_code'),

    // Quantity & Rate
    quantity: numeric('quantity', { precision: 14, scale: 4, mode: 'number' }).default(1).notNull(),
    unit: text('unit').default('nos'),
    rate: numeric('rate', { precision: 14, scale: 4, mode: 'number' }).notNull(),

    // GST
    gst_rate: numeric('gst_rate', { precision: 14, scale: 4, mode: 'number' }).default(18).notNull(), // 0, 5, 12, 18, 28
    cgst: numeric('cgst', { precision: 14, scale: 2, mode: 'number' }).default(0),
    sgst: numeric('sgst', { precision: 14, scale: 2, mode: 'number' }).default(0),
    igst: numeric('igst', { precision: 14, scale: 2, mode: 'number' }).default(0),

    // Totals
    amount: numeric('amount', { precision: 14, scale: 2, mode: 'number' }).notNull(), // quantity * rate
    total: numeric('total', { precision: 14, scale: 2, mode: 'number' }).notNull(), // amount + gst

    sort_order: integer('sort_order').default(0)
});
