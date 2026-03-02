import { redirect, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { debit_notes, vendors, organizations } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
    if (!locals.user) {
        redirect(302, '/login');
    }

    const orgId = locals.user.orgId;

    // Fetch Debit Note
    const debitNote = await db.query.debit_notes.findFirst({
        where: and(
            eq(debit_notes.id, params.id),
            eq(debit_notes.org_id, orgId)
        )
    });

    if (!debitNote) {
        error(404, 'Debit Note not found');
    }

    // Fetch Vendor
    const vendor = await db.query.vendors.findFirst({
        where: eq(vendors.id, debitNote.vendor_id)
    });

    // Fetch Organization (for logo and address)
    const org = await db.query.organizations.findFirst({
        where: eq(organizations.id, orgId)
    });

    return {
        debitNote,
        vendor,
        org
    };
};
