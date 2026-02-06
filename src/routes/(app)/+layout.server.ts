import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { db } from '$lib/server/db';
import { organizations } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load: LayoutServerLoad = async (event) => {
    if (!event.locals.user) {
        redirect(302, '/login');
    }

    const org = await db.query.organizations.findFirst({
        where: eq(organizations.id, event.locals.user.orgId),
        columns: {
            name: true,
            logo_url: true
        }
    });

    return {
        user: event.locals.user,
        orgId: event.locals.user.orgId,
        org: org
    };
};
