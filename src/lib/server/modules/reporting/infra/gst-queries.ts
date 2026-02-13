import { and, eq, gte, inArray, lte, ne } from 'drizzle-orm';
import { db } from '$lib/server/db';
import {
    credit_notes,
    customers,
    expenses,
    invoice_items,
    invoices,
    organizations,
    vendors
} from '$lib/server/db/schema';

export async function findOrganizationForGstReporting(orgId: string) {
    return db.query.organizations.findFirst({
        where: eq(organizations.id, orgId),
        columns: {
            id: true,
            name: true,
            gstin: true,
            state_code: true
        }
    });
}

export async function listGstr1Invoices(orgId: string, startDate: string, endDate: string) {
    return db
        .select()
        .from(invoices)
        .where(
            and(
                eq(invoices.org_id, orgId),
                ne(invoices.status, 'draft'),
                ne(invoices.status, 'cancelled'),
                gte(invoices.invoice_date, startDate),
                lte(invoices.invoice_date, endDate)
            )
        );
}

export async function listInvoiceItemsByInvoiceIds(invoiceIds: string[]) {
    if (invoiceIds.length === 0) {
        return [];
    }

    return db
        .select()
        .from(invoice_items)
        .where(inArray(invoice_items.invoice_id, invoiceIds));
}

export async function listCustomersForOrg(orgId: string) {
    return db
        .select()
        .from(customers)
        .where(eq(customers.org_id, orgId));
}

export async function listGstr1CreditNotes(orgId: string, startDate: string, endDate: string) {
    return db
        .select()
        .from(credit_notes)
        .where(
            and(
                eq(credit_notes.org_id, orgId),
                ne(credit_notes.status, 'cancelled'),
                gte(credit_notes.credit_note_date, startDate),
                lte(credit_notes.credit_note_date, endDate)
            )
        );
}

export async function listGstr3bExpenses(orgId: string, startDate: string, endDate: string) {
    return db
        .select()
        .from(expenses)
        .where(
            and(
                eq(expenses.org_id, orgId),
                gte(expenses.expense_date, startDate),
                lte(expenses.expense_date, endDate)
            )
        );
}

export async function listVendorsForOrg(orgId: string) {
    return db
        .select()
        .from(vendors)
        .where(eq(vendors.org_id, orgId));
}
