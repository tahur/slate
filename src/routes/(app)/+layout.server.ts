import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { db } from '$lib/server/db';
import { organizations } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load: LayoutServerLoad = async (event) => {
    if (!event.locals.user) {
        redirect(302, '/login');
    }

    if (!event.locals.user.orgId) {
        redirect(302, '/setup');
    }

    const org = await db.query.organizations.findFirst({
        where: eq(organizations.id, event.locals.user.orgId),
        columns: {
            name: true,
            logo_url: true,
            address: true,
            city: true,
            state_code: true,
            pincode: true,
            gstin: true
        }
    });

    if (!org) {
        redirect(302, '/setup');
    }

    return {
        user: event.locals.user,
        orgId: event.locals.user.orgId,
        org: org
    };
};
