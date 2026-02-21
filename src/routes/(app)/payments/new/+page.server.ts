import { redirect, fail } from '@sveltejs/kit';
import { localDateStr } from '$lib/utils/date';
import { payments } from '$lib/server/db/schema';
import type { PageServerLoad, Actions } from './$types';
import { logActivity } from '$lib/server/services';
import { setFlash } from '$lib/server/flash';
import { checkIdempotency, generateIdempotencyKey } from '$lib/server/utils/idempotency';
import { isIdempotencyConstraintError, isUniqueConstraintOnColumns } from '$lib/server/utils/db-errors';
import { round2 } from '$lib/utils/currency';
import { failActionFromError } from '$lib/server/platform/errors';
import {
    createCustomerPaymentInTx,
    MONEY_EPSILON,
    parsePaymentAllocationsFromFormData
} from '$lib/server/modules/receivables/application/workflows';
import { runInTx } from '$lib/server/platform/db/tx';
import {
    listActivePaymentModes,
    listDepositAccounts,
    listPaymentCustomers,
    listUnpaidCustomerInvoices
} from '$lib/server/modules/receivables/infra/queries';
import { hasPaymentModes, seedPaymentModes } from '$lib/server/seed';

export const load: PageServerLoad = async ({ locals, url }) => {
    if (!locals.user) {
        redirect(302, '/login');
    }

    const orgId = locals.user.orgId;

    // Auto-seed payment modes for existing orgs
    if (!(await hasPaymentModes(orgId))) {
        await seedPaymentModes(orgId);
    }

    const [customerList, depositAccounts, paymentModes] = await Promise.all([
        listPaymentCustomers(orgId),
        listDepositAccounts(orgId),
        listActivePaymentModes(orgId)
    ]);

    // Check if a customer is pre-selected (from invoice page)
    const customerId = url.searchParams.get('customer');
    const preSelectedInvoiceId = url.searchParams.get('invoice');
    let unpaidInvoices: Awaited<ReturnType<typeof listUnpaidCustomerInvoices>> = [];

    if (customerId) {
        unpaidInvoices = await listUnpaidCustomerInvoices(orgId, customerId);
    }

    return {
        customers: customerList,
        depositAccounts,
        paymentModes,
        selectedCustomer: customerId || '',
        preSelectedInvoiceId,
        unpaidInvoices,
        idempotencyKey: generateIdempotencyKey(),
        defaults: {
            payment_date: localDateStr()
        }
    };
};

export const actions: Actions = {
    recordPayment: async ({ request, locals, cookies }) => {
        if (!locals.user) {
            redirect(302, '/login');
        }

        const orgId = locals.user.orgId;
        const formData = await request.formData();

        const idempotencyKey = formData.get('idempotency_key') as string;
        const { isDuplicate, existingRecord } = await checkIdempotency<typeof payments.$inferSelect>(
            'payments',
            orgId,
            idempotencyKey
        );
        if (isDuplicate && existingRecord) {
            redirect(302, `/payments/${existingRecord.id}`);
        }
        if (isDuplicate) {
            redirect(302, '/payments');
        }

        const customer_id = formData.get('customer_id') as string;
        const payment_date = formData.get('payment_date') as string;
        const amount = round2(parseFloat(formData.get('amount') as string) || 0);
        const payment_mode = formData.get('payment_mode') as string;
        const deposit_to = formData.get('deposit_to') as string;
        const reference = (formData.get('reference') as string) || '';
        const notes = (formData.get('notes') as string) || '';

        if (!customer_id) {
            return fail(400, { error: 'Customer is required' });
        }
        if (!payment_date) {
            return fail(400, { error: 'Payment date is required' });
        }
        if (amount <= MONEY_EPSILON) {
            return fail(400, { error: 'Amount must be positive' });
        }
        if (!payment_mode) {
            return fail(400, { error: 'Payment mode is required' });
        }
        if (!deposit_to) {
            return fail(400, { error: 'Deposit account is required' });
        }

        let allocations;
        try {
            allocations = parsePaymentAllocationsFromFormData(formData);
        } catch (error) {
            return failActionFromError(error, 'Payment allocation parse failed');
        }

        const totalAllocated = round2(allocations.reduce((sum, allocation) => sum + allocation.amount, 0));
        if (totalAllocated > amount + MONEY_EPSILON) {
            return fail(400, { error: 'Allocated amount cannot exceed payment amount' });
        }

        let paymentId = '';
        let paymentNumber = '';

        try {
            await runInTx(async (tx) => {
                const result = await createCustomerPaymentInTx(tx, {
                    orgId,
                    userId: locals.user!.id,
                    customerId: customer_id,
                    paymentDate: payment_date,
                    amount,
                    paymentMode: payment_mode,
                    depositTo: deposit_to,
                    reference,
                    notes,
                    allocations,
                    idempotencyKey: idempotencyKey || null
                });
                paymentId = result.paymentId;
                paymentNumber = result.paymentNumber;
            });

            void logActivity({
                orgId,
                userId: locals.user.id,
                entityType: 'payment',
                entityId: paymentId,
                action: 'created',
                changedFields: {
                    payment_number: { new: paymentNumber },
                    amount: { new: amount },
                    payment_mode: { new: payment_mode }
                }
            });
        } catch (error) {
            if (idempotencyKey && isIdempotencyConstraintError(error, 'payments')) {
                const duplicate = await checkIdempotency<typeof payments.$inferSelect>('payments', orgId, idempotencyKey);
                if (duplicate.isDuplicate && duplicate.existingRecord) {
                    redirect(302, `/payments/${duplicate.existingRecord.id}`);
                }
                redirect(302, '/payments');
            }

            if (isUniqueConstraintOnColumns(error, 'payments', ['org_id', 'payment_number'])) {
                return fail(409, { error: 'Payment number conflict. Please retry.' });
            }

            return failActionFromError(error, 'Payment recording failed');
        }

        setFlash(cookies, {
            type: 'success',
            message: 'Payment recorded successfully.'
        });
        redirect(302, '/payments');
    },

    // API endpoint to get unpaid invoices for a customer
    getInvoices: async ({ request, locals }) => {
        try {
            if (!locals.user) {
                return fail(401, { error: 'Unauthorized' });
            }

            const formData = await request.formData();
            const customerId = formData.get('customer_id') as string;

            if (!customerId) {
                return { invoices: [] };
            }

            const orgId = locals.user.orgId;

            const unpaidInvoices = await listUnpaidCustomerInvoices(orgId, customerId);

            return { invoices: unpaidInvoices };
        } catch (error) {
            return failActionFromError(error, 'Payment invoices lookup failed');
        }
    }
};
