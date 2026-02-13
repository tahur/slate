import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { credit_notes, customers } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { peekNextNumber, logActivity } from '$lib/server/services';
import { checkIdempotency, generateIdempotencyKey } from '$lib/server/utils/idempotency';
import { isIdempotencyConstraintError, isUniqueConstraintOnColumns } from '$lib/server/utils/sqlite-errors';
import type { Actions, PageServerLoad } from './$types';
import { createCreditNoteInTx } from '$lib/server/modules/receivables/application/workflows';
import { runInTx } from '$lib/server/platform/db/tx';
import { failActionFromError } from '$lib/server/platform/errors';
import { invalidateReportingCacheForOrg } from '$lib/server/modules/reporting/application/gst-reports';
import { round2 } from '$lib/utils/currency';
import { localDateStr } from '$lib/utils/date';

export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.user) redirect(302, '/login');

    const orgId = locals.user.orgId;
    const today = localDateStr();

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
        const { isDuplicate, existingRecord } = await checkIdempotency<typeof credit_notes.$inferSelect>(
            'credit_notes',
            orgId,
            idempotencyKey
        );
        if (isDuplicate && existingRecord) {
            redirect(302, `/credit-notes/${existingRecord.id}`);
        }
        if (isDuplicate) {
            redirect(302, '/credit-notes');
        }

        const customer_id = formData.get('customer_id') as string;
        const amount = round2(parseFloat(formData.get('amount') as string) || 0);
        const reason = formData.get('reason') as string;
        const notes = formData.get('notes') as string;
        const date = formData.get('date') as string;
        let number = formData.get('number') as string;

        if (!customer_id || !reason || !date) {
            return fail(400, { error: 'Missing required fields' });
        }
        if (!amount || amount <= 0) {
            return fail(400, { error: 'Amount must be greater than zero' });
        }

        let creditNoteId = '';

        try {
            runInTx((tx) => {
                const result = createCreditNoteInTx(tx, {
                    orgId,
                    userId: locals.user!.id,
                    customerId: customer_id,
                    amount,
                    reason,
                    notes,
                    date,
                    providedNumber: number,
                    idempotencyKey: idempotencyKey || null
                });
                creditNoteId = result.creditNoteId;
                number = result.creditNoteNumber;
            });

            // Log activity (outside transaction — non-critical)
            await logActivity({
                orgId,
                userId: locals.user.id,
                entityType: 'credit_note',
                entityId: creditNoteId,
                action: 'created',
                changedFields: {
                    credit_note_number: { new: number },
                    total: { new: amount },
                    reason: { new: reason }
                }
            });

            invalidateReportingCacheForOrg(orgId);

        } catch (e) {
            if (idempotencyKey && isIdempotencyConstraintError(e, 'credit_notes')) {
                const duplicate = await checkIdempotency<typeof credit_notes.$inferSelect>('credit_notes', orgId, idempotencyKey);
                if (duplicate.isDuplicate && duplicate.existingRecord) {
                    redirect(302, `/credit-notes/${duplicate.existingRecord.id}`);
                }
                redirect(302, '/credit-notes');
            }

            if (isUniqueConstraintOnColumns(e, 'credit_notes', ['org_id', 'credit_note_number'])) {
                return fail(409, { error: 'Credit note number conflict. Please retry.' });
            }

            return failActionFromError(e, 'Credit note creation failed');
        }

        redirect(302, '/credit-notes');
    }
};
