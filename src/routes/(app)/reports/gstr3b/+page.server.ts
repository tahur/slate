import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { expenses, vendors, organizations } from '$lib/server/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { calculateGSTR3BData, type GSTR3BExpense } from '$lib/server/utils/gst-export';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
    if (!locals.user) {
        redirect(302, '/login');
    }

    const orgId = locals.user.orgId;

    // Default to current month
    const now = new Date();
    const defaultStartDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const defaultEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const startDate = url.searchParams.get('from') || defaultStartDate;
    const endDate = url.searchParams.get('to') || defaultEndDate;

    // Get organization
    const org = await db.query.organizations.findFirst({
        where: eq(organizations.id, orgId)
    });

    // Get expenses with vendor data
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

    // Get all vendors for the org
    const vendorRows = await db
        .select()
        .from(vendors)
        .where(eq(vendors.org_id, orgId));
    const vendorMap = new Map(vendorRows.map(v => [v.id, v]));

    // Build expenses with vendor info
    const expensesWithVendors: GSTR3BExpense[] = expenseRows.map(exp => ({
        ...exp,
        vendor: exp.vendor_id ? vendorMap.get(exp.vendor_id) || null : null
    }));

    // Calculate GSTR-3B data
    const gstr3bData = calculateGSTR3BData(expensesWithVendors);

    // Add period info
    const periodStart = new Date(startDate);
    const periodEnd = new Date(endDate);
    const period = `${periodStart.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })} - ${periodEnd.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}`;
    gstr3bData.period = period;

    return {
        startDate,
        endDate,
        period,
        gstin: org?.gstin || '',
        data: gstr3bData
    };
};
