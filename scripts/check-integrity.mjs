import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

const MONEY_EPSILON = 0.01;
const DEFAULT_DB_PATH = 'data/slate.db';
const dbPath = process.env.SLATE_DB_PATH || DEFAULT_DB_PATH;
const absDbPath = path.isAbsolute(dbPath) ? dbPath : path.join(process.cwd(), dbPath);

if (!fs.existsSync(absDbPath)) {
    console.log(`Integrity check skipped: database not found at ${absDbPath}`);
    process.exit(0);
}

const sqlite = new Database(absDbPath, { readonly: true, fileMustExist: true });
sqlite.pragma('foreign_keys = ON');

/** @type {Array<{name:string, sql:string, params?:unknown[]}>} */
const checks = [
    {
        name: 'Journal entries with debit/credit imbalance',
        sql: `
            SELECT
                je.id,
                je.entry_number,
                ROUND(COALESCE(SUM(jl.debit), 0), 2) AS total_debit,
                ROUND(COALESCE(SUM(jl.credit), 0), 2) AS total_credit
            FROM journal_entries je
            LEFT JOIN journal_lines jl ON jl.journal_entry_id = je.id
            GROUP BY je.id
            HAVING ABS(
                ROUND(COALESCE(SUM(jl.debit), 0), 2)
                - ROUND(COALESCE(SUM(jl.credit), 0), 2)
            ) > ?
        `,
        params: [MONEY_EPSILON]
    },
    {
        name: 'Issued invoices without journal link',
        sql: `
            SELECT id, invoice_number, status
            FROM invoices
            WHERE status IN ('issued', 'partially_paid', 'paid')
              AND journal_entry_id IS NULL
        `
    },
    {
        name: 'Invoices with missing journal entry',
        sql: `
            SELECT i.id, i.invoice_number, i.journal_entry_id
            FROM invoices i
            LEFT JOIN journal_entries je ON je.id = i.journal_entry_id
            WHERE i.journal_entry_id IS NOT NULL
              AND je.id IS NULL
        `
    },
    {
        name: 'Payments with missing journal entry',
        sql: `
            SELECT p.id, p.payment_number, p.journal_entry_id
            FROM payments p
            LEFT JOIN journal_entries je ON je.id = p.journal_entry_id
            WHERE p.journal_entry_id IS NOT NULL
              AND je.id IS NULL
        `
    },
    {
        name: 'Expenses with missing journal entry',
        sql: `
            SELECT e.id, e.expense_number, e.journal_entry_id
            FROM expenses e
            LEFT JOIN journal_entries je ON je.id = e.journal_entry_id
            WHERE e.journal_entry_id IS NOT NULL
              AND je.id IS NULL
        `
    },
    {
        name: 'Credit notes with missing journal entry',
        sql: `
            SELECT cn.id, cn.credit_note_number, cn.journal_entry_id
            FROM credit_notes cn
            LEFT JOIN journal_entries je ON je.id = cn.journal_entry_id
            WHERE cn.journal_entry_id IS NOT NULL
              AND je.id IS NULL
        `
    },
    {
        name: 'Orphan payment allocations',
        sql: `
            SELECT pa.id, pa.payment_id, pa.invoice_id, pa.amount
            FROM payment_allocations pa
            LEFT JOIN payments p ON p.id = pa.payment_id
            LEFT JOIN invoices i ON i.id = pa.invoice_id
            WHERE p.id IS NULL
               OR i.id IS NULL
        `
    },
    {
        name: 'Orphan credit allocations',
        sql: `
            SELECT ca.id, ca.invoice_id, ca.credit_note_id, ca.advance_id, ca.amount
            FROM credit_allocations ca
            LEFT JOIN invoices i ON i.id = ca.invoice_id
            LEFT JOIN credit_notes cn ON cn.id = ca.credit_note_id
            LEFT JOIN customer_advances adv ON adv.id = ca.advance_id
            WHERE i.id IS NULL
               OR (ca.credit_note_id IS NOT NULL AND cn.id IS NULL)
               OR (ca.advance_id IS NOT NULL AND adv.id IS NULL)
        `
    },
    {
        name: 'Payments over-allocated beyond payment amount',
        sql: `
            SELECT
                p.id,
                p.payment_number,
                ROUND(p.amount, 2) AS payment_amount,
                ROUND(COALESCE(SUM(pa.amount), 0), 2) AS total_allocated
            FROM payments p
            LEFT JOIN payment_allocations pa ON pa.payment_id = p.id
            GROUP BY p.id
            HAVING ROUND(COALESCE(SUM(pa.amount), 0), 2) > ROUND(p.amount, 2) + ?
        `,
        params: [MONEY_EPSILON]
    },
    {
        name: 'Invoice amount_paid drift vs allocations',
        sql: `
            WITH payment_totals AS (
                SELECT invoice_id, ROUND(COALESCE(SUM(amount), 0), 2) AS paid_via_payment
                FROM payment_allocations
                GROUP BY invoice_id
            ),
            credit_totals AS (
                SELECT invoice_id, ROUND(COALESCE(SUM(amount), 0), 2) AS paid_via_credit
                FROM credit_allocations
                GROUP BY invoice_id
            ),
            invoice_totals AS (
                SELECT
                    i.id,
                    i.invoice_number,
                    ROUND(COALESCE(i.amount_paid, 0), 2) AS recorded_paid,
                    ROUND(
                        COALESCE(pt.paid_via_payment, 0)
                        + COALESCE(ct.paid_via_credit, 0),
                        2
                    ) AS allocated_paid
                FROM invoices i
                LEFT JOIN payment_totals pt ON pt.invoice_id = i.id
                LEFT JOIN credit_totals ct ON ct.invoice_id = i.id
                WHERE i.status <> 'cancelled'
            )
            SELECT
                id,
                invoice_number,
                recorded_paid,
                allocated_paid,
                ROUND(ABS(recorded_paid - allocated_paid), 2) AS drift
            FROM invoice_totals
            WHERE ABS(recorded_paid - allocated_paid) > ?
        `,
        params: [MONEY_EPSILON]
    },
    {
        name: 'Invalid customer advance balances',
        sql: `
            SELECT id, payment_id, amount, balance
            FROM customer_advances
            WHERE balance < -?
               OR balance > amount + ?
        `,
        params: [MONEY_EPSILON, MONEY_EPSILON]
    },
    {
        name: 'Invalid credit note balances',
        sql: `
            SELECT id, credit_note_number, total, balance, status
            FROM credit_notes
            WHERE balance < -?
               OR balance > total + ?
        `,
        params: [MONEY_EPSILON, MONEY_EPSILON]
    }
];

let failureCount = 0;

for (const check of checks) {
    const stmt = sqlite.prepare(check.sql);
    const rows = check.params ? stmt.all(...check.params) : stmt.all();

    if (rows.length === 0) {
        console.log(`OK   ${check.name}`);
        continue;
    }

    failureCount++;
    console.log(`FAIL ${check.name} (${rows.length} rows)`);
    for (const row of rows.slice(0, 10)) {
        console.log(`     ${JSON.stringify(row)}`);
    }
    if (rows.length > 10) {
        console.log(`     ...and ${rows.length - 10} more`);
    }
}

sqlite.close();

if (failureCount > 0) {
    console.error(`\nIntegrity check failed with ${failureCount} failing check(s).`);
    process.exit(1);
}

console.log('\nIntegrity check passed.');
