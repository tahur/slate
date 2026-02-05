/**
 * Idempotency Utilities
 *
 * Prevents duplicate form submissions from creating duplicate records.
 * This protects against:
 * - Double-clicks on submit button
 * - Network retries
 * - Browser refresh during form submission
 * - Accidental form resubmission
 *
 * Usage:
 * 1. Generate a key on form load: crypto.randomUUID()
 * 2. Include it as a hidden input: <input type="hidden" name="idempotency_key" value={key} />
 * 3. Check before creating: const existing = await checkIdempotency(...)
 */

import { db } from '../db';
import { invoices, payments, expenses, credit_notes } from '../db/schema';
import { eq, and } from 'drizzle-orm';

export type IdempotentTable = 'invoices' | 'payments' | 'expenses' | 'credit_notes';

interface IdempotencyResult<T> {
    isDuplicate: boolean;
    existingRecord?: T;
}

/**
 * Check if a record with this idempotency key already exists
 * Returns the existing record if found, allowing the action to return it instead of creating a duplicate
 */
export async function checkIdempotency<T>(
    table: IdempotentTable,
    orgId: string,
    idempotencyKey: string | null | undefined
): Promise<IdempotencyResult<T>> {
    if (!idempotencyKey) {
        return { isDuplicate: false };
    }

    let existingRecord: any = null;

    switch (table) {
        case 'invoices':
            existingRecord = await db.query.invoices.findFirst({
                where: and(
                    eq(invoices.org_id, orgId),
                    eq(invoices.idempotency_key, idempotencyKey)
                )
            });
            break;

        case 'payments':
            existingRecord = await db.query.payments.findFirst({
                where: and(
                    eq(payments.org_id, orgId),
                    eq(payments.idempotency_key, idempotencyKey)
                )
            });
            break;

        case 'expenses':
            existingRecord = await db.query.expenses.findFirst({
                where: and(
                    eq(expenses.org_id, orgId),
                    eq(expenses.idempotency_key, idempotencyKey)
                )
            });
            break;

        case 'credit_notes':
            existingRecord = await db.query.credit_notes.findFirst({
                where: and(
                    eq(credit_notes.org_id, orgId),
                    eq(credit_notes.idempotency_key, idempotencyKey)
                )
            });
            break;
    }

    if (existingRecord) {
        console.log(`[Idempotency] Duplicate submission detected for ${table}, key: ${idempotencyKey}`);
        return { isDuplicate: true, existingRecord: existingRecord as T };
    }

    return { isDuplicate: false };
}

/**
 * Generate a new idempotency key
 * Call this on form load and include in the form as a hidden field
 */
export function generateIdempotencyKey(): string {
    return crypto.randomUUID();
}
