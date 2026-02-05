import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { customers, invoices, payments, credit_notes, customer_advances, payment_allocations } from '$lib/server/db/schema';
import { eq, and, desc, gt, sql } from 'drizzle-orm';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { customerSchema } from '../new/schema';
import type { Actions, PageServerLoad } from './$types';
import { addCurrency } from '$lib/utils/currency';

export const load: PageServerLoad = async ({ locals, params }) => {
    if (!locals.user) {
        redirect(302, '/login');
    }

    const orgId = locals.user.orgId;
    const customerId = params.id;

    const customer = await db.query.customers.findFirst({
        where: and(
            eq(customers.id, customerId),
            eq(customers.org_id, orgId)
        )
    });

    if (!customer) {
        redirect(302, '/customers');
    }

    // Fetch all invoices for this customer
    const customerInvoices = await db
        .select({
            id: invoices.id,
            invoice_number: invoices.invoice_number,
            invoice_date: invoices.invoice_date,
            due_date: invoices.due_date,
            total: invoices.total,
            amount_paid: invoices.amount_paid,
            balance_due: invoices.balance_due,
            status: invoices.status
        })
        .from(invoices)
        .where(and(
            eq(invoices.org_id, orgId),
            eq(invoices.customer_id, customerId)
        ))
        .orderBy(desc(invoices.invoice_date));

    // Fetch all payments for this customer
    const customerPayments = await db
        .select({
            id: payments.id,
            payment_number: payments.payment_number,
            payment_date: payments.payment_date,
            amount: payments.amount,
            payment_mode: payments.payment_mode,
            reference: payments.reference
        })
        .from(payments)
        .where(and(
            eq(payments.org_id, orgId),
            eq(payments.customer_id, customerId)
        ))
        .orderBy(desc(payments.payment_date));

    // Fetch all credit notes for this customer
    const customerCreditNotes = await db
        .select({
            id: credit_notes.id,
            credit_note_number: credit_notes.credit_note_number,
            credit_note_date: credit_notes.credit_note_date,
            total: credit_notes.total,
            balance: credit_notes.balance,
            reason: credit_notes.reason,
            status: credit_notes.status
        })
        .from(credit_notes)
        .where(and(
            eq(credit_notes.org_id, orgId),
            eq(credit_notes.customer_id, customerId)
        ))
        .orderBy(desc(credit_notes.credit_note_date));

    // Fetch available advances
    const customerAdvances = await db
        .select({
            id: customer_advances.id,
            payment_id: customer_advances.payment_id,
            amount: customer_advances.amount,
            balance: customer_advances.balance,
            created_at: customer_advances.created_at,
            notes: customer_advances.notes
        })
        .from(customer_advances)
        .where(and(
            eq(customer_advances.org_id, orgId),
            eq(customer_advances.customer_id, customerId)
        ))
        .orderBy(desc(customer_advances.created_at));

    // Calculate summary stats
    const totalInvoiced = customerInvoices
        .filter(inv => inv.status !== 'draft' && inv.status !== 'cancelled')
        .reduce((sum, inv) => addCurrency(sum, inv.total), 0);

    const totalReceived = customerPayments
        .reduce((sum, pay) => addCurrency(sum, pay.amount), 0);

    const totalCreditNotes = customerCreditNotes
        .filter(cn => cn.status !== 'cancelled')
        .reduce((sum, cn) => addCurrency(sum, cn.total), 0);

    const totalAdvances = customerAdvances
        .filter(adv => adv.balance > 0.01)
        .reduce((sum, adv) => addCurrency(sum, adv.balance), 0);

    const availableCreditNotes = customerCreditNotes
        .filter(cn => cn.status === 'issued' && cn.balance && cn.balance > 0.01)
        .reduce((sum, cn) => addCurrency(sum, cn.balance || 0), 0);

    // Build ledger (combined transactions sorted by date)
    type LedgerEntry = {
        id: string;
        date: string;
        type: 'invoice' | 'payment' | 'credit_note';
        number: string;
        description: string;
        debit: number;
        credit: number;
        status?: string;
        balance: number;
    };

    const ledger: LedgerEntry[] = [];

    // Add invoices (increase what customer owes = debit)
    for (const inv of customerInvoices) {
        if (inv.status === 'draft') continue; // Skip drafts
        ledger.push({
            id: inv.id,
            date: inv.invoice_date,
            type: 'invoice',
            number: inv.invoice_number,
            description: inv.status === 'cancelled' ? 'Invoice (Cancelled)' : 'Invoice',
            debit: inv.status === 'cancelled' ? 0 : inv.total,
            credit: 0,
            status: inv.status || undefined,
            balance: 0
        });
    }

    // Add payments (decrease what customer owes = credit)
    for (const pay of customerPayments) {
        ledger.push({
            id: pay.id,
            date: pay.payment_date,
            type: 'payment',
            number: pay.payment_number,
            description: `Payment (${pay.payment_mode})`,
            debit: 0,
            credit: pay.amount,
            balance: 0
        });
    }

    // Add credit notes (decrease what customer owes = credit)
    for (const cn of customerCreditNotes) {
        if (cn.status === 'cancelled') continue;
        ledger.push({
            id: cn.id,
            date: cn.credit_note_date,
            type: 'credit_note',
            number: cn.credit_note_number,
            description: `Credit Note (${cn.reason})`,
            debit: 0,
            credit: cn.total,
            status: cn.status || undefined,
            balance: 0
        });
    }

    // Sort ledger by date (newest first)
    ledger.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Calculate running balance (from oldest to newest, then reverse for display)
    const ledgerWithBalance = [...ledger].reverse();
    let runningBalance = 0;
    for (const entry of ledgerWithBalance) {
        runningBalance = addCurrency(runningBalance, entry.debit) - entry.credit;
        entry.balance = runningBalance;
    }
    ledgerWithBalance.reverse(); // Back to newest first

    // Pre-populate form with customer data for edit modal
    const form = await superValidate({
        name: customer.name,
        company_name: customer.company_name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        billing_address: customer.billing_address || '',
        city: customer.city || '',
        state_code: customer.state_code || '',
        pincode: customer.pincode || '',
        gstin: customer.gstin || '',
        gst_treatment: customer.gst_treatment as 'registered' | 'unregistered' | 'consumer' | 'overseas',
        payment_terms: customer.payment_terms || 0,
    }, zod4(customerSchema));

    return {
        customer,
        form,
        invoices: customerInvoices,
        payments: customerPayments,
        creditNotes: customerCreditNotes,
        advances: customerAdvances,
        ledger: ledgerWithBalance,
        summary: {
            totalInvoiced,
            totalReceived,
            totalCreditNotes,
            outstanding: customer.balance || 0,
            availableCredits: addCurrency(totalAdvances, availableCreditNotes)
        }
    };
};

export const actions: Actions = {
    default: async (event) => {
        const form = await superValidate(event, zod4(customerSchema));

        if (!form.valid) {
            return fail(400, { form });
        }

        if (!event.locals.user) {
            return fail(401, { form, error: 'Unauthorized' });
        }

        try {
            const data = form.data;

            await db.update(customers)
                .set({
                    name: data.name,
                    company_name: data.company_name || null,
                    email: data.email || null,
                    phone: data.phone || null,
                    billing_address: data.billing_address || null,
                    city: data.city || null,
                    state_code: data.state_code || null,
                    pincode: data.pincode || null,
                    gstin: data.gstin || null,
                    gst_treatment: data.gst_treatment,
                    place_of_supply: data.state_code || null,
                    payment_terms: data.payment_terms,
                    updated_by: event.locals.user.id,
                    updated_at: new Date().toISOString(),
                })
                .where(and(
                    eq(customers.id, event.params.id),
                    eq(customers.org_id, event.locals.user.orgId)
                ));

            return { form, success: true };
        } catch (e) {
            console.error(e);
            return fail(500, { form, error: 'Failed to update customer' });
        }
    }
};
