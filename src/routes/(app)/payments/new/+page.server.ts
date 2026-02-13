import { redirect, fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import {
    customers,
    invoices,
    payments,
    payment_allocations,
    customer_advances,
    accounts
} from '$lib/server/db/schema';
import { eq, and, ne, sql, inArray } from 'drizzle-orm';
import type { PageServerLoad, Actions } from './$types';
import { getNextNumberTx, postPaymentReceipt, logActivity } from '$lib/server/services';
import { setFlash } from '$lib/server/flash';
import { checkIdempotency, generateIdempotencyKey } from '$lib/server/utils/idempotency';
import { round2 } from '$lib/utils/currency';

const MONEY_EPSILON = 0.01;

export const load: PageServerLoad = async ({ locals, url }) => {
    if (!locals.user) {
        redirect(302, '/login');
    }

    const orgId = locals.user.orgId;

    // Get customers
    const customerList = await db
        .select({
            id: customers.id,
            name: customers.name,
            company_name: customers.company_name,
            balance: customers.balance
        })
        .from(customers)
        .where(eq(customers.org_id, orgId))
        .orderBy(customers.name);

    // Get deposit accounts (Cash, Bank)
    const depositAccounts = await db
        .select({
            id: accounts.id,
            name: accounts.account_name,
            code: accounts.account_code
        })
        .from(accounts)
        .where(
            and(
                eq(accounts.org_id, orgId),
                inArray(accounts.account_code, ['1000', '1100'])
            )
        );

    // Check if a customer is pre-selected (from invoice page)
    const customerId = url.searchParams.get('customer');
    const preSelectedInvoiceId = url.searchParams.get('invoice');
    let unpaidInvoices: any[] = [];

    if (customerId) {
        unpaidInvoices = await db
            .select({
                id: invoices.id,
                invoice_number: invoices.invoice_number,
                invoice_date: invoices.invoice_date,
                total: invoices.total,
                balance_due: invoices.balance_due
            })
            .from(invoices)
            .where(
                and(
                    eq(invoices.org_id, orgId),
                    eq(invoices.customer_id, customerId),
                    ne(invoices.status, 'paid'),
                    ne(invoices.status, 'cancelled'),
                    ne(invoices.status, 'draft')
                )
            )
            .orderBy(invoices.invoice_date);
    }

    return {
        customers: customerList,
        depositAccounts,
        selectedCustomer: customerId || '',
        preSelectedInvoiceId,
        unpaidInvoices,
        idempotencyKey: generateIdempotencyKey(),
        defaults: {
            payment_date: new Date().toISOString().split('T')[0]
        }
    };
};

export const actions: Actions = {
    recordPayment: async ({ request, locals, cookies }) => {
        if (!locals.user) {
            redirect(302, '/login');
        }

        const orgId = locals.user.orgId;
        const formData = await request.formData();

        const idempotencyKey = formData.get('idempotency_key') as string;
        const { isDuplicate } = await checkIdempotency('payments', orgId, idempotencyKey);
        if (isDuplicate) {
            redirect(302, '/payments');
        }

        const customer_id = formData.get('customer_id') as string;
        const payment_date = formData.get('payment_date') as string;
        const amount = round2(parseFloat(formData.get('amount') as string) || 0);
        const payment_mode = formData.get('payment_mode') as string;
        const deposit_to = formData.get('deposit_to') as string;
        const reference = (formData.get('reference') as string) || '';
        const notes = (formData.get('notes') as string) || '';

        if (!customer_id) {
            return fail(400, { error: 'Customer is required' });
        }
        if (!payment_date) {
            return fail(400, { error: 'Payment date is required' });
        }
        if (amount <= MONEY_EPSILON) {
            return fail(400, { error: 'Amount must be positive' });
        }
        if (!payment_mode) {
            return fail(400, { error: 'Payment mode is required' });
        }
        if (!deposit_to) {
            return fail(400, { error: 'Deposit account is required' });
        }

        const allocations: { invoice_id: string; amount: number }[] = [];
        const seenInvoiceIds = new Set<string>();
        let i = 0;
        while (formData.has(`allocations[${i}].invoice_id`)) {
            const invoiceId = (formData.get(`allocations[${i}].invoice_id`) as string) || '';
            const allocAmount = round2(parseFloat(formData.get(`allocations[${i}].amount`) as string) || 0);
            if (!invoiceId || allocAmount <= MONEY_EPSILON) {
                i++;
                continue;
            }
            if (seenInvoiceIds.has(invoiceId)) {
                return fail(400, { error: 'Duplicate invoice allocations are not allowed' });
            }
            seenInvoiceIds.add(invoiceId);
            allocations.push({ invoice_id: invoiceId, amount: allocAmount });
            i++;
        }

        const totalAllocated = round2(allocations.reduce((sum, allocation) => sum + allocation.amount, 0));
        if (totalAllocated > amount + MONEY_EPSILON) {
            return fail(400, { error: 'Allocated amount cannot exceed payment amount' });
        }

        const paymentId = crypto.randomUUID();
        let paymentNumber = '';

        try {
            db.transaction((tx) => {
                const customer = tx.query.customers.findFirst({
                    where: and(eq(customers.id, customer_id), eq(customers.org_id, orgId))
                }).sync();
                if (!customer) {
                    throw new Error('Customer not found');
                }

                const depositAccount = tx.query.accounts.findFirst({
                    where: and(eq(accounts.id, deposit_to), eq(accounts.org_id, orgId))
                }).sync();
                if (!depositAccount) {
                    throw new Error('Invalid deposit account');
                }

                const invoiceIds = allocations.map((allocation) => allocation.invoice_id);
                const invoiceMap = new Map<
                    string,
                    {
                        id: string;
                        total: number;
                        amount_paid: number | null;
                        balance_due: number;
                    }
                >();

                if (invoiceIds.length > 0) {
                    const invoiceRows = tx
                        .select({
                            id: invoices.id,
                            total: invoices.total,
                            amount_paid: invoices.amount_paid,
                            balance_due: invoices.balance_due
                        })
                        .from(invoices)
                        .where(
                            and(
                                eq(invoices.org_id, orgId),
                                eq(invoices.customer_id, customer_id),
                                inArray(invoices.id, invoiceIds),
                                ne(invoices.status, 'paid'),
                                ne(invoices.status, 'cancelled'),
                                ne(invoices.status, 'draft')
                            )
                        )
                        .all();

                    for (const invoice of invoiceRows) {
                        invoiceMap.set(invoice.id, invoice);
                    }

                    for (const allocation of allocations) {
                        const invoice = invoiceMap.get(allocation.invoice_id);
                        if (!invoice) {
                            throw new Error('One or more allocations reference invalid invoices');
                        }
                        if (allocation.amount > invoice.balance_due + MONEY_EPSILON) {
                            throw new Error('Allocation amount exceeds invoice balance due');
                        }
                    }
                }

                paymentNumber = getNextNumberTx(tx, orgId, 'payment');

                const paymentModeForPosting = payment_mode === 'cash' ? 'cash' : 'bank';
                const postingResult = postPaymentReceipt(
                    orgId,
                    {
                        paymentId,
                        paymentNumber,
                        date: payment_date,
                        customerId: customer_id,
                        amount,
                        paymentMode: paymentModeForPosting,
                        userId: locals.user!.id
                    },
                    tx
                );

                tx.insert(payments).values({
                    id: paymentId,
                    org_id: orgId,
                    customer_id,
                    payment_number: paymentNumber,
                    payment_date,
                    amount,
                    payment_mode,
                    deposit_to: depositAccount.id,
                    reference,
                    notes,
                    journal_entry_id: postingResult.journalEntryId,
                    idempotency_key: idempotencyKey || null,
                    created_by: locals.user!.id
                });

                for (const allocation of allocations) {
                    const invoice = invoiceMap.get(allocation.invoice_id);
                    if (!invoice) {
                        throw new Error('One or more allocations reference invalid invoices');
                    }

                    tx.insert(payment_allocations).values({
                        id: crypto.randomUUID(),
                        payment_id: paymentId,
                        invoice_id: allocation.invoice_id,
                        amount: allocation.amount
                    });

                    const newBalanceDue = round2(Math.max(0, invoice.balance_due - allocation.amount));
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
                        .where(eq(invoices.id, allocation.invoice_id));
                }

                const excessAmount = round2(amount - totalAllocated);
                if (excessAmount > MONEY_EPSILON) {
                    tx.insert(customer_advances).values({
                        id: crypto.randomUUID(),
                        org_id: orgId,
                        customer_id,
                        payment_id: paymentId,
                        amount: excessAmount,
                        balance: excessAmount,
                        notes: `Advance from payment ${paymentNumber}`
                    });
                }

                tx
                    .update(customers)
                    .set({
                        balance: sql`${customers.balance} - ${amount}`,
                        updated_at: new Date().toISOString()
                    })
                    .where(eq(customers.id, customer_id));
            });

            await logActivity({
                orgId,
                userId: locals.user.id,
                entityType: 'payment',
                entityId: paymentId,
                action: 'created',
                changedFields: {
                    payment_number: { new: paymentNumber },
                    amount: { new: amount },
                    payment_mode: { new: payment_mode }
                }
            });
        } catch (error) {
            console.error('Failed to record payment:', error);
            const message = error instanceof Error ? error.message : '';
            if (
                message === 'Customer not found'
                || message === 'Invalid deposit account'
                || message === 'One or more allocations reference invalid invoices'
                || message === 'Allocation amount exceeds invoice balance due'
            ) {
                return fail(400, { error: message });
            }
            return fail(500, { error: 'Failed to record payment' });
        }

        setFlash(cookies, {
            type: 'success',
            message: 'Payment recorded successfully.'
        });
        redirect(302, '/payments');
    },

    // API endpoint to get unpaid invoices for a customer
    getInvoices: async ({ request, locals }) => {
        try {
            if (!locals.user) {
                return fail(401, { error: 'Unauthorized' });
            }

            const formData = await request.formData();
            const customerId = formData.get('customer_id') as string;

            if (!customerId) {
                return { invoices: [] };
            }

            const orgId = locals.user.orgId;

            const unpaidInvoices = await db
                .select({
                    id: invoices.id,
                    invoice_number: invoices.invoice_number,
                    invoice_date: invoices.invoice_date,
                    total: invoices.total,
                    balance_due: invoices.balance_due
                })
                .from(invoices)
                .where(
                    and(
                        eq(invoices.org_id, orgId),
                        eq(invoices.customer_id, customerId),
                        ne(invoices.status, 'paid'),
                        ne(invoices.status, 'cancelled'),
                        ne(invoices.status, 'draft')
                    )
                )
                .orderBy(invoices.invoice_date);

            return { invoices: unpaidInvoices };
        } catch (error) {
            console.error('getInvoices error:', error);
            return fail(500, { error: error instanceof Error ? error.message : 'Failed to get invoices' });
        }
    }
};
