import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { organizations } from './organizations';
import { users } from './users';

export const vendors = sqliteTable('vendors', {
    id: text('id').primaryKey(),
    org_id: text('org_id')
        .notNull()
        .references(() => organizations.id),

    // Basic Info
    name: text('name').notNull(),
    company_name: text('company_name'),
    display_name: text('display_name'), // How to show in dropdowns

    // Contact
    email: text('email'),
    phone: text('phone'),
    website: text('website'),

    // Address
    billing_address: text('billing_address'),
    city: text('city'),
    state_code: text('state_code'), // 2-digit state code for GST
    pincode: text('pincode'),
    country: text('country').default('India'),

    // GST Details
    gstin: text('gstin'),
    gst_treatment: text('gst_treatment').default('unregistered'), // registered, unregistered, composition, overseas
    pan: text('pan'),

    // Payment Terms
    payment_terms: integer('payment_terms').default(30), // Days

    // Financial
    balance: real('balance').default(0), // What we owe them (positive = payable)

    // TDS
    tds_applicable: integer('tds_applicable').default(0), // Boolean
    tds_section: text('tds_section'), // 194C, 194J, etc.

    // Status
    is_active: integer('is_active').default(1),

    // Audit
    notes: text('notes'),
    created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
    updated_at: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
    created_by: text('created_by').references(() => users.id),
    updated_by: text('updated_by').references(() => users.id)
}, (t) => ({
    orgIdx: index('idx_vendors_org').on(t.org_id),
    orgNameIdx: index('idx_vendors_org_name').on(t.org_id, t.name),
    orgActiveIdx: index('idx_vendors_org_active').on(t.org_id, t.is_active)
}));

export type Vendor = typeof vendors.$inferSelect;
export type NewVendor = typeof vendors.$inferInsert;
