import { eq, and } from 'drizzle-orm';
import type { Tx } from '$lib/server/db';
import { db } from '$lib/server/db';
import {
    quotations,
    quotation_items,
    invoices,
    invoice_items
} from '$lib/server/db/schema';
import { calculateInvoiceTaxTotals, resolvePricesIncludeGst } from '$lib/tax/gst';
import { getNextNumberTx } from '$lib/server/services/number-series';
import {
    findCustomerTaxContextInTx,
    findOrganizationTaxContextInTx
} from '$lib/server/modules/invoicing/infra/queries';
import { NotFoundError, ValidationError } from '$lib/server/platform/errors';

// ─── Types ────────────────────────────────────────────────────────────────

export type QuotationLineInput = {
    description: string;
    hsn_code?: string;
    quantity: number;
    unit: string;
    rate: number;
    gst_rate: number;
    item_id?: string;
};

export type ParsedPricesIncludeGst = { explicit: boolean | null };

export function parsePricesIncludeGst(formData: FormData): ParsedPricesIncludeGst {
    const raw = formData.get('prices_include_gst');
    if (raw === 'true') return { explicit: true };
    if (raw === 'false') return { explicit: false };
    return { explicit: null };
}

export function parseQuotationLineItemsFromFormData(formData: FormData): QuotationLineInput[] {
    const lines: QuotationLineInput[] = [];
    let i = 0;
    while (formData.has(`items[${i}].description`)) {
        const description = (formData.get(`items[${i}].description`) as string || '').trim();
        if (description) {
            lines.push({
                description,
                hsn_code: (formData.get(`items[${i}].hsn_code`) as string) || undefined,
                quantity: parseFloat(formData.get(`items[${i}].quantity`) as string) || 1,
                unit: (formData.get(`items[${i}].unit`) as string) || 'nos',
                rate: parseFloat(formData.get(`items[${i}].rate`) as string) || 0,
                gst_rate: parseFloat(formData.get(`items[${i}].gst_rate`) as string) || 18,
                item_id: (formData.get(`items[${i}].item_id`) as string) || undefined
            });
        }
        i++;
    }
    return lines;
}

// ─── Tax context ──────────────────────────────────────────────────────────

async function resolveTaxContext(
    tx: Tx,
    orgId: string,
    customerId: string,
    requested: ParsedPricesIncludeGst
) {
    const customer = await findCustomerTaxContextInTx(tx, orgId, customerId);
    if (!customer) throw new NotFoundError('Customer not found');

    const org = await findOrganizationTaxContextInTx(tx, orgId);
    if (!org) throw new NotFoundError('Organization not found');

    const isInterState = customer.state_code !== org.state_code;
    const pricesIncludeGst = resolvePricesIncludeGst(requested.explicit, org.pricesIncludeGst);

    return { isInterState, pricesIncludeGst };
}

function calculateTotals(lineItems: QuotationLineInput[], isInterState: boolean, pricesIncludeGst: boolean) {
    return calculateInvoiceTaxTotals(
        lineItems.map((item) => ({
            quantity: item.quantity,
            rate: item.rate,
            gstRate: item.gst_rate
        })),
        { isInterState, pricesIncludeGst }
    );
}

// ─── Create Quotation ─────────────────────────────────────────────────────

export type CreateQuotationInput = {
    orgId: string;
    userId: string;
    customerId: string;
    quotationDate: string;
    validUntil: string;
    subject?: string | null;
    referenceNumber?: string | null;
    notes?: string | null;
    terms?: string | null;
    send: boolean; // true = mark as sent immediately
    requestedPricesIncludeGst: ParsedPricesIncludeGst;
    idempotencyKey?: string | null;
    lineItems: QuotationLineInput[];
};

export type CreateQuotationResult = {
    quotationId: string;
    quotationNumber: string;
    total: number;
};

export async function createQuotationInTx(tx: Tx, input: CreateQuotationInput): Promise<CreateQuotationResult> {
    const { isInterState, pricesIncludeGst } = await resolveTaxContext(
        tx, input.orgId, input.customerId, input.requestedPricesIncludeGst
    );
    const totals = calculateTotals(input.lineItems, isInterState, pricesIncludeGst);

    const quotationId = crypto.randomUUID();
    const quotationNumber = await getNextNumberTx(tx, input.orgId, 'quotation');

    await tx.insert(quotations).values({
        id: quotationId,
        org_id: input.orgId,
        customer_id: input.customerId,
        quotation_number: quotationNumber,
        reference_number: input.referenceNumber || null,
        subject: input.subject || null,
        quotation_date: input.quotationDate,
        valid_until: input.validUntil,
        status: input.send ? 'sent' : 'draft',
        subtotal: totals.subtotal,
        taxable_amount: totals.taxableAmount,
        cgst: totals.cgst,
        sgst: totals.sgst,
        igst: totals.igst,
        total: totals.total,
        is_inter_state: isInterState,
        prices_include_gst: pricesIncludeGst,
        notes: input.notes || null,
        terms: input.terms || null,
        idempotency_key: input.idempotencyKey || null,
        sent_at: input.send ? new Date().toISOString() : null,
        created_by: input.userId,
        updated_by: input.userId
    });

    for (let idx = 0; idx < input.lineItems.length; idx++) {
        const item = input.lineItems[idx];
        const calc = totals.lines[idx];

        await tx.insert(quotation_items).values({
            id: crypto.randomUUID(),
            quotation_id: quotationId,
            item_id: item.item_id || null,
            description: item.description,
            hsn_code: item.hsn_code || null,
            quantity: item.quantity,
            unit: item.unit,
            rate: item.rate,
            gst_rate: item.gst_rate,
            cgst: calc.cgst,
            sgst: calc.sgst,
            igst: calc.igst,
            amount: calc.amount,
            total: calc.total,
            sort_order: idx
        });
    }

    return { quotationId, quotationNumber, total: totals.total };
}

// ─── Update Draft Quotation ───────────────────────────────────────────────

export type UpdateQuotationInput = {
    orgId: string;
    userId: string;
    quotationId: string;
    customerId: string;
    quotationDate: string;
    validUntil: string;
    subject?: string | null;
    referenceNumber?: string | null;
    notes?: string | null;
    terms?: string | null;
    requestedPricesIncludeGst: ParsedPricesIncludeGst;
    lineItems: QuotationLineInput[];
};

export async function updateQuotationInTx(tx: Tx, input: UpdateQuotationInput): Promise<{ total: number }> {
    const { isInterState, pricesIncludeGst } = await resolveTaxContext(
        tx, input.orgId, input.customerId, input.requestedPricesIncludeGst
    );
    const totals = calculateTotals(input.lineItems, isInterState, pricesIncludeGst);

    await tx.update(quotations).set({
        customer_id: input.customerId,
        quotation_date: input.quotationDate,
        valid_until: input.validUntil,
        subject: input.subject || null,
        reference_number: input.referenceNumber || null,
        subtotal: totals.subtotal,
        taxable_amount: totals.taxableAmount,
        cgst: totals.cgst,
        sgst: totals.sgst,
        igst: totals.igst,
        total: totals.total,
        is_inter_state: isInterState,
        prices_include_gst: pricesIncludeGst,
        notes: input.notes || null,
        terms: input.terms || null,
        updated_by: input.userId,
        updated_at: new Date().toISOString()
    }).where(eq(quotations.id, input.quotationId));

    // Delete old items + re-insert
    await tx.delete(quotation_items).where(eq(quotation_items.quotation_id, input.quotationId));

    for (let idx = 0; idx < input.lineItems.length; idx++) {
        const item = input.lineItems[idx];
        const calc = totals.lines[idx];

        await tx.insert(quotation_items).values({
            id: crypto.randomUUID(),
            quotation_id: input.quotationId,
            item_id: item.item_id || null,
            description: item.description,
            hsn_code: item.hsn_code || null,
            quantity: item.quantity,
            unit: item.unit,
            rate: item.rate,
            gst_rate: item.gst_rate,
            cgst: calc.cgst,
            sgst: calc.sgst,
            igst: calc.igst,
            amount: calc.amount,
            total: calc.total,
            sort_order: idx
        });
    }

    return { total: totals.total };
}

// ─── Convert to Invoice ───────────────────────────────────────────────────

export type ConvertToInvoiceInput = {
    orgId: string;
    userId: string;
    quotationId: string;
    invoiceDate: string;
    dueDate: string;
    // Optional price overrides: { itemIndex: newRate }
    priceOverrides?: Record<number, number>;
};

export async function convertQuotationToInvoiceInTx(
    tx: Tx,
    input: ConvertToInvoiceInput
): Promise<{ invoiceId: string; invoiceNumber: string }> {
    // Load quotation
    const quotation = await tx.query.quotations.findFirst({
        where: and(
            eq(quotations.id, input.quotationId),
            eq(quotations.org_id, input.orgId)
        )
    });

    if (!quotation) throw new NotFoundError('Quotation not found');
    if (quotation.status === 'invoiced') throw new ValidationError('Quotation already converted');
    if (quotation.status === 'declined') throw new ValidationError('Cannot convert declined quotation');

    // Load quotation items
    const items = await tx.query.quotation_items.findMany({
        where: eq(quotation_items.quotation_id, input.quotationId),
        orderBy: quotation_items.sort_order
    });

    // Apply price overrides
    const lineItems = items.map((item, idx) => ({
        description: item.description,
        hsn_code: item.hsn_code || undefined,
        quantity: item.quantity,
        unit: item.unit || 'nos',
        rate: input.priceOverrides?.[idx] ?? item.rate,
        gst_rate: item.gst_rate,
        item_id: item.item_id || undefined
    }));

    // Resolve tax context
    const { isInterState, pricesIncludeGst } = await resolveTaxContext(
        tx, input.orgId, quotation.customer_id,
        { explicit: quotation.prices_include_gst ?? null }
    );
    const totals = calculateTotals(lineItems, isInterState, pricesIncludeGst);

    // Create invoice
    const invoiceId = crypto.randomUUID();
    const invoiceNumber = await getNextNumberTx(tx, input.orgId, 'invoice');

    await tx.insert(invoices).values({
        id: invoiceId,
        org_id: input.orgId,
        customer_id: quotation.customer_id,
        invoice_number: invoiceNumber,
        invoice_date: input.invoiceDate,
        due_date: input.dueDate,
        order_number: quotation.reference_number || null,
        status: 'draft',
        subtotal: totals.subtotal,
        taxable_amount: totals.taxableAmount,
        cgst: totals.cgst,
        sgst: totals.sgst,
        igst: totals.igst,
        total: totals.total,
        balance_due: totals.total,
        is_inter_state: isInterState,
        prices_include_gst: pricesIncludeGst,
        notes: quotation.notes || null,
        terms: quotation.terms || null,
        created_by: input.userId,
        updated_by: input.userId
    });

    for (let idx = 0; idx < lineItems.length; idx++) {
        const item = lineItems[idx];
        const calc = totals.lines[idx];

        await tx.insert(invoice_items).values({
            id: crypto.randomUUID(),
            invoice_id: invoiceId,
            item_id: item.item_id || null,
            description: item.description,
            hsn_code: item.hsn_code || null,
            quantity: item.quantity,
            unit: item.unit,
            rate: item.rate,
            gst_rate: item.gst_rate,
            cgst: calc.cgst,
            sgst: calc.sgst,
            igst: calc.igst,
            amount: calc.amount,
            total: calc.total,
            sort_order: idx
        });
    }

    // Mark quotation as invoiced
    await tx.update(quotations).set({
        status: 'invoiced',
        converted_invoice_id: invoiceId,
        updated_at: new Date().toISOString(),
        updated_by: input.userId
    }).where(eq(quotations.id, input.quotationId));

    return { invoiceId, invoiceNumber };
}

// ─── Status transitions ──────────────────────────────────────────────────

export async function sendQuotation(orgId: string, quotationId: string) {
    await db.update(quotations).set({
        status: 'sent',
        sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    }).where(and(eq(quotations.id, quotationId), eq(quotations.org_id, orgId)));
}

export async function acceptQuotation(orgId: string, quotationId: string) {
    await db.update(quotations).set({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    }).where(and(eq(quotations.id, quotationId), eq(quotations.org_id, orgId)));
}

export async function declineQuotation(orgId: string, quotationId: string) {
    await db.update(quotations).set({
        status: 'declined',
        declined_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    }).where(and(eq(quotations.id, quotationId), eq(quotations.org_id, orgId)));
}

export async function deleteQuotation(orgId: string, quotationId: string) {
    await db.delete(quotation_items).where(eq(quotation_items.quotation_id, quotationId));
    await db.delete(quotations).where(
        and(eq(quotations.id, quotationId), eq(quotations.org_id, orgId))
    );
}
