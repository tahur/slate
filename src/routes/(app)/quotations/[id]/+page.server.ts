import { redirect, fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { quotations, quotation_items, customers, organizations } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import type { PageServerLoad, Actions } from './$types';
import { logActivity } from '$lib/server/services';
import { runInTx } from '$lib/server/platform/db/tx';
import { failActionFromError } from '$lib/server/platform/errors';
import { setFlash } from '$lib/server/flash';
import {
    sendQuotation,
    acceptQuotation,
    declineQuotation,
    deleteQuotation,
    convertQuotationToInvoiceInTx
} from '$lib/server/modules/quotations/workflows';
import { localDateStr } from '$lib/utils/date';

export const load: PageServerLoad = async ({ locals, params }) => {
    if (!locals.user) redirect(302, '/login');

    const orgId = locals.user.orgId;
    const quotationId = params.id;

    const quotation = await db.query.quotations.findFirst({
        where: and(
            eq(quotations.id, quotationId),
            eq(quotations.org_id, orgId)
        )
    });

    if (!quotation) redirect(302, '/quotations');

    const [items, customer, org] = await Promise.all([
        db.query.quotation_items.findMany({
            where: eq(quotation_items.quotation_id, quotationId),
            orderBy: quotation_items.sort_order
        }),
        db.query.customers.findFirst({
            where: eq(customers.id, quotation.customer_id)
        }),
        db.query.organizations.findFirst({
            where: eq(organizations.id, orgId)
        })
    ]);

    return { quotation, items, customer, org };
};

export const actions: Actions = {
    send: async ({ locals, params }) => {
        if (!locals.user) return fail(401);
        const orgId = locals.user.orgId;

        try {
            await sendQuotation(orgId, params.id);
            void logActivity({
                orgId, userId: locals.user.id,
                entityType: 'quotation', entityId: params.id,
                action: 'sent', changedFields: { status: { old: 'draft', new: 'sent' } }
            });
            return { success: true };
        } catch (e) {
            return failActionFromError(e, 'Send failed');
        }
    },

    accept: async ({ locals, params }) => {
        if (!locals.user) return fail(401);
        const orgId = locals.user.orgId;

        try {
            await acceptQuotation(orgId, params.id);
            void logActivity({
                orgId, userId: locals.user.id,
                entityType: 'quotation', entityId: params.id,
                action: 'accepted', changedFields: { status: { new: 'accepted' } }
            });
            return { success: true };
        } catch (e) {
            return failActionFromError(e, 'Accept failed');
        }
    },

    decline: async ({ locals, params }) => {
        if (!locals.user) return fail(401);
        const orgId = locals.user.orgId;

        try {
            await declineQuotation(orgId, params.id);
            void logActivity({
                orgId, userId: locals.user.id,
                entityType: 'quotation', entityId: params.id,
                action: 'declined', changedFields: { status: { new: 'declined' } }
            });
            return { success: true };
        } catch (e) {
            return failActionFromError(e, 'Decline failed');
        }
    },

    convert: async ({ locals, params, cookies }) => {
        if (!locals.user) return fail(401);
        const orgId = locals.user.orgId;
        const today = localDateStr();
        const dueDate = localDateStr(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));

        let invoiceId = '';

        try {
            await runInTx(async (tx) => {
                const result = await convertQuotationToInvoiceInTx(tx, {
                    orgId,
                    userId: locals.user!.id,
                    quotationId: params.id,
                    invoiceDate: today,
                    dueDate
                });
                invoiceId = result.invoiceId;
            });

            void logActivity({
                orgId, userId: locals.user.id,
                entityType: 'quotation', entityId: params.id,
                action: 'converted', changedFields: { converted_invoice_id: { new: invoiceId } }
            });
        } catch (e) {
            return failActionFromError(e, 'Conversion failed');
        }

        setFlash(cookies, {
            type: 'success',
            message: 'Quotation converted to invoice.'
        });

        redirect(302, `/invoices/${invoiceId}`);
    },

    delete: async ({ locals, params, cookies }) => {
        if (!locals.user) return fail(401);
        const orgId = locals.user.orgId;

        const quotation = await db.query.quotations.findFirst({
            where: and(eq(quotations.id, params.id), eq(quotations.org_id, orgId))
        });

        if (!quotation) return fail(404, { error: 'Quotation not found' });
        if (quotation.status !== 'draft') return fail(400, { error: 'Only draft quotations can be deleted' });

        try {
            await deleteQuotation(orgId, params.id);
            void logActivity({
                orgId, userId: locals.user.id,
                entityType: 'quotation', entityId: params.id,
                action: 'deleted', changedFields: { quotation_number: { old: quotation.quotation_number } }
            });
        } catch (e) {
            return failActionFromError(e, 'Delete failed');
        }

        setFlash(cookies, { type: 'success', message: 'Quotation deleted.' });
        redirect(302, '/quotations');
    }
};
