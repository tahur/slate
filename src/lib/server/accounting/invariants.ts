/**
 * ACCOUNTING INVARIANTS
 * =====================
 *
 * These are the fundamental rules that MUST hold true for the accounting
 * system to maintain integrity. Breaking these rules will corrupt financial data.
 *
 * ⚠️ WARNING: Do NOT modify these functions without understanding the full
 * implications. These protect the integrity of the entire accounting system.
 *
 * See docs/ACCOUNTING_INVARIANTS.md for detailed documentation.
 */

import { db } from '../db';
import { journal_entries, journal_lines } from '../db/schema';
import { eq, sql } from 'drizzle-orm';

// =============================================================================
// TYPES
// =============================================================================

export interface JournalLineData {
    debit: number | null;
    credit: number | null;
}

export interface JournalEntryData {
    id: string;
    status: string | null;
    total_debit: number;
    total_credit: number;
}

export class AccountingInvariantError extends Error {
    constructor(
        public readonly invariant: string,
        public readonly details: string,
        public readonly context?: Record<string, unknown>
    ) {
        super(`Accounting Invariant Violated [${invariant}]: ${details}`);
        this.name = 'AccountingInvariantError';
    }
}

// =============================================================================
// INVARIANT 1: BALANCED ENTRIES
// Every journal entry must have equal debits and credits
// =============================================================================

const BALANCE_TOLERANCE = 0.01; // Allow for floating point rounding

/**
 * Assert that a set of journal lines is balanced (total debits = total credits)
 *
 * ⚠️ INVARIANT: Total debits MUST equal total credits
 *
 * @throws AccountingInvariantError if debits ≠ credits
 */
export function assertBalanced(lines: JournalLineData[]): void {
    const totalDebit = lines.reduce((sum, line) => sum + (line.debit || 0), 0);
    const totalCredit = lines.reduce((sum, line) => sum + (line.credit || 0), 0);

    if (Math.abs(totalDebit - totalCredit) > BALANCE_TOLERANCE) {
        throw new AccountingInvariantError(
            'BALANCED_ENTRY',
            `Debits (${totalDebit.toFixed(2)}) must equal Credits (${totalCredit.toFixed(2)})`,
            { totalDebit, totalCredit, difference: totalDebit - totalCredit }
        );
    }
}

/**
 * Check if lines are balanced without throwing
 */
export function isBalanced(lines: JournalLineData[]): boolean {
    const totalDebit = lines.reduce((sum, line) => sum + (line.debit || 0), 0);
    const totalCredit = lines.reduce((sum, line) => sum + (line.credit || 0), 0);
    return Math.abs(totalDebit - totalCredit) <= BALANCE_TOLERANCE;
}

// =============================================================================
// INVARIANT 2: VALID LINE ENTRIES
// Each line must be either a debit OR a credit, not both, and not zero
// =============================================================================

/**
 * Assert that a journal line has either debit or credit, not both
 *
 * ⚠️ INVARIANT: A line entry is EITHER a debit OR a credit, never both
 *
 * @throws AccountingInvariantError if line has both debit and credit > 0
 */
export function assertValidLine(line: JournalLineData, lineIndex?: number): void {
    const debit = line.debit || 0;
    const credit = line.credit || 0;

    // Both positive is invalid
    if (debit > 0 && credit > 0) {
        throw new AccountingInvariantError(
            'SINGLE_SIDED_ENTRY',
            `Line ${lineIndex !== undefined ? lineIndex + 1 : ''} has both debit (${debit}) and credit (${credit}). A line must be either debit OR credit.`,
            { debit, credit, lineIndex }
        );
    }

    // Both zero is also invalid (empty line)
    if (debit === 0 && credit === 0) {
        throw new AccountingInvariantError(
            'NON_ZERO_ENTRY',
            `Line ${lineIndex !== undefined ? lineIndex + 1 : ''} has zero amount. Each line must have a debit or credit value.`,
            { debit, credit, lineIndex }
        );
    }

    // Negative values are invalid
    if (debit < 0 || credit < 0) {
        throw new AccountingInvariantError(
            'POSITIVE_AMOUNTS',
            `Line ${lineIndex !== undefined ? lineIndex + 1 : ''} has negative amount. Amounts must be positive.`,
            { debit, credit, lineIndex }
        );
    }
}

/**
 * Assert all lines in an entry are valid
 */
export function assertValidLines(lines: JournalLineData[]): void {
    lines.forEach((line, index) => assertValidLine(line, index));
}

// =============================================================================
// INVARIANT 3: IMMUTABLE POSTED ENTRIES
// Posted journal entries cannot be modified, only reversed
// =============================================================================

/**
 * Assert that a journal entry can be modified (only drafts can be modified)
 *
 * ⚠️ INVARIANT: Posted journal entries are IMMUTABLE
 * The only way to "change" a posted entry is to reverse it and create a new one.
 *
 * @throws AccountingInvariantError if entry is posted
 */
export function assertEntryMutable(entry: JournalEntryData): void {
    if (entry.status === 'posted') {
        throw new AccountingInvariantError(
            'IMMUTABLE_POSTED_ENTRY',
            `Cannot modify posted journal entry ${entry.id}. Posted entries are immutable. Create a reversal instead.`,
            { entryId: entry.id, status: entry.status }
        );
    }

    if (entry.status === 'reversed') {
        throw new AccountingInvariantError(
            'IMMUTABLE_REVERSED_ENTRY',
            `Cannot modify reversed journal entry ${entry.id}. This entry has already been reversed.`,
            { entryId: entry.id, status: entry.status }
        );
    }
}

/**
 * Check if an entry can be modified without throwing
 */
export function isEntryMutable(entry: JournalEntryData): boolean {
    return entry.status !== 'posted' && entry.status !== 'reversed';
}

// =============================================================================
// INVARIANT 4: ENTRY TOTALS MATCH LINES
// The stored totals on journal_entries must match the sum of lines
// =============================================================================

/**
 * Assert that entry totals match the sum of its lines
 *
 * ⚠️ INVARIANT: Stored totals MUST match calculated totals from lines
 *
 * @throws AccountingInvariantError if totals don't match
 */
export function assertTotalsMatch(
    entry: JournalEntryData,
    lines: JournalLineData[]
): void {
    const calculatedDebit = lines.reduce((sum, line) => sum + (line.debit || 0), 0);
    const calculatedCredit = lines.reduce((sum, line) => sum + (line.credit || 0), 0);

    if (Math.abs(entry.total_debit - calculatedDebit) > BALANCE_TOLERANCE) {
        throw new AccountingInvariantError(
            'TOTALS_MATCH_LINES',
            `Entry ${entry.id} stored debit (${entry.total_debit}) doesn't match lines total (${calculatedDebit})`,
            {
                entryId: entry.id,
                storedDebit: entry.total_debit,
                calculatedDebit,
                difference: entry.total_debit - calculatedDebit
            }
        );
    }

    if (Math.abs(entry.total_credit - calculatedCredit) > BALANCE_TOLERANCE) {
        throw new AccountingInvariantError(
            'TOTALS_MATCH_LINES',
            `Entry ${entry.id} stored credit (${entry.total_credit}) doesn't match lines total (${calculatedCredit})`,
            {
                entryId: entry.id,
                storedCredit: entry.total_credit,
                calculatedCredit,
                difference: entry.total_credit - calculatedCredit
            }
        );
    }
}

// =============================================================================
// INVARIANT 5: MINIMUM LINES
// Every journal entry must have at least 2 lines
// =============================================================================

/**
 * Assert that an entry has at least 2 lines (double-entry bookkeeping)
 *
 * ⚠️ INVARIANT: Double-entry bookkeeping requires at least 2 lines
 *
 * @throws AccountingInvariantError if fewer than 2 lines
 */
export function assertMinimumLines(lines: JournalLineData[]): void {
    if (lines.length < 2) {
        throw new AccountingInvariantError(
            'MINIMUM_LINES',
            `Journal entry must have at least 2 lines (double-entry). Found ${lines.length} line(s).`,
            { lineCount: lines.length }
        );
    }
}

// =============================================================================
// COMPOSITE VALIDATION
// Validate all invariants for a complete journal entry
// =============================================================================

/**
 * Validate all accounting invariants for a new journal entry
 * Call this before inserting any journal entry.
 *
 * @throws AccountingInvariantError if any invariant is violated
 */
export function validateNewEntry(lines: JournalLineData[]): void {
    assertMinimumLines(lines);
    assertValidLines(lines);
    assertBalanced(lines);
}

/**
 * Validate a complete journal entry with its lines
 * Call this to verify existing data integrity.
 *
 * @throws AccountingInvariantError if any invariant is violated
 */
export function validateEntry(entry: JournalEntryData, lines: JournalLineData[]): void {
    assertMinimumLines(lines);
    assertValidLines(lines);
    assertBalanced(lines);
    assertTotalsMatch(entry, lines);
}

// =============================================================================
// DATABASE INTEGRITY CHECKS
// Functions to verify database-level accounting integrity
// =============================================================================

/**
 * Verify all journal entries in the database are balanced
 * Use this for periodic integrity checks or after migrations.
 */
export async function verifyAllEntriesBalanced(orgId: string): Promise<{
    valid: boolean;
    errors: { entryId: string; debit: number; credit: number }[];
}> {
    const entries = await db
        .select({
            id: journal_entries.id,
            total_debit: journal_entries.total_debit,
            total_credit: journal_entries.total_credit
        })
        .from(journal_entries)
        .where(eq(journal_entries.org_id, orgId));

    const errors: { entryId: string; debit: number; credit: number }[] = [];

    for (const entry of entries) {
        if (Math.abs(entry.total_debit - entry.total_credit) > BALANCE_TOLERANCE) {
            errors.push({
                entryId: entry.id,
                debit: entry.total_debit,
                credit: entry.total_credit
            });
        }
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Verify that entry totals match the sum of their lines
 */
export async function verifyEntryTotalsMatchLines(orgId: string): Promise<{
    valid: boolean;
    errors: { entryId: string; storedDebit: number; calculatedDebit: number; storedCredit: number; calculatedCredit: number }[];
}> {
    // Get entries with calculated line totals
    const result = await db.all<{
        id: string;
        total_debit: number;
        total_credit: number;
        line_debit: number;
        line_credit: number;
    }>(sql`
        SELECT
            je.id,
            je.total_debit,
            je.total_credit,
            COALESCE(SUM(jl.debit), 0) as line_debit,
            COALESCE(SUM(jl.credit), 0) as line_credit
        FROM journal_entries je
        LEFT JOIN journal_lines jl ON jl.journal_entry_id = je.id
        WHERE je.org_id = ${orgId}
        GROUP BY je.id
    `);

    const errors: { entryId: string; storedDebit: number; calculatedDebit: number; storedCredit: number; calculatedCredit: number }[] = [];

    for (const row of result) {
        const debitMismatch = Math.abs(row.total_debit - row.line_debit) > BALANCE_TOLERANCE;
        const creditMismatch = Math.abs(row.total_credit - row.line_credit) > BALANCE_TOLERANCE;

        if (debitMismatch || creditMismatch) {
            errors.push({
                entryId: row.id,
                storedDebit: row.total_debit,
                calculatedDebit: row.line_debit,
                storedCredit: row.total_credit,
                calculatedCredit: row.line_credit
            });
        }
    }

    return {
        valid: errors.length === 0,
        errors
    };
}
