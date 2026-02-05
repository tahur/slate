import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { credit_notes, customers } from '$lib/server/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getNextNumber, peekNextNumber, bumpNumberSeriesIfHigher, postCreditNote } from '$lib/server/services';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.user) redirect(302, '/login');

    const orgId = locals.user.orgId;
    const today = new Date().toISOString().split('T')[0];

    // Fetch customers
    const customerList = await db.query.customers.findMany({
        where: eq(customers.org_id, orgId),
        columns: { id: true, name: true, company_name: true }
    });

    // Auto number
    const autoNumber = await peekNextNumber(orgId, 'credit_note');

    return {
        customers: customerList,
        autoNumber,
        today
    };
};

export const actions: Actions = {
    default: async ({ request, locals }) => {
        if (!locals.user) return fail(401);

        const data = await request.formData();

        // DEBUG LOG
        console.log('--- Creating Credit Note ---');
        const entries = Object.fromEntries(data.entries());
        console.log('Form Data:', entries);

        const orgId = locals.user.orgId;

        const customer_id = data.get('customer_id') as string;
        const amount = parseFloat(data.get('amount') as string);
        const reason = data.get('reason') as string;
        const notes = data.get('notes') as string;
        const date = data.get('date') as string;
        let number = data.get('number') as string;

        // Collision Check & Recovery
        const existingIV = await db.query.credit_notes.findFirst({
            where: and(
                eq(credit_notes.org_id, orgId),
                eq(credit_notes.credit_note_number, number)
            )
        });

        if (existingIV) {
            console.log('Collision detected for credit note number:', number);
            // Force generate next number
            number = await getNextNumber(orgId, 'credit_note');
        } else if (!number) {
            number = await getNextNumber(orgId, 'credit_note');
        }

        if (!customer_id || !amount || !reason || !date) {
            return fail(400, { error: 'Missing required fields' });
        }

        try {
            const id = crypto.randomUUID();

            // Post journal entry (reverse of invoice: debit sales, credit AR)
            const postingResult = await postCreditNote(orgId, {
                creditNoteId: id,
                creditNoteNumber: number,
                date,
                customerId: customer_id,
                subtotal: amount,
                cgst: 0,
                sgst: 0,
                igst: 0,
                total: amount,
                userId: locals.user.id
            });

            await db.insert(credit_notes).values({
                id,
                org_id: orgId,
                customer_id,
                credit_note_number: number,
                credit_note_date: date,
                subtotal: amount,
                total: amount,
                balance: amount, // Initial balance = total
                reason,
                notes,
                status: 'issued', // Available for use
                journal_entry_id: postingResult.journalEntryId,
                created_by: locals.user.id
            });

            // Update customer balance (reduce by credit note amount)
            await db
                .update(customers)
                .set({
                    balance: sql`${customers.balance} - ${amount}`,
                    updated_at: new Date().toISOString()
                })
                .where(eq(customers.id, customer_id));

            // Ensure the number series is updated if we used a manual/peeked number
            await bumpNumberSeriesIfHigher(orgId, 'credit_note', number);

        } catch (e) {
            console.error('SERVER ERROR Creating Credit Note:', e);
            return fail(500, { error: 'Failed to create credit note: ' + (e instanceof Error ? e.message : String(e)) });
        }

        redirect(302, '/credit-notes');
    }
};
