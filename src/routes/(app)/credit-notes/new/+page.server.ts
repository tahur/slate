import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { credit_notes, customers } from '$lib/server/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getNextNumber, peekNextNumber, bumpNumberSeriesIfHigher, postCreditNote, logActivity } from '$lib/server/services';
import { checkIdempotency, generateIdempotencyKey } from '$lib/server/utils/idempotency';
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
        today,
        idempotencyKey: generateIdempotencyKey()
    };
};

export const actions: Actions = {
    default: async ({ request, locals }) => {
        if (!locals.user) return fail(401);

        const formData = await request.formData();
        const orgId = locals.user.orgId;

        // Check idempotency
        const idempotencyKey = formData.get('idempotency_key') as string;
        const { isDuplicate } = await checkIdempotency('credit_notes', orgId, idempotencyKey);
        if (isDuplicate) {
            redirect(302, '/credit-notes');
        }

        const customer_id = formData.get('customer_id') as string;
        const amount = parseFloat(formData.get('amount') as string);
        const reason = formData.get('reason') as string;
        const notes = formData.get('notes') as string;
        const date = formData.get('date') as string;
        let number = formData.get('number') as string;

        // Collision Check & Recovery
        try {
            const existingCN = await db.query.credit_notes.findFirst({
                where: and(
                    eq(credit_notes.org_id, orgId),
                    eq(credit_notes.credit_note_number, number)
                )
            });

            if (existingCN) {
                console.log('Collision detected for credit note number:', number);
                // Force generate next number
                number = await getNextNumber(orgId, 'credit_note');
            } else if (!number) {
                number = await getNextNumber(orgId, 'credit_note');
            }
        } catch (numErr) {
            console.error('Number generation error:', numErr);
            throw numErr;
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
                idempotency_key: idempotencyKey || null,
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

            // Log activity
            await logActivity({
                orgId,
                userId: locals.user.id,
                entityType: 'credit_note',
                entityId: id,
                action: 'created',
                changedFields: {
                    credit_note_number: { new: number },
                    total: { new: amount },
                    reason: { new: reason }
                }
            });

        } catch (e) {
            console.error('Failed to create credit note:', e);
            const errMsg = e instanceof Error ? e.message : String(e);
            return fail(500, { error: 'Failed to create credit note: ' + errMsg });
        }

        redirect(302, '/credit-notes');
    }
};
