import { addCurrency, round2 } from '../utils/currency';

export interface GstLineInput {
    quantity: number;
    rate: number;
    gstRate: number;
}

export interface GstContext {
    isInterState: boolean;
    pricesIncludeGst: boolean;
}

export interface GstLineBreakdown {
    amount: number;
    taxableAmount: number;
    taxAmount: number;
    cgst: number;
    sgst: number;
    igst: number;
    total: number;
}

export interface GstInvoiceBreakdown {
    subtotal: number;
    taxableAmount: number;
    cgst: number;
    sgst: number;
    igst: number;
    total: number;
    lines: GstLineBreakdown[];
}

/**
 * Resolve invoice-level GST mode with org-level fallback.
 * If invoice-level value is absent, org default is applied.
 */
export function resolvePricesIncludeGst(
    invoiceLevel: boolean | null | undefined,
    orgDefault: boolean | null | undefined
): boolean {
    if (typeof invoiceLevel === 'boolean') return invoiceLevel;
    return Boolean(orgDefault);
}

function splitTaxAmount(taxAmount: number, isInterState: boolean) {
    if (isInterState) {
        return { cgst: 0, sgst: 0, igst: round2(taxAmount) };
    }

    const firstHalf = round2(taxAmount / 2);
    const secondHalf = round2(taxAmount - firstHalf);

    return {
        cgst: firstHalf,
        sgst: secondHalf,
        igst: 0
    };
}

export function calculateLineTax(input: GstLineInput, context: GstContext): GstLineBreakdown {
    const quantity = Number(input.quantity) || 0;
    const rate = Number(input.rate) || 0;
    const gstRate = Number(input.gstRate) || 0;

    const amount = round2(quantity * rate);
    const includeGst = context.pricesIncludeGst && gstRate > 0;

    const taxableAmount = includeGst
        ? round2(amount / (1 + gstRate / 100))
        : amount;

    const taxAmount = includeGst
        ? round2(amount - taxableAmount)
        : round2((taxableAmount * gstRate) / 100);

    const { cgst, sgst, igst } = splitTaxAmount(taxAmount, context.isInterState);
    const total = includeGst ? amount : addCurrency(amount, taxAmount);

    return {
        amount,
        taxableAmount,
        taxAmount,
        cgst,
        sgst,
        igst,
        total
    };
}

export function calculateInvoiceTaxTotals(items: GstLineInput[], context: GstContext): GstInvoiceBreakdown {
    const lines = items.map((item) => calculateLineTax(item, context));

    const subtotal = addCurrency(...lines.map((line) => line.amount));
    const taxableAmount = addCurrency(...lines.map((line) => line.taxableAmount));
    const cgst = addCurrency(...lines.map((line) => line.cgst));
    const sgst = addCurrency(...lines.map((line) => line.sgst));
    const igst = addCurrency(...lines.map((line) => line.igst));
    const totalTax = addCurrency(cgst, sgst, igst);
    const total = context.pricesIncludeGst ? subtotal : addCurrency(subtotal, totalTax);

    return {
        subtotal,
        taxableAmount,
        cgst,
        sgst,
        igst,
        total,
        lines
    };
}
