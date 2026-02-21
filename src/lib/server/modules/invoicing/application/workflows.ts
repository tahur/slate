import { eq } from 'drizzle-orm';
import type { Tx } from '$lib/server/db';
import {
    invoice_items,
    invoices
} from '$lib/server/db/schema';
import { postInvoiceIssuance, reverse } from '$lib/server/services/posting-engine';
import { bumpNumberSeriesIfHigher, getNextNumberTx } from '$lib/server/services/number-series';
import { calculateInvoiceTaxTotals, resolvePricesIncludeGst } from '$lib/tax/gst';
import { ConflictError, InvariantError, NotFoundError, ValidationError } from '$lib/server/platform/errors';
import { logDomainEvent } from '$lib/server/platform/observability';
import {
    applyCustomerBalanceDeltaInTx,
    findCustomerTaxContextInTx,
    findInvoiceByNumberInTx,
    findOrganizationTaxContextInTx
} from '../infra/queries';

export interface InvoiceLineInput {
    description: string;
    hsn_code?: string;
    quantity: number;
    unit: string;
    rate: number;
    gst_rate: number;
    item_id?: string;
}

export type ParsedPricesIncludeGst = boolean | null;

export function parsePricesIncludeGst(formData: FormData): ParsedPricesIncludeGst {
    const raw = formData.get('prices_include_gst');
    if (raw === null) return null;

    const value = String(raw).trim().toLowerCase();
    if (value === 'true' || value === 'on' || value === '1') return true;
    if (value === 'false' || value === 'off' || value === '0') return false;
    return null;
}

export function parseInvoiceLineItemsFromFormData(formData: FormData): InvoiceLineInput[] {
    const lineItems: InvoiceLineInput[] = [];
    let i = 0;

    while (formData.has(`items[${i}].description`)) {
        const description = (formData.get(`items[${i}].description`) as string) || '';
        const hsn_code = (formData.get(`items[${i}].hsn_code`) as string) || '';
        const quantity = parseFloat(formData.get(`items[${i}].quantity`) as string) || 1;
        const unit = (formData.get(`items[${i}].unit`) as string) || 'nos';
        const rate = parseFloat(formData.get(`items[${i}].rate`) as string) || 0;
        const gst_rate = parseFloat(formData.get(`items[${i}].gst_rate`) as string) || 18;
        const item_id = (formData.get(`items[${i}].item_id`) as string) || '';

        if (description.trim()) {
            lineItems.push({
                description,
                hsn_code,
                quantity,
                unit,
                rate,
                gst_rate,
                item_id: item_id || undefined
            });
        }

        i++;
    }

    return lineItems;
}

async function resolveTaxContextInTx(
    tx: Tx,
    orgId: string,
    customerId: string,
    requestedPricesIncludeGst: ParsedPricesIncludeGst
) {
    const customer = await findCustomerTaxContextInTx(tx, orgId, customerId);

    if (!customer) {
        throw new NotFoundError('Customer not found');
    }

    const org = await findOrganizationTaxContextInTx(tx, orgId);

    if (!org) {
        throw new InvariantError('Organization not found');
    }

    const isInterState = customer.state_code !== org.state_code;
    const pricesIncludeGst = resolvePricesIncludeGst(requestedPricesIncludeGst, org.pricesIncludeGst);

    return { isInterState, pricesIncludeGst };
}

function calculateTotals(lineItems: InvoiceLineInput[], isInterState: boolean, pricesIncludeGst: boolean) {
    return calculateInvoiceTaxTotals(
        lineItems.map((item) => ({
            quantity: item.quantity,
            rate: item.rate,
            gstRate: item.gst_rate
        })),
        { isInterState, pricesIncludeGst }
    );
}

export interface CreateInvoiceInTxInput {
    orgId: string;
    userId: string;
    customerId: string;
    invoiceDate: string;
    dueDate: string;
    orderNumber?: string | null;
    notes?: string | null;
    terms?: string | null;
    issue: boolean;
    invoiceNumberMode: 'auto' | 'manual';
    providedInvoiceNumber: string;
    requestedPricesIncludeGst: ParsedPricesIncludeGst;
    idempotencyKey?: string | null;
    lineItems: InvoiceLineInput[];
}

export interface CreateInvoiceInTxResult {
    invoiceId: string;
    invoiceNumber: string;
    subtotal: number;
    taxableAmount: number;
    cgst: number;
    sgst: number;
    igst: number;
    total: number;
    isInterState: boolean;
    pricesIncludeGst: boolean;
}

export async function createInvoiceInTx(tx: Tx, input: CreateInvoiceInTxInput): Promise<CreateInvoiceInTxResult> {
    const { isInterState, pricesIncludeGst } = await resolveTaxContextInTx(
        tx,
        input.orgId,
        input.customerId,
        input.requestedPricesIncludeGst
    );
    const totals = calculateTotals(input.lineItems, isInterState, pricesIncludeGst);

    const invoiceId = crypto.randomUUID();
    let invoiceNumber = input.providedInvoiceNumber.trim();

    if (input.invoiceNumberMode === 'manual') {
        if (!invoiceNumber) {
            throw new ValidationError('Invoice number is required');
        }

        const duplicate = await findInvoiceByNumberInTx(tx, input.orgId, invoiceNumber);

        if (duplicate) {
            throw new ConflictError('Invoice number already exists');
        }

        await bumpNumberSeriesIfHigher(input.orgId, 'invoice', invoiceNumber, tx);
    } else {
        invoiceNumber = input.issue
            ? await getNextNumberTx(tx, input.orgId, 'invoice')
            : `DRAFT-${invoiceId.substring(0, 8).toUpperCase()}`;
    }

    await tx.insert(invoices).values({
        id: invoiceId,
        org_id: input.orgId,
        customer_id: input.customerId,
        invoice_number: invoiceNumber,
        invoice_date: input.invoiceDate,
        due_date: input.dueDate,
        order_number: input.orderNumber || null,
        status: input.issue ? 'issued' : 'draft',
        subtotal: totals.subtotal,
        taxable_amount: totals.taxableAmount,
        cgst: totals.cgst,
        sgst: totals.sgst,
        igst: totals.igst,
        total: totals.total,
        balance_due: totals.total,
        is_inter_state: isInterState,
        prices_include_gst: pricesIncludeGst,
        notes: input.notes || null,
        terms: input.terms || null,
        journal_entry_id: null,
        idempotency_key: input.idempotencyKey || null,
        issued_at: input.issue ? new Date().toISOString() : null,
        created_by: input.userId,
        updated_by: input.userId
    });

    for (let idx = 0; idx < input.lineItems.length; idx++) {
        const item = input.lineItems[idx];
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

    if (input.issue) {
        const postingResult = await postInvoiceIssuance(
            input.orgId,
            {
                invoiceId,
                invoiceNumber,
                date: input.invoiceDate,
                customerId: input.customerId,
                subtotal: totals.subtotal,
                cgst: totals.cgst,
                sgst: totals.sgst,
                igst: totals.igst,
                total: totals.total,
                userId: input.userId
            },
            tx
        );

        await tx
            .update(invoices)
            .set({ journal_entry_id: postingResult.journalEntryId })
            .where(eq(invoices.id, invoiceId));

        await applyCustomerBalanceDeltaInTx(tx, input.customerId, totals.total, new Date().toISOString());

        logDomainEvent('invoicing.invoice.issued_on_create', {
            orgId: input.orgId,
            invoiceId,
            invoiceNumber,
            total: totals.total
        });
    } else {
        logDomainEvent('invoicing.invoice.draft_created', {
            orgId: input.orgId,
            invoiceId,
            invoiceNumber,
            total: totals.total
        });
    }

    return {
        invoiceId,
        invoiceNumber,
        subtotal: totals.subtotal,
        taxableAmount: totals.taxableAmount,
        cgst: totals.cgst,
        sgst: totals.sgst,
        igst: totals.igst,
        total: totals.total,
        isInterState,
        pricesIncludeGst
    };
}

export interface UpdateDraftInvoiceInTxInput {
    orgId: string;
    userId: string;
    invoiceId: string;
    customerId: string;
    invoiceDate: string;
    dueDate: string;
    orderNumber?: string | null;
    notes?: string | null;
    terms?: string | null;
    requestedPricesIncludeGst: ParsedPricesIncludeGst;
    lineItems: InvoiceLineInput[];
}

export interface UpdateDraftInvoiceInTxResult {
    subtotal: number;
    taxableAmount: number;
    cgst: number;
    sgst: number;
    igst: number;
    total: number;
    isInterState: boolean;
    pricesIncludeGst: boolean;
}

export async function updateDraftInvoiceInTx(
    tx: Tx,
    input: UpdateDraftInvoiceInTxInput
): Promise<UpdateDraftInvoiceInTxResult> {
    const { isInterState, pricesIncludeGst } = await resolveTaxContextInTx(
        tx,
        input.orgId,
        input.customerId,
        input.requestedPricesIncludeGst
    );
    const totals = calculateTotals(input.lineItems, isInterState, pricesIncludeGst);

    await tx
        .update(invoices)
        .set({
            customer_id: input.customerId,
            invoice_date: input.invoiceDate,
            due_date: input.dueDate,
            order_number: input.orderNumber || null,
            subtotal: totals.subtotal,
            taxable_amount: totals.taxableAmount,
            cgst: totals.cgst,
            sgst: totals.sgst,
            igst: totals.igst,
            total: totals.total,
            balance_due: totals.total,
            is_inter_state: isInterState,
            prices_include_gst: pricesIncludeGst,
            notes: input.notes || null,
            terms: input.terms || null,
            updated_at: new Date().toISOString(),
            updated_by: input.userId
        })
        .where(eq(invoices.id, input.invoiceId));

    await tx.delete(invoice_items).where(eq(invoice_items.invoice_id, input.invoiceId));

    for (let idx = 0; idx < input.lineItems.length; idx++) {
        const item = input.lineItems[idx];
        const calc = totals.lines[idx];

        await tx.insert(invoice_items).values({
            id: crypto.randomUUID(),
            invoice_id: input.invoiceId,
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

    return {
        subtotal: totals.subtotal,
        taxableAmount: totals.taxableAmount,
        cgst: totals.cgst,
        sgst: totals.sgst,
        igst: totals.igst,
        total: totals.total,
        isInterState,
        pricesIncludeGst
    };
}

interface InvoiceIssueInput {
    id: string;
    customer_id: string;
    invoice_number: string;
    invoice_date: string;
    subtotal: number;
    cgst: number | null;
    sgst: number | null;
    igst: number | null;
    total: number;
}

export async function issueDraftInvoiceInTx(
    tx: Tx,
    orgId: string,
    userId: string,
    invoice: InvoiceIssueInput
): Promise<{ invoiceNumber: string }> {
    let invoiceNumber = invoice.invoice_number;
    if (invoiceNumber.startsWith('DRAFT-')) {
        invoiceNumber = await getNextNumberTx(tx, orgId, 'invoice');
    }

    const postingResult = await postInvoiceIssuance(
        orgId,
        {
            invoiceId: invoice.id,
            invoiceNumber,
            date: invoice.invoice_date,
            customerId: invoice.customer_id,
            subtotal: invoice.subtotal,
            cgst: invoice.cgst || 0,
            sgst: invoice.sgst || 0,
            igst: invoice.igst || 0,
            total: invoice.total,
            userId
        },
        tx
    );

    await tx
        .update(invoices)
        .set({
            invoice_number: invoiceNumber,
            status: 'issued',
            journal_entry_id: postingResult.journalEntryId,
            issued_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            updated_by: userId
        })
        .where(eq(invoices.id, invoice.id));

    await applyCustomerBalanceDeltaInTx(tx, invoice.customer_id, invoice.total, new Date().toISOString());

    logDomainEvent('invoicing.invoice.issued', {
        orgId,
        invoiceId: invoice.id,
        invoiceNumber
    });

    return { invoiceNumber };
}

interface InvoiceCancelInput {
    id: string;
    customer_id: string;
    status: string;
    total: number;
    journal_entry_id: string | null;
}

export async function cancelInvoiceInTx(
    tx: Tx,
    orgId: string,
    userId: string,
    invoice: InvoiceCancelInput,
    nowIso: string
) {
    const reversalDate = nowIso.split('T')[0];

    if (invoice.status === 'issued') {
        if (!invoice.journal_entry_id) {
            throw new InvariantError('Issued invoice is missing journal entry');
        }

        await reverse(orgId, invoice.journal_entry_id, reversalDate, userId, tx);

        await applyCustomerBalanceDeltaInTx(tx, invoice.customer_id, -invoice.total, nowIso);
    }

    await tx
        .update(invoices)
        .set({
            status: 'cancelled',
            cancelled_at: nowIso,
            updated_at: nowIso,
            updated_by: userId
        })
        .where(eq(invoices.id, invoice.id));

    logDomainEvent('invoicing.invoice.cancelled', {
        orgId,
        invoiceId: invoice.id,
        statusWasIssued: invoice.status === 'issued'
    });
}

export async function deleteDraftInvoiceInTx(tx: Tx, invoiceId: string) {
    await tx.delete(invoice_items).where(eq(invoice_items.invoice_id, invoiceId));
    await tx.delete(invoices).where(eq(invoices.id, invoiceId));

    logDomainEvent('invoicing.invoice.draft_deleted', {
        invoiceId
    });
}
