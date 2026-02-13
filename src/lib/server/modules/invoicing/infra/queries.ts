import { and, eq, sql } from 'drizzle-orm';
import type { Tx } from '$lib/server/db';
import { customers, invoices, organizations } from '$lib/server/db/schema';

export function findCustomerTaxContextInTx(tx: Tx, orgId: string, customerId: string) {
    return tx.query.customers.findFirst({
        where: and(eq(customers.id, customerId), eq(customers.org_id, orgId)),
        columns: { id: true, state_code: true }
    }).sync();
}

export function findOrganizationTaxContextInTx(tx: Tx, orgId: string) {
    return tx.query.organizations.findFirst({
        where: eq(organizations.id, orgId),
        columns: { id: true, state_code: true, pricesIncludeGst: true }
    }).sync();
}

export function findInvoiceByNumberInTx(tx: Tx, orgId: string, invoiceNumber: string) {
    return tx
        .select({ id: invoices.id })
        .from(invoices)
        .where(and(eq(invoices.org_id, orgId), eq(invoices.invoice_number, invoiceNumber)))
        .get();
}

export function applyCustomerBalanceDeltaInTx(tx: Tx, customerId: string, amountDelta: number, nowIso: string) {
    tx
        .update(customers)
        .set({
            balance: sql`${customers.balance} + ${amountDelta}`,
            updated_at: nowIso
        })
        .where(eq(customers.id, customerId))
        .run();
}
