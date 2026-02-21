import { pgTable, text, integer, numeric, boolean, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { organizations } from './organizations';
import { users } from './users';

export const items = pgTable(
    'items',
    {
        id: text('id').primaryKey(),
        org_id: text('org_id')
            .notNull()
            .references(() => organizations.id),

        // Type
        type: text('type').notNull().default('service'), // product | service

        // Identifier
        sku: text('sku'), // SKU / Barcode / Item Code

        // Details
        name: text('name').notNull(),
        description: text('description'),

        // Tax
        hsn_code: text('hsn_code'),
        gst_rate: numeric('gst_rate', { precision: 14, scale: 4, mode: 'number' }).default(18).notNull(),

        // Pricing
        rate: numeric('rate', { precision: 14, scale: 4, mode: 'number' }).default(0).notNull(),
        unit: text('unit').default('nos'),
        min_quantity: numeric('min_quantity', { precision: 14, scale: 4, mode: 'number' }).default(1).notNull(),

        // Status
        is_active: boolean('is_active').default(true).notNull(),

        // Audit
        created_at: text('created_at').default(sql`NOW()::text`),
        updated_at: text('updated_at').default(sql`NOW()::text`),
        created_by: text('created_by').references(() => users.id),
        updated_by: text('updated_by').references(() => users.id)
    },
    (t) => ({
        orgIdx: index('idx_items_org').on(t.org_id),
        orgTypeIdx: index('idx_items_org_type').on(t.org_id, t.type),
        orgSkuIdx: uniqueIndex('idx_items_org_sku').on(t.org_id, t.sku)
    })
);
