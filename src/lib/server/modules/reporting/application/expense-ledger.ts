import { and, eq, gte, lt, lte, sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { accounts, expenses, payment_methods, vendors } from '$lib/server/db/schema';
import { round2 } from '$lib/utils/currency';

export type ExpenseAccountOption = {
	id: string;
	name: string;
	code: string;
};

export type CategorySummaryRow = {
	categoryId: string;
	accountName: string;
	accountCode: string;
	count: number;
	total: number;
};

export type ExpenseLedgerEntry = {
	id: string;
	date: string;
	number: string;
	description: string;
	supplierName: string;
	paymentStatus: string;
	methodLabel: string;
	total: number;
	runningTotal: number;
	href: string;
};

export type ExpenseLedgerPagination = {
	page: number;
	pageSize: number;
	totalEntries: number;
	totalPages: number;
	hasPreviousPage: boolean;
	hasNextPage: boolean;
};

function toAmount(value: number | null | undefined): number {
	return round2(Number(value) || 0);
}

export async function listExpenseAccountOptions(orgId: string): Promise<ExpenseAccountOption[]> {
	return db
		.select({
			id: accounts.id,
			name: accounts.account_name,
			code: accounts.account_code
		})
		.from(accounts)
		.where(
			and(
				eq(accounts.org_id, orgId),
				eq(accounts.account_type, 'expense'),
				eq(accounts.is_active, true)
			)
		)
		.orderBy(accounts.account_code);
}

export async function buildCategorySummary(
	orgId: string,
	startDate: string,
	endDate: string
): Promise<CategorySummaryRow[]> {
	const rows = await db
		.select({
			categoryId: expenses.category,
			accountName: accounts.account_name,
			accountCode: accounts.account_code,
			count: sql<number>`COUNT(*)::int`,
			total: sql<number>`COALESCE(SUM(${expenses.total}), 0)`
		})
		.from(expenses)
		.innerJoin(accounts, eq(expenses.category, accounts.id))
		.where(
			and(
				eq(expenses.org_id, orgId),
				gte(expenses.expense_date, startDate),
				lte(expenses.expense_date, endDate)
			)
		)
		.groupBy(expenses.category, accounts.account_name, accounts.account_code)
		.orderBy(accounts.account_code);

	return rows.map((row) => ({
		categoryId: row.categoryId,
		accountName: row.accountName,
		accountCode: row.accountCode,
		count: Number(row.count),
		total: toAmount(row.total)
	}));
}

type BuildExpenseLedgerInput = {
	orgId: string;
	categoryId: string;
	startDate: string;
	endDate: string;
	page: number;
	pageSize: number;
};

export async function buildExpenseLedger(input: BuildExpenseLedgerInput): Promise<{
	categoryName: string;
	opening: number;
	periodTotal: number;
	periodPaid: number;
	periodUnpaid: number;
	entries: ExpenseLedgerEntry[];
	pagination: ExpenseLedgerPagination;
}> {
	const [periodRows, openingRow, categoryRow] = await Promise.all([
		db
			.select({
				id: expenses.id,
				date: expenses.expense_date,
				number: expenses.expense_number,
				description: expenses.description,
				vendorName: vendors.display_name,
				vendorNameFallback: expenses.vendor_name,
				paymentStatus: expenses.payment_status,
				methodLabel: payment_methods.label,
				total: expenses.total,
				createdAt: expenses.created_at
			})
			.from(expenses)
			.leftJoin(vendors, eq(expenses.vendor_id, vendors.id))
			.leftJoin(payment_methods, eq(expenses.payment_method_id, payment_methods.id))
			.where(
				and(
					eq(expenses.org_id, input.orgId),
					eq(expenses.category, input.categoryId),
					gte(expenses.expense_date, input.startDate),
					lte(expenses.expense_date, input.endDate)
				)
			)
			.orderBy(expenses.expense_date, expenses.created_at),
		db
			.select({
				total: sql<number>`COALESCE(SUM(${expenses.total}), 0)`
			})
			.from(expenses)
			.where(
				and(
					eq(expenses.org_id, input.orgId),
					eq(expenses.category, input.categoryId),
					lt(expenses.expense_date, input.startDate)
				)
			),
		db
			.select({ name: accounts.account_name })
			.from(accounts)
			.where(eq(accounts.id, input.categoryId))
			.limit(1)
	]);

	const opening = toAmount(openingRow[0]?.total);
	const categoryName = categoryRow[0]?.name || 'Unknown';

	let running = opening;
	const allEntries: ExpenseLedgerEntry[] = periodRows.map((row) => {
		const total = toAmount(row.total);
		running = round2(running + total);
		return {
			id: row.id,
			date: row.date,
			number: row.number,
			description: row.description || '',
			supplierName: row.vendorName || row.vendorNameFallback || '',
			paymentStatus: row.paymentStatus || 'paid',
			methodLabel: row.methodLabel || '',
			total,
			runningTotal: running,
			href: `/expenses/${row.id}`
		};
	});

	let periodPaid = 0;
	let periodUnpaid = 0;
	for (const entry of allEntries) {
		if (entry.paymentStatus === 'unpaid') {
			periodUnpaid = round2(periodUnpaid + entry.total);
		} else {
			periodPaid = round2(periodPaid + entry.total);
		}
	}
	const periodTotal = round2(periodPaid + periodUnpaid);

	// Paginate
	const totalEntries = allEntries.length;
	const pageSize = Math.max(1, input.pageSize);
	const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
	const page = Math.max(1, Math.min(input.page, totalPages));
	const offset = (page - 1) * pageSize;

	return {
		categoryName,
		opening,
		periodTotal,
		periodPaid,
		periodUnpaid,
		entries: allEntries.slice(offset, offset + pageSize),
		pagination: {
			page,
			pageSize,
			totalEntries,
			totalPages,
			hasPreviousPage: page > 1,
			hasNextPage: page < totalPages
		}
	};
}
