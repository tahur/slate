import { db } from '$lib/server/db';
import { payments, customers, payment_modes } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { hasPaymentModes, seedPaymentModes } from '$lib/server/seed';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
    const orgId = locals.user!.orgId;

    if (!hasPaymentModes(orgId)) {
        seedPaymentModes(orgId);
    }

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

    const modesList = db
        .select({
            mode_key: payment_modes.mode_key,
            label: payment_modes.label
        })
        .from(payment_modes)
        .where(eq(payment_modes.org_id, orgId))
        .all();

    return {
        payments: paymentList.reverse(), // Most recent first
        paymentModes: modesList
    };
};
