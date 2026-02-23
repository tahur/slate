import { generateCSV } from '$lib/server/utils/gst-export';
import {
    buildPartyLedger,
    getFiscalYearRange,
    listPartyOptions,
    normalizePartyType,
    parseIsoDateOrDefault
} from '$lib/server/modules/reporting/application/party-ledger';
import { UnauthorizedError, ValidationError, jsonFromError } from '$lib/server/platform/errors';
import type { RequestHandler } from './$types';

type LedgerCsvRow = {
    date: string;
    document: string;
    number: string;
    reason: string;
    method: string;
    reference: string;
    charge: number;
    settlement: number;
    balance: number;
};

const LEDGER_CSV_COLUMNS: { key: keyof LedgerCsvRow; header: string }[] = [
    { key: 'date', header: 'Date' },
    { key: 'document', header: 'Document' },
    { key: 'number', header: 'Number' },
    { key: 'reason', header: 'Reason' },
    { key: 'method', header: 'Method' },
    { key: 'reference', header: 'Reference' },
    { key: 'charge', header: 'Charge' },
    { key: 'settlement', header: 'Settlement' },
    { key: 'balance', header: 'Running Balance' }
];

function getDocumentLabel(type: string): string {
    if (type === 'invoice') return 'Bill';
    if (type === 'receipt') return 'Receipt';
    if (type === 'supplier_payment') return 'Payment';
    if (type === 'credit_note') return 'Credit Note';
    return 'Expense';
}

export const GET: RequestHandler = async ({ locals, url }) => {
    try {
        if (!locals.user) {
            throw new UnauthorizedError();
        }

        const orgId = locals.user.orgId;
        const defaults = getFiscalYearRange();

        const partyType = normalizePartyType(url.searchParams.get('party'));
        const startRaw = parseIsoDateOrDefault(url.searchParams.get('from'), defaults.startDate);
        const endRaw = parseIsoDateOrDefault(url.searchParams.get('to'), defaults.endDate);
        const startDate = startRaw <= endRaw ? startRaw : endRaw;
        const endDate = startRaw <= endRaw ? endRaw : startRaw;

        const { customers, suppliers } = await listPartyOptions(orgId);
        const selectedPartyIdRaw =
            url.searchParams.get('partyId') ||
            (partyType === 'customer' ? (url.searchParams.get('customer') || '') : '');

        const list = partyType === 'customer' ? customers : suppliers;
        const selectedParty = list.find((party) => party.id === selectedPartyIdRaw);

        if (!selectedParty) {
            throw new ValidationError('Select a party before exporting ledger CSV');
        }

        const { ledger } = await buildPartyLedger({
            orgId,
            partyType,
            partyId: selectedParty.id,
            partyName: selectedParty.name,
            partyCompanyName: selectedParty.companyName,
            startDate,
            endDate,
            page: 1,
            pageSize: 100000
        });

        const rows: LedgerCsvRow[] = ledger.entries.map((entry) => ({
            date: entry.date,
            document: getDocumentLabel(entry.sourceType),
            number: entry.number,
            reason: entry.reason,
            method: entry.methodLabel,
            reference: entry.reference,
            charge: entry.charge,
            settlement: entry.settlement,
            balance: entry.balance
        }));

        const csvContent = generateCSV(rows, LEDGER_CSV_COLUMNS);
        const filename = `party_ledger_${partyType}_${startDate}_to_${endDate}.csv`;

        return new Response(csvContent, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="${filename}"`
            }
        });
    } catch (error) {
        return jsonFromError(error, 'Party ledger CSV export failed');
    }
};
