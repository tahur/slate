import { pgTable, text, integer, numeric, boolean, unique, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { organizations } from './organizations';
import { customers } from './customers';
import { users } from './users';
import { items } from './items';
import { invoices } from './invoices';

export const quotations = pgTable(
    'quotations',
    {
        id: text('id').primaryKey(),
        org_id: text('org_id')
            .notNull()
            .references(() => organizations.id),
        customer_id: text('customer_id')
            .notNull()
            .references(() => customers.id),

        // Numbers
        quotation_number: text('quotation_number').notNull(), // QTN-2025-26-0001
        reference_number: text('reference_number'), // Customer enquiry reference

        // Subject
        subject: text('subject'), // "Supply of 500 iPhone cases"

        // Dates
        quotation_date: text('quotation_date').notNull(),
        valid_until: text('valid_until').notNull(),

        // Status: draft → sent → accepted → declined → expired → invoiced
        status: text('status').default('draft').notNull(),

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

        // GST
        is_inter_state: boolean('is_inter_state').default(false),
        prices_include_gst: boolean('prices_include_gst').default(false),

        // Content
        notes: text('notes'),
        terms: text('terms'),

        // Conversion
        converted_invoice_id: text('converted_invoice_id').references(() => invoices.id),

        // Idempotency
        idempotency_key: text('idempotency_key'),

        // Audit
        sent_at: text('sent_at'),
        accepted_at: text('accepted_at'),
        declined_at: text('declined_at'),
        expired_at: text('expired_at'),
        created_at: text('created_at').default(sql`NOW()::text`),
        updated_at: text('updated_at').default(sql`NOW()::text`),
        created_by: text('created_by').references(() => users.id),
        updated_by: text('updated_by').references(() => users.id)
    },
    (t) => ({
        unq: unique().on(t.org_id, t.quotation_number),
        orgIdx: index('idx_quotations_org').on(t.org_id),
        custIdx: index('idx_quotations_org_customer').on(t.org_id, t.customer_id),
        statusIdx: index('idx_quotations_org_status').on(t.org_id, t.status),
        dateIdx: index('idx_quotations_org_date').on(t.org_id, t.quotation_date),
        idempotencyIdx: uniqueIndex('idx_quotations_org_idempotency').on(t.org_id, t.idempotency_key)
    })
);

export const quotation_items = pgTable('quotation_items', {
    id: text('id').primaryKey(),
    quotation_id: text('quotation_id')
        .notNull()
        .references(() => quotations.id, { onDelete: 'cascade' }),

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
    gst_rate: numeric('gst_rate', { precision: 14, scale: 4, mode: 'number' }).default(18).notNull(),
    cgst: numeric('cgst', { precision: 14, scale: 2, mode: 'number' }).default(0),
    sgst: numeric('sgst', { precision: 14, scale: 2, mode: 'number' }).default(0),
    igst: numeric('igst', { precision: 14, scale: 2, mode: 'number' }).default(0),

    // Totals
    amount: numeric('amount', { precision: 14, scale: 2, mode: 'number' }).notNull(),
    total: numeric('total', { precision: 14, scale: 2, mode: 'number' }).notNull(),

    sort_order: integer('sort_order').default(0)
});

export type Quotation = typeof quotations.$inferSelect;
export type NewQuotation = typeof quotations.$inferInsert;
export type QuotationItem = typeof quotation_items.$inferSelect;
export type NewQuotationItem = typeof quotation_items.$inferInsert;
