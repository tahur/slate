import { and, eq, gt, inArray, ne, sql } from 'drizzle-orm';
import { db, type Tx } from '$lib/server/db';
import { accounts, credit_notes, customer_advances, customers, invoices } from '$lib/server/db/schema';
import { round2 } from '$lib/utils/currency';

export type InvoiceSettlementRow = {
    id: string;
    customer_id: string;
    total: number;
    amount_paid: number | null;
    balance_due: number;
    status: string;
};

export type OpenCustomerInvoiceRow = {
    id: string;
    total: number;
    amount_paid: number | null;
    balance_due: number;
};

export function findAvailableAdvanceInTx(
    tx: Tx,
    orgId: string,
    customerId: string,
    advanceId: string,
    epsilon: number
) {
    return tx.query.customer_advances.findFirst({
        where: and(
            eq(customer_advances.id, advanceId),
            eq(customer_advances.org_id, orgId),
            eq(customer_advances.customer_id, customerId),
            gt(customer_advances.balance, epsilon)
        )
    }).sync();
}

export function findAvailableCreditNoteInTx(
    tx: Tx,
    orgId: string,
    customerId: string,
    creditNoteId: string,
    epsilon: number
) {
    return tx.query.credit_notes.findFirst({
        where: and(
            eq(credit_notes.id, creditNoteId),
            eq(credit_notes.org_id, orgId),
            eq(credit_notes.customer_id, customerId),
            eq(credit_notes.status, 'issued'),
            gt(credit_notes.balance, epsilon)
        )
    }).sync();
}

export function findDepositAccountForModeInTx(tx: Tx, orgId: string, paymentMode: string) {
    const accountCode = paymentMode === 'cash' ? '1000' : '1100';

    return tx.query.accounts.findFirst({
        where: and(eq(accounts.account_code, accountCode), eq(accounts.org_id, orgId))
    }).sync();
}

export function findInvoiceForSettlementInTx(tx: Tx, orgId: string, invoiceId: string): InvoiceSettlementRow | undefined {
    return tx.query.invoices.findFirst({
        where: and(eq(invoices.id, invoiceId), eq(invoices.org_id, orgId)),
        columns: {
            id: true,
            customer_id: true,
            total: true,
            amount_paid: true,
            balance_due: true,
            status: true
        }
    }).sync();
}

export function findCustomerInOrgInTx(tx: Tx, orgId: string, customerId: string) {
    return tx.query.customers.findFirst({
        where: and(eq(customers.id, customerId), eq(customers.org_id, orgId))
    }).sync();
}

export function findDepositAccountByIdInTx(tx: Tx, orgId: string, accountId: string) {
    return tx.query.accounts.findFirst({
        where: and(eq(accounts.id, accountId), eq(accounts.org_id, orgId))
    }).sync();
}

export function findOpenInvoicesByIdsInTx(
    tx: Tx,
    orgId: string,
    customerId: string,
    invoiceIds: string[]
): OpenCustomerInvoiceRow[] {
    if (invoiceIds.length === 0) {
        return [];
    }

    return tx
        .select({
            id: invoices.id,
            total: invoices.total,
            amount_paid: invoices.amount_paid,
            balance_due: invoices.balance_due
        })
        .from(invoices)
        .where(
            and(
                eq(invoices.org_id, orgId),
                eq(invoices.customer_id, customerId),
                inArray(invoices.id, invoiceIds),
                ne(invoices.status, 'paid'),
                ne(invoices.status, 'cancelled'),
                ne(invoices.status, 'draft')
            )
        )
        .all();
}

export function setInvoiceSettlementStateInTx(
    tx: Tx,
    invoiceId: string,
    invoiceTotal: number,
    newBalanceDue: number,
    epsilon: number,
    nowIso: string
) {
    const normalizedBalanceDue = round2(Math.max(0, newBalanceDue));
    const normalizedAmountPaid = round2(invoiceTotal - normalizedBalanceDue);
    const newStatus = normalizedBalanceDue <= epsilon ? 'paid' : 'partially_paid';

    tx
        .update(invoices)
        .set({
            amount_paid: normalizedAmountPaid,
            balance_due: normalizedBalanceDue,
            status: newStatus,
            updated_at: nowIso
        })
        .where(eq(invoices.id, invoiceId))
        .run();

    return {
        amountPaid: normalizedAmountPaid,
        balanceDue: normalizedBalanceDue,
        status: newStatus as 'paid' | 'partially_paid'
    };
}

export function decreaseCustomerBalanceInTx(tx: Tx, customerId: string, amount: number, nowIso: string) {
    tx
        .update(customers)
        .set({
            balance: sql`${customers.balance} - ${amount}`,
            updated_at: nowIso
        })
        .where(eq(customers.id, customerId))
        .run();
}

export async function listPaymentCustomers(orgId: string) {
    return db
        .select({
            id: customers.id,
            name: customers.name,
            company_name: customers.company_name,
            balance: customers.balance
        })
        .from(customers)
        .where(eq(customers.org_id, orgId))
        .orderBy(customers.name);
}

export async function listDepositAccounts(orgId: string) {
    return db
        .select({
            id: accounts.id,
            name: accounts.account_name,
            code: accounts.account_code
        })
        .from(accounts)
        .where(and(eq(accounts.org_id, orgId), inArray(accounts.account_code, ['1000', '1100'])));
}

export async function listUnpaidCustomerInvoices(orgId: string, customerId: string) {
    return db
        .select({
            id: invoices.id,
            invoice_number: invoices.invoice_number,
            invoice_date: invoices.invoice_date,
            total: invoices.total,
            balance_due: invoices.balance_due
        })
        .from(invoices)
        .where(
            and(
                eq(invoices.org_id, orgId),
                eq(invoices.customer_id, customerId),
                ne(invoices.status, 'paid'),
                ne(invoices.status, 'cancelled'),
                ne(invoices.status, 'draft')
            )
        )
        .orderBy(invoices.invoice_date);
}
