import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { invoices, expenses, accounts } from '$lib/server/db/schema';
import { eq, and, ne, sql, gte, lte } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
    if (!locals.user) {
        redirect(302, '/login');
    }

    const orgId = locals.user.orgId;

    // Get date range from query params or default to current month
    const now = new Date();
    const defaultStartDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const defaultEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const startDate = url.searchParams.get('from') || defaultStartDate;
    const endDate = url.searchParams.get('to') || defaultEndDate;

    // Get revenue from invoices (taxable amount)
    const revenue = await db
        .select({
            total: sql<number>`COALESCE(SUM(${invoices.taxable_amount}), 0)`,
            count: sql<number>`COUNT(*)`
        })
        .from(invoices)
        .where(
            and(
                eq(invoices.org_id, orgId),
                ne(invoices.status, 'draft'),
                ne(invoices.status, 'cancelled'),
                gte(invoices.invoice_date, startDate),
                lte(invoices.invoice_date, endDate)
            )
        );

    // Get expenses grouped by category
    const expensesByCategory = await db
        .select({
            category: accounts.account_name,
            amount: sql<number>`COALESCE(SUM(${expenses.amount}), 0)`
        })
        .from(expenses)
        .leftJoin(accounts, eq(expenses.category, accounts.id))
        .where(
            and(
                eq(expenses.org_id, orgId),
                gte(expenses.expense_date, startDate),
                lte(expenses.expense_date, endDate)
            )
        )
        .groupBy(accounts.account_name);

    const totalRevenue = revenue[0]?.total || 0;
    const totalExpenses = expensesByCategory.reduce((sum, e) => sum + (e.amount || 0), 0);
    const netProfit = totalRevenue - totalExpenses;

    return {
        startDate,
        endDate,
        revenue: {
            total: totalRevenue,
            invoiceCount: revenue[0]?.count || 0
        },
        expensesByCategory,
        totalExpenses,
        netProfit
    };
};
