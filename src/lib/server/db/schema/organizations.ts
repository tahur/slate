import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const organizations = sqliteTable('organizations', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    address: text('address'),
    city: text('city'),
    state_code: text('state_code').notNull(), // 2-digit state code for GST (e.g., '29' for Karnataka)
    pincode: text('pincode'),
    phone: text('phone'),
    email: text('email'),
    gstin: text('gstin'), // 15-char GSTIN or NULL if unregistered
    pan: text('pan'),
    logo_url: text('logo_url'),
    currency: text('currency').default('INR'),
    fy_start_month: integer('fy_start_month').default(4), // April
    created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
    updated_at: text('updated_at').default(sql`CURRENT_TIMESTAMP`)
});

export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;
