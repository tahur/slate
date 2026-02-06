import { formatINR } from './currency';
import { formatDate } from './date';

export interface WhatsAppInvoiceData {
    invoiceNumber: string;
    customerName: string;
    customerPhone?: string | null;
    total: number;
    balanceDue: number;
    dueDate: string;
    orgName: string;
    pdfUrl?: string;
}

export interface WhatsAppCreditNoteData {
    creditNoteNumber: string;
    customerName: string;
    customerPhone?: string | null;
    total: number;
    date: string;
    orgName: string;
    reason?: string;
}

export interface WhatsAppPaymentData {
    paymentNumber: string;
    customerName: string;
    customerPhone?: string | null;
    amount: number;
    date: string;
    orgName: string;
    mode: string;
}

/**
 * Normalize phone number for WhatsApp
 * Removes spaces, dashes, and adds country code if missing
 */
function normalizePhone(phone: string | null | undefined): string | null {
    if (!phone) return null;

    // Remove all non-digit characters except +
    let cleaned = phone.replace(/[^\d+]/g, '');

    // If starts with 0, assume Indian number and replace with +91
    if (cleaned.startsWith('0')) {
        cleaned = '91' + cleaned.slice(1);
    }

    // If no country code (10 digits), assume Indian
    if (cleaned.length === 10 && !cleaned.startsWith('+')) {
        cleaned = '91' + cleaned;
    }

    // Remove + if present (wa.me doesn't use it)
    cleaned = cleaned.replace(/^\+/, '');

    return cleaned;
}

/**
 * Generate WhatsApp share URL for an invoice
 */
export function getInvoiceWhatsAppUrl(data: WhatsAppInvoiceData): string {
    const isPaid = data.balanceDue <= 0.01;

    let message = `Hi ${data.customerName}!

Here's your invoice from *${data.orgName}*

*Invoice:* ${data.invoiceNumber}
*Amount:* ${formatINR(data.total)}`;

    if (!isPaid) {
        message += `
*Balance Due:* ${formatINR(data.balanceDue)}
*Due Date:* ${formatDate(data.dueDate)}`;
    } else {
        message += `
*Status:* Paid`;
    }

    if (data.pdfUrl) {
        message += `

View/Download: ${data.pdfUrl}`;
    }

    message += `

Thank you for your business!`;

    const encodedMessage = encodeURIComponent(message);
    const phone = normalizePhone(data.customerPhone);

    if (phone) {
        return `https://wa.me/${phone}?text=${encodedMessage}`;
    }

    return `https://wa.me/?text=${encodedMessage}`;
}

/**
 * Generate WhatsApp share URL for a credit note
 */
export function getCreditNoteWhatsAppUrl(data: WhatsAppCreditNoteData): string {
    let message = `Hi ${data.customerName}!

A credit note has been issued by *${data.orgName}*

*Credit Note:* ${data.creditNoteNumber}
*Amount:* ${formatINR(data.total)}
*Date:* ${formatDate(data.date)}`;

    if (data.reason) {
        message += `
*Reason:* ${data.reason}`;
    }

    message += `

This credit will be adjusted against your future invoices.

Thank you!`;

    const encodedMessage = encodeURIComponent(message);
    const phone = normalizePhone(data.customerPhone);

    if (phone) {
        return `https://wa.me/${phone}?text=${encodedMessage}`;
    }

    return `https://wa.me/?text=${encodedMessage}`;
}

/**
 * Generate WhatsApp share URL for a payment receipt
 */
export function getPaymentWhatsAppUrl(data: WhatsAppPaymentData): string {
    const modeLabels: Record<string, string> = {
        cash: 'Cash',
        bank: 'Bank Transfer',
        upi: 'UPI',
        cheque: 'Cheque'
    };

    const message = `Hi ${data.customerName}!

Payment received - Thank you!

*Receipt:* ${data.paymentNumber}
*Amount:* ${formatINR(data.amount)}
*Date:* ${formatDate(data.date)}
*Mode:* ${modeLabels[data.mode] || data.mode}

From *${data.orgName}*

Thank you for your payment!`;

    const encodedMessage = encodeURIComponent(message);
    const phone = normalizePhone(data.customerPhone);

    if (phone) {
        return `https://wa.me/${phone}?text=${encodedMessage}`;
    }

    return `https://wa.me/?text=${encodedMessage}`;
}
