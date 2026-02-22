import { pgTable, text, boolean, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { organizations } from './organizations';
import { payment_accounts } from './payment_accounts';
import { payment_methods } from './payment_methods';

export const payment_method_account_map = pgTable(
    'payment_method_account_map',
    {
        id: text('id').primaryKey(),
        org_id: text('org_id')
            .notNull()
            .references(() => organizations.id),
        payment_method_id: text('payment_method_id')
            .notNull()
            .references(() => payment_methods.id),
        payment_account_id: text('payment_account_id')
            .notNull()
            .references(() => payment_accounts.id),
        is_default: boolean('is_default').default(false),
        is_active: boolean('is_active').default(true),
        created_at: text('created_at').default(sql`NOW()::text`)
    },
    (t) => ({
        orgIdx: index('idx_payment_method_map_org').on(t.org_id),
        methodIdx: index('idx_payment_method_map_method').on(t.payment_method_id),
        accountIdx: index('idx_payment_method_map_account').on(t.payment_account_id),
        methodAccountUnq: uniqueIndex('idx_payment_method_map_unique').on(
            t.org_id,
            t.payment_method_id,
            t.payment_account_id
        )
    })
);
