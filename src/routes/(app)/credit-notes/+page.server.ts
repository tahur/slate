import { db } from '$lib/server/db';
import { credit_notes, customers } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
    const orgId = locals.user!.orgId;

    const creditNoteList = await db
        .select({
            id: credit_notes.id,
            credit_note_number: credit_notes.credit_note_number,
            credit_note_date: credit_notes.credit_note_date,
            status: credit_notes.status,
            total: credit_notes.total,
            reason: credit_notes.reason,
            customer_name: customers.name,
        })
        .from(credit_notes)
        .leftJoin(customers, eq(credit_notes.customer_id, customers.id))
        .where(eq(credit_notes.org_id, orgId))
        .orderBy(credit_notes.credit_note_date);

    return {
        creditNotes: creditNoteList.reverse()
    };
};
