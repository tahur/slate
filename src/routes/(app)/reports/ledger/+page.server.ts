import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { invoices, payments, customers } from '$lib/server/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

interface LedgerEntry {
    date: string;
    type: 'invoice' | 'payment';
    number: string;
    description: string;
    debit: number;
    credit: number;
    balance: number;
    id: string;
}

interface CustomerLedger {
    id: string;
    name: string;
    company_name: string | null;
    entries: LedgerEntry[];
    totalDebit: number;
    totalCredit: number;
    balance: number;
}

export const load: PageServerLoad = async ({ locals, url }) => {
    if (!locals.user) {
        redirect(302, '/login');
    }

    const orgId = locals.user.orgId;
    const selectedCustomerId = url.searchParams.get('customer');

    // Get all customers
    const customerList = await db
        .select({
            id: customers.id,
            name: customers.name,
            company_name: customers.company_name,
            balance: customers.balance
        })
        .from(customers)
        .where(eq(customers.org_id, orgId))
        .orderBy(customers.name);

    if (!selectedCustomerId) {
        return { customers: customerList, ledger: null };
    }

    // Get customer
    const customer = customerList.find(c => c.id === selectedCustomerId);
    if (!customer) {
        return { customers: customerList, ledger: null };
    }

    // Get invoices
    const customerInvoices = await db
        .select({
            id: invoices.id,
            invoice_number: invoices.invoice_number,
            invoice_date: invoices.invoice_date,
            total: invoices.total,
            status: invoices.status
        })
        .from(invoices)
        .where(
            and(
                eq(invoices.org_id, orgId),
                eq(invoices.customer_id, selectedCustomerId)
            )
        )
        .orderBy(invoices.invoice_date);

    // Get payments
    const customerPayments = await db
        .select({
            id: payments.id,
            payment_number: payments.payment_number,
            payment_date: payments.payment_date,
            amount: payments.amount
        })
        .from(payments)
        .where(
            and(
                eq(payments.org_id, orgId),
                eq(payments.customer_id, selectedCustomerId)
            )
        )
        .orderBy(payments.payment_date);

    // Build ledger entries
    const entries: LedgerEntry[] = [];

    for (const inv of customerInvoices) {
        if (inv.status === 'draft' || inv.status === 'cancelled') continue;
        entries.push({
            date: inv.invoice_date,
            type: 'invoice',
            number: inv.invoice_number,
            description: `Invoice ${inv.invoice_number}`,
            debit: inv.total,
            credit: 0,
            balance: 0,
            id: inv.id
        });
    }

    for (const pay of customerPayments) {
        entries.push({
            date: pay.payment_date,
            type: 'payment',
            number: pay.payment_number,
            description: `Payment ${pay.payment_number}`,
            debit: 0,
            credit: pay.amount,
            balance: 0,
            id: pay.id
        });
    }

    // Sort by date
    entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate running balance
    let runningBalance = 0;
    for (const entry of entries) {
        runningBalance += entry.debit - entry.credit;
        entry.balance = runningBalance;
    }

    const ledger: CustomerLedger = {
        id: customer.id,
        name: customer.name,
        company_name: customer.company_name,
        entries,
        totalDebit: entries.reduce((sum, e) => sum + e.debit, 0),
        totalCredit: entries.reduce((sum, e) => sum + e.credit, 0),
        balance: runningBalance
    };

    return { customers: customerList, ledger };
};
