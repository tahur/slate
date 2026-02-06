import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { customers } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.user) {
        redirect(302, '/login');
    }

    const orgId = locals.user.orgId;

    const customerList = await db
        .select({
            id: customers.id,
            name: customers.name,
            company_name: customers.company_name,
            email: customers.email,
            phone: customers.phone,
            city: customers.city,
            state_code: customers.state_code,
            gstin: customers.gstin,
            gst_treatment: customers.gst_treatment,
            balance: customers.balance,
            status: customers.status,
        })
        .from(customers)
        .where(eq(customers.org_id, orgId))
        .orderBy(desc(customers.created_at));

    const summary = {
        totalCustomers: customerList.length,
        activeCustomers: customerList.filter(c => c.status === 'active').length,
        totalReceivable: customerList.reduce((sum, c) => sum + (c.balance || 0), 0),
    };

    return {
        customers: customerList,
        summary
    };
};
