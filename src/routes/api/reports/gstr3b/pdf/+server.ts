import { db } from '$lib/server/db';
import { expenses, vendors, organizations } from '$lib/server/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import {
    calculateGSTR3BData,
    type GSTR3BExpense
} from '$lib/server/utils/gst-export';
import { buildGSTR3BDocDefinition } from '$lib/pdf/gstr3b-template';
import { generatePdfBuffer } from '$lib/pdf/generate';
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

    // Format period
    const periodStart = new Date(startDate);
    const periodEnd = new Date(endDate);
    const period = `${periodStart.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })} - ${periodEnd.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}`;
    gstr3bData.period = period;

    try {
        const doc = buildGSTR3BDocDefinition({
            orgName: org?.name || 'OpenBill',
            gstin: org?.gstin || '',
            period,
            data: gstr3bData
        });

        const pdf = await generatePdfBuffer(doc);
        const filename = `GSTR3B_${startDate}_to_${endDate}.pdf`;

        return new Response(pdf as BodyInit, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${filename}"`
            }
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('PDF Generation Error:', error);
        return new Response(`PDF Generation Failed: ${message}`, { status: 500 });
    }
};
