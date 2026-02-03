import { invoices, invoice_items, customers, organizations } from '$lib/server/db/schema';
import puppeteer from 'puppeteer';
import type { Browser } from 'puppeteer';
import { numberToWords } from '$lib/utils/currency';

type Invoice = typeof invoices.$inferSelect;
type InvoiceItem = typeof invoice_items.$inferSelect;
type Customer = typeof customers.$inferSelect;
type Organization = typeof organizations.$inferSelect;

type InvoicePdfData = {
    org: Organization | null;
    invoice: Invoice;
    items: InvoiceItem[];
    customer: Customer | null;
};

type StatementEntry = {
    date: string;
    number: string;
    description: string;
    debit: number;
    credit: number;
    balance: number;
};

type StatementData = {
    org: Organization | null;
    customer: Customer;
    startDate: string;
    endDate: string;
    openingBalance: number;
    closingBalance: number;
    totalDebit: number;
    totalCredit: number;
    entries: StatementEntry[];
};

let browserPromise: Promise<Browser> | null = null;

function getExecutablePath(): string | undefined {
    return process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_PATH;
}

async function getBrowser(): Promise<Browser> {
    if (!browserPromise) {
        browserPromise = (async () => {
            const launch = puppeteer.launch;

            if (!launch) {
                throw new Error('Unable to initialize Puppeteer.');
            }

            return launch({
                headless: 'new',
                executablePath: getExecutablePath(),
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
        })();
    }
    return browserPromise;
}

function escapeHtml(value: string | null | undefined): string {
    if (!value) return '';
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function formatCurrency(amount: number | null | undefined): string {
    const value = amount || 0;
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2
    }).format(value);
}

function formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

function baseStyles() {
    return `
        * { box-sizing: border-box; }
        body { font-family: "Inter", Helvetica, Arial, sans-serif; color: #000; margin: 0; padding: 40px; font-size: 11px; line-height: 1.4; }
        .b-1 { border: 1px solid #000; }
        .bt-0 { border-top: 0; }
        .bb-0 { border-bottom: 0; }
        .bl-0 { border-left: 0; }
        .br-0 { border-right: 0; }
        .bb-1 { border-bottom: 1px solid #000; }
        .bl-1 { border-left: 1px solid #000; }
        
        .row { display: flex; }
        .col { flex: 1; padding: 8px; }
        .w-50 { width: 50%; flex: none; }
        .w-60 { width: 60%; flex: none; }
        .w-40 { width: 40%; flex: none; }
        
        h1, h2, h3, h4 { margin: 0; font-weight: bold; }
        .title { font-size: 24px; text-transform: uppercase; text-align: right; }
        
        .table { width: 100%; border-collapse: collapse; }
        .table th, .table td { border: 1px solid #000; padding: 6px; }
        .table th { background: #f3f4f6; text-align: center; font-weight: bold; }
        
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .font-bold { font-weight: bold; }
        
        .header-logo { width: 80px; height: 80px; object-fit: contain; }
        .company-info { padding: 12px; }
        
        .label { font-weight: bold; width: 100px; display: inline-block; }
        
        .total-words { font-style: italic; font-weight: bold; margin-top: 4px; }
        
        .signature-box { height: 80px; display: flex; align-items: flex-end; justify-content: center; }
    `;
}

export function renderInvoiceHtml(data: InvoicePdfData): string {
    const { org, invoice, items, customer } = data;

    // Calculate split taxes for Intra-state
    const isIntra = !invoice.is_inter_state;

    // Group totals
    const totalWords = numberToWords(invoice.total || 0);

    const itemRows = items
        .map((item, i) => {
            const rate = item.gst_rate || 0;
            const splitRate = isIntra ? rate / 2 : rate;
            const gstAmt = (item.amount * rate) / 100;
            const splitAmt = isIntra ? gstAmt / 2 : gstAmt;

            return `
                <tr style="vertical-align: top;">
                    <td class="text-center">${i + 1}</td>
                    <td>${escapeHtml(item.description)}</td>
                    <td class="text-center">${escapeHtml(item.hsn_code || '')}</td>
                    <td class="text-center">${item.quantity} ${escapeHtml(item.unit || '')}</td>
                    <td class="text-right">${formatCurrency(item.rate)}</td>
                    ${isIntra
                    ? `<td class="text-right">${splitRate}%<br>${formatCurrency(splitAmt)}</td>
                           <td class="text-right">${splitRate}%<br>${formatCurrency(splitAmt)}</td>`
                    : `<td class="text-right">${formatCurrency(gstAmt)}</td>`
                }
                    <td class="text-right">${formatCurrency(item.total)}</td>
                </tr>
            `;
        })
        .join('');

    // Tax Headers based on type
    const taxHeaders = isIntra
        ? `<th style="width: 10%">CGST</th><th style="width: 10%">SGST</th>`
        : `<th style="width: 20%">IGST</th>`;

    return `
    <!doctype html>
    <html>
        <head>
            <meta charset="utf-8" />
            <style>${baseStyles()}</style>
        </head>
        <body>
            <div class="b-1">
                <!-- Header -->
                <div class="row bb-1">
                    <div class="company-info" style="flex: 1">
                        <h2>${escapeHtml(org?.name || 'OpenBill')}</h2>
                        <div>${escapeHtml(org?.address || '')}</div>
                        <div>${escapeHtml(org?.city || '')} ${escapeHtml(org?.pincode || '')}, ${escapeHtml(org?.state_code || '')}</div>
                        <div>GSTIN: ${escapeHtml(org?.gstin || '')}</div>
                        <div>${escapeHtml(org?.email || '')}</div>
                    </div>
                    <div style="padding: 12px; display: flex; align-items: flex-end;">
                        <h1 class="title">TAX INVOICE</h1>
                    </div>
                </div>

                <!-- Invoice Meta -->
                <div class="row bb-1">
                    <div class="col w-50 br-1">
                        <div><span class="label">Invoice No:</span> <span class="font-bold">${escapeHtml(invoice.invoice_number)}</span></div>
                        <div><span class="label">Date:</span> ${formatDate(invoice.invoice_date)}</div>
                    </div>
                    <div class="col w-50">
                        <div><span class="label">Due Date:</span> ${formatDate(invoice.due_date)}</div>
                        <!-- <div><span class="label">Terms:</span> Due on Receipt</div> -->
                    </div>
                </div>

                <!-- Addresses -->
                <div class="row bb-1" style="background: #f3f4f6;">
                    <div class="col w-50 br-1 font-bold">Bill To</div>
                    <div class="col w-50 font-bold">Ship To</div>
                </div>
                <div class="row bb-1">
                    <div class="col w-50 br-1">
                        <div class="font-bold">${escapeHtml(customer?.name || 'Unknown')}</div>
                        <div>${escapeHtml(customer?.company_name || '')}</div>
                        <div>${escapeHtml(customer?.billing_address || '')}</div>
                        <div>${escapeHtml(customer?.city || '')} ${escapeHtml(customer?.pincode || '')}</div>
                        <div style="margin-top: 4px">GSTIN: <span class="font-bold">${escapeHtml(customer?.gstin || '')}</span></div>
                    </div>
                    <div class="col w-50">
                        <div class="font-bold">${escapeHtml(customer?.name || 'Unknown')}</div> <!-- Using Billing as Ship To for now -->
                        <div>${escapeHtml(customer?.company_name || '')}</div>
                        <div>${escapeHtml(customer?.billing_address || '')}</div>
                        <div>${escapeHtml(customer?.city || '')} ${escapeHtml(customer?.pincode || '')}</div>
                        <div style="margin-top: 4px">GSTIN: <span class="font-bold">${escapeHtml(customer?.gstin || '')}</span></div>
                    </div>
                </div>

                <!-- Items Table (injected into grid logic) -->
                <div>
                    <table class="table bb-0 bl-0 br-0 bt-0">
                        <thead>
                            <tr>
                                <th style="width: 5%">#</th>
                                <th style="width: 30%; text-align: left;">Item & Description</th>
                                <th style="width: 10%">HSN/SAC</th>
                                <th style="width: 10%">Qty</th>
                                <th style="width: 10%; text-align: right;">Rate</th>
                                ${taxHeaders}
                                <th style="width: 15%; text-align: right;">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemRows}
                            <!-- Filler rows to maintain height? Optional. -->
                        </tbody>
                    </table>
                </div>

                <!-- Totals & Footer -->
                <div class="row bt-1">
                    <div class="col w-60 br-1">
                        <div>Total In Words</div>
                        <div class="total-words">${totalWords}</div>
                        
                        <div style="margin-top: 16px;">
                            <div class="font-bold">Bank Details</div>
                            <div>Bank: ${escapeHtml(org?.bank_name || '—')}</div>
                            <div>A/c No: ${escapeHtml(org?.account_number || '—')}</div>
                            <div>IFSC: ${escapeHtml(org?.ifsc || '—')}</div>
                            <div>Branch: ${escapeHtml(org?.branch || '—')}</div>
                        </div>

                        ${invoice.notes ? `<div style="margin-top: 16px;" class="muted">Note: ${escapeHtml(invoice.notes)}</div>` : ''}
                    </div>
                    
                    <div class="col w-40" style="padding: 0;">
                        <table class="table" style="border: 0; width: 100%;">
                            <tr>
                                <td style="border:0; border-bottom: 1px solid #eee;">Sub Total</td>
                                <td style="border:0; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(invoice.subtotal)}</td>
                            </tr>
                            ${isIntra ? `
                            <tr>
                                <td style="border:0; border-bottom: 1px solid #eee;">CGST</td>
                                <td style="border:0; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(invoice.cgst)}</td>
                            </tr>
                            <tr>
                                <td style="border:0; border-bottom: 1px solid #eee;">SGST</td>
                                <td style="border:0; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(invoice.sgst)}</td>
                            </tr>
                            ` : `
                            <tr>
                                <td style="border:0; border-bottom: 1px solid #eee;">IGST</td>
                                <td style="border:0; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(invoice.igst)}</td>
                            </tr>
                            `}
                            <tr>
                                <td style="border:0; font-weight: bold; background: #e5e7eb;">Total</td>
                                <td style="border:0; font-weight: bold; background: #e5e7eb; text-align: right;">${formatCurrency(invoice.total)}</td>
                            </tr>
                            <tr>
                                <td style="border:0; border-bottom: 1px solid #eee; color: red;">Payment Made</td>
                                <td style="border:0; border-bottom: 1px solid #eee; text-align: right; color: red;">(-) ${formatCurrency(invoice.amount_paid)}</td>
                            </tr>
                            <tr>
                                <td style="border:0; font-size: 14px; font-weight: bold;">Balance Due</td>
                                <td style="border:0; font-size: 14px; font-weight: bold; text-align: right;">${formatCurrency(invoice.balance_due)}</td>
                            </tr>
                        </table>

                        <div class="signature-box">
                            <div style="text-align: center;">
                                <div style="font-weight: bold;">Authorized Signature</div>
                            </div>
                        </div>
                    </div>
                </div>
                
            </div>
            
            <div class="text-center" style="margin-top: 20px; font-size: 10px; color: #666;">
                This is a computer generated invoice.
            </div>
        </body>
    </html>
    `;
}

export function renderStatementHtml(data: StatementData): string {
    const { org, customer, startDate, endDate, openingBalance, closingBalance, totalDebit, totalCredit, entries } = data;

    const entryRows = entries.map(entry => `
        <tr>
            <td style="text-align: center">${formatDate(entry.date)}</td>
            <td>${escapeHtml(entry.number)}</td>
            <td>${escapeHtml(entry.description)}</td>
            <td style="text-align: right">${entry.debit > 0 ? formatCurrency(entry.debit) : '-'}</td>
            <td style="text-align: right">${entry.credit > 0 ? formatCurrency(entry.credit) : '-'}</td>
            <td style="text-align: right">${formatCurrency(entry.balance)}</td>
        </tr>
    `).join('');

    return `
    <!doctype html>
    <html>
        <head>
            <meta charset="utf-8" />
            <style>${baseStyles()}</style>
        </head>
        <body>
            <div class="b-1">
                <div class="row bb-1">
                    <div class="company-info" style="flex: 1">
                        <h2>${escapeHtml(org?.name || 'OpenBill')}</h2>
                        <div>${escapeHtml(org?.address || '')}</div>
                        <div>${escapeHtml(org?.city || '')} ${escapeHtml(org?.pincode || '')}</div>
                    </div>
                    <div style="padding: 12px;">
                        <h1 class="title">STATEMENT</h1>
                        <div class="text-right">
                            ${formatDate(startDate)} to ${formatDate(endDate)}
                        </div>
                    </div>
                </div>
                
                <div class="row bb-1">
                    <div class="col w-50 br-1">
                        <div class="font-bold">To</div>
                        <div class="font-bold" style="font-size: 14px">${escapeHtml(customer.name)}</div>
                        <div>${escapeHtml(customer.company_name || '')}</div>
                        <div>GSTIN: ${escapeHtml(customer.gstin || '')}</div>
                    </div>
                    <div class="col w-50">
                        <div class="row">
                            <span class="label">Opening:</span> <span>${formatCurrency(openingBalance)}</span>
                        </div>
                        <div class="row">
                            <span class="label">Closing:</span> <span>${formatCurrency(closingBalance)}</span>
                        </div>
                    </div>
                </div>

                <table class="table bb-0 bl-0 br-0">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Number</th>
                            <th>Description</th>
                            <th>Debit</th>
                            <th>Credit</th>
                            <th>Balance</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${entryRows}
                    </tbody>
                </table>
            </div>
        </body>
    </html>
    `;
}

export async function renderPdf(html: string): Promise<Buffer> {
    const browser = await getBrowser();
    const page = await browser.newPage();

    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        // Adjusted margins for the border layout
        margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' }
    });

    await page.close();
    return pdfBuffer;
}
