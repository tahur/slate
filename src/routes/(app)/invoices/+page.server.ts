import { db } from '$lib/server/db';
import { invoices, customers } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
    const orgId = locals.user!.orgId;

    const invoiceList = await db
        .select({
            id: invoices.id,
            invoice_number: invoices.invoice_number,
            invoice_date: invoices.invoice_date,
            due_date: invoices.due_date,
            status: invoices.status,
            total: invoices.total,
            balance_due: invoices.balance_due,
            customer_name: customers.name,
            customer_company: customers.company_name,
        })
        .from(invoices)
        .leftJoin(customers, eq(invoices.customer_id, customers.id))
        .where(eq(invoices.org_id, orgId))
        .orderBy(invoices.invoice_date);

    return {
        invoices: invoiceList.reverse() // Most recent first
    };
};
