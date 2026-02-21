import { pgTable, text, boolean } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { organizations } from './organizations';
import { users } from './users';

export const fiscal_years = pgTable('fiscal_years', {
    id: text('id').primaryKey(),
    org_id: text('org_id')
        .notNull()
        .references(() => organizations.id),
    name: text('name').notNull(), // FY 2025-26
    start_date: text('start_date').notNull(),
    end_date: text('end_date').notNull(),
    is_current: boolean('is_current').default(false),
    is_locked: boolean('is_locked').default(false),
    locked_at: text('locked_at'),
    locked_by: text('locked_by').references(() => users.id),
    created_at: text('created_at').default(sql`NOW()::text`)
});

export type FiscalYear = typeof fiscal_years.$inferSelect;
