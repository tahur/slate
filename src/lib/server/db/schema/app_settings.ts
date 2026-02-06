import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { organizations } from './organizations';

export const app_settings = sqliteTable('app_settings', {
    id: text('id').primaryKey(),
    org_id: text('org_id')
        .notNull()
        .references(() => organizations.id),

    // SMTP Configuration
    smtp_host: text('smtp_host'),
    smtp_port: integer('smtp_port').default(587),
    smtp_user: text('smtp_user'),
    smtp_pass: text('smtp_pass'), // Encrypted in production
    smtp_from: text('smtp_from'),
    smtp_secure: integer('smtp_secure', { mode: 'boolean' }).default(false),
    smtp_enabled: integer('smtp_enabled', { mode: 'boolean' }).default(false),

    // Timestamps
    created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
    updated_at: text('updated_at').default(sql`CURRENT_TIMESTAMP`)
});

export type AppSettings = typeof app_settings.$inferSelect;
export type NewAppSettings = typeof app_settings.$inferInsert;
