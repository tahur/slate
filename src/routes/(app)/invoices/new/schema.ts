import { z } from 'zod';

export const GST_RATES = [0, 5, 12, 18, 28] as const;

export const lineItemSchema = z.object({
    description: z.string().min(1, 'Description is required'),
    hsn_code: z.string().optional().default(''),
    quantity: z.coerce.number().min(0.01, 'Quantity must be positive').default(1),
    unit: z.string().default('nos'),
    rate: z.coerce.number().min(0, 'Rate must be positive').default(0),
    gst_rate: z.coerce.number().default(18),
    item_id: z.string().optional(),
});

export const invoiceSchema = z.object({
    customer_id: z.string().min(1, 'Customer is required'),
    invoice_date: z.string().min(1, 'Invoice date is required'),
    due_date: z.string().min(1, 'Due date is required'),
    order_number: z.string().optional().default(''),
    notes: z.string().optional().default(''),
    terms: z.string().optional().default(''),
    prices_include_gst: z.boolean().default(false),
    items: z.array(lineItemSchema).min(1, 'At least one item is required'),
});

export type InvoiceSchema = typeof invoiceSchema;
export type LineItem = z.infer<typeof lineItemSchema>;

// Calculate line item totals
export function calculateLineItem(item: LineItem, isInterState: boolean, pricesIncludeGst = false) {
    const quantity = Number(item.quantity) || 0;
    const rate = Number(item.rate) || 0;
    const gstRate = Number(item.gst_rate) || 0;

    const amount = quantity * rate;

    let taxableAmount: number;
    let taxAmount: number;

    if (pricesIncludeGst && gstRate > 0) {
        // Inclusive: tax is inside the amount
        taxableAmount = amount / (1 + gstRate / 100);
        taxAmount = amount - taxableAmount;
    } else {
        // Exclusive: tax is added on top
        taxableAmount = amount;
        taxAmount = amount * (gstRate / 100);
    }

    let cgst = 0, sgst = 0, igst = 0;
    if (isInterState) {
        igst = taxAmount;
    } else {
        cgst = taxAmount / 2;
        sgst = taxAmount / 2;
    }

    return {
        amount,
        taxableAmount,
        cgst,
        sgst,
        igst,
        total: pricesIncludeGst ? amount : amount + taxAmount,
    };
}

// Calculate invoice totals
export function calculateInvoiceTotals(items: LineItem[], isInterState: boolean, pricesIncludeGst = false) {
    let subtotal = 0;
    let taxableAmount = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;

    for (const item of items) {
        const calc = calculateLineItem(item, isInterState, pricesIncludeGst);
        subtotal += calc.amount;
        taxableAmount += calc.taxableAmount;
        totalCgst += calc.cgst;
        totalSgst += calc.sgst;
        totalIgst += calc.igst;
    }

    return {
        subtotal,
        taxableAmount,
        cgst: totalCgst,
        sgst: totalSgst,
        igst: totalIgst,
        total: pricesIncludeGst ? subtotal : subtotal + totalCgst + totalSgst + totalIgst,
    };
}
