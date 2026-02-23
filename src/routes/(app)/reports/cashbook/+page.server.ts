import { redirect } from '@sveltejs/kit';
import { and, eq, gte, inArray, lt, lte, sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import {
    accounts,
    customers,
    expenses,
    invoices,
    payment_accounts,
    payment_allocations,
    payment_methods,
    payments,
    supplier_payment_allocations,
    supplier_payments,
    vendors
} from '$lib/server/db/schema';
import { localDateStr } from '$lib/utils/date';
import { round2 } from '$lib/utils/currency';
import {
    buildCustomerReceiptReason,
    buildSupplierExpenseReason,
    buildSupplierPaymentReason,
    coalesceReasonSnapshot
} from '$lib/server/services/statement-reasons';
import type { PageServerLoad } from './$types';

type AccountOption = {
    id: string;
    name: string;
    code: string;
};

type AccountSummary = {
    accountId: string;
    accountName: string;
    accountCode: string;
    opening: number;
    received: number;
    paid: number;
    net: number;
    closing: number;
};

type StatementEntry = {
    id: string;
    date: string;
    sourceType: 'payment' | 'expense' | 'supplier_payment';
    /** Human-readable remark: e.g. "Full payment against INV-2026-0001" or "Advance" or "Expense" */
    remark: string;
    voucherNumber: string;
    partyName: string;
    reference: string;
    methodLabel: string;
    received: number;
    paid: number;
    balance: number;
    href: string;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function getMonthRange() {
    const now = new Date();
    return {
        startDate: localDateStr(new Date(now.getFullYear(), now.getMonth(), 1)),
        endDate: localDateStr(new Date(now.getFullYear(), now.getMonth() + 1, 0))
    };
}

function parseIsoDateOrDefault(value: string | null, fallback: string): string {
    if (!value || !DATE_RE.test(value)) {
        return fallback;
    }

    const parsed = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(parsed.getTime())) {
        return fallback;
    }

    const normalized = parsed.toISOString().slice(0, 10);
    return normalized === value ? value : fallback;
}

function toAmount(value: number | null | undefined): number {
    return round2(Number(value) || 0);
}

export const load: PageServerLoad = async ({ locals, url }) => {
    if (!locals.user) {
        redirect(302, '/login');
    }

    const orgId = locals.user.orgId;
    const defaults = getMonthRange();

    const startRaw = parseIsoDateOrDefault(url.searchParams.get('from'), defaults.startDate);
    const endRaw = parseIsoDateOrDefault(url.searchParams.get('to'), defaults.endDate);
    const startDate = startRaw <= endRaw ? startRaw : endRaw;
    const endDate = startRaw <= endRaw ? endRaw : startRaw;

    const selectedMethodId = url.searchParams.get('method') || '';

    // Load active payment methods for the filter dropdown
    const paymentMethodsList = await db
        .select({ id: payment_methods.id, label: payment_methods.label })
        .from(payment_methods)
        .where(and(eq(payment_methods.org_id, orgId), eq(payment_methods.is_active, true)))
        .orderBy(payment_methods.sort_order, payment_methods.label);

    // Load ALL active payment accounts so dropdown shows every bank/cash, not only used ones
    const allAccounts: AccountOption[] = await db
        .select({
            id: payment_accounts.id,
            name: payment_accounts.label,
            code: payment_accounts.ledger_code
        })
        .from(payment_accounts)
        .where(and(eq(payment_accounts.org_id, orgId), eq(payment_accounts.is_active, true)))
        .orderBy(payment_accounts.sort_order, payment_accounts.label);

    const accountMeta = new Map<string, AccountOption>();
    for (const account of allAccounts) {
        accountMeta.set(account.id, account);
    }

    const accountOptions = [...allAccounts].sort((a, b) => {
        const left = a.code === '—' ? `ZZZ-${a.name}` : `${a.code}-${a.name}`;
        const right = b.code === '—' ? `ZZZ-${b.name}` : `${b.code}-${b.name}`;
        return left.localeCompare(right);
    });

    const [paymentAccountRows, expenseAccountRows, supplierPaymentAccountRows] = await Promise.all([
        db
            .select({ accountId: payments.deposit_to })
            .from(payments)
            .where(eq(payments.org_id, orgId))
            .groupBy(payments.deposit_to),
        db
            .select({ accountId: expenses.paid_through })
            .from(expenses)
            .where(and(eq(expenses.org_id, orgId), eq(expenses.payment_status, 'paid')))
            .groupBy(expenses.paid_through),
        db
            .select({ accountId: supplier_payments.paid_from })
            .from(supplier_payments)
            .where(eq(supplier_payments.org_id, orgId))
            .groupBy(supplier_payments.paid_from)
    ]);

    const usedAccountIds = Array.from(
        new Set([
            ...paymentAccountRows
                .map((row) => row.accountId)
                .filter((accountId): accountId is string => Boolean(accountId)),
            ...expenseAccountRows
                .map((row) => row.accountId)
                .filter((accountId): accountId is string => Boolean(accountId)),
            ...supplierPaymentAccountRows
                .map((row) => row.accountId)
                .filter((accountId): accountId is string => Boolean(accountId))
        ])
    );

    for (const accountId of usedAccountIds) {
        if (!accountMeta.has(accountId)) {
            accountMeta.set(accountId, {
                id: accountId,
                name: 'Unknown Account',
                code: '—'
            });
        }
    }

    const [
        paymentsBefore,
        expensesBefore,
        supplierPaymentsBefore,
        paymentsInPeriod,
        expensesInPeriod,
        supplierPaymentsInPeriod
    ] = await Promise.all([
        db
            .select({
                accountId: payments.deposit_to,
                total: sql<number>`COALESCE(SUM(${payments.amount}), 0)`
            })
            .from(payments)
            .where(and(eq(payments.org_id, orgId), lt(payments.payment_date, startDate)))
            .groupBy(payments.deposit_to),
        db
            .select({
                accountId: expenses.paid_through,
                total: sql<number>`COALESCE(SUM(${expenses.total}), 0)`
            })
            .from(expenses)
            .where(
                and(
                    eq(expenses.org_id, orgId),
                    eq(expenses.payment_status, 'paid'),
                    lt(expenses.expense_date, startDate)
                )
            )
            .groupBy(expenses.paid_through),
        db
            .select({
                accountId: supplier_payments.paid_from,
                total: sql<number>`COALESCE(SUM(${supplier_payments.amount}), 0)`
            })
            .from(supplier_payments)
            .where(and(eq(supplier_payments.org_id, orgId), lt(supplier_payments.payment_date, startDate)))
            .groupBy(supplier_payments.paid_from),
        db
            .select({
                accountId: payments.deposit_to,
                total: sql<number>`COALESCE(SUM(${payments.amount}), 0)`
            })
            .from(payments)
            .where(
                and(
                    eq(payments.org_id, orgId),
                    gte(payments.payment_date, startDate),
                    lte(payments.payment_date, endDate)
                )
            )
            .groupBy(payments.deposit_to),
        db
            .select({
                accountId: expenses.paid_through,
                total: sql<number>`COALESCE(SUM(${expenses.total}), 0)`
            })
            .from(expenses)
            .where(
                and(
                    eq(expenses.org_id, orgId),
                    eq(expenses.payment_status, 'paid'),
                    gte(expenses.expense_date, startDate),
                    lte(expenses.expense_date, endDate)
                )
            )
            .groupBy(expenses.paid_through),
        db
            .select({
                accountId: supplier_payments.paid_from,
                total: sql<number>`COALESCE(SUM(${supplier_payments.amount}), 0)`
            })
            .from(supplier_payments)
            .where(
                and(
                    eq(supplier_payments.org_id, orgId),
                    gte(supplier_payments.payment_date, startDate),
                    lte(supplier_payments.payment_date, endDate)
                )
            )
            .groupBy(supplier_payments.paid_from)
    ]);

    const summaryMap = new Map<string, AccountSummary>();
    const ensureSummary = (accountId: string): AccountSummary => {
        const existing = summaryMap.get(accountId);
        if (existing) return existing;

        const meta = accountMeta.get(accountId) || {
            id: accountId,
            name: 'Unknown Account',
            code: '—'
        };

        const next: AccountSummary = {
            accountId,
            accountName: meta.name,
            accountCode: meta.code,
            opening: 0,
            received: 0,
            paid: 0,
            net: 0,
            closing: 0
        };
        summaryMap.set(accountId, next);
        return next;
    };

    for (const account of accountOptions) {
        ensureSummary(account.id);
    }

    for (const row of paymentsBefore) {
        if (!row.accountId) continue;
        const summary = ensureSummary(row.accountId);
        summary.opening = toAmount(summary.opening + toAmount(row.total));
    }

    for (const row of expensesBefore) {
        if (!row.accountId) continue;
        const summary = ensureSummary(row.accountId);
        summary.opening = toAmount(summary.opening - toAmount(row.total));
    }
    for (const row of supplierPaymentsBefore) {
        if (!row.accountId) continue;
        const summary = ensureSummary(row.accountId);
        summary.opening = toAmount(summary.opening - toAmount(row.total));
    }

    for (const row of paymentsInPeriod) {
        if (!row.accountId) continue;
        const summary = ensureSummary(row.accountId);
        summary.received = toAmount(summary.received + toAmount(row.total));
    }

    for (const row of expensesInPeriod) {
        if (!row.accountId) continue;
        const summary = ensureSummary(row.accountId);
        summary.paid = toAmount(summary.paid + toAmount(row.total));
    }
    for (const row of supplierPaymentsInPeriod) {
        if (!row.accountId) continue;
        const summary = ensureSummary(row.accountId);
        summary.paid = toAmount(summary.paid + toAmount(row.total));
    }

    const accountSummaries = Array.from(summaryMap.values())
        .map((summary) => {
            const net = toAmount(summary.received - summary.paid);
            const closing = toAmount(summary.opening + net);
            return {
                ...summary,
                opening: toAmount(summary.opening),
                received: toAmount(summary.received),
                paid: toAmount(summary.paid),
                net,
                closing
            };
        })
        .sort((a, b) => {
            const left = a.accountCode === '—' ? `ZZZ-${a.accountName}` : `${a.accountCode}-${a.accountName}`;
            const right = b.accountCode === '—' ? `ZZZ-${b.accountName}` : `${b.accountCode}-${b.accountName}`;
            return left.localeCompare(right);
        });

    const accountSummaryMap = new Map(accountSummaries.map((summary) => [summary.accountId, summary]));

    const selectedFromUrl = url.searchParams.get('account');
    const selectedAccountId =
        selectedFromUrl && accountMeta.has(selectedFromUrl) ? selectedFromUrl : '';

    const overallSummary = accountSummaries.reduce(
        (acc, summary) => ({
            opening: toAmount(acc.opening + summary.opening),
            received: toAmount(acc.received + summary.received),
            paid: toAmount(acc.paid + summary.paid),
            net: toAmount(acc.net + summary.net),
            closing: toAmount(acc.closing + summary.closing)
        }),
        { opening: 0, received: 0, paid: 0, net: 0, closing: 0 }
    );

    const selectedSummary = selectedAccountId
        ? accountSummaryMap.get(selectedAccountId) || {
            accountId: selectedAccountId,
            accountName: accountMeta.get(selectedAccountId)?.name || 'Unknown Account',
            accountCode: accountMeta.get(selectedAccountId)?.code || '—',
            opening: 0,
            received: 0,
            paid: 0,
            net: 0,
            closing: 0
        }
        : {
            accountId: '',
            accountName: 'All Accounts',
            accountCode: 'ALL',
            opening: overallSummary.opening,
            received: overallSummary.received,
            paid: overallSummary.paid,
            net: overallSummary.net,
            closing: overallSummary.closing
        };

    let entries: StatementEntry[] = [];

    if (accountOptions.length > 0) {
        const paymentWhere = [
            eq(payments.org_id, orgId),
            gte(payments.payment_date, startDate),
            lte(payments.payment_date, endDate)
        ];
        if (selectedAccountId) {
            paymentWhere.push(eq(payments.deposit_to, selectedAccountId));
        }
        if (selectedMethodId) {
            paymentWhere.push(eq(payments.payment_method_id, selectedMethodId));
        }

        const expenseWhere = [
            eq(expenses.org_id, orgId),
            eq(expenses.payment_status, 'paid'),
            gte(expenses.expense_date, startDate),
            lte(expenses.expense_date, endDate)
        ];
        if (selectedAccountId) {
            expenseWhere.push(eq(expenses.paid_through, selectedAccountId));
        }
        if (selectedMethodId) {
            expenseWhere.push(eq(expenses.payment_method_id, selectedMethodId));
        }

        const supplierPaymentWhere = [
            eq(supplier_payments.org_id, orgId),
            gte(supplier_payments.payment_date, startDate),
            lte(supplier_payments.payment_date, endDate)
        ];
        if (selectedAccountId) {
            supplierPaymentWhere.push(eq(supplier_payments.paid_from, selectedAccountId));
        }
        if (selectedMethodId) {
            supplierPaymentWhere.push(eq(supplier_payments.payment_method_id, selectedMethodId));
        }

        const [paymentRows, expenseRows, supplierPaymentRows] = await Promise.all([
            db
                .select({
                    id: payments.id,
                    date: payments.payment_date,
                    voucherNumber: payments.payment_number,
                    amount: payments.amount,
                    mode: payments.payment_mode,
                    reference: payments.reference,
                    reasonSnapshot: payments.reason_snapshot,
                    customerName: customers.name,
                    customerCompany: customers.company_name,
                    createdAt: payments.created_at,
                    methodLabel: payment_methods.label
                })
                .from(payments)
                .leftJoin(customers, eq(payments.customer_id, customers.id))
                .leftJoin(payment_methods, eq(payments.payment_method_id, payment_methods.id))
                .where(and(...paymentWhere)),
            db
                .select({
                    id: expenses.id,
                    date: expenses.expense_date,
                    voucherNumber: expenses.expense_number,
                    amount: expenses.total,
                    paymentStatus: expenses.payment_status,
                    reference: expenses.reference,
                    reasonSnapshot: expenses.reason_snapshot,
                    description: expenses.description,
                    categoryName: accounts.account_name,
                    vendorName: expenses.vendor_name,
                    vendorDisplayName: vendors.display_name,
                    vendorActualName: vendors.name,
                    createdAt: expenses.created_at,
                    methodLabel: payment_methods.label
                })
                .from(expenses)
                .leftJoin(vendors, eq(expenses.vendor_id, vendors.id))
                .leftJoin(accounts, eq(expenses.category, accounts.id))
                .leftJoin(payment_methods, eq(expenses.payment_method_id, payment_methods.id))
                .where(and(...expenseWhere)),
            db
                .select({
                    id: supplier_payments.id,
                    date: supplier_payments.payment_date,
                    voucherNumber: supplier_payments.supplier_payment_number,
                    amount: supplier_payments.amount,
                    mode: supplier_payments.payment_mode,
                    reference: supplier_payments.reference,
                    reasonSnapshot: supplier_payments.reason_snapshot,
                    vendorName: vendors.name,
                    vendorDisplayName: vendors.display_name,
                    createdAt: supplier_payments.created_at,
                    methodLabel: payment_methods.label
                })
                .from(supplier_payments)
                .leftJoin(vendors, eq(supplier_payments.vendor_id, vendors.id))
                .leftJoin(payment_methods, eq(supplier_payments.payment_method_id, payment_methods.id))
                .where(and(...supplierPaymentWhere))
        ]);

        const paymentIds = paymentRows.map((r) => r.id);
        type AllocationInfo = { total: number; invoiceNumbers: string[] };
        const allocationByPayment = new Map<string, AllocationInfo>();
        if (paymentIds.length > 0) {
            const allocRows = await db
                .select({
                    paymentId: payment_allocations.payment_id,
                    invoiceNumber: invoices.invoice_number
                })
                .from(payment_allocations)
                .innerJoin(invoices, eq(payment_allocations.invoice_id, invoices.id))
                .where(inArray(payment_allocations.payment_id, paymentIds));

            const totalByPayment = await db
                .select({
                    paymentId: payment_allocations.payment_id,
                    total: sql<number>`COALESCE(SUM(${payment_allocations.amount}), 0)`
                })
                .from(payment_allocations)
                .where(inArray(payment_allocations.payment_id, paymentIds))
                .groupBy(payment_allocations.payment_id);

            for (const row of totalByPayment) {
                allocationByPayment.set(row.paymentId, { total: toAmount(row.total), invoiceNumbers: [] });
            }
            for (const row of allocRows) {
                const info = allocationByPayment.get(row.paymentId);
                if (info && row.invoiceNumber && !info.invoiceNumbers.includes(row.invoiceNumber)) {
                    info.invoiceNumbers.push(row.invoiceNumber);
                }
            }
            for (const [, info] of allocationByPayment) {
                info.invoiceNumbers.sort();
            }
        }

        const supplierPaymentIds = supplierPaymentRows.map((r) => r.id);
        type SupplierAllocationInfo = { total: number; expenseNumbers: string[] };
        const allocationBySupplierPayment = new Map<string, SupplierAllocationInfo>();
        if (supplierPaymentIds.length > 0) {
            const [allocRows, totalBySupplierPayment] = await Promise.all([
                db
                    .select({
                        supplierPaymentId: supplier_payment_allocations.supplier_payment_id,
                        expenseNumber: expenses.expense_number
                    })
                    .from(supplier_payment_allocations)
                    .innerJoin(expenses, eq(supplier_payment_allocations.expense_id, expenses.id))
                    .where(inArray(supplier_payment_allocations.supplier_payment_id, supplierPaymentIds)),
                db
                    .select({
                        supplierPaymentId: supplier_payment_allocations.supplier_payment_id,
                        total: sql<number>`COALESCE(SUM(${supplier_payment_allocations.amount}), 0)`
                    })
                    .from(supplier_payment_allocations)
                    .where(inArray(supplier_payment_allocations.supplier_payment_id, supplierPaymentIds))
                    .groupBy(supplier_payment_allocations.supplier_payment_id)
            ]);

            for (const row of totalBySupplierPayment) {
                allocationBySupplierPayment.set(row.supplierPaymentId, {
                    total: toAmount(row.total),
                    expenseNumbers: []
                });
            }
            for (const row of allocRows) {
                const info = allocationBySupplierPayment.get(row.supplierPaymentId);
                if (info && row.expenseNumber && !info.expenseNumbers.includes(row.expenseNumber)) {
                    info.expenseNumbers.push(row.expenseNumber);
                }
            }
            for (const [, info] of allocationBySupplierPayment) {
                info.expenseNumbers.sort();
            }
        }

        type StatementEntryWithSortKey = StatementEntry & { createdAt: string };

        const combinedEntries: StatementEntryWithSortKey[] = [
            ...paymentRows.map((row) => {
                const info = allocationByPayment.get(row.id) ?? { total: 0, invoiceNumbers: [] };
                const fallbackReason = buildCustomerReceiptReason(
                    toAmount(row.amount),
                    info.total,
                    info.invoiceNumbers
                );
                const remark = coalesceReasonSnapshot(row.reasonSnapshot, fallbackReason);
                return {
                    id: row.id,
                    date: row.date,
                    sourceType: 'payment' as const,
                    remark,
                    voucherNumber: row.voucherNumber,
                    partyName: row.customerName || row.customerCompany || 'Customer',
                    reference: row.reference || row.mode || '',
                    methodLabel: row.methodLabel || '',
                    received: toAmount(row.amount),
                    paid: 0,
                    balance: 0,
                    href: `/payments/${row.id}`,
                    createdAt: row.createdAt || ''
                };
            }),
            ...expenseRows.map((row) => {
                const paymentStatus = row.paymentStatus === 'unpaid' ? 'unpaid' : 'paid';
                const fallbackReason = buildSupplierExpenseReason(
                    row.categoryName,
                    row.description,
                    paymentStatus
                );
                return {
                    id: row.id,
                    date: row.date,
                    sourceType: 'expense' as const,
                    remark: coalesceReasonSnapshot(row.reasonSnapshot, fallbackReason),
                    voucherNumber: row.voucherNumber,
                    partyName: row.vendorDisplayName || row.vendorActualName || row.vendorName || 'Expense',
                    reference: row.reference || '',
                    methodLabel: row.methodLabel || '',
                    received: 0,
                    paid: toAmount(row.amount),
                    balance: 0,
                    href: `/expenses/${row.id}`,
                    createdAt: row.createdAt || ''
                };
            }),
            ...supplierPaymentRows.map((row) => {
                const info = allocationBySupplierPayment.get(row.id) ?? { total: 0, expenseNumbers: [] };
                const fallbackReason = buildSupplierPaymentReason(
                    toAmount(row.amount),
                    info.total,
                    info.expenseNumbers
                );
                return {
                    id: row.id,
                    date: row.date,
                    sourceType: 'supplier_payment' as const,
                    remark: coalesceReasonSnapshot(row.reasonSnapshot, fallbackReason),
                    voucherNumber: row.voucherNumber,
                    partyName: row.vendorDisplayName || row.vendorName || 'Supplier',
                    reference: row.reference || row.mode || '',
                    methodLabel: row.methodLabel || '',
                    received: 0,
                    paid: toAmount(row.amount),
                    balance: 0,
                    href: `/vendor-payments/${row.id}`,
                    createdAt: row.createdAt || ''
                };
            })
        ];

        entries = combinedEntries
            .sort((a, b) => {
                if (a.date !== b.date) {
                    return a.date.localeCompare(b.date);
                }
                if (a.createdAt !== b.createdAt) {
                    return a.createdAt.localeCompare(b.createdAt);
                }
                return a.voucherNumber.localeCompare(b.voucherNumber);
            })
            .map(({ createdAt: _createdAt, ...entry }) => entry);

        let running = selectedSummary?.opening || 0;
        entries = entries.map((entry) => {
            running = toAmount(running + entry.received - entry.paid);
            return {
                ...entry,
                balance: running
            };
        });
    }

    const totals = {
        opening: overallSummary.opening,
        received: overallSummary.received,
        paid: overallSummary.paid,
        closing: overallSummary.closing
    };

    return {
        startDate,
        endDate,
        accounts: accountOptions,
        selectedAccountId,
        selectedSummary,
        accountSummaries,
        entries,
        totals,
        paymentMethods: paymentMethodsList,
        selectedMethodId
    };
};
