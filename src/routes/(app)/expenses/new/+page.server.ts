import { redirect, fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { expenses, accounts } from '$lib/server/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import type { PageServerLoad, Actions } from './$types';
import { getNextNumber, postExpense } from '$lib/server/services';

export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.user) {
        redirect(302, '/login');
    }

    const orgId = locals.user.orgId;

    // Get expense categories (expense accounts)
    const expenseAccounts = await db
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
        .orderBy(accounts.account_code);

    // Get payment accounts (Cash, Bank)
    const paymentAccounts = await db
        .select({
            id: accounts.id,
            name: accounts.account_name,
            code: accounts.account_code
        })
        .from(accounts)
        .where(
            and(
                eq(accounts.org_id, orgId),
                sql`${accounts.account_code} IN ('1000', '1100')`
            )
        );

    return {
        expenseAccounts,
        paymentAccounts,
        defaults: {
            expense_date: new Date().toISOString().split('T')[0]
        }
    };
};

export const actions: Actions = {
    default: async ({ request, locals }) => {
        if (!locals.user) {
            redirect(302, '/login');
        }

        const orgId = locals.user.orgId;
        const formData = await request.formData();

        // Parse form data
        const expense_date = formData.get('expense_date') as string;
        const category = formData.get('category') as string;
        const vendor = formData.get('vendor') as string || '';
        const description = formData.get('description') as string || '';
        const amount = parseFloat(formData.get('amount') as string) || 0;
        const gst_rate = parseFloat(formData.get('gst_rate') as string) || 0;
        const is_inter_state = formData.get('is_inter_state') === 'on';
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
        if (!paid_through) {
            return fail(400, { error: 'Payment account is required' });
        }

        // Calculate GST
        const gstAmount = (amount * gst_rate) / 100;
        let cgst = 0, sgst = 0, igst = 0;

        if (is_inter_state) {
            igst = gstAmount;
        } else {
            cgst = gstAmount / 2;
            sgst = gstAmount / 2;
        }

        const total = amount + gstAmount;

        try {
            // Generate expense number
            const expenseNumber = await getNextNumber(orgId, 'expense');
            const expenseId = crypto.randomUUID();

            // Get category account code
            const categoryAccount = await db.query.accounts.findFirst({
                where: eq(accounts.id, category)
            });

            if (!categoryAccount) {
                return fail(400, { error: 'Invalid category' });
            }

            // Determine payment mode
            const paymentAccount = await db.query.accounts.findFirst({
                where: eq(accounts.id, paid_through)
            });
            const paidThrough = paymentAccount?.account_code === '1000' ? 'cash' : 'bank';

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
                description: description || `Expense: ${categoryAccount.account_name}`,
                userId: locals.user.id
            });

            // Create expense record
            await db.insert(expenses).values({
                id: expenseId,
                org_id: orgId,
                expense_number: expenseNumber,
                expense_date,
                category,
                vendor,
                description,
                amount,
                gst_rate,
                cgst,
                sgst,
                igst,
                total,
                paid_through,
                reference,
                journal_entry_id: postingResult.journalEntryId,
                created_by: locals.user.id
            });

        } catch (error) {
            console.error('Failed to record expense:', error);
            return fail(500, {
                error: error instanceof Error ? error.message : 'Failed to record expense'
            });
        }

        redirect(302, '/expenses');
    }
};
