import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { customer_advances, credit_notes } from '$lib/server/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals }) => {
    if (!locals.user) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgId = locals.user.orgId;
    const customerId = params.id;

    if (!customerId) {
        return json({ error: 'Customer ID required' }, { status: 400 });
    }

    // Fetch Advances (balance > 0)
    const advances = await db
        .select({
            id: customer_advances.id,
            amount: customer_advances.balance, // Available balance
            date: customer_advances.created_at,
            notes: customer_advances.notes
        })
        .from(customer_advances)
        .where(
            and(
                eq(customer_advances.org_id, orgId),
                eq(customer_advances.customer_id, customerId),
                gt(customer_advances.balance, 0.01)
            )
        );

    // Fetch Credit Notes (status = issued)
    // Note: If we had partial usage on CN, we would check balance. 
    // For now assuming full CN is available or using a 'balance' field if added later.
    // The schema for credit_notes has 'total', but no 'balance'. 
    // WE ASSUME CN is either Used or Unused for now, OR we need to check allocations.
    // Limitation: Current CN schema doesn't track partial balance well without summing allocations.
    // For simplicity, we'll just check status='issued' and assume full amount available.
    // TODO: Improve CN balance tracking.
    const credits = await db
        .select({
            id: credit_notes.id,
            amount: credit_notes.total,
            date: credit_notes.credit_note_date,
            number: credit_notes.credit_note_number
        })
        .from(credit_notes)
        .where(
            and(
                eq(credit_notes.org_id, orgId),
                eq(credit_notes.customer_id, customerId),
                eq(credit_notes.status, 'issued')
            )
        );

    return json({ advances, credits });
};
