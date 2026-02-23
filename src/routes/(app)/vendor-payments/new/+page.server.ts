import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { localDateStr } from '$lib/utils/date';
import { supplier_payments } from '$lib/server/db/schema';
import { checkIdempotency, generateIdempotencyKey } from '$lib/server/utils/idempotency';
import {
    isForeignKeyConstraintError,
    isIdempotencyConstraintError,
    isSchemaOutOfDateError,
    isUniqueConstraintOnColumns
} from '$lib/server/utils/db-errors';
import { runInTx } from '$lib/server/platform/db/tx';
import { failActionFromError } from '$lib/server/platform/errors';
import { setFlash } from '$lib/server/flash';
import { logActivity } from '$lib/server/services';
import { listPaymentOptionsForForm } from '$lib/server/modules/receivables/infra/queries';
import {
    getAvailableSupplierCredit,
    listOpenSupplierExpenses,
    listSupplierOptionsForPayment
} from '$lib/server/modules/payables/infra/queries';
import {
    createSupplierPaymentInTx,
    MONEY_EPSILON,
    parseSupplierPaymentAllocationsFromFormData
} from '$lib/server/modules/payables/application/workflows';
import { round2 } from '$lib/utils/currency';
import { invalidateReportingCacheForOrg } from '$lib/server/modules/reporting/application/gst-reports';

type SupplierPaymentRecord = typeof supplier_payments.$inferSelect;

export const load: PageServerLoad = async ({ locals, url }) => {
    if (!locals.user) {
        redirect(302, '/login');
    }

    const orgId = locals.user.orgId;
    const selectedVendor = url.searchParams.get('vendor') || '';
    const supplierList = await listSupplierOptionsForPayment(orgId);
    const paymentOptions = await listPaymentOptionsForForm(orgId);

    let openBills: Awaited<ReturnType<typeof listOpenSupplierExpenses>> = [];
    let availableCredit = 0;

    if (selectedVendor) {
        openBills = await listOpenSupplierExpenses(orgId, selectedVendor);
        availableCredit = await getAvailableSupplierCredit(orgId, selectedVendor);
    }

    return {
        suppliers: supplierList,
        paymentOptions,
        selectedVendor,
        openBills,
        availableCredit,
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

        let idempotencyResult: { isDuplicate: boolean; existingRecord?: SupplierPaymentRecord };
        try {
            idempotencyResult = await checkIdempotency<SupplierPaymentRecord>(
                'supplier_payments',
                orgId,
                idempotencyKey
            );
        } catch (error) {
            if (isSchemaOutOfDateError(error)) {
                return fail(500, {
                    error: 'Database schema is outdated. Run "npm run db:migrate" and try again.'
                });
            }
            return failActionFromError(error, 'Supplier payment idempotency check failed');
        }
        const { isDuplicate, existingRecord } = idempotencyResult;
        if (isDuplicate && existingRecord) {
            redirect(302, `/vendor-payments/${existingRecord.id}`);
        }
        if (isDuplicate) {
            redirect(302, '/vendor-payments');
        }

        const vendor_id = (formData.get('vendor_id') as string) || '';
        const payment_date = (formData.get('payment_date') as string) || '';
        const amount = round2(parseFloat(formData.get('amount') as string) || 0);
        const payment_mode = (formData.get('payment_mode') as string) || '';
        const paid_from = (formData.get('paid_from') as string) || '';
        const reference = (formData.get('reference') as string) || '';
        const notes = (formData.get('notes') as string) || '';

        if (!vendor_id) {
            return fail(400, { error: 'Supplier is required' });
        }
        if (!payment_date) {
            return fail(400, { error: 'Payment date is required' });
        }
        if (amount <= MONEY_EPSILON) {
            return fail(400, { error: 'Amount must be positive' });
        }
        if (!payment_mode) {
            return fail(400, { error: 'Payment method is required' });
        }
        if (!paid_from) {
            return fail(400, { error: 'Paid from account is required' });
        }

        let allocations;
        try {
            allocations = parseSupplierPaymentAllocationsFromFormData(formData);
        } catch (error) {
            return failActionFromError(error, 'Supplier bill adjustment parse failed');
        }

        const totalRequested = round2(allocations.reduce((sum, allocation) => sum + allocation.amount, 0));
        if (totalRequested > amount + MONEY_EPSILON) {
            return fail(400, { error: 'Adjusted amount cannot exceed payment amount' });
        }

        let paymentId = '';
        let paymentNumber = '';
        let totalAllocated = 0;
        let excessAmount = 0;

        try {
            await runInTx(async (tx) => {
                const result = await createSupplierPaymentInTx(tx, {
                    orgId,
                    userId: locals.user!.id,
                    vendorId: vendor_id,
                    paymentDate: payment_date,
                    amount,
                    paymentMode: payment_mode,
                    paidFrom: paid_from,
                    reference,
                    notes,
                    allocations,
                    idempotencyKey: idempotencyKey || null
                });
                paymentId = result.paymentId;
                paymentNumber = result.paymentNumber;
                totalAllocated = result.totalAllocated;
                excessAmount = result.excessAmount;
            });

            void logActivity({
                orgId,
                userId: locals.user.id,
                entityType: 'payment',
                entityId: paymentId,
                action: 'created',
                changedFields: {
                    supplier_payment_number: { new: paymentNumber },
                    amount: { new: amount },
                    allocated: { new: totalAllocated },
                    excess_as_credit: { new: excessAmount }
                }
            });

            invalidateReportingCacheForOrg(orgId);
        } catch (error) {
            if (isSchemaOutOfDateError(error)) {
                return fail(500, {
                    error: 'Database schema is outdated. Run "npm run db:migrate" and try again.'
                });
            }

            if (idempotencyKey && isIdempotencyConstraintError(error, 'supplier_payments')) {
                let duplicate: { isDuplicate: boolean; existingRecord?: SupplierPaymentRecord };
                try {
                    duplicate = await checkIdempotency<SupplierPaymentRecord>('supplier_payments', orgId, idempotencyKey);
                } catch {
                    redirect(302, '/vendor-payments');
                }
                if (duplicate.isDuplicate && duplicate.existingRecord) {
                    redirect(302, `/vendor-payments/${duplicate.existingRecord.id}`);
                }
                redirect(302, '/vendor-payments');
            }

            if (isUniqueConstraintOnColumns(error, 'supplier_payments', ['org_id', 'supplier_payment_number'])) {
                return fail(409, { error: 'Supplier payment number conflict. Please retry.' });
            }

            if (isForeignKeyConstraintError(error, 'supplier_payments_created_by_users_id_fk')) {
                return fail(401, {
                    error: 'Session is out of sync. Please log out and log in again.'
                });
            }

            if (isForeignKeyConstraintError(error)) {
                return fail(400, {
                    error: 'Linked data changed while saving. Refresh and retry.'
                });
            }

            return failActionFromError(error, 'Supplier payment save failed');
        }

        setFlash(cookies, {
            type: 'success',
            message:
                excessAmount > MONEY_EPSILON
                    ? `Supplier payment saved. ${excessAmount.toFixed(2)} kept as supplier credit.`
                    : 'Supplier payment saved successfully.'
        });
        redirect(302, `/vendor-payments/${paymentId}`);
    },

    getBills: async ({ request, locals }) => {
        try {
            if (!locals.user) {
                return fail(401, { error: 'Unauthorized' });
            }

            const formData = await request.formData();
            const vendorId = (formData.get('vendor_id') as string) || '';

            if (!vendorId) {
                return {
                    bills: [],
                    availableCredit: 0
                };
            }

            const orgId = locals.user.orgId;
            const [bills, availableCredit] = await Promise.all([
                listOpenSupplierExpenses(orgId, vendorId),
                getAvailableSupplierCredit(orgId, vendorId)
            ]);

            return {
                bills,
                availableCredit
            };
        } catch (error) {
            return failActionFromError(error, 'Supplier bills lookup failed');
        }
    }
};

