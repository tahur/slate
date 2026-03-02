import { redirect, fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { expenses, accounts, payment_accounts, payment_method_account_map, payment_methods, vendors } from '$lib/server/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import type { PageServerLoad, Actions } from './$types';
import { getNextNumberTx, postExpense, logActivity } from '$lib/server/services';
import { setFlash } from '$lib/server/flash';
import { checkIdempotency, generateIdempotencyKey } from '$lib/server/utils/idempotency';
import {
    isForeignKeyConstraintError,
    isIdempotencyConstraintError,
    isNotNullConstraintError,
    isSchemaOutOfDateError,
    isUniqueConstraintOnColumns
} from '$lib/server/utils/db-errors';
import { calculateLineTax } from '$lib/tax/gst';
import { runInTx } from '$lib/server/platform/db/tx';
import { failActionFromError } from '$lib/server/platform/errors';
import { invalidateReportingCacheForOrg } from '$lib/server/modules/reporting/application/gst-reports';
import { round2 } from '$lib/utils/currency';
import { localDateStr } from '$lib/utils/date';
import { listPaymentOptionsForForm } from '$lib/server/modules/receivables/infra/queries';
import { buildSupplierExpenseReason } from '$lib/server/services/statement-reasons';
import { ensureExpenseAccounts, hasPaymentConfiguration, seedPaymentConfiguration } from '$lib/server/seed';
import { listOpenSupplierExpenses } from '$lib/server/modules/payables/infra/queries';

type ExpenseRecord = typeof expenses.$inferSelect;

export const load: PageServerLoad = async ({ locals, url }) => {
    if (!locals.user) {
        redirect(302, '/login');
    }

    const orgId = locals.user.orgId;

    if (!(await hasPaymentConfiguration(orgId))) {
        await seedPaymentConfiguration(orgId);
    }

    await ensureExpenseAccounts(orgId);

    // Fetch all data in parallel
    const [expenseAccounts, paymentOptions, vendorList] = await Promise.all([
        db
            .select({
                id: accounts.id,
                name: accounts.account_name,
                code: accounts.account_code
            })
            .from(accounts)
            .where(
                and(
                    eq(accounts.org_id, orgId),
                    eq(accounts.account_type, 'expense'),
                    eq(accounts.is_active, true)
                )
            )
            .orderBy(accounts.account_code),
        listPaymentOptionsForForm(orgId),
        db
            .select({
                id: vendors.id,
                name: vendors.name,
                display_name: vendors.display_name,
                gstin: vendors.gstin,
                state_code: vendors.state_code,
            })
            .from(vendors)
            .where(
                and(
                    eq(vendors.org_id, orgId),
                    eq(vendors.is_active, true)
                )
            )
            .orderBy(vendors.name)
    ]);

    // Check for pre-selected vendor from URL
    const selectedVendorId = url.searchParams.get('vendor');
    const defaultPaymentStatus = url.searchParams.get('mode') === 'credit' ? 'unpaid' : 'paid';

    return {
        expenseAccounts,
        paymentOptions,
        vendors: vendorList,
        selectedVendorId,
        defaultPaymentStatus,
        idempotencyKey: generateIdempotencyKey(),
        defaults: {
            expense_date: localDateStr()
        }
    };
};

export const actions: Actions = {
    save: async ({ request, locals, cookies }) => {
        if (!locals.user) {
            redirect(302, '/login');
        }

        const orgId = locals.user.orgId;
        const formData = await request.formData();

        // Check idempotency
        const idempotencyKey = formData.get('idempotency_key') as string;
        let idempotencyResult: { isDuplicate: boolean; existingRecord?: ExpenseRecord };
        try {
            idempotencyResult = await checkIdempotency<ExpenseRecord>(
                'expenses',
                orgId,
                idempotencyKey
            );
        } catch (error) {
            if (isSchemaOutOfDateError(error)) {
                return fail(500, {
                    error: 'Database schema is outdated. Run "npm run db:migrate" and try again.'
                });
            }
            return failActionFromError(error, 'Expense idempotency check failed');
        }

        const { isDuplicate, existingRecord } = idempotencyResult;
        if (isDuplicate && existingRecord) {
            redirect(302, `/expenses/${existingRecord.id}`);
        }
        if (isDuplicate) {
            redirect(302, '/expenses');
        }

        // Parse form data
        const expense_date = formData.get('expense_date') as string;
        const category = formData.get('category') as string;
        const vendor_id = formData.get('vendor_id') as string || null;
        const vendor_name = formData.get('vendor_name') as string || '';
        const description = formData.get('description') as string || '';
        const amount = round2(parseFloat(formData.get('amount') as string) || 0);
        const gst_rate = parseFloat(formData.get('gst_rate') as string) || 0;
        const is_inter_state = formData.get('is_inter_state') === 'on';
        const payment_mode = formData.get('payment_mode') as string;
        const paid_through = formData.get('paid_through') as string;
        const payment_status = formData.get('payment_status') === 'unpaid' ? 'unpaid' : 'paid';
        const reference = formData.get('reference') as string || '';

        // Validation
        if (!expense_date) {
            return fail(400, { error: 'Date is required' });
        }
        if (!category) {
            return fail(400, { error: 'Category is required' });
        }
        if (amount <= 0) {
            return fail(400, { error: 'Amount must be positive' });
        }
        if (payment_status === 'paid') {
            if (!payment_mode) {
                return fail(400, { error: 'Payment method is required' });
            }
            if (!paid_through) {
                return fail(400, { error: 'Payment account is required' });
            }
        }
        if (payment_status === 'unpaid' && !vendor_id) {
            return fail(400, { error: 'Supplier is required for a credit expense' });
        }

        // Canonical GST calculation uses shared tax engine.
        const taxBreakdown = calculateLineTax(
            { quantity: 1, rate: amount, gstRate: gst_rate },
            { isInterState: is_inter_state, pricesIncludeGst: false }
        );
        const cgst = taxBreakdown.cgst;
        const sgst = taxBreakdown.sgst;
        const igst = taxBreakdown.igst;
        const total = taxBreakdown.total;

        // Pre-fetch account info in parallel (read-only, safe outside transaction)
        let categoryAccount: Awaited<ReturnType<typeof db.query.accounts.findFirst>>;
        let paymentAccount: Awaited<ReturnType<typeof db.query.payment_accounts.findFirst>> | null;
        let paymentMethod: Awaited<ReturnType<typeof db.query.payment_methods.findFirst>> | null;

        try {
            [categoryAccount, paymentAccount, paymentMethod] = await Promise.all([
                db.query.accounts.findFirst({ where: eq(accounts.id, category) }),
                payment_status === 'paid'
                    ? db.query.payment_accounts.findFirst({
                        where: and(
                            eq(payment_accounts.id, paid_through),
                            eq(payment_accounts.org_id, orgId),
                            eq(payment_accounts.is_active, true)
                        )
                    })
                    : Promise.resolve(null),
                payment_status === 'paid'
                    ? db.query.payment_methods.findFirst({
                        where: and(
                            eq(payment_methods.org_id, orgId),
                            eq(payment_methods.method_key, payment_mode),
                            eq(payment_methods.is_active, true)
                        )
                    })
                    : Promise.resolve(null)
            ]);
        } catch (error) {
            if (isSchemaOutOfDateError(error)) {
                return fail(500, {
                    error: 'Database schema is outdated. Run "npm run db:migrate" and try again.'
                });
            }
            return failActionFromError(error, 'Expense setup lookup failed');
        }

        if (!categoryAccount) {
            return fail(400, { error: 'Invalid category' });
        }

        if (vendor_id) {
            const vendor = await db.query.vendors.findFirst({
                where: and(
                    eq(vendors.id, vendor_id),
                    eq(vendors.org_id, orgId),
                    eq(vendors.is_active, true)
                )
            });

            if (!vendor) {
                return fail(400, { error: 'Invalid supplier. Refresh and select again.' });
            }
        }

        if (payment_status === 'paid') {
            if (!paymentAccount) {
                return fail(400, { error: 'Invalid payment account' });
            }

            if (!paymentMethod) {
                return fail(400, { error: 'Invalid payment method' });
            }

            let methodAccountMapping: Awaited<ReturnType<typeof db.query.payment_method_account_map.findFirst>>;
            try {
                methodAccountMapping = await db.query.payment_method_account_map.findFirst({
                    where: and(
                        eq(payment_method_account_map.org_id, orgId),
                        eq(payment_method_account_map.payment_method_id, paymentMethod.id),
                        eq(payment_method_account_map.payment_account_id, paymentAccount.id),
                        eq(payment_method_account_map.is_active, true)
                    )
                });
            } catch (error) {
                if (isSchemaOutOfDateError(error)) {
                    return fail(500, {
                        error: 'Database schema is outdated. Run "npm run db:migrate" and try again.'
                    });
                }
                return failActionFromError(error, 'Payment method-account validation failed');
            }

            if (!methodAccountMapping) {
                return fail(400, { error: 'Selected payment account is not linked to the selected payment method' });
            }
        }

        const isPayableEntry = payment_status === 'unpaid';
        const paidThrough = paymentAccount?.ledger_code === '1000' ? 'cash' : 'bank';
        const reasonSnapshot = buildSupplierExpenseReason(
            categoryAccount.account_name,
            description,
            payment_status
        );

        const expenseId = crypto.randomUUID();
        let expenseNumber = '';

        try {
            await runInTx(async (tx) => {
                // Generate expense number
                expenseNumber = await getNextNumberTx(tx, orgId, 'expense');

                // Post to journal
                const postingResult = await postExpense(orgId, {
                    expenseId,
                    date: expense_date,
                    expenseAccountCode: categoryAccount.account_code,
                    amount,
                    inputCgst: cgst,
                    inputSgst: sgst,
                    inputIgst: igst,
                    paidThrough,
                    paidThroughAccountCode: paymentAccount?.ledger_code,
                    payableOnly: isPayableEntry,
                    vendorId: vendor_id || null,
                    description: description || `Expense: ${categoryAccount.account_name}`,
                    userId: locals.user!.id
                }, tx);

                // Create expense record
                const amountSettled = isPayableEntry ? 0 : total;
                const balanceDue = isPayableEntry
                    ? round2(total)
                    : 0;

                await tx.insert(expenses).values({
                    id: expenseId,
                    org_id: orgId,
                    expense_number: expenseNumber,
                    expense_date,
                    category,
                    vendor_id: vendor_id || null,
                    vendor_name,
                    description,
                    amount,
                    gst_rate,
                    cgst,
                    sgst,
                    igst,
                    total,
                    payment_status,
                    paid_through: isPayableEntry ? null : paid_through,
                    payment_account_id: isPayableEntry ? null : paymentAccount?.id,
                    payment_method_id: isPayableEntry ? null : paymentMethod?.id,
                    amount_settled: amountSettled,
                    balance_due: balanceDue,
                    credit_applied: 0,
                    reference,
                    reason_snapshot: reasonSnapshot,
                    journal_entry_id: postingResult.journalEntryId,
                    idempotency_key: idempotencyKey || null,
                    created_by: locals.user!.id
                });

                if (isPayableEntry && vendor_id) {
                    await tx
                        .update(vendors)
                        .set({
                            // Payable should rise only by net due after any supplier credit adjustment.
                            balance: sql`ROUND((${vendors.balance})::numeric + (${balanceDue})::numeric, 2)::double precision`,
                            updated_at: new Date().toISOString()
                        })
                        .where(and(eq(vendors.id, vendor_id), eq(vendors.org_id, orgId)));
                }
            });

            // Log activity (outside transaction — non-critical)
            void logActivity({
                orgId,
                userId: locals.user.id,
                entityType: 'expense',
                entityId: expenseId,
                action: 'created',
                changedFields: {
                    expense_number: { new: expenseNumber },
                    total: { new: total },
                    category: { new: categoryAccount.account_name },
                    payment_status: { new: payment_status }
                }
            });

            invalidateReportingCacheForOrg(orgId);

        } catch (error) {
            if (isSchemaOutOfDateError(error)) {
                return fail(500, {
                    error: 'Database schema is outdated. Run "npm run db:migrate" and try again.'
                });
            }

            if (idempotencyKey && isIdempotencyConstraintError(error, 'expenses')) {
                let duplicate: { isDuplicate: boolean; existingRecord?: ExpenseRecord };
                try {
                    duplicate = await checkIdempotency<ExpenseRecord>('expenses', orgId, idempotencyKey);
                } catch {
                    redirect(302, '/expenses');
                }
                if (duplicate.isDuplicate && duplicate.existingRecord) {
                    redirect(302, `/expenses/${duplicate.existingRecord.id}`);
                }
                redirect(302, '/expenses');
            }

            if (isUniqueConstraintOnColumns(error, 'expenses', ['org_id', 'expense_number'])) {
                return fail(409, { error: 'Expense number conflict. Please retry.' });
            }

            if (error instanceof Error && error.message.startsWith('Account not found:')) {
                return fail(400, {
                    error: 'Required account setup is incomplete. Please verify chart of accounts and retry.'
                });
            }

            if (payment_status === 'unpaid' && isNotNullConstraintError(error, 'paid_through')) {
                return fail(500, {
                    error: 'Database schema is outdated for supplier payable entries. Run "npm run db:migrate" and retry.'
                });
            }

            if (isForeignKeyConstraintError(error, 'expenses_created_by_users_id_fk')) {
                return fail(401, {
                    error: 'Session is out of sync. Please log out and log in again.'
                });
            }

            if (isForeignKeyConstraintError(error, 'expenses_vendor_id_vendors_id_fk')) {
                return fail(400, {
                    error: 'Selected supplier was not found. Refresh and select supplier again.'
                });
            }

            if (isForeignKeyConstraintError(error)) {
                return fail(400, {
                    error: 'Linked data changed while saving. Refresh and retry.'
                });
            }

            return failActionFromError(error, 'Expense recording failed');
        }

        setFlash(cookies, {
            type: 'success',
            message: payment_status === 'unpaid'
                ? 'Expense recorded on credit.'
                : 'Expense recorded successfully.'
        });
        redirect(302, '/expenses');
    },

    getVendorPending: async ({ request, locals }) => {
        try {
            if (!locals.user) {
                return fail(401, { error: 'Unauthorized' });
            }

            const formData = await request.formData();
            const vendorId = (formData.get('vendor_id') as string) || '';

            if (!vendorId) {
                return {
                    pendingTotal: 0,
                    oldestDate: null,
                    bills: []
                };
            }

            const orgId = locals.user.orgId;
            const openBills = await listOpenSupplierExpenses(orgId, vendorId);
            const pendingTotal = round2(openBills.reduce((sum, bill) => sum + bill.balance_due, 0));

            return {
                pendingTotal,
                oldestDate: openBills[0]?.expense_date || null,
                bills: openBills
            };
        } catch (error) {
            return failActionFromError(error, 'Supplier pending lookup failed');
        }
    }
};
