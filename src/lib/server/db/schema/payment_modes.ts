import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { organizations } from './organizations';
import { accounts } from './accounts';

export const payment_modes = sqliteTable(
    'payment_modes',
    {
        id: text('id').primaryKey(),
        org_id: text('org_id')
            .notNull()
            .references(() => organizations.id),
        mode_key: text('mode_key').notNull(),
        label: text('label').notNull(),
        linked_account_id: text('linked_account_id').references(() => accounts.id),
        is_default: integer('is_default', { mode: 'boolean' }).default(false),
        sort_order: integer('sort_order').default(0),
        is_active: integer('is_active', { mode: 'boolean' }).default(true),
        created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`)
    },
    (t) => ({
        orgIdx: index('idx_payment_modes_org').on(t.org_id)
    })
);
