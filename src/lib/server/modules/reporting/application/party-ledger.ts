import { and, eq, gte, inArray, lt, lte, ne, sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import {
    accounts,
    credit_notes,
    customers,
    expenses,
    invoices,
    payment_allocations,
    payment_methods,
    payments,
    supplier_payment_allocations,
    supplier_payments,
    vendors
} from '$lib/server/db/schema';
import { round2 } from '$lib/utils/currency';
import {
    buildCustomerReceiptReason,
    buildSupplierExpenseReason,
    buildSupplierPaymentReason,
    coalesceReasonSnapshot
} from '$lib/server/services/statement-reasons';

export type PartyType = 'customer' | 'supplier';

export type PartyOption = {
    id: string;
    name: string;
    companyName: string | null;
    balance: number;
};

export type PartyLedgerEntry = {
    id: string;
    date: string;
    sourceType: 'invoice' | 'receipt' | 'credit_note' | 'expense' | 'supplier_payment';
    number: string;
    reason: string;
    reference: string;
    methodLabel: string;
    charge: number;
    settlement: number;
    balance: number;
    href: string;
};

export type PartyLedger = {
    partyType: PartyType;
    partyId: string;
    partyName: string;
    partyCompanyName: string | null;
    opening: number;
    totalCharges: number;
    totalSettlements: number;
    closing: number;
    entries: PartyLedgerEntry[];
};

export type PartyLedgerPagination = {
    page: number;
    pageSize: number;
    totalEntries: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function toAmount(value: number | null | undefined): number {
    return round2(Number(value) || 0);
}

export function normalizePartyType(value: string | null): PartyType {
    return value === 'supplier' ? 'supplier' : 'customer';
}

export function getFiscalYearRange(now = new Date()) {
    const year = now.getFullYear();
    const month = now.getMonth();
    const startYear = month >= 3 ? year : year - 1;
    const endYear = month >= 3 ? year + 1 : year;

    return {
        startDate: `${startYear}-04-01`,
        endDate: `${endYear}-03-31`
    };
}

export function parseIsoDateOrDefault(value: string | null, fallback: string): string {
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

export async function listPartyOptions(orgId: string): Promise<{ customers: PartyOption[]; suppliers: PartyOption[] }> {
    const [customerRows, supplierRows] = await Promise.all([
        db
            .select({
                id: customers.id,
                name: customers.name,
                companyName: customers.company_name,
                balance: customers.balance
            })
            .from(customers)
            .where(eq(customers.org_id, orgId))
            .orderBy(customers.name),
        db
            .select({
                id: vendors.id,
                name: vendors.name,
                displayName: vendors.display_name,
                companyName: vendors.company_name,
                balance: vendors.balance
            })
            .from(vendors)
            .where(and(eq(vendors.org_id, orgId), eq(vendors.is_active, true)))
            .orderBy(vendors.name)
    ]);

    return {
        customers: customerRows.map((row) => ({
            id: row.id,
            name: row.name,
            companyName: row.companyName,
            balance: toAmount(row.balance)
        })),
        suppliers: supplierRows.map((row) => ({
            id: row.id,
            name: row.displayName || row.name,
            companyName: row.companyName,
            balance: toAmount(row.balance)
        }))
    };
}

function paginateLedgerEntries(
    entries: PartyLedgerEntry[],
    requestedPage: number,
    requestedPageSize: number
): { entries: PartyLedgerEntry[]; pagination: PartyLedgerPagination } {
    const totalEntries = entries.length;
    const pageSize = Math.max(1, requestedPageSize);
    const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
    const page = Math.max(1, Math.min(requestedPage, totalPages));
    const offset = (page - 1) * pageSize;

    return {
        entries: entries.slice(offset, offset + pageSize),
        pagination: {
            page,
            pageSize,
            totalEntries,
            totalPages,
            hasPreviousPage: page > 1,
            hasNextPage: page < totalPages
        }
    };
}

type BuildPartyLedgerInput = {
    orgId: string;
    partyType: PartyType;
    partyId: string;
    partyName: string;
    partyCompanyName: string | null;
    startDate: string;
    endDate: string;
    page: number;
    pageSize: number;
};

export async function buildPartyLedger(input: BuildPartyLedgerInput): Promise<{
    ledger: PartyLedger;
    pagination: PartyLedgerPagination;
}> {
    if (input.partyType === 'customer') {
        const [
            periodInvoices,
            periodPayments,
            periodCreditNotes,
            beforeInvoices,
            beforePayments,
            beforeCreditNotes
        ] = await Promise.all([
            db
                .select({
                    id: invoices.id,
                    number: invoices.invoice_number,
                    date: invoices.invoice_date,
                    total: invoices.total,
                    createdAt: invoices.created_at
                })
                .from(invoices)
                .where(
                    and(
                        eq(invoices.org_id, input.orgId),
                        eq(invoices.customer_id, input.partyId),
                        ne(invoices.status, 'draft'),
                        ne(invoices.status, 'cancelled'),
                        gte(invoices.invoice_date, input.startDate),
                        lte(invoices.invoice_date, input.endDate)
                    )
                ),
            db
                .select({
                    id: payments.id,
                    number: payments.payment_number,
                    date: payments.payment_date,
                    amount: payments.amount,
                    reasonSnapshot: payments.reason_snapshot,
                    reference: payments.reference,
                    mode: payments.payment_mode,
                    methodLabel: payment_methods.label,
                    createdAt: payments.created_at
                })
                .from(payments)
                .leftJoin(payment_methods, eq(payments.payment_method_id, payment_methods.id))
                .where(
                    and(
                        eq(payments.org_id, input.orgId),
                        eq(payments.customer_id, input.partyId),
                        gte(payments.payment_date, input.startDate),
                        lte(payments.payment_date, input.endDate)
                    )
                ),
            db
                .select({
                    id: credit_notes.id,
                    number: credit_notes.credit_note_number,
                    date: credit_notes.credit_note_date,
                    total: credit_notes.total,
                    reason: credit_notes.reason,
                    createdAt: credit_notes.created_at
                })
                .from(credit_notes)
                .where(
                    and(
                        eq(credit_notes.org_id, input.orgId),
                        eq(credit_notes.customer_id, input.partyId),
                        ne(credit_notes.status, 'cancelled'),
                        gte(credit_notes.credit_note_date, input.startDate),
                        lte(credit_notes.credit_note_date, input.endDate)
                    )
                ),
            db
                .select({
                    total: sql<number>`COALESCE(SUM(${invoices.total}), 0)`
                })
                .from(invoices)
                .where(
                    and(
                        eq(invoices.org_id, input.orgId),
                        eq(invoices.customer_id, input.partyId),
                        ne(invoices.status, 'draft'),
                        ne(invoices.status, 'cancelled'),
                        lt(invoices.invoice_date, input.startDate)
                    )
                ),
            db
                .select({
                    total: sql<number>`COALESCE(SUM(${payments.amount}), 0)`
                })
                .from(payments)
                .where(
                    and(
                        eq(payments.org_id, input.orgId),
                        eq(payments.customer_id, input.partyId),
                        lt(payments.payment_date, input.startDate)
                    )
                ),
            db
                .select({
                    total: sql<number>`COALESCE(SUM(${credit_notes.total}), 0)`
                })
                .from(credit_notes)
                .where(
                    and(
                        eq(credit_notes.org_id, input.orgId),
                        eq(credit_notes.customer_id, input.partyId),
                        ne(credit_notes.status, 'cancelled'),
                        lt(credit_notes.credit_note_date, input.startDate)
                    )
                )
        ]);

        const paymentIds = periodPayments.map((payment) => payment.id);
        type AllocationInfo = { total: number; invoiceNumbers: string[] };
        const allocationByPayment = new Map<string, AllocationInfo>();

        if (paymentIds.length > 0) {
            const [allocationRows, allocationTotals] = await Promise.all([
                db
                    .select({
                        paymentId: payment_allocations.payment_id,
                        invoiceNumber: invoices.invoice_number
                    })
                    .from(payment_allocations)
                    .innerJoin(invoices, eq(payment_allocations.invoice_id, invoices.id))
                    .where(inArray(payment_allocations.payment_id, paymentIds)),
                db
                    .select({
                        paymentId: payment_allocations.payment_id,
                        total: sql<number>`COALESCE(SUM(${payment_allocations.amount}), 0)`
                    })
                    .from(payment_allocations)
                    .where(inArray(payment_allocations.payment_id, paymentIds))
                    .groupBy(payment_allocations.payment_id)
            ]);

            for (const row of allocationTotals) {
                allocationByPayment.set(row.paymentId, {
                    total: toAmount(row.total),
                    invoiceNumbers: []
                });
            }

            for (const row of allocationRows) {
                const info = allocationByPayment.get(row.paymentId);
                if (!info || !row.invoiceNumber) continue;
                if (!info.invoiceNumbers.includes(row.invoiceNumber)) {
                    info.invoiceNumbers.push(row.invoiceNumber);
                }
            }

            for (const [, info] of allocationByPayment) {
                info.invoiceNumbers.sort();
            }
        }

        type SortableEntry = PartyLedgerEntry & { createdAt: string };
        const combinedEntries: SortableEntry[] = [
            ...periodInvoices.map((row) => ({
                id: row.id,
                date: row.date,
                sourceType: 'invoice' as const,
                number: row.number,
                reason: 'Sales bill issued',
                reference: '',
                methodLabel: '',
                charge: toAmount(row.total),
                settlement: 0,
                balance: 0,
                href: `/invoices/${row.id}`,
                createdAt: row.createdAt || ''
            })),
            ...periodPayments.map((row) => {
                const info = allocationByPayment.get(row.id) ?? { total: 0, invoiceNumbers: [] };
                const fallbackReason = buildCustomerReceiptReason(
                    toAmount(row.amount),
                    info.total,
                    info.invoiceNumbers
                );
                return {
                    id: row.id,
                    date: row.date,
                    sourceType: 'receipt' as const,
                    number: row.number,
                    reason: coalesceReasonSnapshot(row.reasonSnapshot, fallbackReason),
                    reference: row.reference || row.mode || '',
                    methodLabel: row.methodLabel || '',
                    charge: 0,
                    settlement: toAmount(row.amount),
                    balance: 0,
                    href: `/payments/${row.id}`,
                    createdAt: row.createdAt || ''
                };
            }),
            ...periodCreditNotes.map((row) => ({
                id: row.id,
                date: row.date,
                sourceType: 'credit_note' as const,
                number: row.number,
                reason: `Credit note: ${row.reason}`,
                reference: '',
                methodLabel: '',
                charge: 0,
                settlement: toAmount(row.total),
                balance: 0,
                href: `/credit-notes/${row.id}`,
                createdAt: row.createdAt || ''
            }))
        ];

        combinedEntries.sort((a, b) => {
            if (a.date !== b.date) {
                return a.date.localeCompare(b.date);
            }
            if (a.createdAt !== b.createdAt) {
                return a.createdAt.localeCompare(b.createdAt);
            }
            return a.number.localeCompare(b.number);
        });

        const opening = toAmount(
            toAmount(beforeInvoices[0]?.total) -
                toAmount(beforePayments[0]?.total) -
                toAmount(beforeCreditNotes[0]?.total)
        );

        let running = opening;
        const allEntries = combinedEntries.map(({ createdAt: _createdAt, ...entry }) => {
            running = toAmount(running + entry.charge - entry.settlement);
            return {
                ...entry,
                balance: running
            };
        });

        const totalCharges = toAmount(allEntries.reduce((sum, entry) => sum + entry.charge, 0));
        const totalSettlements = toAmount(allEntries.reduce((sum, entry) => sum + entry.settlement, 0));
        const paginated = paginateLedgerEntries(allEntries, input.page, input.pageSize);

        return {
            ledger: {
                partyType: input.partyType,
                partyId: input.partyId,
                partyName: input.partyName,
                partyCompanyName: input.partyCompanyName,
                opening,
                totalCharges,
                totalSettlements,
                closing: running,
                entries: paginated.entries
            },
            pagination: paginated.pagination
        };
    }

    const [periodExpenses, periodSupplierPayments, beforeExpenseSummary, beforeSupplierPaymentSummary] =
        await Promise.all([
            db
                .select({
                    id: expenses.id,
                    number: expenses.expense_number,
                    date: expenses.expense_date,
                    total: expenses.total,
                    paymentStatus: expenses.payment_status,
                    creditApplied: expenses.credit_applied,
                    reasonSnapshot: expenses.reason_snapshot,
                    description: expenses.description,
                    reference: expenses.reference,
                    methodLabel: payment_methods.label,
                    categoryName: accounts.account_name,
                    createdAt: expenses.created_at
                })
                .from(expenses)
                .leftJoin(payment_methods, eq(expenses.payment_method_id, payment_methods.id))
                .leftJoin(accounts, eq(expenses.category, accounts.id))
                .where(
                    and(
                        eq(expenses.org_id, input.orgId),
                        eq(expenses.vendor_id, input.partyId),
                        gte(expenses.expense_date, input.startDate),
                        lte(expenses.expense_date, input.endDate)
                    )
                ),
            db
                .select({
                    id: supplier_payments.id,
                    number: supplier_payments.supplier_payment_number,
                    date: supplier_payments.payment_date,
                    amount: supplier_payments.amount,
                    reasonSnapshot: supplier_payments.reason_snapshot,
                    reference: supplier_payments.reference,
                    mode: supplier_payments.payment_mode,
                    methodLabel: payment_methods.label,
                    createdAt: supplier_payments.created_at
                })
                .from(supplier_payments)
                .leftJoin(payment_methods, eq(supplier_payments.payment_method_id, payment_methods.id))
                .where(
                    and(
                        eq(supplier_payments.org_id, input.orgId),
                        eq(supplier_payments.vendor_id, input.partyId),
                        gte(supplier_payments.payment_date, input.startDate),
                        lte(supplier_payments.payment_date, input.endDate)
                    )
                ),
            db
                .select({
                    charge: sql<number>`COALESCE(SUM(${expenses.total}), 0)`,
                    settlement: sql<number>`COALESCE(SUM(CASE
                        WHEN ${expenses.payment_status} = 'paid' THEN ${expenses.total}
                        ELSE ${expenses.credit_applied}
                    END), 0)`
                })
                .from(expenses)
                .where(
                    and(
                        eq(expenses.org_id, input.orgId),
                        eq(expenses.vendor_id, input.partyId),
                        lt(expenses.expense_date, input.startDate)
                    )
                ),
            db
                .select({
                    total: sql<number>`COALESCE(SUM(${supplier_payments.amount}), 0)`
                })
                .from(supplier_payments)
                .where(
                    and(
                        eq(supplier_payments.org_id, input.orgId),
                        eq(supplier_payments.vendor_id, input.partyId),
                        lt(supplier_payments.payment_date, input.startDate)
                    )
                )
        ]);

    const supplierPaymentIds = periodSupplierPayments.map((row) => row.id);
    type SupplierAllocationInfo = { total: number; expenseNumbers: string[] };
    const allocationBySupplierPayment = new Map<string, SupplierAllocationInfo>();

    if (supplierPaymentIds.length > 0) {
        const [allocationRows, allocationTotals] = await Promise.all([
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

        for (const row of allocationTotals) {
            allocationBySupplierPayment.set(row.supplierPaymentId, {
                total: toAmount(row.total),
                expenseNumbers: []
            });
        }

        for (const row of allocationRows) {
            const info = allocationBySupplierPayment.get(row.supplierPaymentId);
            if (!info || !row.expenseNumber) continue;
            if (!info.expenseNumbers.includes(row.expenseNumber)) {
                info.expenseNumbers.push(row.expenseNumber);
            }
        }

        for (const [, info] of allocationBySupplierPayment) {
            info.expenseNumbers.sort();
        }
    }

    type SortableEntry = PartyLedgerEntry & { createdAt: string };
    const combinedEntries: SortableEntry[] = [
        ...periodExpenses.map((row) => {
            const paymentStatus = row.paymentStatus === 'unpaid' ? 'unpaid' : 'paid';
            const baseReason = buildSupplierExpenseReason(
                row.categoryName,
                row.description,
                paymentStatus
            );
            const upfrontSettlement =
                paymentStatus === 'paid'
                    ? toAmount(row.total)
                    : toAmount(row.creditApplied);
            const fallbackReason =
                paymentStatus === 'unpaid' && upfrontSettlement > 0
                    ? `${baseReason} (credit adjusted)`
                    : baseReason;

            return {
                id: row.id,
                date: row.date,
                sourceType: 'expense' as const,
                number: row.number,
                reason: coalesceReasonSnapshot(row.reasonSnapshot, fallbackReason),
                reference: row.reference || '',
                methodLabel: row.methodLabel || '',
                charge: toAmount(row.total),
                settlement: upfrontSettlement,
                balance: 0,
                href: `/expenses/${row.id}`,
                createdAt: row.createdAt || ''
            };
        }),
        ...periodSupplierPayments.map((row) => {
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
                number: row.number,
                reason: coalesceReasonSnapshot(row.reasonSnapshot, fallbackReason),
                reference: row.reference || row.mode || '',
                methodLabel: row.methodLabel || '',
                charge: 0,
                settlement: toAmount(row.amount),
                balance: 0,
                href: `/vendor-payments/${row.id}`,
                createdAt: row.createdAt || ''
            };
        })
    ].sort((a, b) => {
        if (a.date !== b.date) {
            return a.date.localeCompare(b.date);
        }
        if (a.createdAt !== b.createdAt) {
            return a.createdAt.localeCompare(b.createdAt);
        }
        return a.number.localeCompare(b.number);
    });

    const openingCharge = toAmount(beforeExpenseSummary[0]?.charge);
    const openingExpenseSettlement = toAmount(beforeExpenseSummary[0]?.settlement);
    const openingSupplierPayments = toAmount(beforeSupplierPaymentSummary[0]?.total);
    const opening = toAmount(openingCharge - openingExpenseSettlement - openingSupplierPayments);

    let running = opening;
    const allEntries = combinedEntries.map(({ createdAt: _createdAt, ...entry }) => {
        running = toAmount(running + entry.charge - entry.settlement);
        return {
            ...entry,
            balance: running
        };
    });

    const totalCharges = toAmount(allEntries.reduce((sum, entry) => sum + entry.charge, 0));
    const totalSettlements = toAmount(allEntries.reduce((sum, entry) => sum + entry.settlement, 0));
    const paginated = paginateLedgerEntries(allEntries, input.page, input.pageSize);

    return {
        ledger: {
            partyType: input.partyType,
            partyId: input.partyId,
            partyName: input.partyName,
            partyCompanyName: input.partyCompanyName,
            opening,
            totalCharges,
            totalSettlements,
            closing: running,
            entries: paginated.entries
        },
        pagination: paginated.pagination
    };
}
