import { sqliteTable, text, integer, real, unique, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { organizations } from './organizations';

export const accounts = sqliteTable(
    'accounts',
    {
        id: text('id').primaryKey(),
        org_id: text('org_id')
            .notNull()
            .references(() => organizations.id),
        account_code: text('account_code').notNull(), // 1000, 1100, etc.
        account_name: text('account_name').notNull(),
        account_type: text('account_type').notNull(), // asset, liability, equity, income, expense
        parent_id: text('parent_id'), // Self-reference handled in application logic or Drizzle relations
        is_system: integer('is_system', { mode: 'boolean' }).default(false), // Cannot be deleted if true
        is_active: integer('is_active', { mode: 'boolean' }).default(true),
        description: text('description'),
        balance: real('balance').default(0), // Running balance
        created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`)
    },
    (t) => ({
        unq: unique().on(t.org_id, t.account_code),
        orgIdx: index('idx_accounts_org').on(t.org_id)
    })
);
