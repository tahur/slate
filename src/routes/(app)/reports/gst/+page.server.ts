import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { invoices, expenses } from '$lib/server/db/schema';
import { eq, and, ne, sql, gte, lte } from 'drizzle-orm';
import { localDateStr } from '$lib/utils/date';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
    if (!locals.user) {
        redirect(302, '/login');
    }

    const orgId = locals.user.orgId;

    // Get date range from query params or default to current month
    const now = new Date();
    const defaultStartDate = localDateStr(new Date(now.getFullYear(), now.getMonth(), 1));
    const defaultEndDate = localDateStr(new Date(now.getFullYear(), now.getMonth() + 1, 0));

    const startDate = url.searchParams.get('from') || defaultStartDate;
    const endDate = url.searchParams.get('to') || defaultEndDate;

    // Get GST collected from invoices
    const invoiceGst = await db
        .select({
            cgst: sql<number>`COALESCE(SUM(${invoices.cgst}), 0)`,
            sgst: sql<number>`COALESCE(SUM(${invoices.sgst}), 0)`,
            igst: sql<number>`COALESCE(SUM(${invoices.igst}), 0)`,
            taxable: sql<number>`COALESCE(SUM(${invoices.taxable_amount}), 0)`,
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

    // Get input GST from expenses
    const expenseGst = await db
        .select({
            cgst: sql<number>`COALESCE(SUM(${expenses.cgst}), 0)`,
            sgst: sql<number>`COALESCE(SUM(${expenses.sgst}), 0)`,
            igst: sql<number>`COALESCE(SUM(${expenses.igst}), 0)`,
            total: sql<number>`COALESCE(SUM(${expenses.amount}), 0)`,
            count: sql<number>`COUNT(*)`
        })
        .from(expenses)
        .where(
            and(
                eq(expenses.org_id, orgId),
                gte(expenses.expense_date, startDate),
                lte(expenses.expense_date, endDate)
            )
        );

    const outputGst = invoiceGst[0] || { cgst: 0, sgst: 0, igst: 0, taxable: 0, count: 0 };
    const inputGst = expenseGst[0] || { cgst: 0, sgst: 0, igst: 0, total: 0, count: 0 };

    const outputTotal = outputGst.cgst + outputGst.sgst + outputGst.igst;
    const inputTotal = inputGst.cgst + inputGst.sgst + inputGst.igst;
    const netLiability = outputTotal - inputTotal;

    return {
        startDate,
        endDate,
        output: {
            cgst: outputGst.cgst,
            sgst: outputGst.sgst,
            igst: outputGst.igst,
            total: outputTotal,
            taxableValue: outputGst.taxable,
            invoiceCount: outputGst.count
        },
        input: {
            cgst: inputGst.cgst,
            sgst: inputGst.sgst,
            igst: inputGst.igst,
            total: inputTotal,
            expenseValue: inputGst.total,
            expenseCount: inputGst.count
        },
        netLiability
    };
};
