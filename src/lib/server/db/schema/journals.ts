import { sqliteTable, text, real, index, unique } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { organizations } from './organizations';
import { users } from './users';
import { accounts } from './accounts';

export const journal_entries = sqliteTable(
    'journal_entries',
    {
        id: text('id').primaryKey(),
        org_id: text('org_id')
            .notNull()
            .references(() => organizations.id),
        entry_number: text('entry_number').notNull(), // JE-2026-0001
        entry_date: text('entry_date').notNull(),
        reference_type: text('reference_type').notNull(), // invoice, payment, expense, etc.
        reference_id: text('reference_id'), // ID of source document
        narration: text('narration'),
        total_debit: real('total_debit').notNull(),
        total_credit: real('total_credit').notNull(),
        status: text('status').default('posted'), // draft, posted, reversed
        reversed_by: text('reversed_by'), // Self-reference ID
        created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
        created_by: text('created_by').references(() => users.id)
    },
    (t) => ({
        unq: unique().on(t.org_id, t.entry_number),
        orgIdx: index('idx_journals_org').on(t.org_id)
    })
);

export const journal_lines = sqliteTable(
    'journal_lines',
    {
        id: text('id').primaryKey(),
        journal_entry_id: text('journal_entry_id')
            .notNull()
            .references(() => journal_entries.id),
        account_id: text('account_id')
            .notNull()
            .references(() => accounts.id),
        debit: real('debit').default(0),
        credit: real('credit').default(0),
        party_type: text('party_type'), // customer, vendor
        party_id: text('party_id'), // customer_id or vendor_id
        narration: text('narration')
    },
    (t) => ({
        accountIdx: index('idx_journal_lines_account').on(t.account_id),
        partyIdx: index('idx_journal_lines_party').on(t.party_type, t.party_id)
    })
);
