import { pgTable, text, integer, numeric, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { organizations } from './organizations';
import { users } from './users';

export const customers = pgTable(
    'customers',
    {
        id: text('id').primaryKey(),
        org_id: text('org_id')
            .notNull()
            .references(() => organizations.id),

        // Basic Info
        name: text('name').notNull(),
        company_name: text('company_name'),
        email: text('email'),
        phone: text('phone'),

        // Address
        billing_address: text('billing_address'),
        city: text('city'),
        state_code: text('state_code'),
        pincode: text('pincode'),

        // GST Info
        gstin: text('gstin'),
        gst_treatment: text('gst_treatment').default('unregistered').notNull(),
        // registered, unregistered, consumer, overseas
        place_of_supply: text('place_of_supply'), // State code for GST

        // Defaults
        payment_terms: integer('payment_terms').default(0), // Days

        // Status
        balance: numeric('balance', { precision: 14, scale: 2, mode: 'number' }).default(0), // Current outstanding
        status: text('status').default('active'),

        // Audit
        created_at: text('created_at').default(sql`NOW()::text`),
        updated_at: text('updated_at').default(sql`NOW()::text`),
        created_by: text('created_by').references(() => users.id),
        updated_by: text('updated_by').references(() => users.id)
    },
    (t) => ({
        orgIdx: index('idx_customers_org').on(t.org_id)
    })
);
