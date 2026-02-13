import { z } from 'zod';
import { calculateInvoiceTaxTotals, calculateLineTax } from '$lib/tax/gst';

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
    return calculateLineTax(
        {
            quantity: item.quantity,
            rate: item.rate,
            gstRate: item.gst_rate
        },
        {
            isInterState,
            pricesIncludeGst
        }
    );
}

// Calculate invoice totals
export function calculateInvoiceTotals(items: LineItem[], isInterState: boolean, pricesIncludeGst = false) {
    const totals = calculateInvoiceTaxTotals(
        items.map((item) => ({
            quantity: item.quantity,
            rate: item.rate,
            gstRate: item.gst_rate
        })),
        { isInterState, pricesIncludeGst }
    );

    return {
        subtotal: totals.subtotal,
        taxableAmount: totals.taxableAmount,
        cgst: totals.cgst,
        sgst: totals.sgst,
        igst: totals.igst,
        total: totals.total
    };
}
