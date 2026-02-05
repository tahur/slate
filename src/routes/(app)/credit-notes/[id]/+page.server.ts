import { redirect, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { credit_notes, customers, organizations } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
    if (!locals.user) {
        redirect(302, '/login');
    }

    const orgId = locals.user.orgId;

    // Fetch Credit Note
    const creditNote = await db.query.credit_notes.findFirst({
        where: and(
            eq(credit_notes.id, params.id),
            eq(credit_notes.org_id, orgId)
        )
    });

    if (!creditNote) {
        error(404, 'Credit Note not found');
    }

    // Fetch Customer
    const customer = await db.query.customers.findFirst({
        where: eq(customers.id, creditNote.customer_id)
    });

    // Fetch Organization (for logo and address)
    const org = await db.query.organizations.findFirst({
        where: eq(organizations.id, orgId)
    });

    return {
        creditNote,
        customer,
        org
    };
};
