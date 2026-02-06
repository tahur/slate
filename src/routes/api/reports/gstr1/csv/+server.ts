import { db } from '$lib/server/db';
import { invoices, invoice_items, customers, credit_notes, organizations } from '$lib/server/db/schema';
import { eq, and, ne, gte, lte } from 'drizzle-orm';
import {
    categorizeForGSTR1,
    generateCSV,
    GSTR1_B2B_COLUMNS,
    GSTR1_B2CL_COLUMNS,
    GSTR1_B2CS_COLUMNS,
    GSTR1_CDNR_COLUMNS,
    GSTR1_HSN_COLUMNS,
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
    const section = url.searchParams.get('section') || 'all';

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

    let csvContent = '';
    const periodStr = `${startDate}_to_${endDate}`;

    if (section === 'all') {
        // Generate combined CSV with all sections
        csvContent += '=== B2B SUPPLIES ===\n';
        csvContent += generateCSV(gstr1Data.b2b, GSTR1_B2B_COLUMNS) + '\n\n';

        csvContent += '=== B2CL SUPPLIES ===\n';
        csvContent += generateCSV(gstr1Data.b2cl, GSTR1_B2CL_COLUMNS) + '\n\n';

        csvContent += '=== B2CS SUPPLIES ===\n';
        csvContent += generateCSV(gstr1Data.b2cs, GSTR1_B2CS_COLUMNS) + '\n\n';

        csvContent += '=== CREDIT/DEBIT NOTES ===\n';
        csvContent += generateCSV(gstr1Data.cdnr, GSTR1_CDNR_COLUMNS) + '\n\n';

        csvContent += '=== HSN SUMMARY ===\n';
        csvContent += generateCSV(gstr1Data.hsn, GSTR1_HSN_COLUMNS);
    } else if (section === 'b2b') {
        csvContent = generateCSV(gstr1Data.b2b, GSTR1_B2B_COLUMNS);
    } else if (section === 'b2cl') {
        csvContent = generateCSV(gstr1Data.b2cl, GSTR1_B2CL_COLUMNS);
    } else if (section === 'b2cs') {
        csvContent = generateCSV(gstr1Data.b2cs, GSTR1_B2CS_COLUMNS);
    } else if (section === 'cdnr') {
        csvContent = generateCSV(gstr1Data.cdnr, GSTR1_CDNR_COLUMNS);
    } else if (section === 'hsn') {
        csvContent = generateCSV(gstr1Data.hsn, GSTR1_HSN_COLUMNS);
    }

    const filename = `GSTR1_${section}_${periodStr}.csv`;

    return new Response(csvContent, {
        headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="${filename}"`
        }
    });
};
