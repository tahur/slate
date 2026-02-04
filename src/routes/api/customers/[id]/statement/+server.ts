import { db } from '$lib/server/db';
import { customers, invoices, payments, organizations } from '$lib/server/db/schema';
import { buildStatementDocDefinition } from '$lib/pdf/statement-template';
import { generatePdfBuffer } from '$lib/pdf/generate';
import { eq, and, ne, gte, lte, lt, sql } from 'drizzle-orm';
import type { RequestHandler } from './$types';

function getFiscalYearRange(date: Date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const startYear = month >= 3 ? year : year - 1;
    const endYear = month >= 3 ? year + 1 : year;

    return {
        start: `${startYear}-04-01`,
        end: `${endYear}-03-31`
    };
}

export const GET: RequestHandler = async ({ params, locals, url }) => {
    if (!locals.user) {
        return new Response('Unauthorized', { status: 401 });
    }

    const orgId = locals.user.orgId;
    const { start, end } = getFiscalYearRange(new Date());
    let startDate = url.searchParams.get('from') || start;
    let endDate = url.searchParams.get('to') || end;

    if (startDate > endDate) {
        const tmp = startDate;
        startDate = endDate;
        endDate = tmp;
    }

    const customer = await db.query.customers.findFirst({
        where: and(eq(customers.id, params.id), eq(customers.org_id, orgId))
    });

    if (!customer) {
        return new Response('Customer not found', { status: 404 });
    }

    const invoicesInPeriod = await db
        .select({
            id: invoices.id,
            invoice_number: invoices.invoice_number,
            invoice_date: invoices.invoice_date,
            total: invoices.total
        })
        .from(invoices)
        .where(
            and(
                eq(invoices.org_id, orgId),
                eq(invoices.customer_id, customer.id),
                ne(invoices.status, 'draft'),
                ne(invoices.status, 'cancelled'),
                gte(invoices.invoice_date, startDate),
                lte(invoices.invoice_date, endDate)
            )
        );

    const paymentsInPeriod = await db
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
                eq(payments.customer_id, customer.id),
                gte(payments.payment_date, startDate),
                lte(payments.payment_date, endDate)
            )
        );

    const priorInvoices = await db
        .select({
            total: sql<number>`COALESCE(SUM(${invoices.total}), 0)`
        })
        .from(invoices)
        .where(
            and(
                eq(invoices.org_id, orgId),
                eq(invoices.customer_id, customer.id),
                ne(invoices.status, 'draft'),
                ne(invoices.status, 'cancelled'),
                lt(invoices.invoice_date, startDate)
            )
        );

    const priorPayments = await db
        .select({
            total: sql<number>`COALESCE(SUM(${payments.amount}), 0)`
        })
        .from(payments)
        .where(
            and(
                eq(payments.org_id, orgId),
                eq(payments.customer_id, customer.id),
                lt(payments.payment_date, startDate)
            )
        );

    const openingBalance = (priorInvoices[0]?.total || 0) - (priorPayments[0]?.total || 0);

    const entries = [
        ...invoicesInPeriod.map((inv) => ({
            date: inv.invoice_date,
            number: inv.invoice_number,
            description: `Invoice ${inv.invoice_number}`,
            debit: inv.total,
            credit: 0
        })),
        ...paymentsInPeriod.map((pay) => ({
            date: pay.payment_date,
            number: pay.payment_number,
            description: `Payment ${pay.payment_number}`,
            debit: 0,
            credit: pay.amount
        }))
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let runningBalance = openingBalance;
    const statementEntries = entries.map((entry) => {
        runningBalance += entry.debit - entry.credit;
        return { ...entry, balance: runningBalance };
    });

    const totalDebit = entries.reduce((sum, entry) => sum + entry.debit, 0);
    const totalCredit = entries.reduce((sum, entry) => sum + entry.credit, 0);
    const closingBalance = runningBalance;

    const org = await db.query.organizations.findFirst({
        where: eq(organizations.id, orgId)
    });

    const doc = buildStatementDocDefinition({
        org: org ?? null,
        customer,
        startDate,
        endDate,
        openingBalance,
        closingBalance,
        totalDebit,
        totalCredit,
        entries: statementEntries
    });

    const pdf = await generatePdfBuffer(doc);
    const filename = `Statement-${customer.name.replace(/\s+/g, '-')}.pdf`;

    return new Response(pdf as BodyInit, {
        headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="${filename}"`
        }
    });
};
