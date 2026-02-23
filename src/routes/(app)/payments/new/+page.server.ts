import { redirect, fail } from '@sveltejs/kit';
import { localDateStr } from '$lib/utils/date';
import { payments } from '$lib/server/db/schema';
import type { PageServerLoad, Actions } from './$types';
import { logActivity } from '$lib/server/services';
import { setFlash } from '$lib/server/flash';
import { checkIdempotency, generateIdempotencyKey } from '$lib/server/utils/idempotency';
import {
    isForeignKeyConstraintError,
    isIdempotencyConstraintError,
    isSchemaOutOfDateError,
    isUniqueConstraintOnColumns
} from '$lib/server/utils/db-errors';
import { round2 } from '$lib/utils/currency';
import { failActionFromError } from '$lib/server/platform/errors';
import {
    createCustomerPaymentInTx,
    MONEY_EPSILON,
    parsePaymentAllocationsFromFormData
} from '$lib/server/modules/receivables/application/workflows';
import { runInTx } from '$lib/server/platform/db/tx';
import {
    listPaymentOptionsForForm,
    listPaymentCustomers,
    listUnpaidCustomerInvoices
} from '$lib/server/modules/receivables/infra/queries';
import { hasPaymentConfiguration, seedPaymentConfiguration } from '$lib/server/seed';
import { invalidateReportingCacheForOrg } from '$lib/server/modules/reporting/application/gst-reports';

type PaymentRecord = typeof payments.$inferSelect;

export const load: PageServerLoad = async ({ locals, url }) => {
    if (!locals.user) {
        redirect(302, '/login');
    }

    const orgId = locals.user.orgId;

    // Auto-seed payment modes for existing orgs
    if (!(await hasPaymentConfiguration(orgId))) {
        await seedPaymentConfiguration(orgId);
    }

    const [customerList, paymentOptions] = await Promise.all([
        listPaymentCustomers(orgId),
        listPaymentOptionsForForm(orgId)
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
        paymentOptions,
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
        let idempotencyResult: { isDuplicate: boolean; existingRecord?: PaymentRecord };
        try {
            idempotencyResult = await checkIdempotency<PaymentRecord>(
                'payments',
                orgId,
                idempotencyKey
            );
        } catch (error) {
            if (isSchemaOutOfDateError(error)) {
                return fail(500, {
                    error: 'Database schema is outdated. Run "npm run db:migrate" and try again.'
                });
            }
            return failActionFromError(error, 'Receipt idempotency check failed');
        }
        const { isDuplicate, existingRecord } = idempotencyResult;
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
            return fail(400, { error: 'Receipt date is required' });
        }
        if (amount <= MONEY_EPSILON) {
            return fail(400, { error: 'Amount must be positive' });
        }
        if (!payment_mode) {
            return fail(400, { error: 'Payment method is required' });
        }
        if (!deposit_to) {
            return fail(400, { error: 'Received in account is required' });
        }

        let allocations;
        try {
            allocations = parsePaymentAllocationsFromFormData(formData);
        } catch (error) {
            return failActionFromError(error, 'Bill adjustment parse failed');
        }

        const totalAllocated = round2(allocations.reduce((sum, allocation) => sum + allocation.amount, 0));
        if (totalAllocated > amount + MONEY_EPSILON) {
            return fail(400, { error: 'Adjusted amount cannot exceed received amount' });
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

            invalidateReportingCacheForOrg(orgId);
        } catch (error) {
            if (isSchemaOutOfDateError(error)) {
                return fail(500, {
                    error: 'Database schema is outdated. Run "npm run db:migrate" and try again.'
                });
            }

            if (error instanceof Error && error.message.startsWith('Account not found:')) {
                return fail(400, {
                    error: 'Required account setup is incomplete. Please verify chart of accounts and retry.'
                });
            }

            if (isForeignKeyConstraintError(error, 'payments_created_by_users_id_fk')) {
                return fail(401, {
                    error: 'Session is out of sync. Please log out and log in again.'
                });
            }

            if (isForeignKeyConstraintError(error, 'payments_customer_id_customers_id_fk')) {
                return fail(400, {
                    error: 'Selected customer was not found. Refresh and select customer again.'
                });
            }

            if (isForeignKeyConstraintError(error)) {
                return fail(400, {
                    error: 'Linked data changed while saving. Refresh and retry.'
                });
            }

            if (idempotencyKey && isIdempotencyConstraintError(error, 'payments')) {
                let duplicate: { isDuplicate: boolean; existingRecord?: PaymentRecord };
                try {
                    duplicate = await checkIdempotency<PaymentRecord>('payments', orgId, idempotencyKey);
                } catch {
                    redirect(302, '/payments');
                }
                if (duplicate.isDuplicate && duplicate.existingRecord) {
                    redirect(302, `/payments/${duplicate.existingRecord.id}`);
                }
                redirect(302, '/payments');
            }

            if (isUniqueConstraintOnColumns(error, 'payments', ['org_id', 'payment_number'])) {
                return fail(409, { error: 'Receipt number conflict. Please retry.' });
            }

            return failActionFromError(error, 'Receipt save failed');
        }

        setFlash(cookies, {
            type: 'success',
            message: 'Receipt saved successfully.'
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
            return failActionFromError(error, 'Bill lookup failed');
        }
    }
};
