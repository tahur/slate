import { redirect, fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import {
    invoices,
    invoice_items,
    customers,
    organizations,
    customer_advances,
    credit_notes,
    credit_allocations,
    payments,
    payment_allocations
} from '$lib/server/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import type { PageServerLoad, Actions } from './$types';
import { logActivity } from '$lib/server/services';
import { runInTx } from '$lib/server/platform/db/tx';
import { failActionFromError } from '$lib/server/platform/errors';
import {
    cancelInvoiceInTx,
    deleteDraftInvoiceInTx,
    issueDraftInvoiceInTx,
    parseInvoiceLineItemsFromFormData,
    parsePricesIncludeGst,
    updateDraftInvoiceInTx
} from '$lib/server/modules/invoicing/application/workflows';
import {
    applyCreditsToInvoiceInTx,
    MONEY_EPSILON,
    parseRequestedCredits,
    recordInvoicePaymentInTx,
    settleInvoiceInTx,
    type RequestedCredit
} from '$lib/server/modules/receivables/application/workflows';
import { invalidateReportingCacheForOrg } from '$lib/server/modules/reporting/application/gst-reports';
import { listPaymentOptionsForForm } from '$lib/server/modules/receivables/infra/queries';
import { seedPaymentConfiguration } from '$lib/server/seed';
import { round2 } from '$lib/utils/currency';

export const load: PageServerLoad = async ({ locals, params, url }) => {
    if (!locals.user) {
        redirect(302, '/login');
    }

    const orgId = locals.user.orgId;
    const invoiceId = params.id;

    const invoice = await db.query.invoices.findFirst({
        where: and(
            eq(invoices.id, invoiceId),
            eq(invoices.org_id, orgId)
        )
    });

    if (!invoice) {
        redirect(302, '/invoices');
    }

    const justRecordedPayment = url.searchParams.get('payment') === 'recorded';
    const [items, customer, org, advances, cnList, paymentAllocations, creditAllocations] = await Promise.all([
        db.query.invoice_items.findMany({
            where: eq(invoice_items.invoice_id, invoiceId),
            orderBy: invoice_items.sort_order
        }),
        db.query.customers.findFirst({
            where: eq(customers.id, invoice.customer_id)
        }),
        db.query.organizations.findFirst({
            where: eq(organizations.id, orgId)
        }),
        db
            .select({
                id: customer_advances.id,
                amount: customer_advances.balance,
                date: customer_advances.created_at,
                number: payments.payment_number
            })
            .from(customer_advances)
            .leftJoin(payments, eq(customer_advances.payment_id, payments.id))
            .where(
                and(
                    eq(customer_advances.org_id, orgId),
                    eq(customer_advances.customer_id, invoice.customer_id),
                    gt(customer_advances.balance, MONEY_EPSILON)
                )
            ),
        db
            .select({
                id: credit_notes.id,
                amount: credit_notes.balance,
                date: credit_notes.credit_note_date,
                number: credit_notes.credit_note_number
            })
            .from(credit_notes)
            .where(
                and(
                    eq(credit_notes.org_id, orgId),
                    eq(credit_notes.customer_id, invoice.customer_id),
                    eq(credit_notes.status, 'issued'),
                    gt(credit_notes.balance, MONEY_EPSILON)
                )
            ),
        db
            .select({
                id: payment_allocations.id,
                amount: payment_allocations.amount,
                date: payments.payment_date,
                number: payments.payment_number,
                mode: payments.payment_mode
            })
            .from(payment_allocations)
            .innerJoin(payments, eq(payment_allocations.payment_id, payments.id))
            .where(eq(payment_allocations.invoice_id, invoiceId)),
        db
            .select({
                id: credit_allocations.id,
                amount: credit_allocations.amount,
                credit_note_id: credit_allocations.credit_note_id,
                advance_id: credit_allocations.advance_id,
                created_at: credit_allocations.created_at,
                cn_number: credit_notes.credit_note_number,
                cn_date: credit_notes.credit_note_date,
                adv_date: customer_advances.created_at,
                adv_payment_number: payments.payment_number
            })
            .from(credit_allocations)
            .leftJoin(credit_notes, eq(credit_allocations.credit_note_id, credit_notes.id))
            .leftJoin(customer_advances, eq(credit_allocations.advance_id, customer_advances.id))
            .leftJoin(payments, eq(customer_advances.payment_id, payments.id))
            .where(eq(credit_allocations.invoice_id, invoiceId))
    ]);

    const availableCredits = [
        ...advances.map((a) => ({ ...a, type: 'advance' as const })),
        ...cnList.map((c) => ({ ...c, type: 'credit_note' as const }))
    ];

    const enrichedCreditAllocations = creditAllocations.map((ca) => {
        if (ca.credit_note_id) {
            return {
                id: ca.id,
                amount: ca.amount,
                credit_note_id: ca.credit_note_id,
                advance_id: ca.advance_id,
                created_at: ca.created_at,
                type: 'credit_note' as const,
                number: ca.cn_number || 'Unknown',
                date: ca.cn_date || ca.created_at
            };
        }

        if (ca.advance_id) {
            return {
                id: ca.id,
                amount: ca.amount,
                credit_note_id: ca.credit_note_id,
                advance_id: ca.advance_id,
                created_at: ca.created_at,
                type: 'advance' as const,
                number: ca.adv_payment_number || 'Advance',
                date: ca.adv_date || ca.created_at
            };
        }

        return {
            id: ca.id,
            amount: ca.amount,
            credit_note_id: ca.credit_note_id,
            advance_id: ca.advance_id,
            created_at: ca.created_at,
            type: 'unknown' as const,
            number: 'Unknown',
            date: ca.created_at
        };
    });

    // Combine all transactions for payment history
    const paymentHistory = [
        ...paymentAllocations.map(p => ({
            id: p.id,
            type: 'payment' as const,
            amount: p.amount,
            date: p.date,
            reference: p.number,
            mode: p.mode
        })),
        ...enrichedCreditAllocations.map(c => ({
            id: c.id,
            type: c.type,
            amount: c.amount,
            date: c.date,
            reference: c.number,
            mode: null
        }))
    ].sort((a, b) => new Date(a.date || '').getTime() - new Date(b.date || '').getTime());

    let paymentOptions = await listPaymentOptionsForForm(orgId);
    if (paymentOptions.length === 0) {
        await seedPaymentConfiguration(orgId);
        paymentOptions = await listPaymentOptionsForForm(orgId);
    }

    return {
        invoice,
        items,
        customer,
        org,
        justRecordedPayment,
        availableCredits,
        paymentHistory,
        paymentOptions
    };
};

export const actions: Actions = {
    issue: async ({ locals, params }) => {
        if (!locals.user) {
            return fail(401, { error: 'Unauthorized' });
        }

        const orgId = locals.user.orgId;
        const userId = locals.user.id;

        // Get the invoice (read-only, safe outside tx)
        const invoice = await db.query.invoices.findFirst({
            where: and(
                eq(invoices.id, params.id),
                eq(invoices.org_id, orgId)
            )
        });

        if (!invoice) {
            return fail(404, { error: 'Invoice not found' });
        }

        if (invoice.status !== 'draft') {
            return fail(400, { error: 'Only draft invoices can be issued' });
        }

        let invoiceNumber = invoice.invoice_number;

        try {
            await runInTx(async (tx) => {
                const result = await issueDraftInvoiceInTx(tx, orgId, userId, invoice);
                invoiceNumber = result.invoiceNumber;
            });

            // Log activity (outside tx)
            void logActivity({
                orgId,
                userId,
                entityType: 'invoice',
                entityId: params.id,
                action: 'issued',
                changedFields: {
                    status: { old: 'draft', new: 'issued' },
                    invoice_number: { new: invoiceNumber }
                }
            });

            invalidateReportingCacheForOrg(orgId);

            return { success: true, invoiceNumber };
        } catch (error) {
            return failActionFromError(error, 'Invoice issue failed');
        }
    },

    cancel: async ({ locals, params }) => {
        if (!locals.user) {
            return fail(401, { error: 'Unauthorized' });
        }

        const orgId = locals.user.orgId;

        const invoice = await db.query.invoices.findFirst({
            where: and(
                eq(invoices.id, params.id),
                eq(invoices.org_id, orgId)
            )
        });

        if (!invoice) {
            return fail(404, { error: 'Invoice not found' });
        }

        if (invoice.status === 'cancelled') {
            return fail(400, { error: 'Invoice is already cancelled' });
        }

        if (invoice.status === 'paid') {
            return fail(400, { error: 'Cannot cancel a paid invoice' });
        }

        if (invoice.status === 'partially_paid' || (invoice.amount_paid || 0) > MONEY_EPSILON) {
            return fail(400, { error: 'Cannot cancel an invoice with payments. Reverse settlement first.' });
        }

        try {
            const now = new Date().toISOString();

            await runInTx(async (tx) => {
                await cancelInvoiceInTx(tx, orgId, locals.user!.id, invoice, now);
            });

            void logActivity({
                orgId,
                userId: locals.user.id,
                entityType: 'invoice',
                entityId: params.id,
                action: 'cancelled',
                changedFields: {
                    status: { old: invoice.status, new: 'cancelled' }
                }
            });

            invalidateReportingCacheForOrg(orgId);

            return { success: true };
        } catch (error) {
            return failActionFromError(error, 'Invoice cancel failed');
        }
    },

    applyCredits: async ({ request, locals, params }) => {
        if (!locals.user) return fail(401);

        const data = await request.formData();
        let requestedCredits: RequestedCredit[] = [];
        try {
            requestedCredits = parseRequestedCredits(data.get('credits'));
        } catch (error) {
            return failActionFromError(error, 'Invoice credit parse failed');
        }

        if (requestedCredits.length === 0) {
            return fail(400, { error: 'No credits selected' });
        }

        const orgId = locals.user.orgId;
        const invoiceId = params.id;
        let totalApplied = 0;

        try {
            await runInTx(async (tx) => {
                const result = await applyCreditsToInvoiceInTx(tx, {
                    orgId,
                    invoiceId,
                    requestedCredits
                });
                totalApplied = result.totalApplied;
            });

            return { success: true, message: `Applied ${totalApplied.toFixed(2)} credits` };
        } catch (error) {
            return failActionFromError(error, 'Invoice credit apply failed');
        }
    },

    recordPayment: async ({ request, locals, params }) => {
        if (!locals.user) return fail(401);

        const orgId = locals.user.orgId;
        const invoiceId = params.id;
        const formData = await request.formData();

        const amount = round2(parseFloat(formData.get('amount') as string) || 0);
        const payment_date = formData.get('payment_date') as string;
        const payment_mode = formData.get('payment_mode') as string;
        const deposit_to = formData.get('deposit_to') as string;
        const reference = formData.get('reference') as string || '';

        // Validation
        if (amount <= 0) {
            return fail(400, { error: 'Amount must be positive' });
        }
        if (!payment_date) {
            return fail(400, { error: 'Payment date is required' });
        }
        if (!payment_mode) {
            return fail(400, { error: 'Payment method is required' });
        }
        if (!deposit_to) {
            return fail(400, { error: 'Deposit account is required' });
        }

        // Get invoice (read-only, safe outside tx)
        const invoice = await db.query.invoices.findFirst({
            where: and(eq(invoices.id, invoiceId), eq(invoices.org_id, orgId))
        });

        if (!invoice) return fail(404, { error: 'Invoice not found' });
        if (invoice.status === 'paid' || invoice.status === 'cancelled') {
            return fail(400, { error: 'Invoice is already paid or cancelled' });
        }
        if (amount > invoice.balance_due + MONEY_EPSILON) {
            return fail(400, { error: 'Amount exceeds balance due' });
        }

        let paymentNumber = '';

        try {
            await runInTx(async (tx) => {
                const result = await recordInvoicePaymentInTx(tx, {
                    orgId,
                    userId: locals.user!.id,
                    invoice: {
                        id: invoice.id,
                        customer_id: invoice.customer_id,
                        total: invoice.total,
                        amount_paid: invoice.amount_paid,
                        balance_due: invoice.balance_due,
                        status: invoice.status
                    },
                    amount,
                    paymentDate: payment_date,
                    paymentMode: payment_mode,
                    depositTo: deposit_to,
                    reference
                });
                paymentNumber = result.paymentNumber;
            });

            invalidateReportingCacheForOrg(orgId);

            return { success: true, paymentNumber };

        } catch (error) {
            return failActionFromError(error, 'Invoice payment record failed');
        }
    },

    settle: async ({ request, locals, params }) => {
        if (!locals.user) return fail(401);

        const orgId = locals.user.orgId;
        const invoiceId = params.id;
        const formData = await request.formData();

        const paymentAmount = round2(parseFloat(formData.get('payment_amount') as string) || 0);
        const paymentDate = formData.get('payment_date') as string;
        const paymentMode = formData.get('payment_mode') as string;
        const depositTo = formData.get('deposit_to') as string;
        const paymentReference = (formData.get('payment_reference') as string) || '';

        let requestedCredits: RequestedCredit[] = [];
        try {
            requestedCredits = parseRequestedCredits(formData.get('credits'), { allowEmpty: true });
        } catch (error) {
            return failActionFromError(error, 'Invoice settlement credit parse failed');
        }

        if (paymentAmount < 0) {
            return fail(400, { error: 'Payment amount must be zero or positive' });
        }
        if (paymentAmount > 0 && !paymentDate) {
            return fail(400, { error: 'Payment date is required when payment amount is provided' });
        }
        if (paymentAmount > 0 && !paymentMode) {
            return fail(400, { error: 'Payment method is required when payment amount is provided' });
        }
        if (paymentAmount > 0 && !depositTo) {
            return fail(400, { error: 'Deposit account is required when payment amount is provided' });
        }
        if (paymentAmount <= MONEY_EPSILON && requestedCredits.length === 0) {
            return fail(400, { error: 'No payment or credits selected to settle' });
        }

        let totalSettled = 0;
        let creditSettled = 0;
        let paymentSettled = 0;
        let resultingStatus: 'paid' | 'partially_paid' = 'partially_paid';

        try {
            await runInTx(async (tx) => {
                const result = await settleInvoiceInTx(tx, {
                    orgId,
                    userId: locals.user!.id,
                    invoiceId,
                    requestedCredits,
                    paymentAmount,
                    paymentDate,
                    paymentMode,
                    depositTo,
                    paymentReference
                });

                totalSettled = result.totalSettled;
                creditSettled = result.creditSettled;
                paymentSettled = result.paymentSettled;
                resultingStatus = result.resultingStatus;
            });

            void logActivity({
                orgId,
                userId: locals.user.id,
                entityType: 'invoice',
                entityId: invoiceId,
                action: resultingStatus,
                changedFields: {
                    amount_settled: { new: totalSettled },
                    credits_applied: { new: creditSettled },
                    payment_recorded: { new: paymentSettled }
                }
            });

            invalidateReportingCacheForOrg(orgId);

            return { success: true, message: 'Settlement recorded successfully' };
        } catch (error) {
            return failActionFromError(error, 'Invoice settlement failed');
        }
    },

    update: async ({ request, locals, params }) => {
        if (!locals.user) {
            return fail(401, { error: 'Unauthorized' });
        }

        const orgId = locals.user.orgId;

        // Get the invoice
        const invoice = await db.query.invoices.findFirst({
            where: and(
                eq(invoices.id, params.id),
                eq(invoices.org_id, orgId)
            )
        });

        if (!invoice) {
            return fail(404, { error: 'Invoice not found' });
        }

        if (invoice.status !== 'draft') {
            return fail(400, { error: 'Only draft invoices can be edited' });
        }

        const formData = await request.formData();
        const customer_id = formData.get('customer_id') as string;
        const invoice_date = formData.get('invoice_date') as string;
        const due_date = formData.get('due_date') as string;
        const order_number = formData.get('order_number') as string;
        const notes = formData.get('notes') as string;
        const terms = formData.get('terms') as string;
        const requestedPricesIncludeGst = parsePricesIncludeGst(formData);

        // Validation
        if (!customer_id) return fail(400, { error: 'Customer is required' });
        if (!invoice_date) return fail(400, { error: 'Invoice date is required' });
        if (!due_date) return fail(400, { error: 'Due date is required' });

        const lineItems = parseInvoiceLineItemsFromFormData(formData);

        if (lineItems.length === 0) {
            return fail(400, { error: 'At least one item with a description is required' });
        }

        let updatedTotal = invoice.total;

        try {
            await runInTx(async (tx) => {
                const result = await updateDraftInvoiceInTx(tx, {
                    orgId,
                    userId: locals.user!.id,
                    invoiceId: params.id,
                    customerId: customer_id,
                    invoiceDate: invoice_date,
                    dueDate: due_date,
                    orderNumber: order_number || null,
                    notes: notes || null,
                    terms: terms || null,
                    requestedPricesIncludeGst,
                    lineItems
                });

                updatedTotal = result.total;
            });

            // Log activity (outside tx)
            void logActivity({
                orgId,
                userId: locals.user.id,
                entityType: 'invoice',
                entityId: params.id,
                action: 'updated',
                changedFields: {
                    total: { old: invoice.total, new: updatedTotal },
                }
            });

        } catch (error) {
            return failActionFromError(error, 'Invoice update failed');
        }

        redirect(302, `/invoices/${params.id}`);
    },

    delete: async ({ locals, params }) => {
        if (!locals.user) {
            return fail(401, { error: 'Unauthorized' });
        }

        const orgId = locals.user.orgId;

        const invoice = await db.query.invoices.findFirst({
            where: and(
                eq(invoices.id, params.id),
                eq(invoices.org_id, orgId)
            )
        });

        if (!invoice) {
            return fail(404, { error: 'Invoice not found' });
        }

        if (invoice.status !== 'draft') {
            return fail(400, { error: 'Only draft invoices can be deleted' });
        }

        try {
            await runInTx(async (tx) => {
                await deleteDraftInvoiceInTx(tx, params.id);
            });

            // Log activity (outside tx)
            void logActivity({
                orgId,
                userId: locals.user.id,
                entityType: 'invoice',
                entityId: params.id,
                action: 'deleted',
                changedFields: {
                    invoice_number: { old: invoice.invoice_number },
                }
            });
        } catch (error) {
            return failActionFromError(error, 'Invoice delete failed');
        }

        redirect(302, '/invoices');
    }
};
