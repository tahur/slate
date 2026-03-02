import { db } from '$lib/server/db';
import { debit_notes, vendors } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
    const orgId = locals.user!.orgId;

    const debitNoteList = await db
        .select({
            id: debit_notes.id,
            debit_note_number: debit_notes.debit_note_number,
            debit_note_date: debit_notes.debit_note_date,
            status: debit_notes.status,
            total: debit_notes.total,
            balance: debit_notes.balance,
            reason: debit_notes.reason,
            vendor_name: vendors.name,
        })
        .from(debit_notes)
        .leftJoin(vendors, eq(debit_notes.vendor_id, vendors.id))
        .where(eq(debit_notes.org_id, orgId))
        .orderBy(debit_notes.debit_note_date);

    return {
        debitNotes: debitNoteList.reverse()
    };
};
