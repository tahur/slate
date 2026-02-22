import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { payments, payment_allocations, customers, invoices, organizations, payment_methods } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { hasPaymentConfiguration, seedPaymentConfiguration } from '$lib/server/seed';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
    if (!locals.user) {
        redirect(302, '/login');
    }

    const orgId = locals.user.orgId;

    // Get payment with customer
    const paymentRows = await db
        .select({
            id: payments.id,
            payment_number: payments.payment_number,
            payment_date: payments.payment_date,
            amount: payments.amount,
            payment_mode: payments.payment_mode,
            reference: payments.reference,
            notes: payments.notes,
            customer_id: payments.customer_id,
            created_at: payments.created_at
        })
        .from(payments)
        .where(
            and(
                eq(payments.id, params.id),
                eq(payments.org_id, orgId)
            )
        )
        .limit(1);
    const payment = paymentRows[0];

    if (!payment) {
        redirect(302, '/payments');
    }

    // Fetch all related data in parallel
    const [customer, allocations, org, modesList] = await Promise.all([
        db.query.customers.findFirst({
            where: and(
                eq(customers.id, payment.customer_id),
                eq(customers.org_id, orgId)
            )
        }),
        db
            .select({
                id: payment_allocations.id,
                amount: payment_allocations.amount,
                invoice_id: invoices.id,
                invoice_number: invoices.invoice_number,
                invoice_date: invoices.invoice_date,
                invoice_total: invoices.total
            })
            .from(payment_allocations)
            .leftJoin(invoices, eq(payment_allocations.invoice_id, invoices.id))
            .where(eq(payment_allocations.payment_id, params.id)),
        db.query.organizations.findFirst({
            where: eq(organizations.id, orgId)
        }),
        (async () => {
            if (!(await hasPaymentConfiguration(orgId))) {
                await seedPaymentConfiguration(orgId);
            }
            return db
                .select({
                    mode_key: payment_methods.method_key,
                    label: payment_methods.label
                })
                .from(payment_methods)
                .where(and(eq(payment_methods.org_id, orgId), eq(payment_methods.is_active, true)));
        })()
    ]);

    return { payment, customer, allocations, org, paymentModes: modesList };
};
