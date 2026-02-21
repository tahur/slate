import { pgTable, text, integer, boolean, unique } from 'drizzle-orm/pg-core';
import { organizations } from './organizations';

export const number_series = pgTable(
    'number_series',
    {
        id: text('id').primaryKey(),
        org_id: text('org_id')
            .notNull()
            .references(() => organizations.id),
        module: text('module').notNull(), // invoice, payment, expense, journal
        prefix: text('prefix').notNull(), // INV, PAY, EXP, JE
        current_number: integer('current_number').default(0),
        fy_year: text('fy_year').notNull(), // 2025-26
        reset_on_fy: boolean('reset_on_fy').default(true)
    },
    (t) => ({
        unq: unique().on(t.org_id, t.module, t.fy_year)
    })
);
