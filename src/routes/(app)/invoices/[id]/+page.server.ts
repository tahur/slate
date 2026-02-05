import { redirect, fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import {
    invoices,
    invoice_items,
    customers,
    organizations,
    customer_advances,
    credit_notes,
    credit_allocations,
    payments,
    payment_allocations,
    accounts
} from '$lib/server/db/schema';
import { eq, and, sql, gt, desc } from 'drizzle-orm';
import type { PageServerLoad, Actions } from './$types';
import { getNextNumber, postInvoiceIssuance, postPaymentReceipt } from '$lib/server/services';

export const load: PageServerLoad = async ({ locals, params, url }) => {
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

    const org = await db.query.organizations.findFirst({
        where: eq(organizations.id, locals.user.orgId)
    });

    const justRecordedPayment = url.searchParams.get('payment') === 'recorded';

    // Fetch available credits (advances + credit notes)
    const advances = await db
        .select({
            id: customer_advances.id,
            amount: customer_advances.balance,
            date: customer_advances.created_at,
            number: customer_advances.payment_id // using payment_id as ref
        })
        .from(customer_advances)
        .where(
            and(
                eq(customer_advances.org_id, locals.user.orgId),
                eq(customer_advances.customer_id, invoice.customer_id),
                gt(customer_advances.balance, 0.01)
            )
        );

    const cnList = await db
        .select({
            id: credit_notes.id,
            amount: credit_notes.balance, // Use balance, not total
            date: credit_notes.credit_note_date,
            number: credit_notes.credit_note_number
        })
        .from(credit_notes)
        .where(
            and(
                eq(credit_notes.org_id, locals.user.orgId),
                eq(credit_notes.customer_id, invoice.customer_id),
                eq(credit_notes.status, 'issued'),
                gt(credit_notes.balance, 0.01) // Ensure positive balance
            )
        );

    const availableCredits = [
        ...advances.map(a => ({ ...a, type: 'advance' as const })),
        ...cnList.map(c => ({ ...c, type: 'credit_note' as const }))
    ];

    // Fetch payment history for this invoice
    // 1. Regular payments
    const paymentAllocations = await db
        .select({
            id: payment_allocations.id,
            amount: payment_allocations.amount,
            date: payments.payment_date,
            number: payments.payment_number,
            mode: payments.payment_mode
        })
        .from(payment_allocations)
        .innerJoin(payments, eq(payment_allocations.payment_id, payments.id))
        .where(eq(payment_allocations.invoice_id, params.id));

    // 2. Credit allocations (credit notes + advances)
    const creditAllocations = await db
        .select({
            id: credit_allocations.id,
            amount: credit_allocations.amount,
            credit_note_id: credit_allocations.credit_note_id,
            advance_id: credit_allocations.advance_id,
            created_at: credit_allocations.created_at
        })
        .from(credit_allocations)
        .where(eq(credit_allocations.invoice_id, params.id));

    // Enrich credit allocations with details
    const enrichedCreditAllocations = await Promise.all(
        creditAllocations.map(async (ca) => {
            if (ca.credit_note_id) {
                const cn = await db.query.credit_notes.findFirst({
                    where: eq(credit_notes.id, ca.credit_note_id),
                    columns: { credit_note_number: true, credit_note_date: true }
                });
                return {
                    ...ca,
                    type: 'credit_note' as const,
                    number: cn?.credit_note_number || 'Unknown',
                    date: cn?.credit_note_date || ca.created_at
                };
            } else if (ca.advance_id) {
                const adv = await db.query.customer_advances.findFirst({
                    where: eq(customer_advances.id, ca.advance_id),
                    columns: { payment_id: true, created_at: true }
                });
                // Get payment number for reference
                let paymentNumber = 'Advance';
                if (adv?.payment_id) {
                    const pmt = await db.query.payments.findFirst({
                        where: eq(payments.id, adv.payment_id),
                        columns: { payment_number: true }
                    });
                    paymentNumber = pmt?.payment_number || 'Advance';
                }
                return {
                    ...ca,
                    type: 'advance' as const,
                    number: paymentNumber,
                    date: adv?.created_at || ca.created_at
                };
            }
            return { ...ca, type: 'unknown' as const, number: 'Unknown', date: ca.created_at };
        })
    );

    // Combine all transactions for payment history
    const paymentHistory = [
        ...paymentAllocations.map(p => ({
            id: p.id,
            type: 'payment' as const,
            amount: p.amount,
            date: p.date,
            reference: p.number,
            mode: p.mode
        })),
        ...enrichedCreditAllocations.map(c => ({
            id: c.id,
            type: c.type,
            amount: c.amount,
            date: c.date,
            reference: c.number,
            mode: null
        }))
    ].sort((a, b) => new Date(a.date || '').getTime() - new Date(b.date || '').getTime());

    return { invoice, items, customer, org, justRecordedPayment, availableCredits, paymentHistory };
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
            // Use existing number unless it's a legacy draft placeholder
            let invoiceNumber = invoice.invoice_number;
            if (invoiceNumber.startsWith('DRAFT-')) {
                invoiceNumber = await getNextNumber(orgId, 'invoice');
            }

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
    },

    applyCredits: async ({ request, locals, params }) => {
        if (!locals.user) return fail(401);

        console.log('--- Applying Credits Start ---');
        const data = await request.formData();
        let credits: any[] = [];
        try {
            credits = JSON.parse(data.get('credits') as string);
        } catch (e) {
            console.error('Failed to parse credits JSON:', e);
            return fail(400, { error: 'Invalid credits data' });
        }

        console.log('Credits to apply:', credits);

        if (!credits || credits.length === 0) {
            return fail(400, { error: 'No credits selected' });
        }

        const orgId = locals.user.orgId;
        const invoiceId = params.id;

        // Fetch Invoice current balance
        const invoice = await db.query.invoices.findFirst({
            where: and(eq(invoices.id, invoiceId), eq(invoices.org_id, orgId))
        });

        if (!invoice) return fail(404, { error: 'Invoice not found' });
        if (invoice.status === 'paid' || invoice.status === 'cancelled') {
            return fail(400, { error: 'Invoice is already paid or cancelled' });
        }

        let currentBalanceDocs = invoice.balance_due;
        let totalApplied = 0;

        try {
            for (const credit of credits) {
                if (currentBalanceDocs <= 0.01) break;

                const amountToApply = Math.min(credit.amount, currentBalanceDocs);

                // 1. Create Allocation
                await db.insert(credit_allocations).values({
                    id: crypto.randomUUID(),
                    org_id: orgId, // Added missing org_id
                    credit_note_id: credit.type === 'credit_note' ? credit.id : null,
                    advance_id: credit.type === 'advance' ? credit.id : null,
                    invoice_id: invoiceId,
                    amount: amountToApply,
                    created_at: new Date().toISOString()
                });

                // 2. Update Credit Source
                if (credit.type === 'advance') {
                    await db.update(customer_advances)
                        .set({
                            balance: sql`${customer_advances.balance} - ${amountToApply}`
                        })
                        .where(eq(customer_advances.id, credit.id));
                } else {
                    // Credit Note - Update Balance
                    // Check if balance becomes 0 => status 'applied', else remains 'issued' (partially used)
                    const newStatus = (credit.amount - amountToApply) <= 0.01 ? 'applied' : 'issued';

                    await db.update(credit_notes)
                        .set({
                            balance: sql`${credit_notes.balance} - ${amountToApply}`,
                            status: newStatus
                        })
                        .where(eq(credit_notes.id, credit.id));
                }

                currentBalanceDocs -= amountToApply;
                totalApplied += amountToApply;
            }

            // 3. Update Invoice
            const newAmountPaid = (invoice.amount_paid || 0) + totalApplied;
            const newBalanceDue = invoice.total - newAmountPaid;
            const newStatus = newBalanceDue <= 0.01 ? 'paid' : 'partially_paid';

            await db.update(invoices)
                .set({
                    amount_paid: newAmountPaid,
                    balance_due: Math.max(0, newBalanceDue),
                    status: newStatus,
                    updated_at: new Date().toISOString()
                })
                .where(eq(invoices.id, invoiceId));

            // NOTE: Customer balance is NOT updated here because:
            // - For credit notes: balance was already reduced when credit note was created
            // - For advances: balance was already reduced when original payment was received
            // Applying credits is just an internal allocation, not a new transaction

            return { success: true, message: `Applied ${totalApplied} credits` };

        } catch (e) {
            console.error('Failed to apply credits:', e);
            return fail(500, { error: 'Failed to apply credits: ' + (e instanceof Error ? e.message : String(e)) });
        }
    },

    recordPayment: async ({ request, locals, params }) => {
        if (!locals.user) return fail(401);

        const orgId = locals.user.orgId;
        const invoiceId = params.id;
        const formData = await request.formData();

        const amount = parseFloat(formData.get('amount') as string) || 0;
        const payment_date = formData.get('payment_date') as string;
        const payment_mode = formData.get('payment_mode') as string || 'bank';
        const reference = formData.get('reference') as string || '';

        // Validation
        if (amount <= 0) {
            return fail(400, { error: 'Amount must be positive' });
        }
        if (!payment_date) {
            return fail(400, { error: 'Payment date is required' });
        }

        // Get invoice
        const invoice = await db.query.invoices.findFirst({
            where: and(eq(invoices.id, invoiceId), eq(invoices.org_id, orgId))
        });

        if (!invoice) return fail(404, { error: 'Invoice not found' });
        if (invoice.status === 'paid' || invoice.status === 'cancelled') {
            return fail(400, { error: 'Invoice is already paid or cancelled' });
        }
        if (amount > invoice.balance_due + 0.01) {
            return fail(400, { error: 'Amount exceeds balance due' });
        }

        try {
            // Generate payment number
            const paymentNumber = await getNextNumber(orgId, 'payment');
            const paymentId = crypto.randomUUID();

            // Post to journal
            const paymentModeForPosting = payment_mode === 'cash' ? 'cash' : 'bank';
            const postingResult = await postPaymentReceipt(orgId, {
                paymentId,
                paymentNumber,
                date: payment_date,
                customerId: invoice.customer_id,
                amount,
                paymentMode: paymentModeForPosting,
                userId: locals.user.id
            });

            // Create payment record
            // Get deposit account (Cash or Bank based on mode)
            const depositAccountCode = payment_mode === 'cash' ? '1000' : '1100';
            const depositAccount = await db.query.accounts.findFirst({
                where: and(
                    eq(accounts.account_code, depositAccountCode),
                    eq(accounts.org_id, orgId)
                )
            });

            await db.insert(payments).values({
                id: paymentId,
                org_id: orgId,
                customer_id: invoice.customer_id,
                payment_number: paymentNumber,
                payment_date,
                amount,
                payment_mode,
                deposit_to: depositAccount?.id || '',
                reference,
                journal_entry_id: postingResult.journalEntryId,
                created_by: locals.user.id
            });

            // Create payment allocation for this invoice
            await db.insert(payment_allocations).values({
                id: crypto.randomUUID(),
                payment_id: paymentId,
                invoice_id: invoiceId,
                amount
            });

            // Update invoice
            const newAmountPaid = (invoice.amount_paid || 0) + amount;
            const newBalanceDue = invoice.total - newAmountPaid;
            const newStatus = newBalanceDue <= 0.01 ? 'paid' : 'partially_paid';

            await db.update(invoices)
                .set({
                    amount_paid: newAmountPaid,
                    balance_due: Math.max(0, newBalanceDue),
                    status: newStatus,
                    updated_at: new Date().toISOString()
                })
                .where(eq(invoices.id, invoiceId));

            // Update customer balance
            await db.update(customers)
                .set({
                    balance: sql`${customers.balance} - ${amount}`,
                    updated_at: new Date().toISOString()
                })
                .where(eq(customers.id, invoice.customer_id));

            return { success: true, paymentNumber };

        } catch (e) {
            console.error('Failed to record payment:', e);
            return fail(500, { error: 'Failed to record payment: ' + (e instanceof Error ? e.message : String(e)) });
        }
    }
};
