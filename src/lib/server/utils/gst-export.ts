import type { invoices, invoice_items, customers, credit_notes, expenses, vendors } from '$lib/server/db/schema';

type Invoice = typeof invoices.$inferSelect;
type InvoiceItem = typeof invoice_items.$inferSelect;
type Customer = typeof customers.$inferSelect;
type CreditNote = typeof credit_notes.$inferSelect;
type Expense = typeof expenses.$inferSelect;
type Vendor = typeof vendors.$inferSelect;

// GSTR-1 Types
export type GSTR1Invoice = Invoice & {
    customer: Customer | null;
    items: InvoiceItem[];
};

export type GSTR1CreditNote = CreditNote & {
    customer: Customer | null;
};

export type B2BEntry = {
    gstin: string;
    invoiceNumber: string;
    invoiceDate: string;
    invoiceValue: number;
    placeOfSupply: string;
    reverseCharge: string;
    taxableValue: number;
    cgst: number;
    sgst: number;
    igst: number;
    rate: number;
};

export type B2CLEntry = {
    invoiceNumber: string;
    invoiceDate: string;
    invoiceValue: number;
    placeOfSupply: string;
    taxableValue: number;
    cgst: number;
    sgst: number;
    igst: number;
    rate: number;
};

export type B2CSEntry = {
    placeOfSupply: string;
    type: 'OE' | 'E'; // OE = Others, E = E-Commerce
    taxableValue: number;
    cgst: number;
    sgst: number;
    igst: number;
    rate: number;
};

export type CDNREntry = {
    gstin: string;
    noteNumber: string;
    noteDate: string;
    noteType: 'C' | 'D'; // Credit or Debit
    noteValue: number;
    originalInvoiceNumber: string;
    originalInvoiceDate: string;
    taxableValue: number;
    cgst: number;
    sgst: number;
    igst: number;
    rate: number;
};

export type HSNEntry = {
    hsnCode: string;
    description: string;
    uqc: string; // Unit Quantity Code
    totalQuantity: number;
    totalValue: number;
    taxableValue: number;
    cgst: number;
    sgst: number;
    igst: number;
};

export type GSTR1Data = {
    period: string;
    b2b: B2BEntry[];
    b2cl: B2CLEntry[];
    b2cs: B2CSEntry[];
    cdnr: CDNREntry[];
    hsn: HSNEntry[];
    summary: {
        totalInvoices: number;
        totalTaxableValue: number;
        totalCgst: number;
        totalSgst: number;
        totalIgst: number;
        totalValue: number;
    };
};

// GSTR-3B Types
export type GSTR3BExpense = Expense & {
    vendor: Vendor | null;
};

export type GSTR3BVendorEntry = {
    vendorId: string | null;
    vendorName: string;
    gstin: string | null;
    expenseCount: number;
    totalAmount: number;
    cgst: number;
    sgst: number;
    igst: number;
    totalTax: number;
    isRegistered: boolean;
};

export type GSTR3BData = {
    period: string;
    vendorWise: GSTR3BVendorEntry[];
    summary: {
        totalPurchases: number;
        totalExpenseValue: number;
        eligibleItcCgst: number;
        eligibleItcSgst: number;
        eligibleItcIgst: number;
        totalEligibleItc: number;
        ineligibleItc: number;
    };
};

// B2CL Threshold (Inter-state, unregistered, > ₹2.5L)
const B2CL_THRESHOLD = 250000;

/**
 * Categorize invoices and credit notes for GSTR-1 filing
 */
export function categorizeForGSTR1(
    invoicesWithCustomers: GSTR1Invoice[],
    creditNotesWithCustomers: GSTR1CreditNote[],
    orgStateCode: string
): GSTR1Data {
    const b2b: B2BEntry[] = [];
    const b2cl: B2CLEntry[] = [];
    const b2csMap = new Map<string, B2CSEntry>();
    const cdnr: CDNREntry[] = [];
    const hsnMap = new Map<string, HSNEntry>();

    let totalInvoices = 0;
    let totalTaxableValue = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;
    let totalValue = 0;

    // Process invoices
    for (const inv of invoicesWithCustomers) {
        if (inv.status === 'draft' || inv.status === 'cancelled') continue;

        totalInvoices++;
        totalTaxableValue += inv.taxable_amount || 0;
        totalCgst += inv.cgst || 0;
        totalSgst += inv.sgst || 0;
        totalIgst += inv.igst || 0;
        totalValue += inv.total || 0;

        const customerGstin = inv.customer?.gstin;
        const placeOfSupply = inv.customer?.place_of_supply || inv.customer?.state_code || orgStateCode;
        const isInterState = inv.is_inter_state || false;

        // Calculate average GST rate from items
        const avgRate = calculateAverageGstRate(inv.items, inv.taxable_amount || 0);

        if (customerGstin) {
            // B2B - Registered customer
            b2b.push({
                gstin: customerGstin,
                invoiceNumber: inv.invoice_number,
                invoiceDate: inv.invoice_date,
                invoiceValue: inv.total || 0,
                placeOfSupply,
                reverseCharge: 'N',
                taxableValue: inv.taxable_amount || 0,
                cgst: inv.cgst || 0,
                sgst: inv.sgst || 0,
                igst: inv.igst || 0,
                rate: avgRate
            });
        } else if (isInterState && (inv.total || 0) > B2CL_THRESHOLD) {
            // B2CL - Unregistered, Inter-state, > ₹2.5L
            b2cl.push({
                invoiceNumber: inv.invoice_number,
                invoiceDate: inv.invoice_date,
                invoiceValue: inv.total || 0,
                placeOfSupply,
                taxableValue: inv.taxable_amount || 0,
                cgst: inv.cgst || 0,
                sgst: inv.sgst || 0,
                igst: inv.igst || 0,
                rate: avgRate
            });
        } else {
            // B2CS - Unregistered, Intra-state OR <= ₹2.5L
            const key = `${placeOfSupply}-${avgRate}`;
            const existing = b2csMap.get(key);
            if (existing) {
                existing.taxableValue += inv.taxable_amount || 0;
                existing.cgst += inv.cgst || 0;
                existing.sgst += inv.sgst || 0;
                existing.igst += inv.igst || 0;
            } else {
                b2csMap.set(key, {
                    placeOfSupply,
                    type: 'OE',
                    taxableValue: inv.taxable_amount || 0,
                    cgst: inv.cgst || 0,
                    sgst: inv.sgst || 0,
                    igst: inv.igst || 0,
                    rate: avgRate
                });
            }
        }

        // Process HSN summary from items
        for (const item of inv.items) {
            const hsnCode = item.hsn_code || 'UNSPECIFIED';
            const existing = hsnMap.get(hsnCode);
            if (existing) {
                existing.totalQuantity += item.quantity;
                existing.totalValue += item.total || 0;
                existing.taxableValue += item.amount || 0;
                existing.cgst += item.cgst || 0;
                existing.sgst += item.sgst || 0;
                existing.igst += item.igst || 0;
            } else {
                hsnMap.set(hsnCode, {
                    hsnCode,
                    description: item.description,
                    uqc: item.unit || 'NOS',
                    totalQuantity: item.quantity,
                    totalValue: item.total || 0,
                    taxableValue: item.amount || 0,
                    cgst: item.cgst || 0,
                    sgst: item.sgst || 0,
                    igst: item.igst || 0
                });
            }
        }
    }

    // Process credit notes (CDNR)
    for (const cn of creditNotesWithCustomers) {
        if (cn.status === 'cancelled') continue;

        const customerGstin = cn.customer?.gstin;
        if (!customerGstin) continue; // Only registered customers in CDNR

        // Calculate average rate (simple approximation)
        const taxAmount = (cn.cgst || 0) + (cn.sgst || 0) + (cn.igst || 0);
        const avgRate = cn.subtotal > 0 ? (taxAmount / cn.subtotal) * 100 : 0;

        cdnr.push({
            gstin: customerGstin,
            noteNumber: cn.credit_note_number,
            noteDate: cn.credit_note_date,
            noteType: 'C',
            noteValue: cn.total || 0,
            originalInvoiceNumber: '', // Would need invoice lookup
            originalInvoiceDate: '',
            taxableValue: cn.subtotal || 0,
            cgst: cn.cgst || 0,
            sgst: cn.sgst || 0,
            igst: cn.igst || 0,
            rate: Math.round(avgRate)
        });
    }

    return {
        period: '',
        b2b,
        b2cl,
        b2cs: Array.from(b2csMap.values()),
        cdnr,
        hsn: Array.from(hsnMap.values()),
        summary: {
            totalInvoices,
            totalTaxableValue,
            totalCgst,
            totalSgst,
            totalIgst,
            totalValue
        }
    };
}

/**
 * Calculate ITC data from expenses for GSTR-3B
 */
export function calculateGSTR3BData(expensesWithVendors: GSTR3BExpense[]): GSTR3BData {
    const vendorMap = new Map<string, GSTR3BVendorEntry>();

    let totalPurchases = 0;
    let totalExpenseValue = 0;
    let eligibleItcCgst = 0;
    let eligibleItcSgst = 0;
    let eligibleItcIgst = 0;
    let ineligibleItc = 0;

    for (const expense of expensesWithVendors) {
        const vendorKey = expense.vendor_id || 'unregistered';
        const vendorName = expense.vendor?.name || expense.vendor_name || 'Unregistered/Unknown';
        const vendorGstin = expense.vendor?.gstin || null;
        const isRegistered = !!vendorGstin;

        totalPurchases++;
        totalExpenseValue += expense.amount || 0;

        const cgst = expense.cgst || 0;
        const sgst = expense.sgst || 0;
        const igst = expense.igst || 0;
        const totalTax = cgst + sgst + igst;

        // ITC is only eligible from registered vendors
        if (isRegistered) {
            eligibleItcCgst += cgst;
            eligibleItcSgst += sgst;
            eligibleItcIgst += igst;
        } else {
            ineligibleItc += totalTax;
        }

        const existing = vendorMap.get(vendorKey);
        if (existing) {
            existing.expenseCount++;
            existing.totalAmount += expense.amount || 0;
            existing.cgst += cgst;
            existing.sgst += sgst;
            existing.igst += igst;
            existing.totalTax += totalTax;
        } else {
            vendorMap.set(vendorKey, {
                vendorId: expense.vendor_id,
                vendorName,
                gstin: vendorGstin,
                expenseCount: 1,
                totalAmount: expense.amount || 0,
                cgst,
                sgst,
                igst,
                totalTax,
                isRegistered
            });
        }
    }

    return {
        period: '',
        vendorWise: Array.from(vendorMap.values()).sort((a, b) => b.totalAmount - a.totalAmount),
        summary: {
            totalPurchases,
            totalExpenseValue,
            eligibleItcCgst,
            eligibleItcSgst,
            eligibleItcIgst,
            totalEligibleItc: eligibleItcCgst + eligibleItcSgst + eligibleItcIgst,
            ineligibleItc
        }
    };
}

/**
 * Generate CSV string from data
 */
export function generateCSV<T extends Record<string, unknown>>(
    data: T[],
    columns: { key: keyof T; header: string }[]
): string {
    if (data.length === 0) {
        return columns.map(c => c.header).join(',') + '\n';
    }

    const headers = columns.map(c => escapeCSV(c.header)).join(',');
    const rows = data.map(row =>
        columns.map(c => escapeCSV(String(row[c.key] ?? ''))).join(',')
    );

    return [headers, ...rows].join('\n');
}

function escapeCSV(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
}

/**
 * Generate GSTR-1 JSON in GST portal format
 */
export function generateGSTR1JSON(data: GSTR1Data, gstin: string, fp: string): object {
    return {
        gstin,
        fp, // Filing period (MMYYYY)
        b2b: data.b2b.map(entry => ({
            ctin: entry.gstin,
            inv: [{
                inum: entry.invoiceNumber,
                idt: formatDateForGST(entry.invoiceDate),
                val: entry.invoiceValue,
                pos: entry.placeOfSupply,
                rchrg: entry.reverseCharge,
                itms: [{
                    num: 1,
                    itm_det: {
                        rt: entry.rate,
                        txval: entry.taxableValue,
                        camt: entry.cgst,
                        samt: entry.sgst,
                        iamt: entry.igst
                    }
                }]
            }]
        })),
        b2cl: data.b2cl.map(entry => ({
            pos: entry.placeOfSupply,
            inv: [{
                inum: entry.invoiceNumber,
                idt: formatDateForGST(entry.invoiceDate),
                val: entry.invoiceValue,
                itms: [{
                    num: 1,
                    itm_det: {
                        rt: entry.rate,
                        txval: entry.taxableValue,
                        iamt: entry.igst
                    }
                }]
            }]
        })),
        b2cs: data.b2cs.map(entry => ({
            pos: entry.placeOfSupply,
            typ: entry.type,
            rt: entry.rate,
            txval: entry.taxableValue,
            camt: entry.cgst,
            samt: entry.sgst,
            iamt: entry.igst
        })),
        cdnr: data.cdnr.length > 0 ? data.cdnr.map(entry => ({
            ctin: entry.gstin,
            nt: [{
                ntty: entry.noteType,
                nt_num: entry.noteNumber,
                nt_dt: formatDateForGST(entry.noteDate),
                val: entry.noteValue,
                itms: [{
                    num: 1,
                    itm_det: {
                        rt: entry.rate,
                        txval: entry.taxableValue,
                        camt: entry.cgst,
                        samt: entry.sgst,
                        iamt: entry.igst
                    }
                }]
            }]
        })) : undefined,
        hsn: {
            data: data.hsn.map(entry => ({
                hsn_sc: entry.hsnCode,
                desc: entry.description,
                uqc: entry.uqc,
                qty: entry.totalQuantity,
                val: entry.totalValue,
                txval: entry.taxableValue,
                camt: entry.cgst,
                samt: entry.sgst,
                iamt: entry.igst
            }))
        }
    };
}

/**
 * Generate GSTR-3B JSON summary
 */
export function generateGSTR3BJSON(data: GSTR3BData, gstin: string, fp: string): object {
    return {
        gstin,
        fp, // Filing period (MMYYYY)
        itc_elg: {
            itc_avl: [
                {
                    ty: 'IMPG', // Import of goods
                    iamt: 0,
                    camt: 0,
                    samt: 0
                },
                {
                    ty: 'IMPS', // Import of services
                    iamt: 0,
                    camt: 0,
                    samt: 0
                },
                {
                    ty: 'ISRC', // Inward supplies from registered (reverse charge)
                    iamt: 0,
                    camt: 0,
                    samt: 0
                },
                {
                    ty: 'ISD', // Input Service Distributor
                    iamt: 0,
                    camt: 0,
                    samt: 0
                },
                {
                    ty: 'OTH', // All other ITC
                    iamt: data.summary.eligibleItcIgst,
                    camt: data.summary.eligibleItcCgst,
                    samt: data.summary.eligibleItcSgst
                }
            ],
            itc_net: {
                iamt: data.summary.eligibleItcIgst,
                camt: data.summary.eligibleItcCgst,
                samt: data.summary.eligibleItcSgst
            },
            itc_inelg: [
                {
                    ty: 'RUL', // As per rules
                    iamt: 0,
                    camt: 0,
                    samt: 0
                },
                {
                    ty: 'OTH', // Others
                    iamt: data.summary.ineligibleItc,
                    camt: 0,
                    samt: 0
                }
            ]
        },
        vendor_summary: data.vendorWise.map(v => ({
            vendor_name: v.vendorName,
            gstin: v.gstin,
            expense_count: v.expenseCount,
            total_amount: v.totalAmount,
            cgst: v.cgst,
            sgst: v.sgst,
            igst: v.igst,
            total_tax: v.totalTax,
            itc_eligible: v.isRegistered
        }))
    };
}

function calculateAverageGstRate(items: InvoiceItem[], taxableAmount: number): number {
    if (taxableAmount === 0 || items.length === 0) return 0;

    let weightedRate = 0;
    for (const item of items) {
        const itemWeight = (item.amount || 0) / taxableAmount;
        weightedRate += (item.gst_rate || 0) * itemWeight;
    }

    // Round to common GST rates
    const commonRates = [0, 5, 12, 18, 28];
    return commonRates.reduce((prev, curr) =>
        Math.abs(curr - weightedRate) < Math.abs(prev - weightedRate) ? curr : prev
    );
}

function formatDateForGST(dateStr: string): string {
    // Convert YYYY-MM-DD to DD-MM-YYYY
    const parts = dateStr.split('-');
    if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
}

// CSV column definitions
export const GSTR1_B2B_COLUMNS = [
    { key: 'gstin' as const, header: 'GSTIN of Recipient' },
    { key: 'invoiceNumber' as const, header: 'Invoice Number' },
    { key: 'invoiceDate' as const, header: 'Invoice Date' },
    { key: 'invoiceValue' as const, header: 'Invoice Value' },
    { key: 'placeOfSupply' as const, header: 'Place of Supply' },
    { key: 'reverseCharge' as const, header: 'Reverse Charge' },
    { key: 'taxableValue' as const, header: 'Taxable Value' },
    { key: 'rate' as const, header: 'Rate' },
    { key: 'cgst' as const, header: 'CGST' },
    { key: 'sgst' as const, header: 'SGST' },
    { key: 'igst' as const, header: 'IGST' }
];

export const GSTR1_B2CL_COLUMNS = [
    { key: 'invoiceNumber' as const, header: 'Invoice Number' },
    { key: 'invoiceDate' as const, header: 'Invoice Date' },
    { key: 'invoiceValue' as const, header: 'Invoice Value' },
    { key: 'placeOfSupply' as const, header: 'Place of Supply' },
    { key: 'taxableValue' as const, header: 'Taxable Value' },
    { key: 'rate' as const, header: 'Rate' },
    { key: 'igst' as const, header: 'IGST' }
];

export const GSTR1_B2CS_COLUMNS = [
    { key: 'placeOfSupply' as const, header: 'Place of Supply' },
    { key: 'type' as const, header: 'Type' },
    { key: 'taxableValue' as const, header: 'Taxable Value' },
    { key: 'rate' as const, header: 'Rate' },
    { key: 'cgst' as const, header: 'CGST' },
    { key: 'sgst' as const, header: 'SGST' },
    { key: 'igst' as const, header: 'IGST' }
];

export const GSTR1_CDNR_COLUMNS = [
    { key: 'gstin' as const, header: 'GSTIN of Recipient' },
    { key: 'noteNumber' as const, header: 'Note Number' },
    { key: 'noteDate' as const, header: 'Note Date' },
    { key: 'noteType' as const, header: 'Note Type' },
    { key: 'noteValue' as const, header: 'Note Value' },
    { key: 'taxableValue' as const, header: 'Taxable Value' },
    { key: 'rate' as const, header: 'Rate' },
    { key: 'cgst' as const, header: 'CGST' },
    { key: 'sgst' as const, header: 'SGST' },
    { key: 'igst' as const, header: 'IGST' }
];

export const GSTR1_HSN_COLUMNS = [
    { key: 'hsnCode' as const, header: 'HSN Code' },
    { key: 'description' as const, header: 'Description' },
    { key: 'uqc' as const, header: 'UQC' },
    { key: 'totalQuantity' as const, header: 'Total Quantity' },
    { key: 'totalValue' as const, header: 'Total Value' },
    { key: 'taxableValue' as const, header: 'Taxable Value' },
    { key: 'cgst' as const, header: 'CGST' },
    { key: 'sgst' as const, header: 'SGST' },
    { key: 'igst' as const, header: 'IGST' }
];

export const GSTR3B_VENDOR_COLUMNS = [
    { key: 'vendorName' as const, header: 'Vendor Name' },
    { key: 'gstin' as const, header: 'GSTIN' },
    { key: 'expenseCount' as const, header: 'Expense Count' },
    { key: 'totalAmount' as const, header: 'Total Amount' },
    { key: 'cgst' as const, header: 'CGST' },
    { key: 'sgst' as const, header: 'SGST' },
    { key: 'igst' as const, header: 'IGST' },
    { key: 'totalTax' as const, header: 'Total Tax' },
    { key: 'isRegistered' as const, header: 'ITC Eligible' }
];
