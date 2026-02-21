import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { invoices, invoice_items, customers, organizations, items } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
    if (!locals.user) {
        redirect(302, '/login');
    }

    const invoiceId = params.id;
    const orgId = locals.user.orgId;

    // Fetch invoice
    const invoiceRows = await db
        .select()
        .from(invoices)
        .where(and(eq(invoices.id, invoiceId), eq(invoices.org_id, orgId)))
        .limit(1);
    const invoice = invoiceRows[0];

    if (!invoice) {
        redirect(302, '/invoices');
    }

    // Only drafts can be edited
    if (invoice.status !== 'draft') {
        redirect(302, `/invoices/${invoiceId}`);
    }

    // Fetch line items
    const lineItems = await db
        .select()
        .from(invoice_items)
        .where(eq(invoice_items.invoice_id, invoiceId))
        .orderBy(invoice_items.sort_order);

    // Fetch all customers for dropdown
    const allCustomers = await db.query.customers.findMany({
        where: eq(customers.org_id, orgId),
        columns: {
            id: true,
            name: true,
            company_name: true,
            email: true,
            phone: true,
            billing_address: true,
            city: true,
            state_code: true,
            pincode: true,
            gstin: true,
            gst_treatment: true
        },
    });

    // Fetch org state for GST calculation
    const org = await db.query.organizations.findFirst({
        where: eq(organizations.id, orgId),
        columns: { state_code: true },
    });

    // Fetch active catalog items for combobox
    const catalogItems = await db
        .select({
            id: items.id,
            type: items.type,
            name: items.name,
            description: items.description,
            hsn_code: items.hsn_code,
            gst_rate: items.gst_rate,
            rate: items.rate,
            unit: items.unit,
        })
        .from(items)
        .where(and(eq(items.org_id, orgId), eq(items.is_active, true)));

    return {
        invoice,
        lineItems,
        customers: allCustomers,
        catalogItems,
        orgStateCode: org?.state_code || '',
    };
};
