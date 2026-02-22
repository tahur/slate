import { redirect, fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { expenses, accounts, payment_accounts, payment_methods, vendors } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import type { PageServerLoad, Actions } from './$types';
import { getNextNumberTx, postExpense, logActivity } from '$lib/server/services';
import { setFlash } from '$lib/server/flash';
import { checkIdempotency, generateIdempotencyKey } from '$lib/server/utils/idempotency';
import { isIdempotencyConstraintError, isUniqueConstraintOnColumns } from '$lib/server/utils/db-errors';
import { calculateLineTax } from '$lib/tax/gst';
import { runInTx } from '$lib/server/platform/db/tx';
import { failActionFromError } from '$lib/server/platform/errors';
import { invalidateReportingCacheForOrg } from '$lib/server/modules/reporting/application/gst-reports';
import { round2 } from '$lib/utils/currency';
import { localDateStr } from '$lib/utils/date';
import { listPaymentOptionsForForm } from '$lib/server/modules/receivables/infra/queries';

export const load: PageServerLoad = async ({ locals, url }) => {
    if (!locals.user) {
        redirect(302, '/login');
    }

    const orgId = locals.user.orgId;

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

    return {
        expenseAccounts,
        paymentOptions,
        vendors: vendorList,
        selectedVendorId,
        idempotencyKey: generateIdempotencyKey(),
        defaults: {
            expense_date: localDateStr()
        }
    };
};

export const actions: Actions = {
    default: async ({ request, locals, cookies }) => {
        if (!locals.user) {
            redirect(302, '/login');
        }

        const orgId = locals.user.orgId;
        const formData = await request.formData();

        // Check idempotency
        const idempotencyKey = formData.get('idempotency_key') as string;
        const { isDuplicate, existingRecord } = await checkIdempotency<typeof expenses.$inferSelect>(
            'expenses',
            orgId,
            idempotencyKey
        );
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
        if (!payment_mode) {
            return fail(400, { error: 'Payment method is required' });
        }
        if (!paid_through) {
            return fail(400, { error: 'Payment account is required' });
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
        const [categoryAccount, paymentAccount, paymentMethod] = await Promise.all([
            db.query.accounts.findFirst({ where: eq(accounts.id, category) }),
            db.query.payment_accounts.findFirst({
                where: and(
                    eq(payment_accounts.id, paid_through),
                    eq(payment_accounts.org_id, orgId),
                    eq(payment_accounts.is_active, true)
                )
            }),
            db.query.payment_methods.findFirst({
                where: and(
                    eq(payment_methods.org_id, orgId),
                    eq(payment_methods.method_key, payment_mode),
                    eq(payment_methods.is_active, true)
                )
            })
        ]);

        if (!categoryAccount) {
            return fail(400, { error: 'Invalid category' });
        }

        if (!paymentAccount) {
            return fail(400, { error: 'Invalid payment account' });
        }

        if (!paymentMethod) {
            return fail(400, { error: 'Invalid payment method' });
        }

        // Mapping is informational (drives default account selection in UI).
        // As long as both the method and account are individually valid, allow the combination.

        const paidThrough = paymentAccount.ledger_code === '1000' ? 'cash' : 'bank';

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
                    paidThroughAccountCode: paymentAccount.ledger_code,
                    description: description || `Expense: ${categoryAccount.account_name}`,
                    userId: locals.user!.id
                }, tx);

                // Create expense record
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
                    paid_through,
                    payment_account_id: paymentAccount.id,
                    payment_method_id: paymentMethod.id,
                    reference,
                    journal_entry_id: postingResult.journalEntryId,
                    idempotency_key: idempotencyKey || null,
                    created_by: locals.user!.id
                });
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
                    category: { new: categoryAccount.account_name }
                }
            });

            invalidateReportingCacheForOrg(orgId);

        } catch (error) {
            if (idempotencyKey && isIdempotencyConstraintError(error, 'expenses')) {
                const duplicate = await checkIdempotency<typeof expenses.$inferSelect>('expenses', orgId, idempotencyKey);
                if (duplicate.isDuplicate && duplicate.existingRecord) {
                    redirect(302, `/expenses/${duplicate.existingRecord.id}`);
                }
                redirect(302, '/expenses');
            }

            if (isUniqueConstraintOnColumns(error, 'expenses', ['org_id', 'expense_number'])) {
                return fail(409, { error: 'Expense number conflict. Please retry.' });
            }

            return failActionFromError(error, 'Expense recording failed');
        }

        setFlash(cookies, {
            type: 'success',
            message: 'Expense recorded successfully.'
        });
        redirect(302, '/expenses');
    }
};
