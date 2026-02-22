import { pgTable, text, integer, boolean, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { organizations } from './organizations';

export const payment_methods = pgTable(
    'payment_methods',
    {
        id: text('id').primaryKey(),
        org_id: text('org_id')
            .notNull()
            .references(() => organizations.id),
        method_key: text('method_key').notNull(),
        label: text('label').notNull(),
        direction: text('direction').default('both'), // receive, pay, both
        is_default: boolean('is_default').default(false),
        is_active: boolean('is_active').default(true),
        sort_order: integer('sort_order').default(0),
        created_at: text('created_at').default(sql`NOW()::text`)
    },
    (t) => ({
        orgIdx: index('idx_payment_methods_org').on(t.org_id),
        activeIdx: index('idx_payment_methods_org_active').on(t.org_id, t.is_active),
        orgMethodKeyUnq: uniqueIndex('idx_payment_methods_org_key').on(t.org_id, t.method_key)
    })
);
