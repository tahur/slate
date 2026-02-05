import { db } from '$lib/server/db';
import { journal_entries } from '$lib/server/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

function getMonthRange(): { startDate: string; endDate: string } {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    const startDate = new Date(year, month, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

    return { startDate, endDate };
}

export const load: PageServerLoad = async ({ locals, url }) => {
    const orgId = locals.user!.orgId;

    // Get date range from URL params or default to current month
    const defaults = getMonthRange();
    const startDate = url.searchParams.get('from') || defaults.startDate;
    const endDate = url.searchParams.get('to') || defaults.endDate;

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
        .where(
            and(
                eq(journal_entries.org_id, orgId),
                gte(journal_entries.entry_date, startDate),
                lte(journal_entries.entry_date, endDate)
            )
        )
        .orderBy(journal_entries.entry_date);

    return {
        journals: journalList.reverse(),
        startDate,
        endDate
    };
};
