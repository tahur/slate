import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { vendors } from '$lib/server/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.user) {
        redirect(302, '/login');
    }

    const orgId = locals.user.orgId;

    const vendorList = await db
        .select({
            id: vendors.id,
            name: vendors.name,
            company_name: vendors.company_name,
            display_name: vendors.display_name,
            email: vendors.email,
            phone: vendors.phone,
            city: vendors.city,
            state_code: vendors.state_code,
            gstin: vendors.gstin,
            gst_treatment: vendors.gst_treatment,
            balance: vendors.balance,
            is_active: vendors.is_active,
        })
        .from(vendors)
        .where(eq(vendors.org_id, orgId))
        .orderBy(desc(vendors.created_at));

    // Calculate summary stats
    const summary = {
        totalVendors: vendorList.length,
        activeVendors: vendorList.filter(v => v.is_active).length,
        totalPayable: vendorList.reduce((sum, v) => sum + (v.balance || 0), 0),
    };

    return {
        vendors: vendorList,
        summary
    };
};
