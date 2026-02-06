import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { organizations } from './organizations';

export const users = sqliteTable('users', {
    id: text('id').primaryKey(),
    org_id: text('org_id')
        .references(() => organizations.id),
    email: text('email').notNull().unique(),
    password_hash: text('password_hash').notNull(),
    name: text('name').notNull(),
    role: text('role').default('admin'), // admin, user
    is_active: integer('is_active', { mode: 'boolean' }).default(true),
    created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
    updated_at: text('updated_at').default(sql`CURRENT_TIMESTAMP`)
});

export const sessions = sqliteTable('sessions', {
    id: text('id').primaryKey(),
    userId: text('user_id')
        .notNull()
        .references(() => users.id),
    expiresAt: integer('expires_at').notNull()
});

export const password_reset_tokens = sqliteTable('password_reset_tokens', {
    id: text('id').primaryKey(),
    user_id: text('user_id')
        .notNull()
        .references(() => users.id),
    token_hash: text('token_hash').notNull(),
    expires_at: integer('expires_at').notNull(),
    created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`)
});

export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type PasswordResetToken = typeof password_reset_tokens.$inferSelect;
