import { fail, redirect } from '@sveltejs/kit';
import { localDateStr } from '$lib/utils/date';
import { db } from '$lib/server/db';
import { customers, items, organizations } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { setFlash } from '$lib/server/flash';
import { logActivity } from '$lib/server/services';
import { peekNextNumber } from '$lib/server/services/number-series';
import { runInTx } from '$lib/server/platform/db/tx';
import { failActionFromError } from '$lib/server/platform/errors';
import {
    createQuotationInTx,
    parseQuotationLineItemsFromFormData,
    parsePricesIncludeGst
} from '$lib/server/modules/quotations/workflows';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.user) redirect(302, '/login');

    const orgId = locals.user.orgId;
    const today = localDateStr();
    const validUntil = localDateStr(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));

    const [customerList, org, catalogItems, autoQuotationNumber] = await Promise.all([
        db.query.customers.findMany({
            where: eq(customers.org_id, orgId),
            columns: {
                id: true, name: true, company_name: true, email: true, phone: true,
                billing_address: true, city: true, state_code: true, pincode: true,
                gstin: true, gst_treatment: true
            },
        }),
        db.query.organizations.findFirst({
            where: eq(organizations.id, orgId),
            columns: {
                state_code: true,
                pricesIncludeGst: true,
                invoice_terms_default: true // use same terms default for quotations
            },
        }),
        db.select({
            id: items.id, type: items.type, name: items.name,
            description: items.description, hsn_code: items.hsn_code,
            gst_rate: items.gst_rate, rate: items.rate, unit: items.unit,
        }).from(items).where(and(eq(items.org_id, orgId), eq(items.is_active, true))),
        peekNextNumber(orgId, 'quotation')
    ]);

    return {
        customers: customerList,
        catalogItems,
        orgStateCode: org?.state_code || '',
        orgPricesIncludeGst: org?.pricesIncludeGst || false,
        autoQuotationNumber,
        defaults: {
            quotation_date: today,
            valid_until: validUntil,
            terms: org?.invoice_terms_default || ''
        }
    };
};

export const actions: Actions = {
    default: async (event) => {
        if (!event.locals.user) return fail(401, { error: 'Unauthorized' });

        const formData = await event.request.formData();
        const orgId = event.locals.user.orgId;
        const userId = event.locals.user.id;

        const customer_id = formData.get('customer_id') as string;
        const quotation_date = formData.get('quotation_date') as string;
        const valid_until = formData.get('valid_until') as string;
        const subject = formData.get('subject') as string;
        const reference_number = formData.get('reference_number') as string;
        const notes = formData.get('notes') as string;
        const terms = formData.get('terms') as string;
        const intent = (formData.get('intent') as string || 'draft').trim();
        const requestedPricesIncludeGst = parsePricesIncludeGst(formData);

        if (!customer_id) return fail(400, { error: 'Customer is required' });
        if (!quotation_date) return fail(400, { error: 'Quotation date is required' });
        if (!valid_until) return fail(400, { error: 'Valid until date is required' });

        const lineItems = parseQuotationLineItemsFromFormData(formData);
        if (lineItems.length === 0) return fail(400, { error: 'At least one item is required' });

        const isSend = intent === 'send';
        let createdId = '';
        let quotationNumber = '';

        try {
            await runInTx(async (tx) => {
                const result = await createQuotationInTx(tx, {
                    orgId,
                    userId,
                    customerId: customer_id,
                    quotationDate: quotation_date,
                    validUntil: valid_until,
                    subject: subject || null,
                    referenceNumber: reference_number || null,
                    notes: notes || null,
                    terms: terms || null,
                    send: isSend,
                    requestedPricesIncludeGst,
                    lineItems
                });

                createdId = result.quotationId;
                quotationNumber = result.quotationNumber;
            });

            void logActivity({
                orgId, userId,
                entityType: 'quotation',
                entityId: createdId,
                action: isSend ? 'sent' : 'created',
                changedFields: {
                    quotation_number: { new: quotationNumber },
                    status: { new: isSend ? 'sent' : 'draft' }
                }
            });
        } catch (e) {
            return failActionFromError(e, 'Quotation creation failed');
        }

        setFlash(event.cookies, {
            type: 'success',
            message: isSend ? 'Quotation sent.' : 'Quotation saved as draft.'
        });

        redirect(302, `/quotations/${createdId}`);
    }
};
