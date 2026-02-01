import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { organizations } from './organizations';
import { users } from './users';

export const fiscal_years = sqliteTable('fiscal_years', {
    id: text('id').primaryKey(),
    org_id: text('org_id')
        .notNull()
        .references(() => organizations.id),
    name: text('name').notNull(), // FY 2025-26
    start_date: text('start_date').notNull(),
    end_date: text('end_date').notNull(),
    is_current: integer('is_current', { mode: 'boolean' }).default(false),
    is_locked: integer('is_locked', { mode: 'boolean' }).default(false),
    locked_at: text('locked_at'),
    locked_by: text('locked_by').references(() => users.id),
    created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`)
});

export type FiscalYear = typeof fiscal_years.$inferSelect;
