import { db } from '$lib/server/db';
import { invoices, expenses, accounts, organizations } from '$lib/server/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
    const orgId = locals.user!.orgId;

    // Fetch Organization Details
    const org = await db.query.organizations.findFirst({
        where: eq(organizations.id, orgId)
    });

    // Metrics
    // 1. Total Receivables (Outstanding Invoices)
    const receivablesResult = await db
        .select({
            count: sql<number>`count(*)`,
            total: sql<number>`sum(${invoices.total} - ${invoices.amount_paid})`
        })
        .from(invoices)
        .where(and(eq(invoices.org_id, orgId), eq(invoices.status, 'draft'))); // TODO: Change to 'sent' or 'overdue' when realized

    // 2. Total Expenses
    const expensesResult = await db
        .select({
            total: sql<number>`sum(${expenses.total})`
        })
        .from(expenses)
        .where(eq(expenses.org_id, orgId));

    // 3. Cash on Hand (Bank + Cash accounts) - approximated by just fetching all accounts for now or specific types if we had them distinct
    // For now, simpler to just list recent activity

    return {
        org,
        stats: {
            receivables: receivablesResult[0]?.total || 0,
            receivablesCount: receivablesResult[0]?.count || 0,
            expenses: expensesResult[0]?.total || 0,
            cash: 0 // Placeholder
        }
    };
};
