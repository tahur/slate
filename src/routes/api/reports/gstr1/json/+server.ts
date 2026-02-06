import { db } from '$lib/server/db';
import { invoices, invoice_items, customers, credit_notes, organizations } from '$lib/server/db/schema';
import { eq, and, ne, gte, lte } from 'drizzle-orm';
import {
    categorizeForGSTR1,
    generateGSTR1JSON,
    type GSTR1Invoice,
    type GSTR1CreditNote
} from '$lib/server/utils/gst-export';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, url }) => {
    if (!locals.user) {
        return new Response('Unauthorized', { status: 401 });
    }

    const orgId = locals.user.orgId;

    const now = new Date();
    const defaultStartDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const defaultEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const startDate = url.searchParams.get('from') || defaultStartDate;
    const endDate = url.searchParams.get('to') || defaultEndDate;

    const org = await db.query.organizations.findFirst({
        where: eq(organizations.id, orgId)
    });

    const orgStateCode = org?.state_code || '29';

    // Get invoices
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

    const customerIds = [...new Set(invoiceRows.map(inv => inv.customer_id))];
    const customerRows = customerIds.length > 0
        ? await db.select().from(customers).where(eq(customers.org_id, orgId))
        : [];
    const customerMap = new Map(customerRows.map(c => [c.id, c]));

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

    const invoicesWithCustomers: GSTR1Invoice[] = invoiceRows.map(inv => ({
        ...inv,
        customer: customerMap.get(inv.customer_id) || null,
        items: itemsByInvoice.get(inv.id) || []
    }));

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

    const gstr1Data = categorizeForGSTR1(invoicesWithCustomers, creditNotesWithCustomers, orgStateCode);

    // Generate filing period in MMYYYY format
    const periodDate = new Date(startDate);
    const fp = String(periodDate.getMonth() + 1).padStart(2, '0') + periodDate.getFullYear();

    const jsonData = generateGSTR1JSON(gstr1Data, org?.gstin || '', fp);

    const filename = `GSTR1_${startDate}_to_${endDate}.json`;

    return new Response(JSON.stringify(jsonData, null, 2), {
        headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="${filename}"`
        }
    });
};
