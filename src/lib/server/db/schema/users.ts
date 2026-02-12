import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { organizations } from './organizations';

export const users = sqliteTable('users', {
    id: text('id').primaryKey(),
    orgId: text('org_id')
        .references(() => organizations.id),
    email: text('email').notNull().unique(),
    emailVerified: integer('email_verified', { mode: 'boolean' }).default(false),
    name: text('name').notNull(),
    image: text('image'),
    role: text('role').default('admin'),
    isActive: integer('is_active', { mode: 'boolean' }).default(true),
    createdAt: integer('created_at', { mode: 'timestamp' }),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
});

export const sessions = sqliteTable('sessions', {
    id: text('id').primaryKey(),
    expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
    token: text('token').notNull().unique(),
    createdAt: integer('created_at', { mode: 'timestamp' }),
    updatedAt: integer('updated_at', { mode: 'timestamp' }),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
        .notNull()
        .references(() => users.id)
});

export const auth_accounts = sqliteTable('auth_accounts', {
    id: text('id').primaryKey(),
    userId: text('user_id')
        .notNull()
        .references(() => users.id),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    expiresAt: integer('expires_at', { mode: 'timestamp' }),
    password: text('password'),
    createdAt: integer('created_at', { mode: 'timestamp' }),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
});

export const verification = sqliteTable('verification', {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
});

// Relations for better-auth joins
export const usersRelations = relations(users, ({ many }) => ({
    sessions: many(sessions),
    accounts: many(auth_accounts)
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
    user: one(users, { fields: [sessions.userId], references: [users.id] })
}));

export const authAccountsRelations = relations(auth_accounts, ({ one }) => ({
    user: one(users, { fields: [auth_accounts.userId], references: [users.id] })
}));

export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
