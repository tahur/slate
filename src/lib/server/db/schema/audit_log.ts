import { sqliteTable, text, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { users } from './users';

export const audit_log = sqliteTable(
    'audit_log',
    {
        id: text('id').primaryKey(),
        org_id: text('org_id').notNull(),
        entity_type: text('entity_type').notNull(), // invoice, payment, customer, etc.
        entity_id: text('entity_id').notNull(),
        action: text('action').notNull(), // create, update, delete, issue, cancel
        changed_fields: text('changed_fields'), // JSON: {"status": {"old": "draft", "new": "issued"}}
        user_id: text('user_id')
            .notNull()
            .references(() => users.id),
        ip_address: text('ip_address'),
        user_agent: text('user_agent'),
        created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`)
    },
    (t) => ({
        entityIdx: index('idx_audit_entity').on(t.org_id, t.entity_type, t.entity_id),
        dateIdx: index('idx_audit_date').on(t.org_id, t.created_at)
    })
);
