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
import { getNextNumber, postPaymentReceipt } from '$lib/server/services';
import { setFlash } from '$lib/server/flash';

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

        // Parse form data
        const customer_id = formData.get('customer_id') as string;
        const payment_date = formData.get('payment_date') as string;
        const amount = parseFloat(formData.get('amount') as string) || 0;
        const payment_mode = formData.get('payment_mode') as string;
        const deposit_to = formData.get('deposit_to') as string;
        const reference = formData.get('reference') as string || '';
        const notes = formData.get('notes') as string || '';

        // Validation
        if (!customer_id) {
            return fail(400, { error: 'Customer is required' });
        }
        if (!payment_date) {
            return fail(400, { error: 'Payment date is required' });
        }
        if (amount <= 0) {
            return fail(400, { error: 'Amount must be positive' });
        }
        if (!payment_mode) {
            return fail(400, { error: 'Payment mode is required' });
        }
        if (!deposit_to) {
            return fail(400, { error: 'Deposit account is required' });
        }

        // Parse allocations
        const allocations: { invoice_id: string; amount: number }[] = [];
        let i = 0;
        while (formData.has(`allocations[${i}].invoice_id`)) {
            const invoiceId = formData.get(`allocations[${i}].invoice_id`) as string;
            const allocAmount = parseFloat(formData.get(`allocations[${i}].amount`) as string) || 0;
            if (invoiceId && allocAmount > 0) {
                allocations.push({ invoice_id: invoiceId, amount: allocAmount });
            }
            i++;
        }

        // Calculate total allocated
        const totalAllocated = allocations.reduce((sum, a) => sum + a.amount, 0);

        try {
            // Generate payment number
            const paymentNumber = await getNextNumber(orgId, 'payment');
            const paymentId = crypto.randomUUID();

            // Determine payment mode for posting
            const paymentModeForPosting = payment_mode === 'cash' ? 'cash' : 'bank';

            // Post to journal
            const postingResult = await postPaymentReceipt(orgId, {
                paymentId,
                paymentNumber,
                date: payment_date,
                customerId: customer_id,
                amount,
                paymentMode: paymentModeForPosting,
                userId: locals.user.id
            });

            // Create payment record
            await db.insert(payments).values({
                id: paymentId,
                org_id: orgId,
                customer_id,
                payment_number: paymentNumber,
                payment_date,
                amount,
                payment_mode,
                deposit_to,
                reference,
                notes,
                journal_entry_id: postingResult.journalEntryId,
                created_by: locals.user.id
            });

            // Create allocations and update invoices
            for (const alloc of allocations) {
                await db.insert(payment_allocations).values({
                    id: crypto.randomUUID(),
                    payment_id: paymentId,
                    invoice_id: alloc.invoice_id,
                    amount: alloc.amount
                });

                // Update invoice
                const invoice = await db.query.invoices.findFirst({
                    where: eq(invoices.id, alloc.invoice_id)
                });

                if (invoice) {
                    const newAmountPaid = (invoice.amount_paid || 0) + alloc.amount;
                    const newBalanceDue = invoice.total - newAmountPaid;
                    const newStatus = newBalanceDue <= 0 ? 'paid' : 'partially_paid';

                    await db
                        .update(invoices)
                        .set({
                            amount_paid: newAmountPaid,
                            balance_due: Math.max(0, newBalanceDue),
                            status: newStatus,
                            updated_at: new Date().toISOString()
                        })
                        .where(eq(invoices.id, alloc.invoice_id));
                }
            }

            // Handle overpayment (excess as advance)
            const excessAmount = amount - totalAllocated;
            if (excessAmount > 0.01) {
                await db.insert(customer_advances).values({
                    id: crypto.randomUUID(),
                    org_id: orgId,
                    customer_id,
                    payment_id: paymentId,
                    amount: excessAmount,
                    balance: excessAmount,
                    notes: `Advance from payment ${paymentNumber}`
                });
            }

            // Update customer balance
            await db
                .update(customers)
                .set({
                    balance: sql`${customers.balance} - ${amount}`,
                    updated_at: new Date().toISOString()
                })
                .where(eq(customers.id, customer_id));

        } catch (error) {
            console.error('Failed to record payment:', error);
            return fail(500, {
                error: error instanceof Error ? error.message : 'Failed to record payment'
            });
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
