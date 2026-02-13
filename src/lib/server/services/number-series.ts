import { db, type Tx } from '../db';
import { number_series } from '../db/schema';
import { eq, and } from 'drizzle-orm';

export type NumberSeriesModule = 'invoice' | 'payment' | 'expense' | 'journal' | 'credit_note';

// Keep legacy alias for backwards compat within this file
type DbTransaction = Tx;

const MODULE_PREFIXES: Record<NumberSeriesModule, string> = {
    invoice: 'INV',
    payment: 'PAY',
    expense: 'EXP',
    journal: 'JE',
    credit_note: 'CN'
};

export function getDefaultPrefix(module: NumberSeriesModule): string {
    return MODULE_PREFIXES[module];
}

/**
 * Get the current fiscal year string based on Indian FY (April-March)
 * e.g., "2025-26" for dates between April 2025 and March 2026
 */
export function getCurrentFiscalYear(date?: Date): string {
    const d = date || new Date();
    const year = d.getFullYear();
    const month = d.getMonth(); // 0-indexed, April = 3

    if (month >= 3) {
        // April onwards = current year FY
        return `${year}-${(year + 1).toString().slice(-2)}`;
    } else {
        // Jan-March = previous year FY
        return `${year - 1}-${year.toString().slice(-2)}`;
    }
}

/**
 * Pad a number with leading zeros
 */
function padNumber(num: number, length: number = 4): string {
    return num.toString().padStart(length, '0');
}

/**
 * Get the next number in a series with atomic increment (transaction-aware).
 * Use this version when you need the increment to roll back with a transaction.
 * 
 * @param tx - Drizzle transaction context
 * @param orgId - Organization ID
 * @param module - Type of document (invoice, payment, etc.)
 * @param fyYear - Fiscal year (optional, defaults to current)
 * @returns Formatted number like "INV-2025-26-0001"
 */
export function getNextNumberTx(
    tx: DbTransaction,
    orgId: string,
    module: NumberSeriesModule,
    fyYear?: string
): string {
    const fy = fyYear || getCurrentFiscalYear();
    const prefix = MODULE_PREFIXES[module];

    // Try to get existing series
    const existing = tx
        .select()
        .from(number_series)
        .where(
            and(
                eq(number_series.org_id, orgId),
                eq(number_series.module, module),
                eq(number_series.fy_year, fy)
            )
        )
        .get();

    let nextNumber: number;

    if (existing) {
        // Increment atomically
        nextNumber = (existing.current_number || 0) + 1;
        tx
            .update(number_series)
            .set({ current_number: nextNumber })
            .where(eq(number_series.id, existing.id))
            .run();
    } else {
        // Create new series
        nextNumber = 1;
        tx.insert(number_series).values({
            id: crypto.randomUUID(),
            org_id: orgId,
            module,
            prefix,
            fy_year: fy,
            current_number: nextNumber,
            reset_on_fy: true
        }).run();
    }

    const finalPrefix = existing?.prefix || prefix;
    return `${finalPrefix}-${fy}-${padNumber(nextNumber)}`;
}

/**
 * Get the next number in a series with atomic increment.
 * Creates the series record if it doesn't exist.
 * NOTE: Use getNextNumberTx if you need rollback on failure.
 *
 * @param orgId - Organization ID
 * @param module - Type of document (invoice, payment, etc.)
 * @param fyYear - Fiscal year (optional, defaults to current)
 * @returns Formatted number like "INV-2025-26-0001"
 */
export function getNextNumber(
    orgId: string,
    module: NumberSeriesModule,
    fyYear?: string
): string {
    const fy = fyYear || getCurrentFiscalYear();
    const prefix = MODULE_PREFIXES[module];

    // Try to get existing series
    const existing = db
        .select()
        .from(number_series)
        .where(
            and(
                eq(number_series.org_id, orgId),
                eq(number_series.module, module),
                eq(number_series.fy_year, fy)
            )
        )
        .get();

    let nextNumber: number;

    if (existing) {
        // Increment atomically
        nextNumber = (existing.current_number || 0) + 1;
        db
            .update(number_series)
            .set({ current_number: nextNumber })
            .where(eq(number_series.id, existing.id))
            .run();
    } else {
        // Create new series
        nextNumber = 1;
        db.insert(number_series).values({
            id: crypto.randomUUID(),
            org_id: orgId,
            module,
            prefix,
            fy_year: fy,
            current_number: nextNumber,
            reset_on_fy: true
        }).run();
    }

    const finalPrefix = existing?.prefix || prefix;
    return `${finalPrefix}-${fy}-${padNumber(nextNumber)}`;
}


/**
 * Generate a draft number (not part of official series)
 */
export function getDraftNumber(
    orgId: string,
    module: NumberSeriesModule
): string {
    const fy = getCurrentFiscalYear();

    // Count existing drafts for this module
    // For simplicity, we use a timestamp-based approach
    const timestamp = Date.now().toString().slice(-6);

    return `DRAFT-${fy}-${timestamp}`;
}

/**
 * Peek at what the next number would be without incrementing
 */
export function peekNextNumber(
    orgId: string,
    module: NumberSeriesModule,
    fyYear?: string
): string {
    const fy = fyYear || getCurrentFiscalYear();
    const prefix = MODULE_PREFIXES[module];

    const existing = db
        .select()
        .from(number_series)
        .where(
            and(
                eq(number_series.org_id, orgId),
                eq(number_series.module, module),
                eq(number_series.fy_year, fy)
            )
        )
        .get();

    const nextNumber = (existing?.current_number || 0) + 1;
    const finalPrefix = existing?.prefix || prefix;
    return `${finalPrefix}-${fy}-${padNumber(nextNumber)}`;
}

type ParsedSeriesNumber = {
    prefix: string;
    fy: string;
    sequence: number;
};

function parseSeriesNumber(value: string): ParsedSeriesNumber | null {
    const match = /^([A-Z0-9]+)-(\d{4}-\d{2})-(\d{4})$/.exec(value.trim());
    if (!match) return null;
    return {
        prefix: match[1],
        fy: match[2],
        sequence: Number.parseInt(match[3], 10)
    };
}

/**
 * Bump the number series when a manual number is higher than the current counter.
 * Only applies when the manual number matches the standard series format.
 */
export function bumpNumberSeriesIfHigher(
    orgId: string,
    module: NumberSeriesModule,
    manualNumber: string,
    tx?: Tx
): void {
    const parsed = parseSeriesNumber(manualNumber);
    if (!parsed || Number.isNaN(parsed.sequence)) return;

    const defaultPrefix = MODULE_PREFIXES[module];
    const q = tx || db;

    const existing = q
        .select()
        .from(number_series)
        .where(
            and(
                eq(number_series.org_id, orgId),
                eq(number_series.module, module),
                eq(number_series.fy_year, parsed.fy)
            )
        )
        .get();

    if (existing) {
        if (existing.prefix !== parsed.prefix) {
            return;
        }
        if ((existing.current_number || 0) >= parsed.sequence) {
            return;
        }
        q
            .update(number_series)
            .set({ current_number: parsed.sequence })
            .where(eq(number_series.id, existing.id))
            .run();
        return;
    }

    if (parsed.prefix !== defaultPrefix) {
        return;
    }

    q.insert(number_series).values({
        id: crypto.randomUUID(),
        org_id: orgId,
        module,
        prefix: parsed.prefix,
        fy_year: parsed.fy,
        current_number: parsed.sequence,
        reset_on_fy: true
    }).run();
}
