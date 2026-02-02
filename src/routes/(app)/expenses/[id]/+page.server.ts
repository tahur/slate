import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { expenses, accounts } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
    if (!locals.user) {
        redirect(302, '/login');
    }

    const orgId = locals.user.orgId;

    // Get expense
    const expense = await db
        .select({
            id: expenses.id,
            expense_number: expenses.expense_number,
            expense_date: expenses.expense_date,
            category: expenses.category,
            vendor: expenses.vendor,
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
        .get();

    if (!expense) {
        redirect(302, '/expenses');
    }

    // Get payment account name
    const paymentAccount = await db.query.accounts.findFirst({
        where: eq(accounts.id, expense.paid_through)
    });

    return {
        expense,
        paymentAccountName: paymentAccount?.account_name || 'Unknown'
    };
};
