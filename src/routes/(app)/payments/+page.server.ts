import { db } from '$lib/server/db';
import { payments, customers, payment_methods } from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';
import { hasPaymentConfiguration, seedPaymentConfiguration } from '$lib/server/seed';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
    const orgId = locals.user!.orgId;

    if (!(await hasPaymentConfiguration(orgId))) {
        await seedPaymentConfiguration(orgId);
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

    const modesList = await db
        .select({
            mode_key: payment_methods.method_key,
            label: payment_methods.label
        })
        .from(payment_methods)
        .where(and(eq(payment_methods.org_id, orgId), eq(payment_methods.is_active, true)));

    return {
        payments: paymentList.reverse(), // Most recent first
        paymentModes: modesList
    };
};
