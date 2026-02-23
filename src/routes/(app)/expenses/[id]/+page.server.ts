import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import {
    expenses,
    accounts,
    payment_accounts,
    payment_methods,
    supplier_payment_allocations,
    supplier_payments,
    vendors
} from '$lib/server/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { localDateStr } from '$lib/utils/date';
import { round2 } from '$lib/utils/currency';
import { runInTx } from '$lib/server/platform/db/tx';
import { failActionFromError } from '$lib/server/platform/errors';
import { invalidateReportingCacheForOrg } from '$lib/server/modules/reporting/application/gst-reports';
import { listPaymentOptionsForForm } from '$lib/server/modules/receivables/infra/queries';
import { createSupplierPaymentInTx, MONEY_EPSILON } from '$lib/server/modules/payables/application/workflows';
import { logActivity } from '$lib/server/services';

export const load: PageServerLoad = async ({ locals, params }) => {
    if (!locals.user) {
        redirect(302, '/login');
    }

    const orgId = locals.user.orgId;

    // Get expense
    const expenseRows = await db
        .select({
            id: expenses.id,
            expense_number: expenses.expense_number,
            expense_date: expenses.expense_date,
            category: expenses.category,
            vendor_id: expenses.vendor_id,
            vendor_name: expenses.vendor_name,
            vendor_display_name: vendors.display_name,
            vendor_actual_name: vendors.name,
            description: expenses.description,
            amount: expenses.amount,
            gst_rate: expenses.gst_rate,
            cgst: expenses.cgst,
            sgst: expenses.sgst,
            igst: expenses.igst,
            total: expenses.total,
            payment_status: expenses.payment_status,
            paid_through: expenses.paid_through,
            amount_settled: expenses.amount_settled,
            balance_due: expenses.balance_due,
            reference: expenses.reference,
            created_at: expenses.created_at,
            category_name: accounts.account_name
        })
        .from(expenses)
        .leftJoin(accounts, eq(expenses.category, accounts.id))
        .leftJoin(vendors, eq(expenses.vendor_id, vendors.id))
        .where(
            and(
                eq(expenses.id, params.id),
                eq(expenses.org_id, orgId)
            )
        )
        .limit(1);
    const expense = expenseRows[0];

    if (!expense) {
        redirect(302, '/expenses');
    }

    // Get payment account name
    const paymentAccount = expense.paid_through
        ? await db.query.payment_accounts.findFirst({
            where: and(eq(payment_accounts.id, expense.paid_through), eq(payment_accounts.org_id, orgId))
        })
        : null;

    const settlements = await db
        .select({
            id: supplier_payment_allocations.id,
            amount: supplier_payment_allocations.amount,
            date: supplier_payments.payment_date,
            payment_number: supplier_payments.supplier_payment_number,
            reference: supplier_payments.reference,
            method_label: payment_methods.label,
            account_label: payment_accounts.label
        })
        .from(supplier_payment_allocations)
        .innerJoin(supplier_payments, eq(supplier_payment_allocations.supplier_payment_id, supplier_payments.id))
        .leftJoin(payment_methods, eq(supplier_payments.payment_method_id, payment_methods.id))
        .leftJoin(payment_accounts, eq(supplier_payments.payment_account_id, payment_accounts.id))
        .where(
            and(
                eq(supplier_payment_allocations.expense_id, params.id),
                eq(supplier_payments.org_id, orgId)
            )
        )
        .orderBy(desc(supplier_payments.payment_date), desc(supplier_payments.created_at));

    const balanceDue = round2(expense.balance_due || 0);
    const canSettleCredit =
        expense.payment_status === 'unpaid' &&
        Boolean(expense.vendor_id) &&
        balanceDue > MONEY_EPSILON;

    const paymentOptions = canSettleCredit
        ? await listPaymentOptionsForForm(orgId)
        : [];

    return {
        expense,
        canSettleCredit,
        balanceDue,
        settlements,
        paymentOptions,
        defaults: {
            payment_date: localDateStr()
        },
        paymentAccountName: expense.payment_status === 'unpaid'
            ? 'Accounts Payable'
            : paymentAccount?.label || 'Unknown'
    };
};

export const actions: Actions = {
    settle: async ({ request, locals, params }) => {
        if (!locals.user) {
            return fail(401, { error: 'Unauthorized' });
        }

        const orgId = locals.user.orgId;
        const formData = await request.formData();

        const paymentDate = (formData.get('payment_date') as string) || '';
        const paymentMode = (formData.get('payment_mode') as string) || '';
        const paidFrom = (formData.get('paid_from') as string) || '';
        const amount = round2(parseFloat((formData.get('amount') as string) || '0') || 0);
        const reference = (formData.get('reference') as string) || '';
        const notes = (formData.get('notes') as string) || '';

        if (!paymentDate) {
            return fail(400, { error: 'Payment date is required' });
        }
        if (!paymentMode) {
            return fail(400, { error: 'Payment method is required' });
        }
        if (!paidFrom) {
            return fail(400, { error: 'Payment account is required' });
        }
        if (amount <= MONEY_EPSILON) {
            return fail(400, { error: 'Amount must be positive' });
        }

        const expense = await db.query.expenses.findFirst({
            where: and(
                eq(expenses.id, params.id),
                eq(expenses.org_id, orgId)
            )
        });

        if (!expense) {
            return fail(404, { error: 'Expense not found' });
        }
        if (!expense.vendor_id) {
            return fail(400, { error: 'This expense has no supplier linked' });
        }

        const balanceDue = round2(expense.balance_due || 0);
        if (expense.payment_status !== 'unpaid' || balanceDue <= MONEY_EPSILON) {
            return fail(400, { error: 'This expense is already settled' });
        }
        if (amount > balanceDue + MONEY_EPSILON) {
            return fail(400, { error: 'Amount cannot exceed current credit balance' });
        }

        try {
            let paymentNumber = '';
            await runInTx(async (tx) => {
                const result = await createSupplierPaymentInTx(tx, {
                    orgId,
                    userId: locals.user!.id,
                    vendorId: expense.vendor_id!,
                    paymentDate,
                    amount,
                    paymentMode,
                    paidFrom,
                    reference,
                    notes,
                    allocations: [
                        {
                            expense_id: expense.id,
                            amount
                        }
                    ]
                });
                paymentNumber = result.paymentNumber;
            });

            void logActivity({
                orgId,
                userId: locals.user.id,
                entityType: 'expense',
                entityId: expense.id,
                action: 'updated',
                changedFields: {
                    settlement_payment: { new: amount },
                    supplier_payment_number: { new: paymentNumber }
                }
            });

            invalidateReportingCacheForOrg(orgId);
        } catch (error) {
            return failActionFromError(error, 'Expense settlement failed');
        }

        redirect(302, `/expenses/${params.id}?settle=recorded`);
    }
};
