import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { invoices, customers } from '$lib/server/db/schema';
import { eq, and, ne, sql } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

interface AgingBucket {
    current: number;
    days1_30: number;
    days31_60: number;
    days61_90: number;
    days90plus: number;
    total: number;
}

interface CustomerAging {
    id: string;
    name: string;
    company_name: string | null;
    aging: AgingBucket;
}

export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.user) {
        redirect(302, '/login');
    }

    const orgId = locals.user.orgId;
    const today = new Date();

    // Get all unpaid invoices
    const unpaidInvoices = await db
        .select({
            id: invoices.id,
            customer_id: invoices.customer_id,
            invoice_date: invoices.invoice_date,
            due_date: invoices.due_date,
            balance_due: invoices.balance_due,
            customer_name: customers.name,
            customer_company: customers.company_name
        })
        .from(invoices)
        .leftJoin(customers, eq(invoices.customer_id, customers.id))
        .where(
            and(
                eq(invoices.org_id, orgId),
                ne(invoices.status, 'paid'),
                ne(invoices.status, 'cancelled'),
                ne(invoices.status, 'draft')
            )
        );

    // Group by customer and calculate aging
    const customerAgingMap = new Map<string, CustomerAging>();

    for (const inv of unpaidInvoices) {
        const dueDate = new Date(inv.due_date);
        const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        const balance = inv.balance_due || 0;

        if (!customerAgingMap.has(inv.customer_id)) {
            customerAgingMap.set(inv.customer_id, {
                id: inv.customer_id,
                name: inv.customer_name || 'Unknown',
                company_name: inv.customer_company,
                aging: {
                    current: 0,
                    days1_30: 0,
                    days31_60: 0,
                    days61_90: 0,
                    days90plus: 0,
                    total: 0
                }
            });
        }

        const customer = customerAgingMap.get(inv.customer_id)!;

        if (daysOverdue <= 0) {
            customer.aging.current += balance;
        } else if (daysOverdue <= 30) {
            customer.aging.days1_30 += balance;
        } else if (daysOverdue <= 60) {
            customer.aging.days31_60 += balance;
        } else if (daysOverdue <= 90) {
            customer.aging.days61_90 += balance;
        } else {
            customer.aging.days90plus += balance;
        }
        customer.aging.total += balance;
    }

    const customerAging = Array.from(customerAgingMap.values())
        .sort((a, b) => b.aging.total - a.aging.total);

    // Calculate totals
    const totals: AgingBucket = {
        current: 0,
        days1_30: 0,
        days31_60: 0,
        days61_90: 0,
        days90plus: 0,
        total: 0
    };

    for (const c of customerAging) {
        totals.current += c.aging.current;
        totals.days1_30 += c.aging.days1_30;
        totals.days31_60 += c.aging.days31_60;
        totals.days61_90 += c.aging.days61_90;
        totals.days90plus += c.aging.days90plus;
        totals.total += c.aging.total;
    }

    return { customerAging, totals };
};
