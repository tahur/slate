const AMOUNT_EPSILON = 0.01;

function sortedInvoiceNumbers(invoiceNumbers: string[]): string[] {
    return invoiceNumbers
        .map((number) => number.trim())
        .filter(Boolean)
        .sort();
}

export function buildCustomerReceiptReason(
    amount: number,
    allocatedTotal: number,
    invoiceNumbers: string[]
): string {
    const cleanInvoiceNumbers = sortedInvoiceNumbers(invoiceNumbers);
    const invoiceList = cleanInvoiceNumbers.join(', ');

    if (allocatedTotal >= amount - AMOUNT_EPSILON && invoiceList) {
        return `Full receipt against ${invoiceList}`;
    }

    if (allocatedTotal > 0 && invoiceList) {
        if (amount - allocatedTotal > AMOUNT_EPSILON) {
            return `Part receipt against ${invoiceList}; balance as advance`;
        }
        return `Part receipt against ${invoiceList}`;
    }

    return 'Advance from customer';
}

export type SupplierExpensePaymentStatus = 'paid' | 'unpaid';

export function buildSupplierExpenseReason(
    categoryName: string | null,
    description: string | null,
    paymentStatus: SupplierExpensePaymentStatus = 'paid'
): string {
    const category = categoryName || 'Expense';
    const details = (description || '').trim();
    const baseReason = details ? `${category}: ${details}` : category;
    if (paymentStatus === 'unpaid') {
        return `Payable booked - ${baseReason}`;
    }
    return baseReason;
}

export function buildSupplierPaymentReason(
    amount: number,
    allocatedTotal: number,
    expenseNumbers: string[]
): string {
    const cleanExpenseNumbers = sortedInvoiceNumbers(expenseNumbers);
    const expenseList = cleanExpenseNumbers.join(', ');

    if (allocatedTotal >= amount - AMOUNT_EPSILON && expenseList) {
        return `Full payment against ${expenseList}`;
    }

    if (allocatedTotal > 0 && expenseList) {
        if (amount - allocatedTotal > AMOUNT_EPSILON) {
            return `Part payment against ${expenseList}; balance as supplier credit`;
        }
        return `Part payment against ${expenseList}`;
    }

    return 'Advance paid to supplier';
}

export function coalesceReasonSnapshot(snapshot: string | null | undefined, fallbackReason: string): string {
    const trimmed = (snapshot || '').trim();
    return trimmed || fallbackReason;
}
