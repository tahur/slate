import { db } from '$lib/server/db';
import { accounts, invoices, expenses, audit_log, customers, payments, vendors } from '$lib/server/db/schema';
import { eq, and, ne, sql, gte, lte, desc, gt, inArray } from 'drizzle-orm';
import { localDateStr } from '$lib/utils/date';

export interface MoneyPosition {
    cash: number;
    bank: number;
    toCollect: number;
    payables: number;
    gstDue: number;
    gstOutput: number;
    gstInput: number;
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

const DASHBOARD_CACHE_TTL_MS = 30_000;

const dashboardCache = new Map<
    string,
    {
        expiresAt: number;
        data: DashboardData;
    }
>();

interface AccountMetrics {
    cash: number;
    bank: number;
    payables: number;
    gstOutputRaw: number;
    gstInput: number;
}

interface InvoiceMetrics {
    toCollect: number;
    salesMonth: number;
    overdueCount: number;
    overdueAmount: number;
    dueSoonCount: number;
    dueSoonAmount: number;
}

function getCachedDashboardData(orgId: string): DashboardData | null {
    const cached = dashboardCache.get(orgId);
    if (!cached) return null;
    if (Date.now() > cached.expiresAt) {
        dashboardCache.delete(orgId);
        return null;
    }
    return cached.data;
}

function cacheDashboardData(orgId: string, data: DashboardData): void {
    dashboardCache.set(orgId, {
        expiresAt: Date.now() + DASHBOARD_CACHE_TTL_MS,
        data
    });
}

export function invalidateDashboardCacheForOrg(orgId: string): void {
    dashboardCache.delete(orgId);
}

export async function getDashboardData(orgId: string): Promise<DashboardData> {
    const cached = getCachedDashboardData(orgId);
    if (cached) {
        return cached;
    }

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const startDate = localDateStr(firstDayOfMonth);
    const endDate = localDateStr(lastDayOfMonth);
    const todayStr = localDateStr(now);
    const nextWeek = new Date(now);
    nextWeek.setDate(now.getDate() + 7);
    const nextWeekStr = localDateStr(nextWeek);

    const [accountMetrics, invoiceMetrics, monthlyExpenseTotal, recentActivity, dueInvoices] = await Promise.all([
        getAccountMetrics(orgId),
        getInvoiceMetrics(orgId, startDate, endDate, todayStr, nextWeekStr),
        getMonthlyExpenseTotal(orgId, startDate, endDate),
        getRecentActivity(orgId),
        getDueInvoices(orgId)
    ]);

    const outputGst = Math.abs(accountMetrics.gstOutputRaw);
    const money: MoneyPosition = {
        cash: accountMetrics.cash,
        bank: accountMetrics.bank,
        toCollect: invoiceMetrics.toCollect,
        payables: accountMetrics.payables,
        gstOutput: outputGst,
        gstInput: accountMetrics.gstInput,
        gstDue: outputGst - accountMetrics.gstInput
    };

    const monthly: MonthlyStats = {
        sales: invoiceMetrics.salesMonth,
        expenses: monthlyExpenseTotal,
        profit: invoiceMetrics.salesMonth - monthlyExpenseTotal
    };

    const alerts: { overdue: Alert; dueSoon: Alert } = {
        overdue: {
            type: 'overdue',
            count: invoiceMetrics.overdueCount,
            amount: invoiceMetrics.overdueAmount
        },
        dueSoon: {
            type: 'due_soon',
            count: invoiceMetrics.dueSoonCount,
            amount: invoiceMetrics.dueSoonAmount
        }
    };

    const data: DashboardData = {
        money,
        monthly,
        alerts,
        recentActivity,
        dueInvoices
    };

    cacheDashboardData(orgId, data);

    return data;
}

async function getAccountMetrics(orgId: string): Promise<AccountMetrics> {
    const [accountResult, payablesResult] = await Promise.all([
        db
            .select({
                cash: sql<number>`
                    COALESCE(
                        SUM(CASE WHEN ${accounts.account_code} = '1000' THEN ${accounts.balance} ELSE 0 END),
                        0
                    )
                `,
                bank: sql<number>`
                    COALESCE(
                        SUM(CASE WHEN ${accounts.account_code} = '1100' THEN ${accounts.balance} ELSE 0 END),
                        0
                    )
                `,
                gstOutputRaw: sql<number>`
                    COALESCE(
                        SUM(
                            CASE
                                WHEN ${accounts.account_code} IN ('2100', '2101', '2102')
                                THEN ${accounts.balance}
                                ELSE 0
                            END
                        ),
                        0
                    )
                `,
                gstInput: sql<number>`
                    COALESCE(
                        SUM(
                            CASE
                                WHEN ${accounts.account_code} IN ('1300', '1301', '1302')
                                THEN ${accounts.balance}
                                ELSE 0
                            END
                        ),
                        0
                    )
                `
            })
            .from(accounts)
            .where(eq(accounts.org_id, orgId)),
        db
            .select({
                total: sql<number>`COALESCE(SUM(${vendors.balance}), 0)`
            })
            .from(vendors)
            .where(and(eq(vendors.org_id, orgId), gt(vendors.balance, 0)))
    ]);

    const accountRow = accountResult[0];

    return {
        cash: Number(accountRow?.cash) || 0,
        bank: Number(accountRow?.bank) || 0,
        payables: Number(payablesResult[0]?.total) || 0,
        gstOutputRaw: Number(accountRow?.gstOutputRaw) || 0,
        gstInput: Number(accountRow?.gstInput) || 0
    };
}

async function getInvoiceMetrics(
    orgId: string,
    startDate: string,
    endDate: string,
    todayStr: string,
    nextWeekStr: string
): Promise<InvoiceMetrics> {
    const result = await db
        .select({
            toCollect: sql<number>`
                COALESCE(
                    SUM(
                        CASE
                            WHEN ${invoices.status} NOT IN ('draft', 'cancelled', 'paid')
                            THEN ${invoices.balance_due}
                            ELSE 0
                        END
                    ),
                    0
                )
            `,
            salesMonth: sql<number>`
                COALESCE(
                    SUM(
                        CASE
                            WHEN ${invoices.status} NOT IN ('draft', 'cancelled')
                                AND ${invoices.invoice_date} >= ${startDate}
                                AND ${invoices.invoice_date} <= ${endDate}
                            THEN ${invoices.total}
                            ELSE 0
                        END
                    ),
                    0
                )
            `,
            overdueCount: sql<number>`
                COALESCE(
                    SUM(
                        CASE
                            WHEN ${invoices.status} NOT IN ('draft', 'cancelled', 'paid')
                                AND ${invoices.due_date} < ${todayStr}
                                AND ${invoices.balance_due} > 0
                            THEN 1
                            ELSE 0
                        END
                    ),
                    0
                )
            `,
            overdueAmount: sql<number>`
                COALESCE(
                    SUM(
                        CASE
                            WHEN ${invoices.status} NOT IN ('draft', 'cancelled', 'paid')
                                AND ${invoices.due_date} < ${todayStr}
                                AND ${invoices.balance_due} > 0
                            THEN ${invoices.balance_due}
                            ELSE 0
                        END
                    ),
                    0
                )
            `,
            dueSoonCount: sql<number>`
                COALESCE(
                    SUM(
                        CASE
                            WHEN ${invoices.status} NOT IN ('draft', 'cancelled', 'paid')
                                AND ${invoices.due_date} >= ${todayStr}
                                AND ${invoices.due_date} <= ${nextWeekStr}
                                AND ${invoices.balance_due} > 0
                            THEN 1
                            ELSE 0
                        END
                    ),
                    0
                )
            `,
            dueSoonAmount: sql<number>`
                COALESCE(
                    SUM(
                        CASE
                            WHEN ${invoices.status} NOT IN ('draft', 'cancelled', 'paid')
                                AND ${invoices.due_date} >= ${todayStr}
                                AND ${invoices.due_date} <= ${nextWeekStr}
                                AND ${invoices.balance_due} > 0
                            THEN ${invoices.balance_due}
                            ELSE 0
                        END
                    ),
                    0
                )
            `
        })
        .from(invoices)
        .where(eq(invoices.org_id, orgId));

    const row = result[0];

    return {
        toCollect: Number(row?.toCollect) || 0,
        salesMonth: Number(row?.salesMonth) || 0,
        overdueCount: Number(row?.overdueCount) || 0,
        overdueAmount: Number(row?.overdueAmount) || 0,
        dueSoonCount: Number(row?.dueSoonCount) || 0,
        dueSoonAmount: Number(row?.dueSoonAmount) || 0
    };
}

async function getMonthlyExpenseTotal(orgId: string, startDate: string, endDate: string): Promise<number> {
    const result = await db
        .select({
            total: sql<number>`COALESCE(SUM(${expenses.total}), 0)`
        })
        .from(expenses)
        .where(and(eq(expenses.org_id, orgId), gte(expenses.expense_date, startDate), lte(expenses.expense_date, endDate)));

    return Number(result[0]?.total) || 0;
}

async function getRecentActivity(orgId: string): Promise<RecentActivityItem[]> {
    // Get last 5 audit log entries
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

    if (recentLogs.length === 0) return [];

    // Batch-fetch all related entities by type (instead of N+1 queries)
    const invoiceIds = [...new Set(recentLogs.filter((l) => l.entityType === 'invoice').map((l) => l.entityId))];
    const paymentIds = [...new Set(recentLogs.filter((l) => l.entityType === 'payment').map((l) => l.entityId))];
    const expenseIds = [...new Set(recentLogs.filter((l) => l.entityType === 'expense').map((l) => l.entityId))];
    const customerEntityIds = [...new Set(recentLogs.filter((l) => l.entityType === 'customer').map((l) => l.entityId))];

    const [invoiceRows, paymentRows, expenseRows, customerRows] = await Promise.all([
        invoiceIds.length > 0
            ? db.select({ id: invoices.id, invoice_number: invoices.invoice_number, total: invoices.total })
                .from(invoices).where(inArray(invoices.id, invoiceIds))
            : Promise.resolve([]),
        paymentIds.length > 0
            ? db
                .select({
                    id: payments.id,
                    payment_number: payments.payment_number,
                    amount: payments.amount,
                    customer_name: customers.name
                })
                .from(payments)
                .leftJoin(customers, eq(payments.customer_id, customers.id))
                .where(inArray(payments.id, paymentIds))
            : Promise.resolve([]),
        expenseIds.length > 0
            ? db.select({ id: expenses.id, expense_number: expenses.expense_number, total: expenses.total })
                .from(expenses).where(inArray(expenses.id, expenseIds))
            : Promise.resolve([]),
        customerEntityIds.length > 0
            ? db.select({ id: customers.id, name: customers.name })
                .from(customers).where(inArray(customers.id, customerEntityIds))
            : Promise.resolve([])
    ]);

    // Build lookup maps
    const invoiceMap = new Map(invoiceRows.map(r => [r.id, r]));
    const paymentMap = new Map(paymentRows.map(r => [r.id, r]));
    const expenseMap = new Map(expenseRows.map(r => [r.id, r]));
    const customerMap = new Map(customerRows.map(r => [r.id, r]));

    return recentLogs.map(log => {
        let description = formatActivityDescription(log.action, log.entityType);
        let amount: number | undefined;

        if (log.entityType === 'invoice') {
            const inv = invoiceMap.get(log.entityId);
            if (inv) {
                description = `${formatActionVerb(log.action)} Invoice ${inv.invoice_number}`;
                amount = inv.total;
            }
        } else if (log.entityType === 'payment') {
            const pay = paymentMap.get(log.entityId);
            if (pay) {
                description = `Payment received from ${pay.customer_name || 'Customer'}`;
                amount = pay.amount;
            }
        } else if (log.entityType === 'expense') {
            const exp = expenseMap.get(log.entityId);
            if (exp) {
                description = `${formatActionVerb(log.action)} Expense ${exp.expense_number}`;
                amount = exp.total;
            }
        } else if (log.entityType === 'customer') {
            const cust = customerMap.get(log.entityId);
            if (cust) {
                description = `${formatActionVerb(log.action)} customer ${cust.name}`;
            }
        }

        return {
            id: log.id,
            description,
            amount,
            createdAt: log.createdAt || ''
        };
    });
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
    const today = localDateStr();

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
