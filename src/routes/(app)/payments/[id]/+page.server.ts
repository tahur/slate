import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { payments, payment_allocations, customers, invoices, organizations } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
    if (!locals.user) {
        redirect(302, '/login');
    }

    const orgId = locals.user.orgId;

    // Get payment with customer
    const payment = await db
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
        .get();

    if (!payment) {
        redirect(302, '/payments');
    }

    // Get customer
    const customer = await db.query.customers.findFirst({
        where: and(
            eq(customers.id, payment.customer_id),
            eq(customers.org_id, orgId)
        )
    });

    // Get allocations with invoice details
    const allocations = await db
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
        .where(eq(payment_allocations.payment_id, params.id));

    // Get organization
    const org = await db.query.organizations.findFirst({
        where: eq(organizations.id, orgId)
    });

    return { payment, customer, allocations, org };
};
