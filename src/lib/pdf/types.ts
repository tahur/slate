import type { invoices, invoice_items, customers, organizations } from '$lib/server/db/schema';

type Invoice = typeof invoices.$inferSelect;
type InvoiceItem = typeof invoice_items.$inferSelect;
type Customer = typeof customers.$inferSelect;
type Organization = typeof organizations.$inferSelect;

export type InvoicePdfData = {
	org: Organization | null;
	invoice: Invoice;
	items: InvoiceItem[];
	customer: Customer | null;
};

export type StatementEntry = {
	date: string;
	number: string;
	description: string;
	debit: number;
	credit: number;
	balance: number;
};

export type StatementData = {
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
