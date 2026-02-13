import {
    calculateGSTR3BData,
    categorizeForGSTR1,
    type GSTR1CreditNote,
    type GSTR1Data,
    type GSTR1Invoice,
    type GSTR3BData,
    type GSTR3BExpense
} from '$lib/server/utils/gst-export';
import {
    findOrganizationForGstReporting,
    listCustomersForOrg,
    listGstr1CreditNotes,
    listGstr1Invoices,
    listGstr3bExpenses,
    listInvoiceItemsByInvoiceIds,
    listVendorsForOrg
} from '../infra/gst-queries';
import { ValidationError } from '$lib/server/platform/errors';
import { localDateStr } from '$lib/utils/date';
import {
    createReportCacheKey,
    getCachedReport,
    invalidateOrgReportCache,
    setCachedReport
} from '$lib/server/platform/observability';

export interface DateRange {
    startDate: string;
    endDate: string;
}

export type Gstr1CsvSection = 'all' | 'b2b' | 'b2cl' | 'b2cs' | 'cdnr' | 'hsn';

const DATE_FORMAT_RE = /^\d{4}-\d{2}-\d{2}$/;
const GSTR1_CSV_SECTIONS: ReadonlySet<Gstr1CsvSection> = new Set([
    'all',
    'b2b',
    'b2cl',
    'b2cs',
    'cdnr',
    'hsn'
]);

function assertIsoDate(value: string, fieldName: 'from' | 'to'): string {
    if (!DATE_FORMAT_RE.test(value)) {
        throw new ValidationError(`Invalid ${fieldName} date format. Expected YYYY-MM-DD.`);
    }

    const parsed = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(parsed.getTime())) {
        throw new ValidationError(`Invalid ${fieldName} date value.`);
    }

    const normalized = parsed.toISOString().slice(0, 10);
    if (normalized !== value) {
        throw new ValidationError(`Invalid ${fieldName} date value.`);
    }

    return value;
}

export function getCurrentMonthDateRange(now = new Date()): DateRange {
    return {
        startDate: localDateStr(new Date(now.getFullYear(), now.getMonth(), 1)),
        endDate: localDateStr(new Date(now.getFullYear(), now.getMonth() + 1, 0))
    };
}

export function resolveDateRangeFromUrl(url: URL): DateRange {
    try {
        return parseDateRangeQueryFromUrl(url);
    } catch {
        return getCurrentMonthDateRange();
    }
}

export function parseDateRangeQueryFromUrl(url: URL): DateRange {
    const defaults = getCurrentMonthDateRange();
    const fromRaw = url.searchParams.get('from');
    const toRaw = url.searchParams.get('to');

    const startDate = fromRaw ? assertIsoDate(fromRaw, 'from') : defaults.startDate;
    const endDate = toRaw ? assertIsoDate(toRaw, 'to') : defaults.endDate;

    if (startDate <= endDate) {
        return { startDate, endDate };
    }

    return {
        startDate: endDate,
        endDate: startDate
    };
}

export function parseGstr1CsvSectionFromUrl(url: URL): Gstr1CsvSection {
    const section = (url.searchParams.get('section') || 'all').toLowerCase();
    if (GSTR1_CSV_SECTIONS.has(section as Gstr1CsvSection)) {
        return section as Gstr1CsvSection;
    }
    throw new ValidationError('Invalid section. Allowed values: all, b2b, b2cl, b2cs, cdnr, hsn.');
}

export function formatPeriodRange(startDate: string, endDate: string): string {
    const periodStart = new Date(startDate);
    const periodEnd = new Date(endDate);

    return `${periodStart.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })} - ${periodEnd.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}`;
}

export function filingPeriodFromDate(startDate: string): string {
    const periodDate = new Date(startDate);
    return String(periodDate.getMonth() + 1).padStart(2, '0') + periodDate.getFullYear();
}

export interface Gstr1ReportResult {
    org: Awaited<ReturnType<typeof findOrganizationForGstReporting>>;
    data: GSTR1Data;
}

export async function buildGstr1Report(orgId: string, range: DateRange): Promise<Gstr1ReportResult> {
    const cacheKey = createReportCacheKey(orgId, 'gstr1', range.startDate, range.endDate);
    const cached = getCachedReport<Gstr1ReportResult>(cacheKey);
    if (cached) {
        return cached;
    }

    const [org, invoiceRows, customerRows, creditNoteRows] = await Promise.all([
        findOrganizationForGstReporting(orgId),
        listGstr1Invoices(orgId, range.startDate, range.endDate),
        listCustomersForOrg(orgId),
        listGstr1CreditNotes(orgId, range.startDate, range.endDate)
    ]);

    const invoiceIds = invoiceRows.map((invoice) => invoice.id);
    const itemRows = await listInvoiceItemsByInvoiceIds(invoiceIds);

    const customerMap = new Map(customerRows.map((customer) => [customer.id, customer]));
    const itemsByInvoice = new Map<string, typeof itemRows>();

    for (const item of itemRows) {
        const existing = itemsByInvoice.get(item.invoice_id);
        if (existing) {
            existing.push(item);
            continue;
        }
        itemsByInvoice.set(item.invoice_id, [item]);
    }

    const invoicesWithCustomers: GSTR1Invoice[] = invoiceRows.map((invoice) => ({
        ...invoice,
        customer: customerMap.get(invoice.customer_id) || null,
        items: itemsByInvoice.get(invoice.id) || []
    }));

    const creditNotesWithCustomers: GSTR1CreditNote[] = creditNoteRows.map((creditNote) => ({
        ...creditNote,
        customer: customerMap.get(creditNote.customer_id) || null
    }));

    const orgStateCode = org?.state_code || '29';
    const data = categorizeForGSTR1(invoicesWithCustomers, creditNotesWithCustomers, orgStateCode);
    data.period = formatPeriodRange(range.startDate, range.endDate);

    const result = { org, data };
    setCachedReport(cacheKey, result);
    return result;
}

export interface Gstr3bReportResult {
    org: Awaited<ReturnType<typeof findOrganizationForGstReporting>>;
    data: GSTR3BData;
}

export async function buildGstr3bReport(orgId: string, range: DateRange): Promise<Gstr3bReportResult> {
    const cacheKey = createReportCacheKey(orgId, 'gstr3b', range.startDate, range.endDate);
    const cached = getCachedReport<Gstr3bReportResult>(cacheKey);
    if (cached) {
        return cached;
    }

    const [org, expenseRows, vendorRows] = await Promise.all([
        findOrganizationForGstReporting(orgId),
        listGstr3bExpenses(orgId, range.startDate, range.endDate),
        listVendorsForOrg(orgId)
    ]);

    const vendorMap = new Map(vendorRows.map((vendor) => [vendor.id, vendor]));
    const expensesWithVendors: GSTR3BExpense[] = expenseRows.map((expense) => ({
        ...expense,
        vendor: expense.vendor_id ? vendorMap.get(expense.vendor_id) || null : null
    }));

    const data = calculateGSTR3BData(expensesWithVendors);
    data.period = formatPeriodRange(range.startDate, range.endDate);

    const result = { org, data };
    setCachedReport(cacheKey, result);
    return result;
}

export function invalidateReportingCacheForOrg(orgId: string): number {
    return invalidateOrgReportCache(orgId);
}
