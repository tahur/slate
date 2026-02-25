import { db } from '$lib/server/db';
import { quotations, customers } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
    const orgId = locals.user!.orgId;

    const quotationList = await db
        .select({
            id: quotations.id,
            quotation_number: quotations.quotation_number,
            subject: quotations.subject,
            quotation_date: quotations.quotation_date,
            valid_until: quotations.valid_until,
            status: quotations.status,
            total: quotations.total,
            customer_name: customers.name,
            customer_company: customers.company_name,
        })
        .from(quotations)
        .leftJoin(customers, eq(quotations.customer_id, customers.id))
        .where(eq(quotations.org_id, orgId))
        .orderBy(quotations.quotation_date);

    return {
        quotations: quotationList.reverse()
    };
};
