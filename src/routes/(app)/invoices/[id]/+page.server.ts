import { redirect, fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { invoices, invoice_items, customers } from '$lib/server/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import type { PageServerLoad, Actions } from './$types';
import { getNextNumber, postInvoiceIssuance } from '$lib/server/services';

export const load: PageServerLoad = async ({ locals, params }) => {
    if (!locals.user) {
        redirect(302, '/login');
    }

    const invoice = await db.query.invoices.findFirst({
        where: and(
            eq(invoices.id, params.id),
            eq(invoices.org_id, locals.user.orgId)
        )
    });

    if (!invoice) {
        redirect(302, '/invoices');
    }

    // Get items
    const items = await db.query.invoice_items.findMany({
        where: eq(invoice_items.invoice_id, params.id),
        orderBy: invoice_items.sort_order,
    });

    // Get customer
    const customer = await db.query.customers.findFirst({
        where: eq(customers.id, invoice.customer_id),
    });

    return { invoice, items, customer };
};

export const actions: Actions = {
    issue: async ({ locals, params }) => {
        if (!locals.user) {
            redirect(302, '/login');
        }

        const orgId = locals.user.orgId;

        // Get the invoice
        const invoice = await db.query.invoices.findFirst({
            where: and(
                eq(invoices.id, params.id),
                eq(invoices.org_id, orgId)
            )
        });

        if (!invoice) {
            return fail(404, { error: 'Invoice not found' });
        }

        if (invoice.status !== 'draft') {
            return fail(400, { error: 'Only draft invoices can be issued' });
        }

        try {
            // Generate official invoice number
            const invoiceNumber = await getNextNumber(orgId, 'invoice');

            // Post to journal
            const postingResult = await postInvoiceIssuance(orgId, {
                invoiceId: invoice.id,
                invoiceNumber,
                date: invoice.invoice_date,
                customerId: invoice.customer_id,
                subtotal: invoice.subtotal,
                cgst: invoice.cgst || 0,
                sgst: invoice.sgst || 0,
                igst: invoice.igst || 0,
                total: invoice.total,
                userId: locals.user.id
            });

            // Update invoice
            await db
                .update(invoices)
                .set({
                    invoice_number: invoiceNumber,
                    status: 'issued',
                    journal_entry_id: postingResult.journalEntryId,
                    issued_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    updated_by: locals.user.id
                })
                .where(eq(invoices.id, params.id));

            // Update customer balance
            await db
                .update(customers)
                .set({
                    balance: sql`${customers.balance} + ${invoice.total}`,
                    updated_at: new Date().toISOString()
                })
                .where(eq(customers.id, invoice.customer_id));

            return { success: true, invoiceNumber };
        } catch (error) {
            console.error('Failed to issue invoice:', error);
            return fail(500, {
                error: error instanceof Error ? error.message : 'Failed to issue invoice'
            });
        }
    },

    cancel: async ({ locals, params }) => {
        if (!locals.user) {
            redirect(302, '/login');
        }

        const orgId = locals.user.orgId;

        // Get the invoice
        const invoice = await db.query.invoices.findFirst({
            where: and(
                eq(invoices.id, params.id),
                eq(invoices.org_id, orgId)
            )
        });

        if (!invoice) {
            return fail(404, { error: 'Invoice not found' });
        }

        if (invoice.status === 'paid') {
            return fail(400, { error: 'Cannot cancel a paid invoice' });
        }

        try {
            // Update invoice status
            await db
                .update(invoices)
                .set({
                    status: 'cancelled',
                    cancelled_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    updated_by: locals.user.id
                })
                .where(eq(invoices.id, params.id));

            // If it was issued, reverse customer balance
            if (invoice.status === 'issued' || invoice.status === 'partially_paid') {
                await db
                    .update(customers)
                    .set({
                        balance: sql`${customers.balance} - ${invoice.balance_due}`,
                        updated_at: new Date().toISOString()
                    })
                    .where(eq(customers.id, invoice.customer_id));
            }

            return { success: true };
        } catch (error) {
            console.error('Failed to cancel invoice:', error);
            return fail(500, {
                error: error instanceof Error ? error.message : 'Failed to cancel invoice'
            });
        }
    }
};
