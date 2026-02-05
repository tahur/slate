import { db } from '$lib/server/db';
import { expenses, accounts, vendors } from '$lib/server/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
    const orgId = locals.user!.orgId;

    const expenseList = await db
        .select({
            id: expenses.id,
            expense_number: expenses.expense_number,
            expense_date: expenses.expense_date,
            category: expenses.category,
            vendor_id: expenses.vendor_id,
            vendor_name: expenses.vendor_name,
            description: expenses.description,
            amount: expenses.amount,
            cgst: expenses.cgst,
            sgst: expenses.sgst,
            igst: expenses.igst,
            total: expenses.total,
            category_name: accounts.account_name,
            vendor_display_name: vendors.display_name,
            vendor_actual_name: vendors.name,
        })
        .from(expenses)
        .leftJoin(accounts, eq(expenses.category, accounts.id))
        .leftJoin(vendors, eq(expenses.vendor_id, vendors.id))
        .where(eq(expenses.org_id, orgId))
        .orderBy(desc(expenses.expense_date));

    return {
        expenses: expenseList
    };
};
