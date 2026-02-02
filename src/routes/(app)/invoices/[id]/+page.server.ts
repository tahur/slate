import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { invoices, invoice_items, customers } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
    if (!locals.user) {
        redirect(302, '/login');
    }

    const invoice = await db.query.invoices.findFirst({
        where: and(
            eq(invoices.id, params.id),
            eq(invoices.org_id, locals.user.orgId)
        )
    });

    if (!invoice) {
        redirect(302, '/invoices');
    }

    // Get items
    const items = await db.query.invoice_items.findMany({
        where: eq(invoice_items.invoice_id, params.id),
        orderBy: invoice_items.sort_order,
    });

    // Get customer
    const customer = await db.query.customers.findFirst({
        where: eq(customers.id, invoice.customer_id),
    });

    return { invoice, items, customer };
};
