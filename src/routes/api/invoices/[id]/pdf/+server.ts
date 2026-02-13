import { db } from '$lib/server/db';
import { invoices, invoice_items, customers, organizations } from '$lib/server/db/schema';
import { buildInvoiceDocDefinition } from '$lib/pdf/invoice-template';
import { generatePdfBuffer } from '$lib/pdf/generate';
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
		const doc = buildInvoiceDocDefinition({ org: org ?? null, invoice, items, customer: customer ?? null });
		const pdf = await generatePdfBuffer(doc);

		const filename = `${invoice.invoice_number}.pdf`;

		return new Response(pdf as BodyInit, {
			headers: {
				'Content-Type': 'application/pdf',
				'Content-Disposition': `attachment; filename="${filename}"`
			}
		});
	} catch (error: unknown) {
		console.error('PDF generation error:', error);
		return new Response('Failed to generate invoice PDF', {
			status: 500
		});
	}
};
