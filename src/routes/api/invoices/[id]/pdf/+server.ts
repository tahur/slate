import { db } from '$lib/server/db';
import { invoices, invoice_items, customers, organizations } from '$lib/server/db/schema';
import { renderInvoiceHtml, renderPdf } from '$lib/server/services/pdf';
import { eq, and } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals }) => {
    if (!locals.user) {
        return new Response('Unauthorized', { status: 401 });
    }

    const orgId = locals.user.orgId;

    const invoice = await db.query.invoices.findFirst({
        where: and(eq(invoices.id, params.id), eq(invoices.org_id, orgId))
    });

    if (!invoice) {
        return new Response('Invoice not found', { status: 404 });
    }

    const items = await db.query.invoice_items.findMany({
        where: eq(invoice_items.invoice_id, invoice.id),
        orderBy: invoice_items.sort_order
    });

    const customer = await db.query.customers.findFirst({
        where: eq(customers.id, invoice.customer_id)
    });

    const org = await db.query.organizations.findFirst({
        where: eq(organizations.id, orgId)
    });

    try {
        const html = renderInvoiceHtml({ org, invoice, items, customer });
        const pdf = await renderPdf(html);

        const filename = `${invoice.invoice_number}.pdf`;

        return new Response(pdf, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `inline; filename="${filename}"`
            }
        });
    } catch (error: any) {
        console.error('PDF Generation Error:', error);
        return new Response(`PDF Generation Failed: ${error.message}\n${error.stack}`, { status: 500 });
    }
};
