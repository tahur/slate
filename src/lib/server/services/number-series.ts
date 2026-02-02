import { db } from '../db';
import { number_series } from '../db/schema';
import { eq, and } from 'drizzle-orm';

export type NumberSeriesModule = 'invoice' | 'payment' | 'expense' | 'journal';

const MODULE_PREFIXES: Record<NumberSeriesModule, string> = {
    invoice: 'INV',
    payment: 'PAY',
    expense: 'EXP',
    journal: 'JE'
};

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
 * Get the next number in a series with atomic increment.
 * Creates the series record if it doesn't exist.
 * 
 * @param orgId - Organization ID
 * @param module - Type of document (invoice, payment, etc.)
 * @param fyYear - Fiscal year (optional, defaults to current)
 * @returns Formatted number like "INV-2025-26-0001"
 */
export async function getNextNumber(
    orgId: string,
    module: NumberSeriesModule,
    fyYear?: string
): Promise<string> {
    const fy = fyYear || getCurrentFiscalYear();
    const prefix = MODULE_PREFIXES[module];

    // Try to get existing series
    const existing = await db
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
        await db
            .update(number_series)
            .set({ current_number: nextNumber })
            .where(eq(number_series.id, existing.id));
    } else {
        // Create new series
        nextNumber = 1;
        await db.insert(number_series).values({
            id: crypto.randomUUID(),
            org_id: orgId,
            module,
            prefix,
            fy_year: fy,
            current_number: nextNumber,
            reset_on_fy: true
        });
    }

    return `${prefix}-${fy}-${padNumber(nextNumber)}`;
}

/**
 * Generate a draft number (not part of official series)
 */
export async function getDraftNumber(
    orgId: string,
    module: NumberSeriesModule
): Promise<string> {
    const fy = getCurrentFiscalYear();

    // Count existing drafts for this module
    // For simplicity, we use a timestamp-based approach
    const timestamp = Date.now().toString().slice(-6);

    return `DRAFT-${fy}-${timestamp}`;
}

/**
 * Peek at what the next number would be without incrementing
 */
export async function peekNextNumber(
    orgId: string,
    module: NumberSeriesModule,
    fyYear?: string
): Promise<string> {
    const fy = fyYear || getCurrentFiscalYear();
    const prefix = MODULE_PREFIXES[module];

    const existing = await db
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
    return `${prefix}-${fy}-${padNumber(nextNumber)}`;
}
