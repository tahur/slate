import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { invoices, invoice_items, customers, credit_notes, organizations } from '$lib/server/db/schema';
import { eq, and, ne, gte, lte } from 'drizzle-orm';
import { categorizeForGSTR1, type GSTR1Invoice, type GSTR1CreditNote } from '$lib/server/utils/gst-export';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
    if (!locals.user) {
        redirect(302, '/login');
    }

    const orgId = locals.user.orgId;

    // Default to current month
    const now = new Date();
    const defaultStartDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const defaultEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const startDate = url.searchParams.get('from') || defaultStartDate;
    const endDate = url.searchParams.get('to') || defaultEndDate;

    // Get organization for state code
    const org = await db.query.organizations.findFirst({
        where: eq(organizations.id, orgId)
    });

    const orgStateCode = org?.state_code || '29'; // Default to Karnataka

    // Get invoices with customer data
    const invoiceRows = await db
        .select()
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

    // Get customers for all invoices
    const customerIds = [...new Set(invoiceRows.map(inv => inv.customer_id))];
    const customerRows = customerIds.length > 0
        ? await db.select().from(customers).where(
            and(
                eq(customers.org_id, orgId)
            )
        )
        : [];
    const customerMap = new Map(customerRows.map(c => [c.id, c]));

    // Get items for all invoices
    const invoiceIds = invoiceRows.map(inv => inv.id);
    const itemRows = invoiceIds.length > 0
        ? await db.select().from(invoice_items)
        : [];
    const itemsByInvoice = new Map<string, typeof itemRows>();
    for (const item of itemRows) {
        if (!invoiceIds.includes(item.invoice_id)) continue;
        const existing = itemsByInvoice.get(item.invoice_id) || [];
        existing.push(item);
        itemsByInvoice.set(item.invoice_id, existing);
    }

    // Build invoices with customer and items
    const invoicesWithCustomers: GSTR1Invoice[] = invoiceRows.map(inv => ({
        ...inv,
        customer: customerMap.get(inv.customer_id) || null,
        items: itemsByInvoice.get(inv.id) || []
    }));

    // Get credit notes
    const creditNoteRows = await db
        .select()
        .from(credit_notes)
        .where(
            and(
                eq(credit_notes.org_id, orgId),
                ne(credit_notes.status, 'cancelled'),
                gte(credit_notes.credit_note_date, startDate),
                lte(credit_notes.credit_note_date, endDate)
            )
        );

    const creditNotesWithCustomers: GSTR1CreditNote[] = creditNoteRows.map(cn => ({
        ...cn,
        customer: customerMap.get(cn.customer_id) || null
    }));

    // Categorize data for GSTR-1
    const gstr1Data = categorizeForGSTR1(invoicesWithCustomers, creditNotesWithCustomers, orgStateCode);

    // Add period info
    const periodStart = new Date(startDate);
    const periodEnd = new Date(endDate);
    const period = `${periodStart.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })} - ${periodEnd.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}`;
    gstr1Data.period = period;

    return {
        startDate,
        endDate,
        period,
        gstin: org?.gstin || '',
        data: gstr1Data
    };
};
