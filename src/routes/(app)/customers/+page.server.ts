import { db } from '$lib/server/db';
import { customers } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
    const orgId = locals.user!.orgId;

    const customerList = await db.query.customers.findMany({
        where: eq(customers.org_id, orgId),
        orderBy: (customers, { desc }) => [desc(customers.created_at)]
    });

    return {
        customers: customerList
    };
};
