import { db } from '$lib/server/db';
import { expenses, accounts } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
    const orgId = locals.user!.orgId;

    const expenseList = await db
        .select({
            id: expenses.id,
            expense_number: expenses.expense_number,
            expense_date: expenses.expense_date,
            category: expenses.category,
            vendor_name: expenses.vendor_name,
            description: expenses.description,
            amount: expenses.amount,
            cgst: expenses.cgst,
            sgst: expenses.sgst,
            igst: expenses.igst,
            total: expenses.total,
            category_name: accounts.account_name,
        })
        .from(expenses)
        .leftJoin(accounts, eq(expenses.category, accounts.id))
        .where(eq(expenses.org_id, orgId))
        .orderBy(expenses.expense_date);

    return {
        expenses: expenseList.reverse() // Most recent first
    };
};
