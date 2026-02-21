import { pgTable, text, boolean, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { organizations } from './organizations';

export const users = pgTable('users', {
    id: text('id').primaryKey(),
    orgId: text('org_id')
        .references(() => organizations.id),
    email: text('email').notNull().unique(),
    emailVerified: boolean('email_verified').default(false),
    name: text('name').notNull(),
    image: text('image'),
    role: text('role').default('admin'),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at', { mode: 'date' }),
    updatedAt: timestamp('updated_at', { mode: 'date' })
});

export const sessions = pgTable('sessions', {
    id: text('id').primaryKey(),
    expiresAt: timestamp('expires_at', { mode: 'date' }).notNull(),
    token: text('token').notNull().unique(),
    createdAt: timestamp('created_at', { mode: 'date' }),
    updatedAt: timestamp('updated_at', { mode: 'date' }),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
        .notNull()
        .references(() => users.id)
});

export const auth_accounts = pgTable('auth_accounts', {
    id: text('id').primaryKey(),
    userId: text('user_id')
        .notNull()
        .references(() => users.id),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    expiresAt: timestamp('expires_at', { mode: 'date' }),
    password: text('password'),
    createdAt: timestamp('created_at', { mode: 'date' }),
    updatedAt: timestamp('updated_at', { mode: 'date' })
});

export const verification = pgTable('verification', {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at', { mode: 'date' }).notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }),
    updatedAt: timestamp('updated_at', { mode: 'date' })
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
