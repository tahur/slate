import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { organizations } from './organizations';
import { users } from './users';

export const items = sqliteTable(
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
        gst_rate: real('gst_rate').default(18).notNull(),

        // Pricing
        rate: real('rate').default(0).notNull(),
        unit: text('unit').default('nos'),

        // Status
        is_active: integer('is_active', { mode: 'boolean' }).default(true).notNull(),

        // Audit
        created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
        updated_at: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
        created_by: text('created_by').references(() => users.id),
        updated_by: text('updated_by').references(() => users.id)
    },
    (t) => ({
        orgIdx: index('idx_items_org').on(t.org_id),
        orgTypeIdx: index('idx_items_org_type').on(t.org_id, t.type)
    })
);
