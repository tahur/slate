import { db } from '$lib/server/db';
import { invoices, expenses, customers, organizations } from '$lib/server/db/schema';
import { eq, and, ne, sql, gte, lte, lt, desc } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
    const orgId = locals.user!.orgId;
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const last30Days = new Date(today);
    last30Days.setDate(today.getDate() - 30);
    const last30DaysStr = last30Days.toISOString().split('T')[0];

    // Fetch Organization Details
    const org = await db.query.organizations.findFirst({
        where: eq(organizations.id, orgId)
    });

    // Metrics
    // 1. Total Receivables (Outstanding Invoices)
    const receivablesResult = await db
        .select({
            count: sql<number>`count(*)`,
            total: sql<number>`COALESCE(sum(${invoices.balance_due}), 0)`
        })
        .from(invoices)
        .where(
            and(
                eq(invoices.org_id, orgId),
                ne(invoices.status, 'draft'),
                ne(invoices.status, 'cancelled')
            )
        );

    // 2. Total Overdue (based on due date)
    const overdueResult = await db
        .select({
            count: sql<number>`count(*)`,
            total: sql<number>`COALESCE(sum(${invoices.balance_due}), 0)`
        })
        .from(invoices)
        .where(
            and(
                eq(invoices.org_id, orgId),
                ne(invoices.status, 'draft'),
                ne(invoices.status, 'cancelled'),
                ne(invoices.status, 'paid'),
                lt(invoices.due_date, todayStr)
            )
        );

    // 3. Sales in last 30 days (for DSO)
    const sales30Result = await db
        .select({
            total: sql<number>`COALESCE(sum(${invoices.total}), 0)`
        })
        .from(invoices)
        .where(
            and(
                eq(invoices.org_id, orgId),
                ne(invoices.status, 'draft'),
                ne(invoices.status, 'cancelled'),
                gte(invoices.invoice_date, last30DaysStr),
                lte(invoices.invoice_date, todayStr)
            )
        );

    const receivables = receivablesResult[0]?.total || 0;
    const sales30 = sales30Result[0]?.total || 0;
    const dso = sales30 > 0 ? (receivables / sales30) * 30 : 0;

    // 4. Recent Invoices
    const recentInvoices = await db
        .select({
            id: invoices.id,
            invoice_number: invoices.invoice_number,
            invoice_date: invoices.invoice_date,
            status: invoices.status,
            total: invoices.total,
            balance_due: invoices.balance_due,
            customer_name: customers.name
        })
        .from(invoices)
        .leftJoin(customers, eq(invoices.customer_id, customers.id))
        .where(eq(invoices.org_id, orgId))
        .orderBy(desc(invoices.invoice_date))
        .limit(5);

    return {
        org,
        stats: {
            receivables,
            receivablesCount: receivablesResult[0]?.count || 0,
            overdue: overdueResult[0]?.total || 0,
            overdueCount: overdueResult[0]?.count || 0,
            dso
        },
        recentInvoices
    };
};
