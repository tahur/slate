import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { items } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.user) {
        redirect(302, '/login');
    }

    const orgId = locals.user.orgId;

    const itemList = await db
        .select({
            id: items.id,
            type: items.type,
            sku: items.sku,
            name: items.name,
            description: items.description,
            hsn_code: items.hsn_code,
            gst_rate: items.gst_rate,
            rate: items.rate,
            unit: items.unit,
            is_active: items.is_active,
        })
        .from(items)
        .where(eq(items.org_id, orgId))
        .orderBy(desc(items.created_at));

    const summary = {
        totalItems: itemList.length,
        products: itemList.filter(i => i.type === 'product').length,
        services: itemList.filter(i => i.type === 'service').length,
        active: itemList.filter(i => i.is_active).length,
    };

    return {
        items: itemList,
        summary
    };
};
