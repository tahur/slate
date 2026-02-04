import { db } from '$lib/server/db';
import { journal_entries } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
    const orgId = locals.user!.orgId;

    const journalList = await db
        .select({
            id: journal_entries.id,
            entry_number: journal_entries.entry_number,
            entry_date: journal_entries.entry_date,
            reference_type: journal_entries.reference_type,
            narration: journal_entries.narration,
            total_debit: journal_entries.total_debit,
            total_credit: journal_entries.total_credit,
            status: journal_entries.status,
        })
        .from(journal_entries)
        .where(eq(journal_entries.org_id, orgId))
        .orderBy(journal_entries.entry_date);

    return {
        journals: journalList.reverse()
    };
};
