import { db } from '$lib/server/db';
import { expenses, vendors, organizations } from '$lib/server/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import {
    calculateGSTR3BData,
    generateCSV,
    GSTR3B_VENDOR_COLUMNS,
    type GSTR3BExpense
} from '$lib/server/utils/gst-export';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, url }) => {
    if (!locals.user) {
        return new Response('Unauthorized', { status: 401 });
    }

    const orgId = locals.user.orgId;

    const now = new Date();
    const defaultStartDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const defaultEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const startDate = url.searchParams.get('from') || defaultStartDate;
    const endDate = url.searchParams.get('to') || defaultEndDate;

    // Get expenses
    const expenseRows = await db
        .select()
        .from(expenses)
        .where(
            and(
                eq(expenses.org_id, orgId),
                gte(expenses.expense_date, startDate),
                lte(expenses.expense_date, endDate)
            )
        );

    // Get vendors
    const vendorRows = await db
        .select()
        .from(vendors)
        .where(eq(vendors.org_id, orgId));
    const vendorMap = new Map(vendorRows.map(v => [v.id, v]));

    const expensesWithVendors: GSTR3BExpense[] = expenseRows.map(exp => ({
        ...exp,
        vendor: exp.vendor_id ? vendorMap.get(exp.vendor_id) || null : null
    }));

    const gstr3bData = calculateGSTR3BData(expensesWithVendors);

    // Generate CSV with vendor data
    let csvContent = '=== GSTR-3B PURCHASE DATA ===\n';
    csvContent += `Period: ${startDate} to ${endDate}\n\n`;

    csvContent += '=== ITC SUMMARY ===\n';
    csvContent += `Total Purchases,${gstr3bData.summary.totalPurchases}\n`;
    csvContent += `Total Expense Value,${gstr3bData.summary.totalExpenseValue}\n`;
    csvContent += `Eligible ITC CGST,${gstr3bData.summary.eligibleItcCgst}\n`;
    csvContent += `Eligible ITC SGST,${gstr3bData.summary.eligibleItcSgst}\n`;
    csvContent += `Eligible ITC IGST,${gstr3bData.summary.eligibleItcIgst}\n`;
    csvContent += `Total Eligible ITC,${gstr3bData.summary.totalEligibleItc}\n`;
    csvContent += `Ineligible ITC,${gstr3bData.summary.ineligibleItc}\n\n`;

    csvContent += '=== VENDOR-WISE BREAKDOWN ===\n';
    csvContent += generateCSV(gstr3bData.vendorWise, GSTR3B_VENDOR_COLUMNS);

    const filename = `GSTR3B_${startDate}_to_${endDate}.csv`;

    return new Response(csvContent, {
        headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="${filename}"`
        }
    });
};
