import { sqliteTable, text, integer, real, unique, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { organizations } from './organizations';
import { customers } from './customers';
import { users } from './users';
import { journal_entries } from './journals';
import { items } from './items';

export const invoices = sqliteTable(
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
        subtotal: real('subtotal').default(0).notNull(),
        discount_type: text('discount_type'), // percent, fixed
        discount_value: real('discount_value').default(0),
        discount_amount: real('discount_amount').default(0),
        taxable_amount: real('taxable_amount').default(0).notNull(),
        cgst: real('cgst').default(0),
        sgst: real('sgst').default(0),
        igst: real('igst').default(0),
        total: real('total').default(0).notNull(),
        amount_paid: real('amount_paid').default(0),
        balance_due: real('balance_due').default(0).notNull(),

        // GST
        is_inter_state: integer('is_inter_state', { mode: 'boolean' }).default(false), // 0 = intra, 1 = inter
        prices_include_gst: integer('prices_include_gst', { mode: 'boolean' }).default(false),

        // TDS (Phase 2 - columns added for future)
        tds_rate: real('tds_rate').default(0),
        tds_amount: real('tds_amount').default(0),

        // E-Way Bill (Phase 2 - for goods > ₹50k interstate)
        eway_bill_no: text('eway_bill_no'),
        eway_bill_date: text('eway_bill_date'),
        vehicle_number: text('vehicle_number'),
        transporter_name: text('transporter_name'),

        // Multi-currency (Phase 3 - future-proof)
        currency: text('currency').default('INR'),
        exchange_rate: real('exchange_rate').default(1),
        base_currency_total: real('base_currency_total'), // Converted to org currency

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
        created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
        updated_at: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
        created_by: text('created_by').references(() => users.id),
        updated_by: text('updated_by').references(() => users.id)
    },
    (t) => ({
        unq: unique().on(t.org_id, t.invoice_number),
        orgIdx: index('idx_invoices_org').on(t.org_id),
        custIdx: index('idx_invoices_org_customer').on(t.org_id, t.customer_id),
        statusIdx: index('idx_invoices_org_status').on(t.org_id, t.status),
        dateIdx: index('idx_invoices_org_date').on(t.org_id, t.invoice_date),
        journalEntryIdx: index('idx_invoices_journal_entry').on(t.journal_entry_id),
        idempotencyIdx: uniqueIndex('idx_invoices_org_idempotency').on(t.org_id, t.idempotency_key)
    })
);

export const invoice_items = sqliteTable('invoice_items', {
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
    quantity: real('quantity').default(1).notNull(),
    unit: text('unit').default('nos'),
    rate: real('rate').notNull(),

    // GST
    gst_rate: real('gst_rate').default(18).notNull(), // 0, 5, 12, 18, 28
    cgst: real('cgst').default(0),
    sgst: real('sgst').default(0),
    igst: real('igst').default(0),

    // Totals
    amount: real('amount').notNull(), // quantity * rate
    total: real('total').notNull(), // amount + gst

    sort_order: integer('sort_order').default(0)
});
