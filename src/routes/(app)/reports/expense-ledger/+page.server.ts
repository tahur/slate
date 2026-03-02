import { redirect } from '@sveltejs/kit';
import { parsePagination } from '$lib/server/platform/db/pagination';
import {
	getFiscalYearRange,
	parseIsoDateOrDefault
} from '$lib/server/modules/reporting/application/party-ledger';
import {
	buildCategorySummary,
	buildExpenseLedger,
	listExpenseAccountOptions
} from '$lib/server/modules/reporting/application/expense-ledger';
import { ensureExpenseAccounts } from '$lib/server/seed';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user) {
		redirect(302, '/login');
	}

	const orgId = locals.user.orgId;

	await ensureExpenseAccounts(orgId);

	const defaults = getFiscalYearRange();
	const startRaw = parseIsoDateOrDefault(url.searchParams.get('from'), defaults.startDate);
	const endRaw = parseIsoDateOrDefault(url.searchParams.get('to'), defaults.endDate);
	const startDate = startRaw <= endRaw ? startRaw : endRaw;
	const endDate = startRaw <= endRaw ? endRaw : startRaw;

	const categoryId = url.searchParams.get('category') || '';
	const paginationInput = parsePagination(url.searchParams, { defaultPageSize: 50, maxPageSize: 200 });

	const [categoryOptions, categorySummary] = await Promise.all([
		listExpenseAccountOptions(orgId),
		buildCategorySummary(orgId, startDate, endDate)
	]);

	// Validate selected category
	const validCategoryIds = new Set(categoryOptions.map((opt) => opt.id));
	const selectedCategoryId = categoryId && validCategoryIds.has(categoryId) ? categoryId : '';

	if (!selectedCategoryId) {
		return {
			startDate,
			endDate,
			selectedCategoryId: '',
			categoryOptions,
			categorySummary,
			ledger: null,
			pagination: null
		};
	}

	const ledger = await buildExpenseLedger({
		orgId,
		categoryId: selectedCategoryId,
		startDate,
		endDate,
		page: paginationInput.page,
		pageSize: paginationInput.pageSize
	});

	return {
		startDate,
		endDate,
		selectedCategoryId,
		categoryOptions,
		categorySummary,
		ledger,
		pagination: ledger.pagination
	};
};
