import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { debit_notes, accounts, vendors } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { peekNextNumber, logActivity } from '$lib/server/services';
import { checkIdempotency, generateIdempotencyKey } from '$lib/server/utils/idempotency';
import { isIdempotencyConstraintError, isUniqueConstraintOnColumns } from '$lib/server/utils/db-errors';
import type { Actions, PageServerLoad } from './$types';
import { createDebitNoteInTx } from '$lib/server/modules/payables/application/workflows';
import { runInTx } from '$lib/server/platform/db/tx';
import { failActionFromError } from '$lib/server/platform/errors';
import { invalidateReportingCacheForOrg } from '$lib/server/modules/reporting/application/gst-reports';
import { round2 } from '$lib/utils/currency';
import { localDateStr } from '$lib/utils/date';
import { ensureExpenseAccounts } from '$lib/server/seed';

export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.user) redirect(302, '/login');

    const orgId = locals.user.orgId;
    const today = localDateStr();

    await ensureExpenseAccounts(orgId);

    // Fetch vendors and expense accounts in parallel
    const [vendorList, expenseAccounts, autoNumber] = await Promise.all([
        db.query.vendors.findMany({
            where: and(eq(vendors.org_id, orgId), eq(vendors.is_active, true)),
            columns: { id: true, name: true, company_name: true }
        }),
        db
            .select({
                id: accounts.id,
                name: accounts.account_name,
                code: accounts.account_code
            })
            .from(accounts)
            .where(
                and(
                    eq(accounts.org_id, orgId),
                    eq(accounts.account_type, 'expense'),
                    eq(accounts.is_active, true)
                )
            )
            .orderBy(accounts.account_code),
        peekNextNumber(orgId, 'debit_note')
    ]);

    return {
        vendors: vendorList,
        expenseAccounts,
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
        const { isDuplicate, existingRecord } = await checkIdempotency<typeof debit_notes.$inferSelect>(
            'debit_notes',
            orgId,
            idempotencyKey
        );
        if (isDuplicate && existingRecord) {
            redirect(302, `/debit-notes/${existingRecord.id}`);
        }
        if (isDuplicate) {
            redirect(302, '/debit-notes');
        }

        const vendor_id = formData.get('vendor_id') as string;
        const expense_account_id = formData.get('expense_account_id') as string;
        const expense_account_code = formData.get('expense_account_code') as string;
        const amount = round2(parseFloat(formData.get('amount') as string) || 0);
        const subtotal = round2(parseFloat(formData.get('subtotal') as string) || amount);
        const cgst = round2(parseFloat(formData.get('cgst') as string) || 0);
        const sgst = round2(parseFloat(formData.get('sgst') as string) || 0);
        const igst = round2(parseFloat(formData.get('igst') as string) || 0);
        const total = round2(parseFloat(formData.get('total') as string) || round2(subtotal + cgst + sgst + igst));
        const reason = formData.get('reason') as string;
        const notes = formData.get('notes') as string;
        const date = formData.get('date') as string;
        let number = formData.get('number') as string;

        if (!vendor_id || !reason || !date || !expense_account_id || !expense_account_code) {
            return fail(400, { error: 'Missing required fields' });
        }
        if (!total || total <= 0) {
            return fail(400, { error: 'Amount must be greater than zero' });
        }

        let debitNoteId = '';

        try {
            await runInTx(async (tx) => {
                const result = await createDebitNoteInTx(tx, {
                    orgId,
                    userId: locals.user!.id,
                    vendorId: vendor_id,
                    expenseAccountId: expense_account_id,
                    expenseAccountCode: expense_account_code,
                    subtotal,
                    cgst,
                    sgst,
                    igst,
                    total,
                    reason,
                    notes,
                    date,
                    providedNumber: number,
                    idempotencyKey: idempotencyKey || null
                });
                debitNoteId = result.debitNoteId;
                number = result.debitNoteNumber;
            });

            // Log activity (outside transaction — non-critical)
            void logActivity({
                orgId,
                userId: locals.user.id,
                entityType: 'debit_note',
                entityId: debitNoteId,
                action: 'created',
                changedFields: {
                    debit_note_number: { new: number },
                    total: { new: total },
                    reason: { new: reason }
                }
            });

            invalidateReportingCacheForOrg(orgId);

        } catch (e) {
            if (idempotencyKey && isIdempotencyConstraintError(e, 'debit_notes')) {
                const duplicate = await checkIdempotency<typeof debit_notes.$inferSelect>('debit_notes', orgId, idempotencyKey);
                if (duplicate.isDuplicate && duplicate.existingRecord) {
                    redirect(302, `/debit-notes/${duplicate.existingRecord.id}`);
                }
                redirect(302, '/debit-notes');
            }

            if (isUniqueConstraintOnColumns(e, 'debit_notes', ['org_id', 'debit_note_number'])) {
                return fail(409, { error: 'Debit note number conflict. Please retry.' });
            }

            return failActionFromError(e, 'Debit note creation failed');
        }

        redirect(302, '/debit-notes');
    }
};
