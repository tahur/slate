import { and, eq, sql } from 'drizzle-orm';
import type { Tx } from '$lib/server/db';
import { customers, invoices, organizations } from '$lib/server/db/schema';

export async function findCustomerTaxContextInTx(tx: Tx, orgId: string, customerId: string) {
    return tx.query.customers.findFirst({
        where: and(eq(customers.id, customerId), eq(customers.org_id, orgId)),
        columns: { id: true, state_code: true }
    });
}

export async function findOrganizationTaxContextInTx(tx: Tx, orgId: string) {
    return tx.query.organizations.findFirst({
        where: eq(organizations.id, orgId),
        columns: { id: true, state_code: true, pricesIncludeGst: true }
    });
}

export async function findInvoiceByNumberInTx(tx: Tx, orgId: string, invoiceNumber: string) {
    const rows = await tx
        .select({ id: invoices.id })
        .from(invoices)
        .where(and(eq(invoices.org_id, orgId), eq(invoices.invoice_number, invoiceNumber)))
        .limit(1);
    return rows[0];
}

export async function applyCustomerBalanceDeltaInTx(tx: Tx, customerId: string, amountDelta: number, nowIso: string) {
    await tx
        .update(customers)
        .set({
            balance: sql`${customers.balance} + ${amountDelta}`,
            updated_at: nowIso
        })
        .where(eq(customers.id, customerId));
}
