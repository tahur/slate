import { fail, redirect } from '@sveltejs/kit';
import { localDateStr } from '$lib/utils/date';
import { db } from '$lib/server/db';
import {
    customers,
    invoices,
    invoice_items,
    items,
    organizations
} from '$lib/server/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { setFlash } from '$lib/server/flash';
import { logActivity } from '$lib/server/services';
import { peekNextNumber } from '$lib/server/services/number-series';
import { checkIdempotency, generateIdempotencyKey } from '$lib/server/utils/idempotency';
import { isIdempotencyConstraintError, isUniqueConstraintOnColumns } from '$lib/server/utils/sqlite-errors';
import { runInTx } from '$lib/server/platform/db/tx';
import { failActionFromError } from '$lib/server/platform/errors';
import {
    createInvoiceInTx,
    parseInvoiceLineItemsFromFormData,
    parsePricesIncludeGst
} from '$lib/server/modules/invoicing/application/workflows';
import { invalidateReportingCacheForOrg } from '$lib/server/modules/reporting/application/gst-reports';
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

    // Default dates (local timezone)
    const today = localDateStr();
    const dueDate = localDateStr(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
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
        const userId = event.locals.user.id;

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
        const requestedPricesIncludeGst = parsePricesIncludeGst(formData);


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

        const lineItems = parseInvoiceLineItemsFromFormData(formData);

        if (lineItems.length === 0) {
            return fail(400, { error: 'At least one item with a description is required' });
        }

        const isIssue = intent === 'issue';

        let createdInvoiceId = '';
        let invoiceNumber = providedInvoiceNumber;
        let createdTotal = 0;

        try {
            runInTx((tx) => {
                const result = createInvoiceInTx(tx, {
                    orgId,
                    userId,
                    customerId: customer_id,
                    invoiceDate: invoice_date,
                    dueDate: due_date,
                    orderNumber: order_number || null,
                    notes: notes || null,
                    terms: terms || null,
                    issue: isIssue,
                    invoiceNumberMode: invoiceNumberMode === 'manual' ? 'manual' : 'auto',
                    providedInvoiceNumber,
                    requestedPricesIncludeGst,
                    idempotencyKey: idempotencyKey || null,
                    lineItems
                });

                createdInvoiceId = result.invoiceId;
                invoiceNumber = result.invoiceNumber;
                createdTotal = result.total;
            });

            // Log activity (outside transaction — non-critical, fire-and-forget)
            await logActivity({
                orgId,
                userId,
                entityType: 'invoice',
                entityId: createdInvoiceId,
                action: isIssue ? 'issued' : 'created',
                changedFields: {
                    invoice_number: { new: invoiceNumber },
                    total: { new: createdTotal },
                    status: { new: isIssue ? 'issued' : 'draft' }
                }
            });

        } catch (e) {
            if (idempotencyKey && isIdempotencyConstraintError(e, 'invoices')) {
                const duplicate = await checkIdempotency<typeof invoices.$inferSelect>('invoices', orgId, idempotencyKey);
                if (duplicate.isDuplicate && duplicate.existingRecord) {
                    redirect(302, `/invoices/${duplicate.existingRecord.id}`);
                }
            }

            if (isUniqueConstraintOnColumns(e, 'invoices', ['org_id', 'invoice_number'])) {
                return fail(409, { error: 'Invoice number already exists' });
            }

            return failActionFromError(e, 'Invoice creation failed');
        }


        const message = isIssue
            ? 'Invoice issued successfully.'
            : 'Invoice saved as draft.';

        if (isIssue) {
            invalidateReportingCacheForOrg(orgId);
        }

        setFlash(event.cookies, {
            type: 'success',
            message
        });
        const redirectUrl = `/invoices/${createdInvoiceId}`;
        redirect(302, redirectUrl);
    }
};
