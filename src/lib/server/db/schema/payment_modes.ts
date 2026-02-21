import { pgTable, text, integer, boolean, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { organizations } from './organizations';
import { accounts } from './accounts';

export const payment_modes = pgTable(
    'payment_modes',
    {
        id: text('id').primaryKey(),
        org_id: text('org_id')
            .notNull()
            .references(() => organizations.id),
        mode_key: text('mode_key').notNull(),
        label: text('label').notNull(),
        linked_account_id: text('linked_account_id').references(() => accounts.id),
        is_default: boolean('is_default').default(false),
        sort_order: integer('sort_order').default(0),
        is_active: boolean('is_active').default(true),
        created_at: text('created_at').default(sql`NOW()::text`)
    },
    (t) => ({
        orgIdx: index('idx_payment_modes_org').on(t.org_id)
    })
);
