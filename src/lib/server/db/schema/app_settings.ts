import { pgTable, text, integer, boolean, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { organizations } from './organizations';

export const app_settings = pgTable('app_settings', {
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
    smtp_secure: boolean('smtp_secure').default(false),
    smtp_enabled: boolean('smtp_enabled').default(false),

    // Timestamps
    created_at: text('created_at').default(sql`NOW()::text`),
    updated_at: text('updated_at').default(sql`NOW()::text`)
}, (t) => ({
    orgUniqueIdx: uniqueIndex('idx_app_settings_org_unique').on(t.org_id)
}));

export type AppSettings = typeof app_settings.$inferSelect;
export type NewAppSettings = typeof app_settings.$inferInsert;
