import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import {
    customers,
    invoices,
    invoice_items,
    organizations,
    payments,
    payment_allocations,
    customer_advances,
    credit_notes,
    credit_allocations,
    accounts
} from '$lib/server/db/schema';
import { eq, and, sql, inArray } from 'drizzle-orm';
import { calculateLineItem, calculateInvoiceTotals, type LineItem, GST_RATES } from './schema';
import { setFlash } from '$lib/server/flash';
import { postInvoiceIssuance, postPaymentReceipt } from '$lib/server/services';
import { bumpNumberSeriesIfHigher, getNextNumber, peekNextNumber } from '$lib/server/services/number-series';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.user) {
        redirect(302, '/login');
    }

    const orgId = locals.user.orgId;

    // Fetch customers for dropdown
    const customerList = await db.query.customers.findMany({
        where: eq(customers.org_id, orgId),
        columns: {
            id: true,
            name: true,
            company_name: true,
            email: true,
            phone: true,
            billing_address: true,
            city: true,
            state_code: true,
            pincode: true,
            gstin: true,
            gst_treatment: true
        },
    });

    // Fetch org state for GST calculation
    const org = await db.query.organizations.findFirst({
        where: eq(organizations.id, orgId),
        columns: { state_code: true },
    });

    // Default dates
    const today = new Date().toISOString().split('T')[0];
    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const autoInvoiceNumber = await peekNextNumber(orgId, 'invoice');

    // Return data without using superforms for nested arrays
    return {
        customers: customerList,
        orgStateCode: org?.state_code || '',
        autoInvoiceNumber,
        defaults: {
            invoice_date: today,
            due_date: dueDate,
        }
    };
};

export const actions: Actions = {
    default: async (event) => {
        if (!event.locals.user) {
            return fail(401, { error: 'Unauthorized' });
        }

        const formData = await event.request.formData();

        // DEBUG LOGGING
        const fs = await import('node:fs');
        const log = (msg: string) => fs.appendFileSync('debug_log.txt', `[${new Date().toISOString()}] ${msg}\n`);
        log('Starting Default Action');

        // Parse form data
        const customer_id = formData.get('customer_id') as string;
        const invoice_date = formData.get('invoice_date') as string;
        const due_date = formData.get('due_date') as string;
        const order_number = formData.get('order_number') as string;
        const notes = formData.get('notes') as string;
        const terms = formData.get('terms') as string;
        const intent = (formData.get('intent') as string || 'draft').trim();
        const invoiceNumberMode = (formData.get('invoice_number_mode') as string || 'auto').trim();
        const providedInvoiceNumber = (formData.get('invoice_number') as string || '').trim();
        const capturePayment = formData.get('capture_payment') === 'on';
        const payment_amount = parseFloat(formData.get('payment_amount') as string) || 0;
        const payment_date = formData.get('payment_date') as string;
        const payment_mode = (formData.get('payment_mode') as string) || '';
        const payment_reference = (formData.get('payment_reference') as string) || '';

        // Credits (New)
        const used_credits_json = (formData.get('used_credits') as string) || '[]';
        let used_credits: { id: string; type: 'advance' | 'credit_note'; amount: number }[] = [];
        try {
            used_credits = JSON.parse(used_credits_json);
        } catch (e) {
            console.error('Failed to parse used_credits', e);
        }

        // Validation
        if (!customer_id) {
            return fail(400, { error: 'Customer is required' });
        }
        if (!invoice_date) {
            return fail(400, { error: 'Invoice date is required' });
        }
        if (!due_date) {
            return fail(400, { error: 'Due date is required' });
        }

        // Parse line items from form data
        const items: LineItem[] = [];
        let i = 0;
        while (formData.has(`items[${i}].description`)) {
            const description = formData.get(`items[${i}].description`) as string;
            const hsn_code = formData.get(`items[${i}].hsn_code`) as string || '';
            const quantity = parseFloat(formData.get(`items[${i}].quantity`) as string) || 1;
            const unit = formData.get(`items[${i}].unit`) as string || 'nos';
            const rate = parseFloat(formData.get(`items[${i}].rate`) as string) || 0;
            const gst_rate = parseFloat(formData.get(`items[${i}].gst_rate`) as string) || 18;

            if (description && description.trim()) {
                items.push({ description, hsn_code, quantity, unit, rate, gst_rate });
            }
            i++;
        }

        if (items.length === 0) {
            return fail(400, { error: 'At least one item with a description is required' });
        }

        const isIssue = intent === 'issue';

        if (isIssue && capturePayment) {
            if (!payment_date) {
                return fail(400, { error: 'Payment date is required' });
            }
            if (payment_amount <= 0) {
                return fail(400, { error: 'Payment amount must be positive' });
            }
            if (!payment_mode) {
                return fail(400, { error: 'Payment mode is required' });
            }
        }

        let createdInvoiceId = '';

        try {
            const orgId = event.locals.user.orgId;
            const invoiceId = crypto.randomUUID();
            let invoiceNumber = providedInvoiceNumber;
            createdInvoiceId = invoiceId;

            // Get customer to determine inter-state
            const customer = await db.query.customers.findFirst({
                where: eq(customers.id, customer_id),
                columns: { state_code: true },
            });

            const org = await db.query.organizations.findFirst({
                where: eq(organizations.id, orgId),
                columns: { state_code: true },
            });

            const isInterState = customer?.state_code !== org?.state_code;

            // Calculate totals
            const totals = calculateInvoiceTotals(items, isInterState);

            if (invoiceNumberMode === 'manual') {
                if (!invoiceNumber) {
                    return fail(400, { error: 'Invoice number is required' });
                }
                const duplicate = await db
                    .select({ id: invoices.id })
                    .from(invoices)
                    .where(
                        and(
                            eq(invoices.org_id, orgId),
                            eq(invoices.invoice_number, invoiceNumber)
                        )
                    )
                    .get();

                if (duplicate) {
                    return fail(400, { error: 'Invoice number already exists' });
                }

                await bumpNumberSeriesIfHigher(orgId, 'invoice', invoiceNumber);
            } else {
                invoiceNumber = await getNextNumber(orgId, 'invoice');
                const duplicate = await db
                    .select({ id: invoices.id })
                    .from(invoices)
                    .where(
                        and(
                            eq(invoices.org_id, orgId),
                            eq(invoices.invoice_number, invoiceNumber)
                        )
                    )
                    .get();

                if (duplicate) {
                    return fail(400, { error: 'Invoice number already exists' });
                }
            }

            let depositAccountId: string | null = null;
            if (isIssue && capturePayment) {
                const depositAccounts = await db
                    .select({
                        id: accounts.id,
                        code: accounts.account_code
                    })
                    .from(accounts)
                    .where(
                        and(
                            eq(accounts.org_id, orgId),
                            inArray(accounts.account_code, ['1000', '1100'])
                        )
                    );

                const cashAccount = depositAccounts.find((acc) => acc.code === '1000');
                const bankAccount = depositAccounts.find((acc) => acc.code === '1100');

                depositAccountId =
                    payment_mode === 'cash' ? cashAccount?.id ?? null : bankAccount?.id ?? null;

                if (!depositAccountId) {
                    return fail(400, { error: 'Deposit account not found' });
                }
            }

            let postingResult: { journalEntryId: string } | null = null;
            if (isIssue) {
                postingResult = await postInvoiceIssuance(orgId, {
                    invoiceId,
                    invoiceNumber,
                    date: invoice_date,
                    customerId: customer_id,
                    subtotal: totals.subtotal,
                    cgst: totals.cgst,
                    sgst: totals.sgst,
                    igst: totals.igst,
                    total: totals.total,
                    userId: event.locals.user.id
                });
            }

            // Insert invoice
            await db.insert(invoices).values({
                id: invoiceId,
                org_id: orgId,
                customer_id: customer_id,
                invoice_number: invoiceNumber,
                invoice_date: invoice_date,
                due_date: due_date,
                order_number: order_number || null,
                status: isIssue ? 'issued' : 'draft',
                subtotal: totals.subtotal,
                taxable_amount: totals.subtotal,
                cgst: totals.cgst,
                sgst: totals.sgst,
                igst: totals.igst,
                total: totals.total,
                balance_due: totals.total,
                is_inter_state: isInterState,
                notes: notes || null,
                terms: terms || null,
                journal_entry_id: postingResult?.journalEntryId || null,
                issued_at: isIssue ? new Date().toISOString() : null,
                created_by: event.locals.user.id,
                updated_by: event.locals.user.id,
            });

            // Insert line items
            for (let idx = 0; idx < items.length; idx++) {
                const item = items[idx];
                const calc = calculateLineItem(item, isInterState);

                await db.insert(invoice_items).values({
                    id: crypto.randomUUID(),
                    invoice_id: invoiceId,
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

            if (isIssue) {
                await db
                    .update(customers)
                    .set({
                        balance: sql`${customers.balance} + ${totals.total}`,
                        updated_at: new Date().toISOString()
                    })
                    .where(eq(customers.id, customer_id));
            }

            if (isIssue && capturePayment && depositAccountId) {
                const paymentNumber = await getNextNumber(orgId, 'payment');
                const paymentId = crypto.randomUUID();
                const paymentModeForPosting = payment_mode === 'cash' ? 'cash' : 'bank';

                const paymentPosting = await postPaymentReceipt(orgId, {
                    paymentId,
                    paymentNumber,
                    date: payment_date,
                    customerId: customer_id,
                    amount: payment_amount,
                    paymentMode: paymentModeForPosting,
                    userId: event.locals.user.id
                });

                await db.insert(payments).values({
                    id: paymentId,
                    org_id: orgId,
                    customer_id,
                    payment_number: paymentNumber,
                    payment_date,
                    amount: payment_amount,
                    payment_mode,
                    deposit_to: depositAccountId,
                    reference: payment_reference || null,
                    notes: null,
                    journal_entry_id: paymentPosting.journalEntryId,
                    created_by: event.locals.user.id
                });

                const allocatedAmount = Math.min(payment_amount, totals.total);
                if (allocatedAmount > 0) {
                    await db.insert(payment_allocations).values({
                        id: crypto.randomUUID(),
                        payment_id: paymentId,
                        invoice_id: invoiceId,
                        amount: allocatedAmount
                    });
                }

                const newAmountPaid = allocatedAmount;
                const newBalanceDue = totals.total - allocatedAmount;
                const newStatus = newBalanceDue <= 0 ? 'paid' : 'partially_paid';

                await db
                    .update(invoices)
                    .set({
                        amount_paid: newAmountPaid,
                        balance_due: Math.max(0, newBalanceDue),
                        status: newStatus,
                        updated_at: new Date().toISOString(),
                        updated_by: event.locals.user.id
                    })
                    .where(eq(invoices.id, invoiceId));

                const excessAmount = payment_amount - allocatedAmount;
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

                await db
                    .update(customers)
                    .set({
                        balance: sql`${customers.balance} - ${payment_amount}`,
                        updated_at: new Date().toISOString()
                    })
                    .where(eq(customers.id, customer_id));
            }

            // --- Apply Credits Logic ---
            if (isIssue && used_credits.length > 0) {
                let totalCredited = 0;
                // Calculate initial remaining balance to be covered by credits
                const amountPaidNow = capturePayment ? Math.min(payment_amount, totals.total) : 0;
                let remainingInvoiceBalance = totals.total - amountPaidNow;

                for (const credit of used_credits) {
                    log(`Processing credit: ${JSON.stringify(credit)}`);
                    if (remainingInvoiceBalance <= 0.01) break; // Invoice fully paid

                    // Allocation Check: Use min(Credit Available, Invoice Remaining)
                    const allocationAmount = Math.min(credit.amount, remainingInvoiceBalance);

                    if (allocationAmount <= 0) continue;

                    if (credit.type === 'advance') {
                        await db.insert(credit_allocations).values({
                            id: crypto.randomUUID(),
                            org_id: orgId,
                            invoice_id: invoiceId,
                            advance_id: credit.id,
                            amount: allocationAmount
                        });

                        // Reduce Advance Balance
                        await db.update(customer_advances)
                            .set({
                                balance: sql`${customer_advances.balance} - ${allocationAmount}`
                            })
                            .where(eq(customer_advances.id, credit.id));

                    } else if (credit.type === 'credit_note') {
                        await db.insert(credit_allocations).values({
                            id: crypto.randomUUID(),
                            org_id: orgId,
                            invoice_id: invoiceId,
                            credit_note_id: credit.id,
                            amount: allocationAmount
                        });

                        // Mark CN as Applied (Update status if fully used)
                        // Assuming CN schema limitation: if we use it, we mark applied.
                        // Ideally we should have a 'balance' on CN.
                        await db.update(credit_notes)
                            .set({ status: 'applied' })
                            .where(eq(credit_notes.id, credit.id));
                    }

                    totalCredited += allocationAmount;
                    remainingInvoiceBalance -= allocationAmount;
                }

                // Update Invoice Balance Due
                if (totalCredited > 0) {
                    // Get current invoice state (it might have been paid partially above)
                    // Because we ran the payment logic first, balance_due might already be reduced.
                    // But wait, the `update` query above (line 346) set the balance_due. 
                    // We need to fetch it or just calculate based on previous knowledge.

                    // Current Logic Flow:
                    // 1. Calculate Totals (Line 160)
                    // 2. Insert Invoice (Line 243) -> Balance Due = Total
                    // 3. Payment Logic (Line 301) -> Reduces Balance Due
                    // 4. NOW: Credit Logic -> Further Reduces Balance Due

                    // We need to query the invoice again to be safe, or use SQL decrement

                    // Determine new status
                    // We can't easily Determine Valid Status with SQL update only without reading back.
                    // So let's just do a db update with SQL math and then a status check?
                    // Or easier: Just calculate it here since we know values.

                    const amountAlreadyPaid = capturePayment ? Math.min(payment_amount, totals.total) : 0;
                    const currentBalanceDue = Math.max(0, totals.total - amountAlreadyPaid);
                    const finalBalanceDue = Math.max(0, currentBalanceDue - totalCredited);
                    const finalStatus = finalBalanceDue <= 0 ? 'paid' : 'partially_paid';

                    await db.update(invoices)
                        .set({
                            balance_due: finalBalanceDue,
                            status: finalStatus,
                            updated_at: new Date().toISOString()
                        })
                        .where(eq(invoices.id, invoiceId));
                }
            }
        } catch (e) {
            // DEBUG LOGGING
            const fs = await import('node:fs');
            fs.appendFileSync('debug_log.txt', `[ERROR] Invoice creation error: ${e instanceof Error ? e.stack : JSON.stringify(e)}\n`);
            console.error('Invoice creation error:', e);
            return fail(500, { error: 'Failed to create invoice' });
        }

        const message = isIssue
            ? (capturePayment
                ? 'Invoice issued and payment recorded.'
                : 'Invoice issued successfully.')
            : 'Invoice saved as draft.';

        setFlash(event.cookies, {
            type: 'success',
            message
        });
        const redirectUrl = capturePayment
            ? `/invoices/${createdInvoiceId}?payment=recorded`
            : `/invoices/${createdInvoiceId}`;
        redirect(302, redirectUrl);
    }
};
