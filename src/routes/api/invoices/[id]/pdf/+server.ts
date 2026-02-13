import { db } from '$lib/server/db';
import { invoices, invoice_items, customers, organizations } from '$lib/server/db/schema';
import { buildInvoiceDocDefinition } from '$lib/pdf/invoice-template';
import { generatePdfBuffer } from '$lib/pdf/generate';
import { eq, and } from 'drizzle-orm';
import {
	NotFoundError,
	UnauthorizedError,
	jsonFromError
} from '$lib/server/platform/errors';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals }) => {
	try {
		if (!locals.user) {
			throw new UnauthorizedError();
		}

		const orgId = locals.user.orgId;

		const invoice = await db.query.invoices.findFirst({
			where: and(eq(invoices.id, params.id), eq(invoices.org_id, orgId))
		});

		if (!invoice) {
			throw new NotFoundError('Invoice not found');
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

		const doc = buildInvoiceDocDefinition({ org: org ?? null, invoice, items, customer: customer ?? null });
		const pdf = await generatePdfBuffer(doc);

		const filename = `${invoice.invoice_number}.pdf`;

		return new Response(pdf as BodyInit, {
			headers: {
				'Content-Type': 'application/pdf',
				'Content-Disposition': `attachment; filename="${filename}"`
			}
		});
	} catch (error) {
		return jsonFromError(error, 'Invoice PDF generation failed');
	}
};
