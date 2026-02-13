import { redirect, fail } from '@sveltejs/kit';
import { db, type Tx } from '$lib/server/db';
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
import { postInvoiceIssuance, postPaymentReceipt, reverse, logActivity } from '$lib/server/services';
import { getNextNumberTx } from '$lib/server/services/number-series';
import { calculateLineItem, calculateInvoiceTotals, type LineItem } from '../new/schema';
import { round2 } from '$lib/utils/currency';

const MONEY_EPSILON = 0.01;

type RequestedCredit = {
    id: string;
    type: 'advance' | 'credit_note';
    amount: number;
};

type AppliedCreditsResult = {
    totalApplied: number;
    remainingBalanceDue: number;
};

function parseRequestedCredits(rawValue: FormDataEntryValue | null): RequestedCredit[] {
    if (typeof rawValue !== 'string') {
        throw new Error('Invalid credits data');
    }

    let parsed: unknown;
    try {
        parsed = JSON.parse(rawValue);
    } catch {
        throw new Error('Invalid credits data');
    }

    if (!Array.isArray(parsed)) {
        throw new Error('Invalid credits data');
    }

    const seen = new Set<string>();
    const credits: RequestedCredit[] = [];

    for (const entry of parsed) {
        if (!entry || typeof entry !== 'object') {
            throw new Error('Invalid credits data');
        }

        const id = typeof (entry as any).id === 'string' ? (entry as any).id.trim() : '';
        const type = (entry as any).type;
        const amount = Number((entry as any).amount);

        if (!id || (type !== 'advance' && type !== 'credit_note') || !Number.isFinite(amount) || amount <= 0) {
            throw new Error('Invalid credits data');
        }

        const dedupeKey = `${type}:${id}`;
        if (seen.has(dedupeKey)) {
            throw new Error('Duplicate credit entries are not allowed');
        }
        seen.add(dedupeKey);

        credits.push({ id, type, amount: round2(amount) });
    }

    return credits;
}

function applyRequestedCreditsInTx(
    tx: Tx,
    orgId: string,
    customerId: string,
    invoiceId: string,
    requestedCredits: RequestedCredit[],
    startingBalanceDue: number
): AppliedCreditsResult {
    let currentBalanceDue = round2(startingBalanceDue);
    let totalApplied = 0;

    for (const requested of requestedCredits) {
        if (currentBalanceDue <= MONEY_EPSILON) break;

        if (requested.type === 'advance') {
            const advance = tx.query.customer_advances.findFirst({
                where: and(
                    eq(customer_advances.id, requested.id),
                    eq(customer_advances.org_id, orgId),
                    eq(customer_advances.customer_id, customerId),
                    gt(customer_advances.balance, MONEY_EPSILON)
                )
            }).sync();

            if (!advance) {
                throw new Error('Selected advance is no longer available');
            }

            const available = round2(advance.balance);
            if (requested.amount > available + MONEY_EPSILON) {
                throw new Error('Requested credit exceeds available advance balance');
            }

            const amountToApply = round2(Math.min(requested.amount, currentBalanceDue));
            if (amountToApply <= MONEY_EPSILON) continue;

            tx.insert(credit_allocations).values({
                id: crypto.randomUUID(),
                org_id: orgId,
                credit_note_id: null,
                advance_id: advance.id,
                invoice_id: invoiceId,
                amount: amountToApply,
                created_at: new Date().toISOString()
            });

            const remaining = round2(available - amountToApply);
            tx
                .update(customer_advances)
                .set({ balance: remaining })
                .where(eq(customer_advances.id, advance.id));

            currentBalanceDue = round2(currentBalanceDue - amountToApply);
            totalApplied = round2(totalApplied + amountToApply);
            continue;
        }

        const creditNote = tx.query.credit_notes.findFirst({
            where: and(
                eq(credit_notes.id, requested.id),
                eq(credit_notes.org_id, orgId),
                eq(credit_notes.customer_id, customerId),
                eq(credit_notes.status, 'issued'),
                gt(credit_notes.balance, MONEY_EPSILON)
            )
        }).sync();

        if (!creditNote) {
            throw new Error('Selected credit note is no longer available');
        }

        const available = round2(creditNote.balance || 0);
        if (requested.amount > available + MONEY_EPSILON) {
            throw new Error('Requested credit exceeds available credit note balance');
        }

        const amountToApply = round2(Math.min(requested.amount, currentBalanceDue));
        if (amountToApply <= MONEY_EPSILON) continue;

        tx.insert(credit_allocations).values({
            id: crypto.randomUUID(),
            org_id: orgId,
            credit_note_id: creditNote.id,
            advance_id: null,
            invoice_id: invoiceId,
            amount: amountToApply,
            created_at: new Date().toISOString()
        });

        const remaining = round2(available - amountToApply);
        tx
            .update(credit_notes)
            .set({
                balance: remaining,
                status: remaining <= MONEY_EPSILON ? 'applied' : 'issued'
            })
            .where(eq(credit_notes.id, creditNote.id));

        currentBalanceDue = round2(currentBalanceDue - amountToApply);
        totalApplied = round2(totalApplied + amountToApply);
    }

    return {
        totalApplied,
        remainingBalanceDue: currentBalanceDue
    };
}



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
            return fail(401, { error: 'Unauthorized' });
        }

        const orgId = locals.user.orgId;
        const userId = locals.user.id;

        // Get the invoice (read-only, safe outside tx)
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

        let invoiceNumber = invoice.invoice_number;

        try {
            db.transaction((tx) => {
                if (invoiceNumber.startsWith('DRAFT-')) {
                    invoiceNumber = getNextNumberTx(tx, orgId, 'invoice');
                }

                // Post to journal
                const postingResult = postInvoiceIssuance(orgId, {
                    invoiceId: invoice.id,
                    invoiceNumber,
                    date: invoice.invoice_date,
                    customerId: invoice.customer_id,
                    subtotal: invoice.subtotal,
                    cgst: invoice.cgst || 0,
                    sgst: invoice.sgst || 0,
                    igst: invoice.igst || 0,
                    total: invoice.total,
                    userId
                }, tx);

                // Update invoice
                tx
                    .update(invoices)
                    .set({
                        invoice_number: invoiceNumber,
                        status: 'issued',
                        journal_entry_id: postingResult.journalEntryId,
                        issued_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                        updated_by: userId
                    })
                    .where(eq(invoices.id, params.id));

                // Update customer balance
                tx
                    .update(customers)
                    .set({
                        balance: sql`${customers.balance} + ${invoice.total}`,
                        updated_at: new Date().toISOString()
                    })
                    .where(eq(customers.id, invoice.customer_id));
            });

            // Log activity (outside tx)
            await logActivity({
                orgId,
                userId,
                entityType: 'invoice',
                entityId: params.id,
                action: 'issued',
                changedFields: {
                    status: { old: 'draft', new: 'issued' },
                    invoice_number: { new: invoiceNumber }
                }
            });

            return { success: true, invoiceNumber };
        } catch (error) {
            console.error('Failed to issue invoice:', error);
            return fail(500, { error: 'Failed to issue invoice' });
        }
    },

    cancel: async ({ locals, params }) => {
        if (!locals.user) {
            return fail(401, { error: 'Unauthorized' });
        }

        const orgId = locals.user.orgId;

        const invoice = await db.query.invoices.findFirst({
            where: and(
                eq(invoices.id, params.id),
                eq(invoices.org_id, orgId)
            )
        });

        if (!invoice) {
            return fail(404, { error: 'Invoice not found' });
        }

        if (invoice.status === 'cancelled') {
            return fail(400, { error: 'Invoice is already cancelled' });
        }

        if (invoice.status === 'paid') {
            return fail(400, { error: 'Cannot cancel a paid invoice' });
        }

        if (invoice.status === 'partially_paid' || (invoice.amount_paid || 0) > MONEY_EPSILON) {
            return fail(400, { error: 'Cannot cancel an invoice with payments. Reverse settlement first.' });
        }

        try {
            const now = new Date().toISOString();
            const reversalDate = now.split('T')[0];

            db.transaction((tx) => {
                if (invoice.status === 'issued') {
                    if (!invoice.journal_entry_id) {
                        throw new Error('Issued invoice is missing journal entry');
                    }

                    // Keep ledger immutable: posted entry must be reversed, not edited.
                    reverse(orgId, invoice.journal_entry_id, reversalDate, locals.user!.id, tx);

                    // Remove receivable impact from customer balance.
                    tx
                        .update(customers)
                        .set({
                            balance: sql`${customers.balance} - ${invoice.total}`,
                            updated_at: now
                        })
                        .where(eq(customers.id, invoice.customer_id));
                }

                // Mark invoice document as cancelled.
                tx
                    .update(invoices)
                    .set({
                        status: 'cancelled',
                        cancelled_at: now,
                        updated_at: now,
                        updated_by: locals.user!.id
                    })
                    .where(eq(invoices.id, params.id));
            });

            await logActivity({
                orgId,
                userId: locals.user.id,
                entityType: 'invoice',
                entityId: params.id,
                action: 'cancelled',
                changedFields: {
                    status: { old: invoice.status, new: 'cancelled' }
                }
            });

            return { success: true };
        } catch (error) {
            console.error('Failed to cancel invoice:', error);
            const message = error instanceof Error ? error.message : 'Failed to cancel invoice';
            if (
                message === 'Issued invoice is missing journal entry'
                || message === 'Cannot cancel an invoice with payments. Reverse settlement first.'
            ) {
                return fail(400, { error: message });
            }
            return fail(500, { error: 'Failed to cancel invoice' });
        }
    },

    applyCredits: async ({ request, locals, params }) => {
        if (!locals.user) return fail(401);

        const data = await request.formData();
        let requestedCredits: RequestedCredit[] = [];
        try {
            requestedCredits = parseRequestedCredits(data.get('credits'));
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Invalid credits data';
            return fail(400, { error: message });
        }

        if (requestedCredits.length === 0) {
            return fail(400, { error: 'No credits selected' });
        }

        const orgId = locals.user.orgId;
        const invoiceId = params.id;
        let totalApplied = 0;

        try {
            db.transaction((tx) => {
                const invoice = tx.query.invoices.findFirst({
                    where: and(eq(invoices.id, invoiceId), eq(invoices.org_id, orgId))
                }).sync();

                if (!invoice) {
                    throw new Error('Invoice not found');
                }
                if (invoice.status === 'paid' || invoice.status === 'cancelled') {
                    throw new Error('Invoice is already paid or cancelled');
                }
                if (invoice.balance_due <= MONEY_EPSILON) {
                    throw new Error('Invoice has no balance due');
                }

                const applied = applyRequestedCreditsInTx(
                    tx,
                    orgId,
                    invoice.customer_id,
                    invoiceId,
                    requestedCredits,
                    invoice.balance_due
                );

                totalApplied = round2(applied.totalApplied);
                if (totalApplied <= MONEY_EPSILON) {
                    throw new Error('No credits were applied');
                }

                const newBalanceDue = round2(Math.max(0, applied.remainingBalanceDue));
                const newAmountPaid = round2(invoice.total - newBalanceDue);
                const newStatus = newBalanceDue <= MONEY_EPSILON ? 'paid' : 'partially_paid';

                tx
                    .update(invoices)
                    .set({
                        amount_paid: newAmountPaid,
                        balance_due: newBalanceDue,
                        status: newStatus,
                        updated_at: new Date().toISOString()
                    })
                    .where(eq(invoices.id, invoiceId));
            });

            return { success: true, message: `Applied ${totalApplied.toFixed(2)} credits` };
        } catch (error) {
            console.error('Failed to apply credits:', error);
            const message = error instanceof Error ? error.message : 'Failed to apply credits';
            if (
                message === 'Invoice not found'
                || message === 'Invoice is already paid or cancelled'
                || message === 'Invoice has no balance due'
                || message === 'No credits were applied'
                || message === 'Invalid credits data'
                || message === 'Duplicate credit entries are not allowed'
                || message === 'Selected advance is no longer available'
                || message === 'Requested credit exceeds available advance balance'
                || message === 'Selected credit note is no longer available'
                || message === 'Requested credit exceeds available credit note balance'
            ) {
                const statusCode = message === 'Invoice not found' ? 404 : 400;
                return fail(statusCode, { error: message });
            }
            return fail(500, { error: 'Failed to apply credits' });
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

        // Get invoice (read-only, safe outside tx)
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

        let paymentNumber = '';

        try {
            db.transaction((tx) => {
                paymentNumber = getNextNumberTx(tx, orgId, 'payment');
                const paymentId = crypto.randomUUID();

                // Post to journal
                const paymentModeForPosting = payment_mode === 'cash' ? 'cash' : 'bank';
                const postingResult = postPaymentReceipt(orgId, {
                    paymentId,
                    paymentNumber,
                    date: payment_date,
                    customerId: invoice.customer_id,
                    amount,
                    paymentMode: paymentModeForPosting,
                    userId: locals.user!.id
                }, tx);

                // Get deposit account
                const depositAccountCode = payment_mode === 'cash' ? '1000' : '1100';
                const depositAccount = tx.query.accounts.findFirst({
                    where: and(
                        eq(accounts.account_code, depositAccountCode),
                        eq(accounts.org_id, orgId)
                    )
                }).sync();

                // Create payment record
                tx.insert(payments).values({
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
                    created_by: locals.user!.id
                });

                // Create payment allocation
                tx.insert(payment_allocations).values({
                    id: crypto.randomUUID(),
                    payment_id: paymentId,
                    invoice_id: invoiceId,
                    amount
                });

                // Update invoice
                const newAmountPaid = (invoice.amount_paid || 0) + amount;
                const newBalanceDue = invoice.total - newAmountPaid;
                const newStatus = newBalanceDue <= 0.01 ? 'paid' : 'partially_paid';

                tx.update(invoices)
                    .set({
                        amount_paid: newAmountPaid,
                        balance_due: Math.max(0, newBalanceDue),
                        status: newStatus,
                        updated_at: new Date().toISOString()
                    })
                    .where(eq(invoices.id, invoiceId));

                // Update customer balance
                tx.update(customers)
                    .set({
                        balance: sql`${customers.balance} - ${amount}`,
                        updated_at: new Date().toISOString()
                    })
                    .where(eq(customers.id, invoice.customer_id));
            });

            return { success: true, paymentNumber };

        } catch (e) {
            console.error('Failed to record payment:', e);
            return fail(500, { error: 'Failed to record payment' });
        }
    },

    settle: async ({ request, locals, params }) => {
        if (!locals.user) return fail(401);

        const orgId = locals.user.orgId;
        const invoiceId = params.id;
        const formData = await request.formData();

        const paymentAmount = round2(parseFloat(formData.get('payment_amount') as string) || 0);
        const paymentDate = formData.get('payment_date') as string;
        const paymentMode = (formData.get('payment_mode') as string) || 'bank';
        const paymentReference = (formData.get('payment_reference') as string) || '';

        let requestedCredits: RequestedCredit[] = [];
        try {
            requestedCredits = parseRequestedCredits(formData.get('credits') ?? '[]');
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Invalid credits data';
            return fail(400, { error: message });
        }

        if (paymentAmount < 0) {
            return fail(400, { error: 'Payment amount must be zero or positive' });
        }
        if (paymentAmount > 0 && !paymentDate) {
            return fail(400, { error: 'Payment date is required when payment amount is provided' });
        }
        if (paymentAmount <= MONEY_EPSILON && requestedCredits.length === 0) {
            return fail(400, { error: 'No payment or credits selected to settle' });
        }

        let totalSettled = 0;
        let creditSettled = 0;
        let paymentSettled = 0;
        let resultingStatus: 'paid' | 'partially_paid' = 'partially_paid';

        try {
            db.transaction((tx) => {
                const invoice = tx.query.invoices.findFirst({
                    where: and(eq(invoices.id, invoiceId), eq(invoices.org_id, orgId))
                }).sync();

                if (!invoice) {
                    throw new Error('Invoice not found');
                }
                if (invoice.status === 'paid' || invoice.status === 'cancelled') {
                    throw new Error('Invoice is already paid or cancelled');
                }
                if (invoice.balance_due <= MONEY_EPSILON) {
                    throw new Error('Invoice has no balance due');
                }

                let currentBalanceDue = round2(invoice.balance_due);

                if (requestedCredits.length > 0) {
                    const appliedCredits = applyRequestedCreditsInTx(
                        tx,
                        orgId,
                        invoice.customer_id,
                        invoiceId,
                        requestedCredits,
                        currentBalanceDue
                    );

                    creditSettled = round2(appliedCredits.totalApplied);
                    currentBalanceDue = round2(appliedCredits.remainingBalanceDue);
                }

                if (paymentAmount > MONEY_EPSILON) {
                    if (paymentAmount > currentBalanceDue + MONEY_EPSILON) {
                        throw new Error('Payment amount exceeds remaining balance due');
                    }

                    const paymentNumber = getNextNumberTx(tx, orgId, 'payment');
                    const paymentId = crypto.randomUUID();

                    const paymentModeForPosting = paymentMode === 'cash' ? 'cash' : 'bank';
                    const postingResult = postPaymentReceipt(
                        orgId,
                        {
                            paymentId,
                            paymentNumber,
                            date: paymentDate,
                            customerId: invoice.customer_id,
                            amount: paymentAmount,
                            paymentMode: paymentModeForPosting,
                            userId: locals.user!.id
                        },
                        tx
                    );

                    const depositAccountCode = paymentModeForPosting === 'cash' ? '1000' : '1100';
                    const depositAccount = tx.query.accounts.findFirst({
                        where: and(eq(accounts.account_code, depositAccountCode), eq(accounts.org_id, orgId))
                    }).sync();

                    if (!depositAccount) {
                        throw new Error('Deposit account is not configured');
                    }

                    tx.insert(payments).values({
                        id: paymentId,
                        org_id: orgId,
                        customer_id: invoice.customer_id,
                        payment_number: paymentNumber,
                        payment_date: paymentDate,
                        amount: paymentAmount,
                        payment_mode: paymentMode,
                        deposit_to: depositAccount.id,
                        reference: paymentReference,
                        journal_entry_id: postingResult.journalEntryId,
                        created_by: locals.user!.id
                    });

                    tx.insert(payment_allocations).values({
                        id: crypto.randomUUID(),
                        payment_id: paymentId,
                        invoice_id: invoiceId,
                        amount: paymentAmount
                    });

                    tx
                        .update(customers)
                        .set({
                            balance: sql`${customers.balance} - ${paymentAmount}`,
                            updated_at: new Date().toISOString()
                        })
                        .where(eq(customers.id, invoice.customer_id));

                    paymentSettled = paymentAmount;
                    currentBalanceDue = round2(currentBalanceDue - paymentAmount);
                }

                totalSettled = round2(creditSettled + paymentSettled);
                if (totalSettled <= MONEY_EPSILON) {
                    throw new Error('No settlement was applied');
                }

                const newBalanceDue = round2(Math.max(0, currentBalanceDue));
                const newAmountPaid = round2(invoice.total - newBalanceDue);
                const newStatus = newBalanceDue <= MONEY_EPSILON ? 'paid' : 'partially_paid';
                resultingStatus = newStatus;

                tx
                    .update(invoices)
                    .set({
                        amount_paid: newAmountPaid,
                        balance_due: newBalanceDue,
                        status: newStatus,
                        updated_at: new Date().toISOString()
                    })
                    .where(eq(invoices.id, invoiceId));
            });

            await logActivity({
                orgId,
                userId: locals.user.id,
                entityType: 'invoice',
                entityId: invoiceId,
                action: resultingStatus,
                changedFields: {
                    amount_settled: { new: totalSettled },
                    credits_applied: { new: creditSettled },
                    payment_recorded: { new: paymentSettled }
                }
            });

            return { success: true, message: 'Settlement recorded successfully' };
        } catch (error) {
            console.error('Settlement failed:', error);
            const message = error instanceof Error ? error.message : 'Settlement failed';
            if (
                message === 'Invoice not found'
                || message === 'Invoice is already paid or cancelled'
                || message === 'Invoice has no balance due'
                || message === 'No settlement was applied'
                || message === 'Payment amount exceeds remaining balance due'
                || message === 'Deposit account is not configured'
                || message === 'Duplicate credit entries are not allowed'
                || message === 'Selected advance is no longer available'
                || message === 'Requested credit exceeds available advance balance'
                || message === 'Selected credit note is no longer available'
                || message === 'Requested credit exceeds available credit note balance'
            ) {
                const statusCode = message === 'Invoice not found' ? 404 : 400;
                return fail(statusCode, { error: message });
            }
            return fail(500, { error: 'Settlement failed' });
        }
    },

    update: async ({ request, locals, params }) => {
        if (!locals.user) {
            return fail(401, { error: 'Unauthorized' });
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
            return fail(400, { error: 'Only draft invoices can be edited' });
        }

        const formData = await request.formData();
        const customer_id = formData.get('customer_id') as string;
        const invoice_date = formData.get('invoice_date') as string;
        const due_date = formData.get('due_date') as string;
        const order_number = formData.get('order_number') as string;
        const notes = formData.get('notes') as string;
        const terms = formData.get('terms') as string;
        const pricesIncludeGst = formData.get('prices_include_gst') === 'true';

        // Validation
        if (!customer_id) return fail(400, { error: 'Customer is required' });
        if (!invoice_date) return fail(400, { error: 'Invoice date is required' });
        if (!due_date) return fail(400, { error: 'Due date is required' });

        // Parse line items
        const lineItems: LineItem[] = [];
        let i = 0;
        while (formData.has(`items[${i}].description`)) {
            const description = formData.get(`items[${i}].description`) as string;
            const hsn_code = formData.get(`items[${i}].hsn_code`) as string || '';
            const quantity = parseFloat(formData.get(`items[${i}].quantity`) as string) || 1;
            const unit = formData.get(`items[${i}].unit`) as string || 'nos';
            const rate = parseFloat(formData.get(`items[${i}].rate`) as string) || 0;
            const gst_rate = parseFloat(formData.get(`items[${i}].gst_rate`) as string) || 18;
            const item_id = formData.get(`items[${i}].item_id`) as string || '';

            if (description && description.trim()) {
                lineItems.push({ description, hsn_code, quantity, unit, rate, gst_rate, item_id: item_id || undefined });
            }
            i++;
        }

        if (lineItems.length === 0) {
            return fail(400, { error: 'At least one item with a description is required' });
        }

        // Calculate totals (read-only queries safe outside tx)
        const customer = await db.query.customers.findFirst({
            where: eq(customers.id, customer_id),
            columns: { state_code: true },
        });
        const org = await db.query.organizations.findFirst({
            where: eq(organizations.id, orgId),
            columns: { state_code: true },
        });
        const isInterState = customer?.state_code !== org?.state_code;
        const totals = calculateInvoiceTotals(lineItems, isInterState, pricesIncludeGst);

        try {
            db.transaction((tx) => {
                // Update invoice record
                tx
                    .update(invoices)
                    .set({
                        customer_id,
                        invoice_date,
                        due_date,
                        order_number: order_number || null,
                        subtotal: totals.subtotal,
                        taxable_amount: totals.taxableAmount,
                        cgst: totals.cgst,
                        sgst: totals.sgst,
                        igst: totals.igst,
                        total: totals.total,
                        balance_due: totals.total,
                        is_inter_state: isInterState,
                        prices_include_gst: pricesIncludeGst,
                        notes: notes || null,
                        terms: terms || null,
                        updated_at: new Date().toISOString(),
                        updated_by: locals.user!.id,
                    })
                    .where(eq(invoices.id, params.id));

                // Delete old line items and insert new ones
                tx.delete(invoice_items).where(eq(invoice_items.invoice_id, params.id));

                for (let idx = 0; idx < lineItems.length; idx++) {
                    const item = lineItems[idx];
                    const calc = calculateLineItem(item, isInterState, pricesIncludeGst);

                    tx.insert(invoice_items).values({
                        id: crypto.randomUUID(),
                        invoice_id: params.id,
                        item_id: item.item_id || null,
                        description: item.description,
                        hsn_code: item.hsn_code || null,
                        quantity: item.quantity,
                        unit: item.unit,
                        rate: item.rate,
                        gst_rate: item.gst_rate,
                        cgst: calc.cgst,
                        sgst: calc.sgst,
                        igst: calc.igst,
                        amount: calc.amount,
                        total: calc.total,
                        sort_order: idx,
                    });
                }
            });

            // Log activity (outside tx)
            await logActivity({
                orgId,
                userId: locals.user.id,
                entityType: 'invoice',
                entityId: params.id,
                action: 'updated',
                changedFields: {
                    total: { old: invoice.total, new: totals.total },
                }
            });

        } catch (e) {
            console.error('Invoice update error:', e);
            return fail(500, { error: 'Failed to update invoice' });
        }

        redirect(302, `/invoices/${params.id}`);
    },

    delete: async ({ locals, params }) => {
        if (!locals.user) {
            return fail(401, { error: 'Unauthorized' });
        }

        const orgId = locals.user.orgId;

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
            return fail(400, { error: 'Only draft invoices can be deleted' });
        }

        try {
            db.transaction((tx) => {
                tx.delete(invoice_items).where(eq(invoice_items.invoice_id, params.id));
                tx.delete(invoices).where(eq(invoices.id, params.id));
            });

            // Log activity (outside tx)
            await logActivity({
                orgId,
                userId: locals.user.id,
                entityType: 'invoice',
                entityId: params.id,
                action: 'deleted',
                changedFields: {
                    invoice_number: { old: invoice.invoice_number },
                }
            });
        } catch (e) {
            console.error('Invoice delete error:', e);
            return fail(500, { error: 'Failed to delete invoice' });
        }

        redirect(302, '/invoices');
    }
};
