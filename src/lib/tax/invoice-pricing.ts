import { addCurrency, round2 } from '$lib/utils/currency';
import { calculateLineTax, type GstContext, type GstInvoiceBreakdown, type GstLineInput } from './gst';

export type InvoiceDiscountType = 'percent' | 'amount' | null;

export type InvoiceDiscountInput = {
    type: InvoiceDiscountType;
    value: number;
};

export type InvoicePricingLineBreakdown = {
    amount: number;
    discountAmount: number;
    taxableAmount: number;
    taxAmount: number;
    cgst: number;
    sgst: number;
    igst: number;
    total: number;
};

export type InvoicePricingBreakdown = GstInvoiceBreakdown & {
    discountType: InvoiceDiscountType;
    discountValue: number;
    discountAmount: number;
    lines: InvoicePricingLineBreakdown[];
};

function normalizeDiscount(input: InvoiceDiscountInput | null | undefined): InvoiceDiscountInput {
    if (!input?.type) {
        return { type: null, value: 0 };
    }

    return {
        type: input.type,
        value: Math.max(0, Number(input.value) || 0)
    };
}

function resolveDiscountAmount(subtotal: number, discount: InvoiceDiscountInput): number {
    if (!discount.type || subtotal <= 0) {
        return 0;
    }

    if (discount.type === 'percent') {
        return round2((subtotal * discount.value) / 100);
    }

    return round2(discount.value);
}

function distributeDiscountAcrossLines(amounts: number[], totalDiscount: number): number[] {
    const lineCents = amounts.map((amount) => Math.max(0, Math.round(round2(amount) * 100)));
    const subtotalCents = lineCents.reduce((sum, cents) => sum + cents, 0);
    const discountCents = Math.max(0, Math.round(round2(totalDiscount) * 100));

    if (subtotalCents === 0 || discountCents === 0) {
        return amounts.map(() => 0);
    }

    const parts = lineCents.map((cents, index) => {
        if (cents === 0) {
            return { index, base: 0, remainder: 0 };
        }

        const exact = (discountCents * cents) / subtotalCents;
        const base = Math.floor(exact);
        return { index, base, remainder: exact - base };
    });

    let remaining = discountCents - parts.reduce((sum, part) => sum + part.base, 0);

    parts
        .filter((part) => lineCents[part.index] > 0)
        .sort((a, b) => {
            if (b.remainder === a.remainder) return a.index - b.index;
            return b.remainder - a.remainder;
        })
        .forEach((part) => {
            if (remaining <= 0) return;
            part.base += 1;
            remaining -= 1;
        });

    return parts
        .sort((a, b) => a.index - b.index)
        .map((part, index) => round2(Math.min(part.base / 100, lineCents[index] / 100)));
}

export function calculateInvoicePricing(
    items: GstLineInput[],
    context: GstContext,
    discountInput?: InvoiceDiscountInput | null
): InvoicePricingBreakdown {
    const normalizedDiscount = normalizeDiscount(discountInput);
    const rawLines = items.map((item) => calculateLineTax(item, context));
    const subtotal = addCurrency(...rawLines.map((line) => line.amount));
    const discountAmount = Math.min(subtotal, resolveDiscountAmount(subtotal, normalizedDiscount));
    const lineDiscounts = distributeDiscountAcrossLines(
        rawLines.map((line) => line.amount),
        discountAmount
    );

    const lines = rawLines.map((rawLine, index) => {
        const discountedBase = round2(Math.max(0, rawLine.amount - lineDiscounts[index]));
        const recalculated = calculateLineTax(
            {
                quantity: 1,
                rate: discountedBase,
                gstRate: items[index]?.gstRate || 0
            },
            context
        );

        return {
            amount: rawLine.amount,
            discountAmount: lineDiscounts[index],
            taxableAmount: recalculated.taxableAmount,
            taxAmount: recalculated.taxAmount,
            cgst: recalculated.cgst,
            sgst: recalculated.sgst,
            igst: recalculated.igst,
            total: recalculated.total
        };
    });

    const taxableAmount = addCurrency(...lines.map((line) => line.taxableAmount));
    const cgst = addCurrency(...lines.map((line) => line.cgst));
    const sgst = addCurrency(...lines.map((line) => line.sgst));
    const igst = addCurrency(...lines.map((line) => line.igst));
    const total = addCurrency(...lines.map((line) => line.total));

    return {
        subtotal,
        discountType: discountAmount > 0 ? normalizedDiscount.type : null,
        discountValue: discountAmount > 0 ? normalizedDiscount.value : 0,
        discountAmount: round2(discountAmount),
        taxableAmount,
        cgst,
        sgst,
        igst,
        total,
        lines
    };
}
