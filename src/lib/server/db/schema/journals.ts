import { pgTable, text, numeric, index, unique, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { organizations } from './organizations';
import { users } from './users';
import { accounts } from './accounts';

/**
 * ⚠️ ACCOUNTING INVARIANTS ENFORCED AT DATABASE LEVEL
 *
 * These constraints are the FINAL safety net for accounting integrity.
 * See docs/ACCOUNTING_INVARIANTS.md for details.
 */

export const journal_entries = pgTable(
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
        total_debit: numeric('total_debit', { precision: 14, scale: 2, mode: 'number' }).notNull(),
        total_credit: numeric('total_credit', { precision: 14, scale: 2, mode: 'number' }).notNull(),
        status: text('status').default('posted'), // draft, posted, reversed
        reversed_by: text('reversed_by'), // Self-reference ID
        created_at: text('created_at').default(sql`NOW()::text`),
        created_by: text('created_by').references(() => users.id)
    },
    (t) => ({
        unq: unique().on(t.org_id, t.entry_number),
        orgIdx: index('idx_journals_org').on(t.org_id),
        dateIdx: index('idx_journals_date').on(t.org_id, t.entry_date),

        // ⚠️ ACCOUNTING INVARIANT: Journal entry totals must balance
        entryBalanced: check(
            'entry_balanced',
            sql`ROUND(total_debit::numeric, 2) = ROUND(total_credit::numeric, 2)`
        )
    })
);

export const journal_lines = pgTable(
    'journal_lines',
    {
        id: text('id').primaryKey(),
        journal_entry_id: text('journal_entry_id')
            .notNull()
            .references(() => journal_entries.id),
        account_id: text('account_id')
            .notNull()
            .references(() => accounts.id),
        debit: numeric('debit', { precision: 14, scale: 2, mode: 'number' }).default(0),
        credit: numeric('credit', { precision: 14, scale: 2, mode: 'number' }).default(0),
        party_type: text('party_type'), // customer, vendor
        party_id: text('party_id'), // customer_id or vendor_id
        narration: text('narration')
    },
    (t) => ({
        // Indexes for query performance
        accountIdx: index('idx_journal_lines_account').on(t.account_id),
        partyIdx: index('idx_journal_lines_party').on(t.party_type, t.party_id),
        entryIdx: index('idx_journal_lines_entry').on(t.journal_entry_id),

        // ⚠️ ACCOUNTING INVARIANT: Amounts must be non-negative
        debitPositive: check('debit_positive', sql`debit >= 0`),
        creditPositive: check('credit_positive', sql`credit >= 0`),

        // ⚠️ ACCOUNTING INVARIANT: A line is EITHER debit OR credit, exactly one side > 0
        singleSided: check(
            'single_sided_entry',
            sql`(debit > 0 AND credit = 0) OR (debit = 0 AND credit > 0)`
        )
    })
);
