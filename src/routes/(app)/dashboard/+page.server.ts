import { db } from '$lib/server/db';
import { organizations } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { getDashboardData } from '$lib/server/services/dashboard';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
    const orgId = locals.user!.orgId;

    // Fetch Organization Details
    const org = await db.query.organizations.findFirst({
        where: eq(organizations.id, orgId)
    });

    // Get all dashboard data
    const dashboardData = await getDashboardData(orgId);

    return {
        org,
        ...dashboardData
    };
};
