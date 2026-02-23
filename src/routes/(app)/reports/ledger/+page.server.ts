import { redirect } from '@sveltejs/kit';
import { parsePagination } from '$lib/server/platform/db/pagination';
import {
    buildPartyLedger,
    getFiscalYearRange,
    listPartyOptions,
    normalizePartyType,
    parseIsoDateOrDefault
} from '$lib/server/modules/reporting/application/party-ledger';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
    if (!locals.user) {
        redirect(302, '/login');
    }

    const orgId = locals.user.orgId;
    const defaults = getFiscalYearRange();

    const partyType = normalizePartyType(url.searchParams.get('party'));

    const startRaw = parseIsoDateOrDefault(url.searchParams.get('from'), defaults.startDate);
    const endRaw = parseIsoDateOrDefault(url.searchParams.get('to'), defaults.endDate);
    const startDate = startRaw <= endRaw ? startRaw : endRaw;
    const endDate = startRaw <= endRaw ? endRaw : startRaw;

    const paginationInput = parsePagination(url.searchParams, { defaultPageSize: 50, maxPageSize: 200 });

    const { customers, suppliers } = await listPartyOptions(orgId);

    const selectedPartyIdRaw =
        url.searchParams.get('partyId') ||
        (partyType === 'customer' ? (url.searchParams.get('customer') || '') : '');

    const validIds = new Set((partyType === 'customer' ? customers : suppliers).map((party) => party.id));
    const selectedPartyId = selectedPartyIdRaw && validIds.has(selectedPartyIdRaw) ? selectedPartyIdRaw : '';

    if (!selectedPartyId) {
        return {
            partyType,
            selectedPartyId: '',
            startDate,
            endDate,
            customers,
            suppliers,
            ledger: null,
            pagination: null
        };
    }

    const selectedParty = (partyType === 'customer' ? customers : suppliers).find(
        (party) => party.id === selectedPartyId
    );

    if (!selectedParty) {
        return {
            partyType,
            selectedPartyId: '',
            startDate,
            endDate,
            customers,
            suppliers,
            ledger: null,
            pagination: null
        };
    }

    const result = await buildPartyLedger({
        orgId,
        partyType,
        partyId: selectedParty.id,
        partyName: selectedParty.name,
        partyCompanyName: selectedParty.companyName,
        startDate,
        endDate,
        page: paginationInput.page,
        pageSize: paginationInput.pageSize
    });

    return {
        partyType,
        selectedPartyId,
        startDate,
        endDate,
        customers,
        suppliers,
        ledger: result.ledger,
        pagination: result.pagination
    };
};
