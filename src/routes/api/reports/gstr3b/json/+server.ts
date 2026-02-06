import { db } from '$lib/server/db';
import { expenses, vendors, organizations } from '$lib/server/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import {
    calculateGSTR3BData,
    generateGSTR3BJSON,
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

    const org = await db.query.organizations.findFirst({
        where: eq(organizations.id, orgId)
    });

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

    // Generate filing period in MMYYYY format
    const periodDate = new Date(startDate);
    const fp = String(periodDate.getMonth() + 1).padStart(2, '0') + periodDate.getFullYear();

    const jsonData = generateGSTR3BJSON(gstr3bData, org?.gstin || '', fp);

    const filename = `GSTR3B_${startDate}_to_${endDate}.json`;

    return new Response(JSON.stringify(jsonData, null, 2), {
        headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="${filename}"`
        }
    });
};
