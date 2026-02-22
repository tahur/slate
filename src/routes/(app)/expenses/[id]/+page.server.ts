import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { expenses, accounts, payment_accounts } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

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
            vendor_name: expenses.vendor_name,
            description: expenses.description,
            amount: expenses.amount,
            gst_rate: expenses.gst_rate,
            cgst: expenses.cgst,
            sgst: expenses.sgst,
            igst: expenses.igst,
            total: expenses.total,
            paid_through: expenses.paid_through,
            reference: expenses.reference,
            created_at: expenses.created_at,
            category_name: accounts.account_name
        })
        .from(expenses)
        .leftJoin(accounts, eq(expenses.category, accounts.id))
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
    const paymentAccount = await db.query.payment_accounts.findFirst({
        where: and(eq(payment_accounts.id, expense.paid_through), eq(payment_accounts.org_id, orgId))
    });

    return {
        expense,
        paymentAccountName: paymentAccount?.label || 'Unknown'
    };
};
