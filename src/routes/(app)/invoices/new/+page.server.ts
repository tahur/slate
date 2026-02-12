import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import {
    customers,
    invoices,
    invoice_items,
    items,
    organizations
} from '$lib/server/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { calculateLineItem, calculateInvoiceTotals, type LineItem, GST_RATES } from './schema';
import { setFlash } from '$lib/server/flash';
import { postInvoiceIssuance, logActivity } from '$lib/server/services';
import { bumpNumberSeriesIfHigher, getNextNumber, peekNextNumber } from '$lib/server/services/number-series';
import { checkIdempotency, generateIdempotencyKey } from '$lib/server/utils/idempotency';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.user) {
        redirect(302, '/login');
    }

    const orgId = locals.user.orgId;

    // Fetch customers for dropdown
    const customerList = await db.query.customers.findMany({
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
        columns: { state_code: true, pricesIncludeGst: true },
    });

    // Fetch active catalog items
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

    // Default dates
    const today = new Date().toISOString().split('T')[0];
    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const autoInvoiceNumber = await peekNextNumber(orgId, 'invoice');

    // Generate idempotency key to prevent duplicate submissions
    const idempotencyKey = generateIdempotencyKey();

    return {
        customers: customerList,
        catalogItems,
        orgStateCode: org?.state_code || '',
        orgPricesIncludeGst: org?.pricesIncludeGst || false,
        autoInvoiceNumber,
        idempotencyKey,
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
        const orgId = event.locals.user.orgId;

        // Check idempotency to prevent duplicate submissions
        const idempotencyKey = formData.get('idempotency_key') as string;
        const { isDuplicate, existingRecord } = await checkIdempotency<typeof invoices.$inferSelect>(
            'invoices',
            orgId,
            idempotencyKey
        );

        if (isDuplicate && existingRecord) {
            // Return existing invoice instead of creating duplicate
            redirect(302, `/invoices/${existingRecord.id}`);
        }

        // Parse form data
        const customer_id = formData.get('customer_id') as string;
        const invoice_date = formData.get('invoice_date') as string;
        const due_date = formData.get('due_date') as string;
        const order_number = formData.get('order_number') as string;
        const notes = formData.get('notes') as string;
        const terms = formData.get('terms') as string;
        const intent = (formData.get('intent') as string || 'draft').trim();
        const invoiceNumberMode = (formData.get('invoice_number_mode') as string || 'auto').trim();
        const providedInvoiceNumber = (formData.get('invoice_number') as string || '').trim();
        const pricesIncludeGst = formData.get('prices_include_gst') === 'true';


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
        const lineItems: LineItem[] = [];
        let i = 0;
        while (formData.has(`items[${i}].description`)) {
            const description = formData.get(`items[${i}].description`) as string;
            const hsn_code = formData.get(`items[${i}].hsn_code`) as string || '';
            const quantity = parseFloat(formData.get(`items[${i}].quantity`) as string) || 1;
            const unit = formData.get(`items[${i}].unit`) as string || 'nos';
            const rate = parseFloat(formData.get(`items[${i}].rate`) as string) || 0;
            const gst_rate = parseFloat(formData.get(`items[${i}].gst_rate`) as string) || 18;
            const item_id = formData.get(`items[${i}].item_id`) as string || '';

            if (description && description.trim()) {
                lineItems.push({ description, hsn_code, quantity, unit, rate, gst_rate, item_id: item_id || undefined });
            }
            i++;
        }

        if (lineItems.length === 0) {
            return fail(400, { error: 'At least one item with a description is required' });
        }

        const isIssue = intent === 'issue';




        let createdInvoiceId = '';
        let invoiceNumber = providedInvoiceNumber;

        // Pre-fetch customer and org for inter-state calculation (read-only, can be outside transaction)
        const customer = await db.query.customers.findFirst({
            where: eq(customers.id, customer_id),
            columns: { state_code: true },
        });

        const org = await db.query.organizations.findFirst({
            where: eq(organizations.id, orgId),
            columns: { state_code: true },
        });

        const isInterState = customer?.state_code !== org?.state_code;
        const totals = calculateInvoiceTotals(lineItems, isInterState, pricesIncludeGst);

        // Handle manual invoice number mode (outside transaction - user explicitly chose the number)
        if (invoiceNumberMode === 'manual') {
            if (!invoiceNumber) {
                return fail(400, { error: 'Invoice number is required' });
            }
            const duplicate = await db
                .select({ id: invoices.id })
                .from(invoices)
                .where(
                    and(
                        eq(invoices.org_id, orgId),
                        eq(invoices.invoice_number, invoiceNumber)
                    )
                )
                .get();

            if (duplicate) {
                return fail(400, { error: 'Invoice number already exists' });
            }

            await bumpNumberSeriesIfHigher(orgId, 'invoice', invoiceNumber);
        }

        try {
            const invoiceId = crypto.randomUUID();
            createdInvoiceId = invoiceId;

            // Auto-generate invoice number (only after all validation passes)
            if (invoiceNumberMode !== 'manual') {
                if (isIssue) {
                    invoiceNumber = await getNextNumber(orgId, 'invoice');

                    // Check for duplicate (shouldn't happen but safety check)
                    const duplicate = await db
                        .select({ id: invoices.id })
                        .from(invoices)
                        .where(
                            and(
                                eq(invoices.org_id, orgId),
                                eq(invoices.invoice_number, invoiceNumber)
                            )
                        )
                        .get();

                    if (duplicate) {
                        return fail(400, { error: 'Invoice number already exists' });
                    }
                } else {
                    // Drafts get a temporary number — no sequential number consumed
                    invoiceNumber = `DRAFT-${invoiceId.substring(0, 8).toUpperCase()}`;
                }
            }

            // Insert invoice
            await db.insert(invoices).values({
                id: invoiceId,
                org_id: orgId,
                customer_id: customer_id,
                invoice_number: invoiceNumber,
                invoice_date: invoice_date,
                due_date: due_date,
                order_number: order_number || null,
                status: isIssue ? 'issued' : 'draft',
                subtotal: totals.subtotal,
                taxable_amount: totals.taxableAmount,
                cgst: totals.cgst,
                sgst: totals.sgst,
                igst: totals.igst,
                total: totals.total,
                balance_due: totals.total,
                is_inter_state: isInterState,
                prices_include_gst: pricesIncludeGst,
                notes: notes || null,
                terms: terms || null,
                journal_entry_id: null,
                idempotency_key: idempotencyKey || null,
                issued_at: isIssue ? new Date().toISOString() : null,
                created_by: event.locals.user.id,
                updated_by: event.locals.user.id,
            });

            // Insert line items
            for (let idx = 0; idx < lineItems.length; idx++) {
                const item = lineItems[idx];
                const calc = calculateLineItem(item, isInterState, pricesIncludeGst);

                await db.insert(invoice_items).values({
                    id: crypto.randomUUID(),
                    invoice_id: invoiceId,
                    item_id: item.item_id || null,
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


            // Post-transaction operations (only if invoice was saved successfully)
            if (isIssue) {
                const postingResult = await postInvoiceIssuance(orgId, {
                    invoiceId: createdInvoiceId,
                    invoiceNumber,
                    date: invoice_date,
                    customerId: customer_id,
                    subtotal: totals.subtotal,
                    cgst: totals.cgst,
                    sgst: totals.sgst,
                    igst: totals.igst,
                    total: totals.total,
                    userId: event.locals.user.id
                });

                // Update invoice with journal entry ID
                if (postingResult?.journalEntryId) {
                    await db
                        .update(invoices)
                        .set({ journal_entry_id: postingResult.journalEntryId })
                        .where(eq(invoices.id, createdInvoiceId));
                }

                // Update customer balance
                await db
                    .update(customers)
                    .set({
                        balance: sql`${customers.balance} + ${totals.total}`,
                        updated_at: new Date().toISOString()
                    })
                    .where(eq(customers.id, customer_id));
            }

            // Log activity
            await logActivity({
                orgId,
                userId: event.locals.user.id,
                entityType: 'invoice',
                entityId: createdInvoiceId,
                action: isIssue ? 'issued' : 'created',
                changedFields: {
                    invoice_number: { new: invoiceNumber },
                    total: { new: totals.total },
                    status: { new: isIssue ? 'issued' : 'draft' }
                }
            });

        } catch (e) {
            console.error('Invoice creation error:', e);
            return fail(500, { error: 'Failed to create invoice' });
        }


        const message = isIssue
            ? 'Invoice issued successfully.'
            : 'Invoice saved as draft.';

        setFlash(event.cookies, {
            type: 'success',
            message
        });
        const redirectUrl = `/invoices/${createdInvoiceId}`;
        redirect(302, redirectUrl);
    }
};
