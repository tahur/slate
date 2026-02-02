import { db } from '$lib/server/db';
import { payments, customers } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
    const orgId = locals.user!.orgId;

    const paymentList = await db
        .select({
            id: payments.id,
            payment_number: payments.payment_number,
            payment_date: payments.payment_date,
            amount: payments.amount,
            payment_mode: payments.payment_mode,
            reference: payments.reference,
            customer_name: customers.name,
            customer_company: customers.company_name,
        })
        .from(payments)
        .leftJoin(customers, eq(payments.customer_id, customers.id))
        .where(eq(payments.org_id, orgId))
        .orderBy(payments.payment_date);

    return {
        payments: paymentList.reverse() // Most recent first
    };
};
