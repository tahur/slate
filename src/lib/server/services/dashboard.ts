import { db } from '$lib/server/db';
import { accounts, invoices, expenses, audit_log, customers, payments, vendors } from '$lib/server/db/schema';
import { eq, and, ne, sql, gte, lte, lt, desc, or, gt } from 'drizzle-orm';

export interface MoneyPosition {
    cash: number;
    bank: number;
    toCollect: number;
    payables: number;
    gstDue: number;
}

export interface MonthlyStats {
    sales: number;
    expenses: number;
    profit: number;
}

export interface Alert {
    type: 'overdue' | 'due_soon';
    count: number;
    amount: number;
}

export interface RecentActivityItem {
    id: string;
    description: string;
    amount?: number;
    createdAt: string;
}

export interface DashboardData {
    money: MoneyPosition;
    monthly: MonthlyStats;
    alerts: {
        overdue: Alert;
        dueSoon: Alert;
    };
    recentActivity: RecentActivityItem[];
    dueInvoices: DueInvoice[];
}

export interface DueInvoice {
    id: string;
    invoiceNumber: string;
    customerName: string;
    dueDate: string;
    amount: number;
    daysOverdue: number;
}

export async function getDashboardData(orgId: string): Promise<DashboardData> {
    const [money, monthly, alerts, recentActivity, dueInvoices] = await Promise.all([
        getMoneyPosition(orgId),
        getMonthlyStats(orgId),
        getAlerts(orgId),
        getRecentActivity(orgId),
        getDueInvoices(orgId)
    ]);

    return {
        money,
        monthly,
        alerts,
        recentActivity,
        dueInvoices
    };
}

async function getMoneyPosition(orgId: string): Promise<MoneyPosition> {
    // Get Cash balance (account code 1000)
    const cashResult = await db
        .select({ balance: accounts.balance })
        .from(accounts)
        .where(and(eq(accounts.org_id, orgId), eq(accounts.account_code, '1000')));

    // Get Bank balance (account code 1100)
    const bankResult = await db
        .select({ balance: accounts.balance })
        .from(accounts)
        .where(and(eq(accounts.org_id, orgId), eq(accounts.account_code, '1100')));

    // Get total receivables (unpaid invoices)
    const receivablesResult = await db
        .select({
            total: sql<number>`COALESCE(SUM(${invoices.balance_due}), 0)`
        })
        .from(invoices)
        .where(
            and(
                eq(invoices.org_id, orgId),
                ne(invoices.status, 'draft'),
                ne(invoices.status, 'cancelled'),
                ne(invoices.status, 'paid')
            )
        );

    // Get GST accounts for Output GST (2100, 2101, 2102) - liability
    const outputGstResult = await db
        .select({
            total: sql<number>`COALESCE(SUM(${accounts.balance}), 0)`
        })
        .from(accounts)
        .where(
            and(
                eq(accounts.org_id, orgId),
                or(
                    eq(accounts.account_code, '2100'),
                    eq(accounts.account_code, '2101'),
                    eq(accounts.account_code, '2102')
                )
            )
        );

    // Get GST accounts for Input GST (1300, 1301, 1302) - asset (credit)
    const inputGstResult = await db
        .select({
            total: sql<number>`COALESCE(SUM(${accounts.balance}), 0)`
        })
        .from(accounts)
        .where(
            and(
                eq(accounts.org_id, orgId),
                or(
                    eq(accounts.account_code, '1300'),
                    eq(accounts.account_code, '1301'),
                    eq(accounts.account_code, '1302')
                )
            )
        );

    const outputGst = outputGstResult[0]?.total || 0;
    const inputGst = inputGstResult[0]?.total || 0;

    // Get total payables (sum of vendor balances where balance > 0)
    const payablesResult = await db
        .select({
            total: sql<number>`COALESCE(SUM(${vendors.balance}), 0)`
        })
        .from(vendors)
        .where(
            and(
                eq(vendors.org_id, orgId),
                gt(vendors.balance, 0)
            )
        );

    return {
        cash: cashResult[0]?.balance || 0,
        bank: bankResult[0]?.balance || 0,
        toCollect: receivablesResult[0]?.total || 0,
        payables: payablesResult[0]?.total || 0,
        gstDue: outputGst - inputGst
    };
}

async function getMonthlyStats(orgId: string): Promise<MonthlyStats> {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const startDate = firstDayOfMonth.toISOString().split('T')[0];
    const endDate = lastDayOfMonth.toISOString().split('T')[0];

    // Sales this month (non-draft, non-cancelled invoices)
    const salesResult = await db
        .select({
            total: sql<number>`COALESCE(SUM(${invoices.total}), 0)`
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

    // Expenses this month
    const expensesResult = await db
        .select({
            total: sql<number>`COALESCE(SUM(${expenses.total}), 0)`
        })
        .from(expenses)
        .where(
            and(
                eq(expenses.org_id, orgId),
                gte(expenses.expense_date, startDate),
                lte(expenses.expense_date, endDate)
            )
        );

    const totalSales = salesResult[0]?.total || 0;
    const totalExpenses = expensesResult[0]?.total || 0;

    return {
        sales: totalSales,
        expenses: totalExpenses,
        profit: totalSales - totalExpenses
    };
}

async function getAlerts(orgId: string): Promise<{ overdue: Alert; dueSoon: Alert }> {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString().split('T')[0];

    // Overdue invoices: due_date < today, balance_due > 0
    const overdueResult = await db
        .select({
            count: sql<number>`COUNT(*)`,
            total: sql<number>`COALESCE(SUM(${invoices.balance_due}), 0)`
        })
        .from(invoices)
        .where(
            and(
                eq(invoices.org_id, orgId),
                ne(invoices.status, 'draft'),
                ne(invoices.status, 'cancelled'),
                ne(invoices.status, 'paid'),
                lt(invoices.due_date, todayStr),
                sql`${invoices.balance_due} > 0`
            )
        );

    // Due this week: due_date between today and +7 days
    const dueSoonResult = await db
        .select({
            count: sql<number>`COUNT(*)`,
            total: sql<number>`COALESCE(SUM(${invoices.balance_due}), 0)`
        })
        .from(invoices)
        .where(
            and(
                eq(invoices.org_id, orgId),
                ne(invoices.status, 'draft'),
                ne(invoices.status, 'cancelled'),
                ne(invoices.status, 'paid'),
                gte(invoices.due_date, todayStr),
                lte(invoices.due_date, nextWeekStr),
                sql`${invoices.balance_due} > 0`
            )
        );

    return {
        overdue: {
            type: 'overdue',
            count: overdueResult[0]?.count || 0,
            amount: overdueResult[0]?.total || 0
        },
        dueSoon: {
            type: 'due_soon',
            count: dueSoonResult[0]?.count || 0,
            amount: dueSoonResult[0]?.total || 0
        }
    };
}

async function getRecentActivity(orgId: string): Promise<RecentActivityItem[]> {
    // Get last 5 audit log entries with relevant details
    const recentLogs = await db
        .select({
            id: audit_log.id,
            entityType: audit_log.entity_type,
            entityId: audit_log.entity_id,
            action: audit_log.action,
            createdAt: audit_log.created_at
        })
        .from(audit_log)
        .where(eq(audit_log.org_id, orgId))
        .orderBy(desc(audit_log.created_at))
        .limit(5);

    // Enrich with entity details
    const enrichedActivity: RecentActivityItem[] = [];

    for (const log of recentLogs) {
        let description = formatActivityDescription(log.action, log.entityType);
        let amount: number | undefined;

        // Get entity details based on type
        if (log.entityType === 'invoice') {
            const invoice = await db
                .select({
                    invoice_number: invoices.invoice_number,
                    total: invoices.total
                })
                .from(invoices)
                .where(eq(invoices.id, log.entityId))
                .limit(1);

            if (invoice[0]) {
                description = `${formatActionVerb(log.action)} Invoice ${invoice[0].invoice_number}`;
                amount = invoice[0].total;
            }
        } else if (log.entityType === 'payment') {
            const payment = await db
                .select({
                    payment_number: payments.payment_number,
                    amount: payments.amount,
                    customer_id: payments.customer_id
                })
                .from(payments)
                .where(eq(payments.id, log.entityId))
                .limit(1);

            if (payment[0]) {
                const customer = await db
                    .select({ name: customers.name })
                    .from(customers)
                    .where(eq(customers.id, payment[0].customer_id))
                    .limit(1);

                const customerName = customer[0]?.name || 'Customer';
                description = `Payment received from ${customerName}`;
                amount = payment[0].amount;
            }
        } else if (log.entityType === 'expense') {
            const expense = await db
                .select({
                    expense_number: expenses.expense_number,
                    total: expenses.total,
                    description: expenses.description
                })
                .from(expenses)
                .where(eq(expenses.id, log.entityId))
                .limit(1);

            if (expense[0]) {
                description = `${formatActionVerb(log.action)} Expense ${expense[0].expense_number}`;
                amount = expense[0].total;
            }
        } else if (log.entityType === 'customer') {
            const customer = await db
                .select({ name: customers.name })
                .from(customers)
                .where(eq(customers.id, log.entityId))
                .limit(1);

            if (customer[0]) {
                description = `${formatActionVerb(log.action)} customer ${customer[0].name}`;
            }
        }

        enrichedActivity.push({
            id: log.id,
            description,
            amount,
            createdAt: log.createdAt || ''
        });
    }

    return enrichedActivity;
}

function formatActivityDescription(action: string, entityType: string): string {
    const entityLabel = entityType.replace('_', ' ');
    return `${formatActionVerb(action)} ${entityLabel}`;
}

function formatActionVerb(action: string): string {
    switch (action) {
        case 'created':
            return 'Created';
        case 'updated':
            return 'Updated';
        case 'deleted':
            return 'Deleted';
        case 'issued':
            return 'Issued';
        case 'cancelled':
            return 'Cancelled';
        case 'paid':
            return 'Paid';
        case 'partially_paid':
            return 'Partially paid';
        default:
            return action.charAt(0).toUpperCase() + action.slice(1);
    }
}

async function getDueInvoices(orgId: string): Promise<DueInvoice[]> {
    const today = new Date().toISOString().split('T')[0];

    const results = await db
        .select({
            id: invoices.id,
            invoiceNumber: invoices.invoice_number,
            dueDate: invoices.due_date,
            amount: invoices.balance_due,
            customerName: customers.name
        })
        .from(invoices)
        .leftJoin(customers, eq(invoices.customer_id, customers.id))
        .where(
            and(
                eq(invoices.org_id, orgId),
                ne(invoices.status, 'draft'),
                ne(invoices.status, 'cancelled'),
                ne(invoices.status, 'paid')
            )
        )
        .orderBy(invoices.due_date)
        .limit(5);

    return results.map(inv => {
        const due = new Date(inv.dueDate);
        const now = new Date();
        const diffTime = now.getTime() - due.getTime();
        const daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return {
            id: inv.id,
            invoiceNumber: inv.invoiceNumber,
            customerName: inv.customerName || 'Unknown',
            dueDate: inv.dueDate,
            amount: inv.amount,
            daysOverdue: daysOverdue > 0 ? daysOverdue : 0
        };
    });
}
