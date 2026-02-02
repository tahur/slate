import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { customers, invoices, invoice_items, organizations } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { calculateLineItem, calculateInvoiceTotals, type LineItem, GST_RATES } from './schema';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.user) {
        redirect(302, '/login');
    }

    const orgId = locals.user.orgId;

    // Fetch customers for dropdown
    const customerList = await db.query.customers.findMany({
        where: eq(customers.org_id, orgId),
        columns: { id: true, name: true, company_name: true, state_code: true, gst_treatment: true },
    });

    // Fetch org state for GST calculation
    const org = await db.query.organizations.findFirst({
        where: eq(organizations.id, orgId),
        columns: { state_code: true },
    });

    // Default dates
    const today = new Date().toISOString().split('T')[0];
    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Return data without using superforms for nested arrays
    return {
        customers: customerList,
        orgStateCode: org?.state_code || '',
        defaults: {
            invoice_date: today,
            due_date: dueDate,
        }
    };
};

export const actions: Actions = {
    default: async (event) => {
        if (!event.locals.user) {
            return fail(401, { error: 'Unauthorized' });
        }

        const formData = await event.request.formData();

        // Parse form data
        const customer_id = formData.get('customer_id') as string;
        const invoice_date = formData.get('invoice_date') as string;
        const due_date = formData.get('due_date') as string;
        const order_number = formData.get('order_number') as string;
        const notes = formData.get('notes') as string;
        const terms = formData.get('terms') as string;

        // Validation
        if (!customer_id) {
            return fail(400, { error: 'Customer is required' });
        }
        if (!invoice_date) {
            return fail(400, { error: 'Invoice date is required' });
        }
        if (!due_date) {
            return fail(400, { error: 'Due date is required' });
        }

        // Parse line items from form data
        const items: LineItem[] = [];
        let i = 0;
        while (formData.has(`items[${i}].description`)) {
            const description = formData.get(`items[${i}].description`) as string;
            const hsn_code = formData.get(`items[${i}].hsn_code`) as string || '';
            const quantity = parseFloat(formData.get(`items[${i}].quantity`) as string) || 1;
            const unit = formData.get(`items[${i}].unit`) as string || 'nos';
            const rate = parseFloat(formData.get(`items[${i}].rate`) as string) || 0;
            const gst_rate = parseFloat(formData.get(`items[${i}].gst_rate`) as string) || 18;

            if (description && description.trim()) {
                items.push({ description, hsn_code, quantity, unit, rate, gst_rate });
            }
            i++;
        }

        if (items.length === 0) {
            return fail(400, { error: 'At least one item with a description is required' });
        }

        try {
            const orgId = event.locals.user.orgId;
            const invoiceId = crypto.randomUUID();

            // Get customer to determine inter-state
            const customer = await db.query.customers.findFirst({
                where: eq(customers.id, customer_id),
                columns: { state_code: true },
            });

            const org = await db.query.organizations.findFirst({
                where: eq(organizations.id, orgId),
                columns: { state_code: true },
            });

            const isInterState = customer?.state_code !== org?.state_code;

            // Calculate totals
            const totals = calculateInvoiceTotals(items, isInterState);

            // Generate draft invoice number
            const existingInvoices = await db.select({ id: invoices.id }).from(invoices).where(eq(invoices.org_id, orgId));
            const count = existingInvoices.length;
            const fy = new Date().getFullYear();
            const invoiceNumber = `DRAFT-${fy}-${String(count + 1).padStart(4, '0')}`;

            // Insert invoice
            await db.insert(invoices).values({
                id: invoiceId,
                org_id: orgId,
                customer_id: customer_id,
                invoice_number: invoiceNumber,
                invoice_date: invoice_date,
                due_date: due_date,
                order_number: order_number || null,
                status: 'draft',
                subtotal: totals.subtotal,
                taxable_amount: totals.subtotal,
                cgst: totals.cgst,
                sgst: totals.sgst,
                igst: totals.igst,
                total: totals.total,
                balance_due: totals.total,
                is_inter_state: isInterState,
                notes: notes || null,
                terms: terms || null,
                created_by: event.locals.user.id,
                updated_by: event.locals.user.id,
            });

            // Insert line items
            for (let idx = 0; idx < items.length; idx++) {
                const item = items[idx];
                const calc = calculateLineItem(item, isInterState);

                await db.insert(invoice_items).values({
                    id: crypto.randomUUID(),
                    invoice_id: invoiceId,
                    description: item.description,
                    hsn_code: item.hsn_code || null,
                    quantity: item.quantity,
                    unit: item.unit,
                    rate: item.rate,
                    gst_rate: item.gst_rate,
                    cgst: calc.cgst,
                    sgst: calc.sgst,
                    igst: calc.igst,
                    amount: calc.amount,
                    total: calc.total,
                    sort_order: idx,
                });
            }

        } catch (e) {
            console.error('Invoice creation error:', e);
            return fail(500, { error: 'Failed to create invoice' });
        }

        redirect(302, '/invoices');
    }
};
