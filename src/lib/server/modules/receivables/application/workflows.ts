import { and, eq, ne, sql } from 'drizzle-orm';
import type { Tx } from '$lib/server/db';
import {
    credit_allocations,
    credit_notes,
    customer_advances,
    invoices,
    payment_allocations,
    payments,
    refunds
} from '$lib/server/db/schema';
import { postCreditNote, postPaymentReceipt, postRefund } from '$lib/server/services/posting-engine';
import { bumpNumberSeriesIfHigher, getNextNumberTx } from '$lib/server/services/number-series';
import { buildCustomerReceiptReason } from '$lib/server/services/statement-reasons';
import { round2 } from '$lib/utils/currency';
import { NotFoundError, ValidationError } from '$lib/server/platform/errors';
import { logDomainEvent } from '$lib/server/platform/observability';
import {
    decreaseCustomerBalanceInTx,
    findAvailableAdvanceInTx,
    findAvailableCreditNoteInTx,
    findCustomerInOrgInTx,
    findDepositAccountByIdInTx,
    findInvoiceForSettlementInTx,
    findOpenInvoicesByIdsInTx,
    findPaymentMethodByKeyInTx,
    increaseCustomerBalanceInTx,
    isPaymentMethodMappedToAccountInTx,
    setInvoiceSettlementStateInTx
} from '../infra/queries';

export const MONEY_EPSILON = 0.01;

export type RequestedCredit = {
    id: string;
    type: 'advance' | 'credit_note';
    amount: number;
};

export type PaymentAllocationInput = {
    invoice_id: string;
    amount: number;
};

type ParseRequestedCreditsOptions = {
    allowEmpty?: boolean;
};

export function parseRequestedCredits(
    rawValue: FormDataEntryValue | null,
    options: ParseRequestedCreditsOptions = {}
): RequestedCredit[] {
    if (rawValue === null) {
        if (options.allowEmpty) {
            return [];
        }
        throw new ValidationError('Invalid credits data');
    }

    if (typeof rawValue !== 'string') {
        throw new ValidationError('Invalid credits data');
    }

    let parsed: unknown;
    try {
        parsed = JSON.parse(rawValue);
    } catch {
        throw new ValidationError('Invalid credits data');
    }

    if (!Array.isArray(parsed)) {
        throw new ValidationError('Invalid credits data');
    }

    const seen = new Set<string>();
    const credits: RequestedCredit[] = [];

    for (const entry of parsed) {
        if (!entry || typeof entry !== 'object') {
            throw new ValidationError('Invalid credits data');
        }

        const id = typeof (entry as any).id === 'string' ? (entry as any).id.trim() : '';
        const type = (entry as any).type;
        const amount = Number((entry as any).amount);

        if (!id || (type !== 'advance' && type !== 'credit_note') || !Number.isFinite(amount) || amount <= 0) {
            throw new ValidationError('Invalid credits data');
        }

        const dedupeKey = `${type}:${id}`;
        if (seen.has(dedupeKey)) {
            throw new ValidationError('Duplicate credit entries are not allowed');
        }

        seen.add(dedupeKey);
        credits.push({ id, type, amount: round2(amount) });
    }

    return credits;
}

export function parsePaymentAllocationsFromFormData(formData: FormData): PaymentAllocationInput[] {
    const allocations: PaymentAllocationInput[] = [];
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
            throw new ValidationError('Duplicate invoice allocations are not allowed');
        }

        seenInvoiceIds.add(invoiceId);
        allocations.push({ invoice_id: invoiceId, amount: allocAmount });
        i++;
    }

    return allocations;
}

interface ApplyRequestedCreditsInTxInput {
    orgId: string;
    customerId: string;
    invoiceId: string;
    requestedCredits: RequestedCredit[];
    startingBalanceDue: number;
}

interface ApplyRequestedCreditsInTxResult {
    totalApplied: number;
    remainingBalanceDue: number;
}

export async function applyRequestedCreditsInTx(
    tx: Tx,
    input: ApplyRequestedCreditsInTxInput
): Promise<ApplyRequestedCreditsInTxResult> {
    let currentBalanceDue = round2(input.startingBalanceDue);
    let totalApplied = 0;

    for (const requested of input.requestedCredits) {
        if (currentBalanceDue <= MONEY_EPSILON) break;

        if (requested.type === 'advance') {
            const advance = await findAvailableAdvanceInTx(
                tx,
                input.orgId,
                input.customerId,
                requested.id,
                MONEY_EPSILON
            );

            if (!advance) {
                throw new ValidationError('Selected advance is no longer available');
            }

            const available = round2(advance.balance);
            if (requested.amount > available + MONEY_EPSILON) {
                throw new ValidationError('Requested credit exceeds available advance balance');
            }

            const amountToApply = round2(Math.min(requested.amount, currentBalanceDue));
            if (amountToApply <= MONEY_EPSILON) continue;

            await tx.insert(credit_allocations).values({
                id: crypto.randomUUID(),
                org_id: input.orgId,
                credit_note_id: null,
                advance_id: advance.id,
                invoice_id: input.invoiceId,
                amount: amountToApply,
                created_at: new Date().toISOString()
            });

            const remaining = round2(available - amountToApply);
            await tx
                .update(customer_advances)
                .set({ balance: remaining })
                .where(eq(customer_advances.id, advance.id));

            currentBalanceDue = round2(currentBalanceDue - amountToApply);
            totalApplied = round2(totalApplied + amountToApply);
            continue;
        }

        const creditNote = await findAvailableCreditNoteInTx(
            tx,
            input.orgId,
            input.customerId,
            requested.id,
            MONEY_EPSILON
        );

        if (!creditNote) {
            throw new ValidationError('Selected credit note is no longer available');
        }

        const available = round2(creditNote.balance || 0);
        if (requested.amount > available + MONEY_EPSILON) {
            throw new ValidationError('Requested credit exceeds available credit note balance');
        }

        const amountToApply = round2(Math.min(requested.amount, currentBalanceDue));
        if (amountToApply <= MONEY_EPSILON) continue;

        await tx.insert(credit_allocations).values({
            id: crypto.randomUUID(),
            org_id: input.orgId,
            credit_note_id: creditNote.id,
            advance_id: null,
            invoice_id: input.invoiceId,
            amount: amountToApply,
            created_at: new Date().toISOString()
        });

        const remaining = round2(available - amountToApply);
        await tx
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

interface InvoiceRow {
    id: string;
    invoice_number: string;
    customer_id: string;
    total: number;
    amount_paid: number | null;
    credits_applied: number | null;
    balance_due: number;
    status: string;
}

interface RecordInvoicePaymentInTxInput {
    orgId: string;
    userId: string;
    invoice: InvoiceRow;
    amount: number;
    paymentDate: string;
    paymentMode: string;
    depositTo: string;
    reference?: string;
}

async function resolvePaymentSelectionInTx(tx: Tx, orgId: string, paymentMode: string, depositTo: string) {
    const paymentMethod = await findPaymentMethodByKeyInTx(tx, orgId, paymentMode);
    if (!paymentMethod) {
        throw new ValidationError('Invalid payment method');
    }

    const depositAccount = await findDepositAccountByIdInTx(tx, orgId, depositTo);
    if (!depositAccount) {
        throw new ValidationError('Invalid deposit account');
    }

    const isMapped = await isPaymentMethodMappedToAccountInTx(tx, orgId, paymentMethod.id, depositAccount.id);
    if (!isMapped) {
        throw new ValidationError('Selected payment account is not linked to the selected payment method');
    }

    return { paymentMethod, depositAccount };
}

export async function recordInvoicePaymentInTx(
    tx: Tx,
    input: RecordInvoicePaymentInTxInput
): Promise<{ paymentNumber: string; paymentId: string }> {
    const amount = round2(input.amount);

    if (input.invoice.status === 'paid' || input.invoice.status === 'adjusted' || input.invoice.status === 'cancelled') {
        throw new ValidationError('Invoice is already paid or cancelled');
    }
    if (amount <= MONEY_EPSILON) {
        throw new ValidationError('Amount must be positive');
    }
    if (amount > input.invoice.balance_due + MONEY_EPSILON) {
        throw new ValidationError('Amount exceeds balance due');
    }

    const { paymentMethod, depositAccount } = await resolvePaymentSelectionInTx(
        tx,
        input.orgId,
        input.paymentMode,
        input.depositTo
    );

    const paymentNumber = await getNextNumberTx(tx, input.orgId, 'payment');
    const paymentId = crypto.randomUUID();
    const paymentModeForPosting = depositAccount.account_code === '1000' ? 'cash' : 'bank';

    const postingResult = await postPaymentReceipt(
        input.orgId,
        {
            paymentId,
            paymentNumber,
            date: input.paymentDate,
            customerId: input.invoice.customer_id,
            amount,
            paymentMode: paymentModeForPosting,
            depositAccountCode: depositAccount.account_code,
            userId: input.userId
        },
        tx
    );

    await tx.insert(payments).values({
        id: paymentId,
        org_id: input.orgId,
        customer_id: input.invoice.customer_id,
        payment_number: paymentNumber,
        payment_date: input.paymentDate,
        amount,
        payment_mode: input.paymentMode,
        deposit_to: depositAccount.id,
        payment_account_id: depositAccount.id,
        payment_method_id: paymentMethod.id,
        reference: input.reference || '',
        reason_snapshot: buildCustomerReceiptReason(amount, amount, [input.invoice.invoice_number]),
        journal_entry_id: postingResult.journalEntryId,
        created_by: input.userId
    });

    await tx.insert(payment_allocations).values({
        id: crypto.randomUUID(),
        payment_id: paymentId,
        invoice_id: input.invoice.id,
        amount
    });

    const newAmountPaid = round2((input.invoice.amount_paid || 0) + amount);
    const newCreditsApplied = round2(input.invoice.credits_applied || 0);
    const nowIso = new Date().toISOString();

    await setInvoiceSettlementStateInTx(
        tx,
        input.invoice.id,
        input.invoice.total,
        newAmountPaid,
        newCreditsApplied,
        MONEY_EPSILON,
        nowIso
    );
    await decreaseCustomerBalanceInTx(tx, input.invoice.customer_id, amount, nowIso);

    logDomainEvent('receivables.invoice_payment_recorded', {
        orgId: input.orgId,
        invoiceId: input.invoice.id,
        paymentId,
        paymentNumber,
        amount
    });

    return { paymentNumber, paymentId };
}

interface ApplyCreditsToInvoiceInTxInput {
    orgId: string;
    invoiceId: string;
    requestedCredits: RequestedCredit[];
}

export async function applyCreditsToInvoiceInTx(
    tx: Tx,
    input: ApplyCreditsToInvoiceInTxInput
): Promise<{ totalApplied: number; newStatus: 'issued' | 'partially_paid' | 'paid' | 'adjusted' }> {
    const invoice = await findInvoiceForSettlementInTx(tx, input.orgId, input.invoiceId);

    if (!invoice) {
        throw new NotFoundError('Invoice not found');
    }
    if (invoice.status === 'paid' || invoice.status === 'adjusted' || invoice.status === 'cancelled') {
        throw new ValidationError('Invoice is already paid or cancelled');
    }
    if (invoice.balance_due <= MONEY_EPSILON) {
        throw new ValidationError('Invoice has no balance due');
    }

    const applied = await applyRequestedCreditsInTx(tx, {
        orgId: input.orgId,
        customerId: invoice.customer_id,
        invoiceId: input.invoiceId,
        requestedCredits: input.requestedCredits,
        startingBalanceDue: invoice.balance_due
    });

    const totalApplied = round2(applied.totalApplied);
    if (totalApplied <= MONEY_EPSILON) {
        throw new ValidationError('No credits were applied');
    }

    const settlement = await setInvoiceSettlementStateInTx(
        tx,
        input.invoiceId,
        invoice.total,
        round2(invoice.amount_paid || 0),
        round2((invoice.credits_applied || 0) + totalApplied),
        MONEY_EPSILON,
        new Date().toISOString()
    );

    logDomainEvent('receivables.invoice_credits_applied', {
        orgId: input.orgId,
        invoiceId: input.invoiceId,
        totalApplied,
        newStatus: settlement.status
    });

    return { totalApplied, newStatus: settlement.status };
}

interface SettleInvoiceInTxInput {
    orgId: string;
    userId: string;
    invoiceId: string;
    requestedCredits: RequestedCredit[];
    paymentAmount: number;
    paymentDate?: string;
    paymentMode: string;
    depositTo?: string;
    paymentReference?: string;
}

export async function settleInvoiceInTx(
    tx: Tx,
    input: SettleInvoiceInTxInput
): Promise<{
    totalSettled: number;
    creditSettled: number;
    paymentSettled: number;
    resultingStatus: 'issued' | 'partially_paid' | 'paid' | 'adjusted';
}> {
    const invoice = await findInvoiceForSettlementInTx(tx, input.orgId, input.invoiceId);

    if (!invoice) {
        throw new NotFoundError('Invoice not found');
    }
    if (invoice.status === 'paid' || invoice.status === 'adjusted' || invoice.status === 'cancelled') {
        throw new ValidationError('Invoice is already paid or cancelled');
    }
    if (invoice.balance_due <= MONEY_EPSILON) {
        throw new ValidationError('Invoice has no balance due');
    }

    let currentBalanceDue = round2(invoice.balance_due);
    let creditSettled = 0;
    let paymentSettled = 0;
    let newAmountPaid = round2(invoice.amount_paid || 0);
    let newCreditsApplied = round2(invoice.credits_applied || 0);

    if (input.requestedCredits.length > 0) {
        const appliedCredits = await applyRequestedCreditsInTx(tx, {
            orgId: input.orgId,
            customerId: invoice.customer_id,
            invoiceId: input.invoiceId,
            requestedCredits: input.requestedCredits,
            startingBalanceDue: currentBalanceDue
        });

        creditSettled = round2(appliedCredits.totalApplied);
        currentBalanceDue = round2(appliedCredits.remainingBalanceDue);
        newCreditsApplied = round2(newCreditsApplied + creditSettled);
    }

    if (input.paymentAmount > MONEY_EPSILON) {
        if (!input.paymentDate) {
            throw new ValidationError('Payment date is required when payment amount is provided');
        }
        if (input.paymentAmount > currentBalanceDue + MONEY_EPSILON) {
            throw new ValidationError('Payment amount exceeds remaining balance due');
        }

        if (!input.depositTo) {
            throw new ValidationError('Deposit account is required when payment amount is provided');
        }

        const { paymentMethod, depositAccount } = await resolvePaymentSelectionInTx(
            tx,
            input.orgId,
            input.paymentMode,
            input.depositTo
        );

        const paymentAmount = round2(input.paymentAmount);
        const paymentNumber = await getNextNumberTx(tx, input.orgId, 'payment');
        const paymentId = crypto.randomUUID();
        const paymentModeForPosting = depositAccount.account_code === '1000' ? 'cash' : 'bank';

        const postingResult = await postPaymentReceipt(
            input.orgId,
            {
                paymentId,
                paymentNumber,
                date: input.paymentDate,
                customerId: invoice.customer_id,
                amount: paymentAmount,
                paymentMode: paymentModeForPosting,
                depositAccountCode: depositAccount.account_code,
                userId: input.userId
            },
            tx
        );

        await tx.insert(payments).values({
            id: paymentId,
            org_id: input.orgId,
            customer_id: invoice.customer_id,
            payment_number: paymentNumber,
            payment_date: input.paymentDate,
            amount: paymentAmount,
            payment_mode: input.paymentMode,
            deposit_to: depositAccount.id,
            payment_account_id: depositAccount.id,
            payment_method_id: paymentMethod.id,
            reference: input.paymentReference || '',
            reason_snapshot: buildCustomerReceiptReason(
                paymentAmount,
                paymentAmount,
                [invoice.invoice_number]
            ),
            journal_entry_id: postingResult.journalEntryId,
            created_by: input.userId
        });

        await tx.insert(payment_allocations).values({
            id: crypto.randomUUID(),
            payment_id: paymentId,
            invoice_id: input.invoiceId,
            amount: paymentAmount
        });

        await decreaseCustomerBalanceInTx(tx, invoice.customer_id, paymentAmount, new Date().toISOString());

        paymentSettled = paymentAmount;
        currentBalanceDue = round2(currentBalanceDue - paymentAmount);
        newAmountPaid = round2(newAmountPaid + paymentAmount);
    }

    const totalSettled = round2(creditSettled + paymentSettled);
    if (totalSettled <= MONEY_EPSILON) {
        throw new ValidationError('No settlement was applied');
    }

    const settlement = await setInvoiceSettlementStateInTx(
        tx,
        input.invoiceId,
        invoice.total,
        newAmountPaid,
        newCreditsApplied,
        MONEY_EPSILON,
        new Date().toISOString()
    );

    logDomainEvent('receivables.invoice_settled', {
        orgId: input.orgId,
        invoiceId: input.invoiceId,
        totalSettled,
        creditSettled,
        paymentSettled,
        resultingStatus: settlement.status
    });

    return {
        totalSettled,
        creditSettled,
        paymentSettled,
        resultingStatus: settlement.status
    };
}

interface CreateCustomerPaymentInTxInput {
    orgId: string;
    userId: string;
    customerId: string;
    paymentDate: string;
    amount: number;
    paymentMode: string;
    depositTo: string;
    reference?: string;
    notes?: string;
    allocations: PaymentAllocationInput[];
    idempotencyKey?: string | null;
}

export async function createCustomerPaymentInTx(
    tx: Tx,
    input: CreateCustomerPaymentInTxInput
): Promise<{ paymentId: string; paymentNumber: string; totalAllocated: number; excessAmount: number }> {
    if (input.amount <= MONEY_EPSILON) {
        throw new ValidationError('Amount must be positive');
    }

    const totalAllocated = round2(input.allocations.reduce((sum, allocation) => sum + allocation.amount, 0));
    if (totalAllocated > input.amount + MONEY_EPSILON) {
        throw new ValidationError('Allocated amount cannot exceed payment amount');
    }

    const customer = await findCustomerInOrgInTx(tx, input.orgId, input.customerId);
    if (!customer) {
        throw new NotFoundError('Customer not found');
    }

    const { paymentMethod, depositAccount } = await resolvePaymentSelectionInTx(
        tx,
        input.orgId,
        input.paymentMode,
        input.depositTo
    );

    const invoiceMap = new Map<
        string,
        {
            id: string;
            invoice_number: string;
            total: number;
            amount_paid: number | null;
            credits_applied: number | null;
            balance_due: number;
        }
    >();

    const invoiceIds = input.allocations.map((allocation) => allocation.invoice_id);
    if (invoiceIds.length > 0) {
        const invoiceRows = await findOpenInvoicesByIdsInTx(tx, input.orgId, input.customerId, invoiceIds);

        for (const invoice of invoiceRows) {
            invoiceMap.set(invoice.id, invoice);
        }

        for (const allocation of input.allocations) {
            const invoice = invoiceMap.get(allocation.invoice_id);
            if (!invoice) {
                throw new ValidationError('One or more allocations reference invalid invoices');
            }
            if (allocation.amount > invoice.balance_due + MONEY_EPSILON) {
                throw new ValidationError('Allocation amount exceeds invoice balance due');
            }
        }
    }

    const paymentId = crypto.randomUUID();
    const paymentNumber = await getNextNumberTx(tx, input.orgId, 'payment');
    const paymentModeForPosting = depositAccount.account_code === '1000' ? 'cash' : 'bank';
    const allocatedInvoiceNumbers = Array.from(
        new Set(
            input.allocations
                .map((allocation) => invoiceMap.get(allocation.invoice_id)?.invoice_number || '')
                .filter(Boolean)
        )
    ).sort();
    const reasonSnapshot = buildCustomerReceiptReason(input.amount, totalAllocated, allocatedInvoiceNumbers);

    const postingResult = await postPaymentReceipt(
        input.orgId,
        {
            paymentId,
            paymentNumber,
            date: input.paymentDate,
            customerId: input.customerId,
            amount: input.amount,
            paymentMode: paymentModeForPosting,
            depositAccountCode: depositAccount.account_code,
            userId: input.userId
        },
        tx
    );

    await tx.insert(payments).values({
        id: paymentId,
        org_id: input.orgId,
        customer_id: input.customerId,
        payment_number: paymentNumber,
        payment_date: input.paymentDate,
        amount: input.amount,
        payment_mode: input.paymentMode,
        deposit_to: depositAccount.id,
        payment_account_id: depositAccount.id,
        payment_method_id: paymentMethod.id,
        reference: input.reference || '',
        notes: input.notes || '',
        reason_snapshot: reasonSnapshot,
        journal_entry_id: postingResult.journalEntryId,
        idempotency_key: input.idempotencyKey || null,
        created_by: input.userId
    });

    for (const allocation of input.allocations) {
        const invoice = invoiceMap.get(allocation.invoice_id);
        if (!invoice) {
            throw new ValidationError('One or more allocations reference invalid invoices');
        }

        await tx.insert(payment_allocations).values({
            id: crypto.randomUUID(),
            payment_id: paymentId,
            invoice_id: allocation.invoice_id,
            amount: allocation.amount
        });

        await setInvoiceSettlementStateInTx(
            tx,
            allocation.invoice_id,
            invoice.total,
            round2((invoice.amount_paid || 0) + allocation.amount),
            round2(invoice.credits_applied || 0),
            MONEY_EPSILON,
            new Date().toISOString()
        );
    }

    const excessAmount = round2(input.amount - totalAllocated);
    if (excessAmount > MONEY_EPSILON) {
        await tx.insert(customer_advances).values({
            id: crypto.randomUUID(),
            org_id: input.orgId,
            customer_id: input.customerId,
            payment_id: paymentId,
            amount: excessAmount,
            balance: excessAmount,
            notes: `Advance from payment ${paymentNumber}`
        });
    }

    await decreaseCustomerBalanceInTx(tx, input.customerId, input.amount, new Date().toISOString());

    logDomainEvent('receivables.customer_payment_recorded', {
        orgId: input.orgId,
        customerId: input.customerId,
        paymentId,
        paymentNumber,
        amount: input.amount,
        totalAllocated,
        excessAmount
    });

    return {
        paymentId,
        paymentNumber,
        totalAllocated,
        excessAmount
    };
}

interface CreateCreditNoteInTxInput {
    orgId: string;
    userId: string;
    customerId: string;
    invoiceId?: string | null;
    subtotal: number;
    cgst: number;
    sgst: number;
    igst: number;
    total: number;
    reason: string;
    notes?: string;
    date: string;
    providedNumber?: string;
    idempotencyKey?: string | null;
}

type CreditNoteReason = 'return' | 'damaged' | 'discount' | 'writeoff' | 'cancellation' | 'other';

const CREDIT_NOTE_REASON_MAP: Record<string, CreditNoteReason> = {
    return: 'return',
    returned: 'return',
    damaged: 'damaged',
    damage: 'damaged',
    discount: 'discount',
    writeoff: 'writeoff',
    write_off: 'writeoff',
    'write-off': 'writeoff',
    cancellation: 'cancellation',
    cancel: 'cancellation',
    other: 'other'
};

function normalizeCreditNoteReason(rawReason: string): CreditNoteReason {
    const reasonKey = rawReason.trim().toLowerCase().replace(/\s+/g, '_');
    const normalized = CREDIT_NOTE_REASON_MAP[reasonKey];
    if (!normalized) {
        throw new ValidationError('Invalid credit note reason');
    }
    return normalized;
}

async function assertInvoiceCreditCapInTx(
    tx: Tx,
    orgId: string,
    customerId: string,
    invoiceId: string,
    creditTotal: number
) {
    const invoice = await tx.query.invoices.findFirst({
        where: and(
            eq(invoices.id, invoiceId),
            eq(invoices.org_id, orgId),
            eq(invoices.customer_id, customerId)
        ),
        columns: {
            id: true,
            total: true,
            status: true
        }
    });

    if (!invoice) {
        throw new ValidationError('Linked invoice not found for this customer');
    }
    if (invoice.status === 'draft' || invoice.status === 'cancelled') {
        throw new ValidationError('Cannot issue a credit note for draft or cancelled invoice');
    }

    const existingCreditRows = await tx
        .select({
            total: sql<number>`COALESCE(SUM(${credit_notes.total}), 0)`
        })
        .from(credit_notes)
        .where(
            and(
                eq(credit_notes.org_id, orgId),
                eq(credit_notes.invoice_id, invoiceId),
                ne(credit_notes.status, 'cancelled')
            )
        );

    const existingCredits = Number(existingCreditRows[0]?.total) || 0;
    const remainingCap = round2((invoice.total || 0) - existingCredits);
    if (creditTotal > remainingCap + MONEY_EPSILON) {
        throw new ValidationError('Credit note exceeds remaining value on linked invoice');
    }
}

async function assertCustomerGlobalCreditCapInTx(
    tx: Tx,
    orgId: string,
    customerId: string,
    creditTotal: number
) {
    const [invoiceRows, creditRows] = await Promise.all([
        tx
            .select({
                total: sql<number>`COALESCE(SUM(${invoices.total}), 0)`
            })
            .from(invoices)
            .where(
                and(
                    eq(invoices.org_id, orgId),
                    eq(invoices.customer_id, customerId),
                    ne(invoices.status, 'draft'),
                    ne(invoices.status, 'cancelled')
                )
            ),
        tx
            .select({
                total: sql<number>`COALESCE(SUM(${credit_notes.total}), 0)`
            })
            .from(credit_notes)
            .where(
                and(
                    eq(credit_notes.org_id, orgId),
                    eq(credit_notes.customer_id, customerId),
                    ne(credit_notes.status, 'cancelled')
                )
            )
    ]);

    const totalInvoices = Number(invoiceRows[0]?.total) || 0;
    const existingCredits = Number(creditRows[0]?.total) || 0;
    if (existingCredits + creditTotal > totalInvoices + MONEY_EPSILON) {
        throw new ValidationError('Credit note exceeds total invoice value for this customer');
    }
}

export async function createCreditNoteInTx(
    tx: Tx,
    input: CreateCreditNoteInTxInput
): Promise<{ creditNoteId: string; creditNoteNumber: string; total: number }> {
    const invoiceId = input.invoiceId?.trim() || null;
    const subtotal = round2(input.subtotal);
    const cgst = round2(input.cgst);
    const sgst = round2(input.sgst);
    const igst = round2(input.igst);
    const total = round2(input.total);
    const expectedTotal = round2(subtotal + cgst + sgst + igst);
    const normalizedReason = normalizeCreditNoteReason(input.reason);

    if (subtotal < 0 || cgst < 0 || sgst < 0 || igst < 0 || total <= MONEY_EPSILON) {
        throw new ValidationError('Credit note totals are invalid');
    }
    if (Math.abs(total - expectedTotal) > MONEY_EPSILON) {
        throw new ValidationError('Credit note total does not match tax breakdown');
    }

    if (invoiceId) {
        await assertInvoiceCreditCapInTx(tx, input.orgId, input.customerId, invoiceId, total);
    } else {
        await assertCustomerGlobalCreditCapInTx(tx, input.orgId, input.customerId, total);
    }

    const creditNoteId = crypto.randomUUID();
    let creditNoteNumber = (input.providedNumber || '').trim();

    if (creditNoteNumber) {
        const existing = await tx.query.credit_notes.findFirst({
            where: and(
                eq(credit_notes.org_id, input.orgId),
                eq(credit_notes.credit_note_number, creditNoteNumber)
            )
        });

        if (existing) {
            creditNoteNumber = await getNextNumberTx(tx, input.orgId, 'credit_note');
        }
    } else {
        creditNoteNumber = await getNextNumberTx(tx, input.orgId, 'credit_note');
    }

    const postingResult = await postCreditNote(
        input.orgId,
        {
            creditNoteId,
            creditNoteNumber,
            date: input.date,
            customerId: input.customerId,
            subtotal,
            cgst,
            sgst,
            igst,
            total,
            userId: input.userId
        },
        tx
    );

    await tx.insert(credit_notes).values({
        id: creditNoteId,
        org_id: input.orgId,
        customer_id: input.customerId,
        invoice_id: invoiceId,
        credit_note_number: creditNoteNumber,
        credit_note_date: input.date,
        subtotal,
        cgst,
        sgst,
        igst,
        total,
        balance: total,
        reason: normalizedReason,
        notes: input.notes || '',
        status: 'issued',
        journal_entry_id: postingResult.journalEntryId,
        idempotency_key: input.idempotencyKey || null,
        created_by: input.userId
    });

    await decreaseCustomerBalanceInTx(tx, input.customerId, total, new Date().toISOString());

    await bumpNumberSeriesIfHigher(input.orgId, 'credit_note', creditNoteNumber, tx);

    logDomainEvent('receivables.credit_note_issued', {
        orgId: input.orgId,
        customerId: input.customerId,
        creditNoteId,
        creditNoteNumber,
        total,
        reason: normalizedReason,
        invoiceId
    });

    return {
        creditNoteId,
        creditNoteNumber,
        total
    };
}

interface RecordRefundInTxInput {
    orgId: string;
    userId: string;
    creditNoteId: string;
    refundDate: string;
    amount: number;
    paymentMode: string;
    sourceAccountId: string;
    reference?: string;
    notes?: string;
    idempotencyKey?: string | null;
}

export async function recordRefundInTx(
    tx: Tx,
    input: RecordRefundInTxInput
): Promise<{ refundId: string; refundNumber: string; remainingBalance: number }> {
    const amount = round2(input.amount);
    if (amount <= MONEY_EPSILON) {
        throw new ValidationError('Refund amount must be positive');
    }

    const creditNote = await tx.query.credit_notes.findFirst({
        where: and(
            eq(credit_notes.id, input.creditNoteId),
            eq(credit_notes.org_id, input.orgId)
        ),
        columns: {
            id: true,
            customer_id: true,
            credit_note_number: true,
            balance: true,
            status: true
        }
    });

    if (!creditNote) {
        throw new NotFoundError('Credit note not found');
    }
    if (creditNote.status === 'cancelled') {
        throw new ValidationError('Cancelled credit note cannot be refunded');
    }

    const availableBalance = round2(creditNote.balance || 0);
    if (amount > availableBalance + MONEY_EPSILON) {
        throw new ValidationError('Refund amount exceeds available credit balance');
    }

    const { paymentMethod, depositAccount } = await resolvePaymentSelectionInTx(
        tx,
        input.orgId,
        input.paymentMode,
        input.sourceAccountId
    );

    const refundId = crypto.randomUUID();
    const refundNumber = await getNextNumberTx(tx, input.orgId, 'refund');
    const postingResult = await postRefund(
        input.orgId,
        {
            refundId,
            refundNumber,
            date: input.refundDate,
            customerId: creditNote.customer_id,
            amount,
            sourceAccountCode: depositAccount.account_code,
            userId: input.userId
        },
        tx
    );

    await tx.insert(refunds).values({
        id: refundId,
        org_id: input.orgId,
        customer_id: creditNote.customer_id,
        credit_note_id: creditNote.id,
        refund_number: refundNumber,
        refund_date: input.refundDate,
        amount,
        payment_mode: input.paymentMode,
        source_account_id: depositAccount.id,
        payment_method_id: paymentMethod.id,
        reference: input.reference || '',
        notes: input.notes || '',
        status: 'posted',
        journal_entry_id: postingResult.journalEntryId,
        idempotency_key: input.idempotencyKey || null,
        created_by: input.userId
    });

    const remainingBalance = round2(availableBalance - amount);
    await tx
        .update(credit_notes)
        .set({
            balance: remainingBalance,
            status: remainingBalance <= MONEY_EPSILON ? 'applied' : 'issued'
        })
        .where(eq(credit_notes.id, creditNote.id));

    await increaseCustomerBalanceInTx(tx, creditNote.customer_id, amount, new Date().toISOString());

    logDomainEvent('receivables.refund_posted', {
        orgId: input.orgId,
        creditNoteId: creditNote.id,
        creditNoteNumber: creditNote.credit_note_number,
        refundId,
        refundNumber,
        amount
    });

    return {
        refundId,
        refundNumber,
        remainingBalance
    };
}

interface CancelInvoiceWithCreditNoteInTxInput {
    orgId: string;
    userId: string;
    invoiceId: string;
    nowIso: string;
    refundNow?: boolean;
    refundDate?: string;
    refundAmount?: number;
    refundPaymentMode?: string;
    refundSourceAccountId?: string;
    refundReference?: string;
    refundNotes?: string;
    refundIdempotencyKey?: string | null;
}

function buildCancellationCreditNoteTotals(invoice: {
    total: number;
    cgst: number | null;
    sgst: number | null;
    igst: number | null;
}, cancellationTotal: number) {
    const invoiceTotal = round2(invoice.total || 0);
    if (invoiceTotal <= MONEY_EPSILON) {
        return {
            subtotal: cancellationTotal,
            cgst: 0,
            sgst: 0,
            igst: 0,
            total: cancellationTotal
        };
    }

    const ratio = Math.min(1, cancellationTotal / invoiceTotal);
    const cgst = round2((invoice.cgst || 0) * ratio);
    const sgst = round2((invoice.sgst || 0) * ratio);
    const igst = round2((invoice.igst || 0) * ratio);
    const subtotal = round2(Math.max(0, cancellationTotal - cgst - sgst - igst));

    return {
        subtotal,
        cgst,
        sgst,
        igst,
        total: cancellationTotal
    };
}

export async function cancelInvoiceWithCreditNoteInTx(
    tx: Tx,
    input: CancelInvoiceWithCreditNoteInTxInput
): Promise<{
    cancellationCreditNoteId: string | null;
    cancellationCreditNoteNumber: string | null;
    refundId: string | null;
}> {
    const invoice = await tx.query.invoices.findFirst({
        where: and(
            eq(invoices.id, input.invoiceId),
            eq(invoices.org_id, input.orgId)
        ),
        columns: {
            id: true,
            customer_id: true,
            invoice_number: true,
            subtotal: true,
            cgst: true,
            sgst: true,
            igst: true,
            total: true,
            amount_paid: true,
            credits_applied: true,
            balance_due: true,
            status: true
        }
    });

    if (!invoice) {
        throw new NotFoundError('Invoice not found');
    }
    if (invoice.status === 'cancelled') {
        throw new ValidationError('Invoice is already cancelled');
    }
    if (invoice.status === 'draft') {
        throw new ValidationError('Draft invoices should be deleted instead of cancelled');
    }

    // Fetch individual credit allocation rows so we can unwind them
    const [cnAllocRows, advAllocRows] = await Promise.all([
        tx
            .select({
                id: credit_allocations.id,
                credit_note_id: credit_allocations.credit_note_id,
                amount: credit_allocations.amount
            })
            .from(credit_allocations)
            .where(
                and(
                    eq(credit_allocations.invoice_id, invoice.id),
                    sql`${credit_allocations.credit_note_id} IS NOT NULL`
                )
            ),
        tx
            .select({
                id: credit_allocations.id,
                advance_id: credit_allocations.advance_id,
                amount: credit_allocations.amount
            })
            .from(credit_allocations)
            .where(
                and(
                    eq(credit_allocations.invoice_id, invoice.id),
                    sql`${credit_allocations.advance_id} IS NOT NULL`
                )
            )
    ]);

    const cashPaid = round2(invoice.amount_paid || 0);
    const appliedCreditNotesTotal = round2(cnAllocRows.reduce((s, r) => s + (r.amount || 0), 0));
    const appliedAdvancesTotal = round2(advAllocRows.reduce((s, r) => s + (r.amount || 0), 0));

    // Unwind credit note allocations: restore balance on each source CN
    for (const row of cnAllocRows) {
        if (!row.credit_note_id) continue;
        const amt = round2(row.amount || 0);
        await tx
            .update(credit_notes)
            .set({
                balance: sql`${credit_notes.balance} + ${amt}`,
                status: 'issued'
            })
            .where(eq(credit_notes.id, row.credit_note_id));
    }

    // Unwind advance allocations: restore balance on each source advance
    for (const row of advAllocRows) {
        if (!row.advance_id) continue;
        const amt = round2(row.amount || 0);
        await tx
            .update(customer_advances)
            .set({
                balance: sql`${customer_advances.balance} + ${amt}`
            })
            .where(eq(customer_advances.id, row.advance_id));
    }

    // Delete all credit allocation rows for this invoice
    if (cnAllocRows.length > 0 || advAllocRows.length > 0) {
        await tx
            .delete(credit_allocations)
            .where(eq(credit_allocations.invoice_id, invoice.id));
    }

    // After unwinding, cancellation CN covers the full invoice total
    const cancellationTotal = round2(invoice.total);

    if (cancellationTotal < -MONEY_EPSILON) {
        throw new ValidationError('Invoice cancellation integrity check failed');
    }

    let cancellationCreditNoteId: string | null = null;
    let cancellationCreditNoteNumber: string | null = null;
    let refundId: string | null = null;

    if (cancellationTotal > MONEY_EPSILON) {
        const cancellationCredit = await createCreditNoteInTx(tx, {
            orgId: input.orgId,
            userId: input.userId,
            customerId: invoice.customer_id,
            invoiceId: invoice.id,
            reason: 'cancellation',
            notes: `Cancellation of invoice ${invoice.invoice_number}`,
            date: input.nowIso.split('T')[0],
            ...buildCancellationCreditNoteTotals(invoice, cancellationTotal)
        });

        cancellationCreditNoteId = cancellationCredit.creditNoteId;
        cancellationCreditNoteNumber = cancellationCredit.creditNoteNumber;

        // After unwinding credits, actual balance_due = total - cashPaid (no credits applied)
        const actualBalanceDue = round2(invoice.total - cashPaid);
        const autoOffset = round2(Math.min(actualBalanceDue, cancellationTotal));
        const remainingBalance = round2(cancellationTotal - autoOffset);

        await tx
            .update(credit_notes)
            .set({
                balance: remainingBalance,
                status: remainingBalance <= MONEY_EPSILON ? 'applied' : 'issued'
            })
            .where(eq(credit_notes.id, cancellationCredit.creditNoteId));

        if (input.refundNow && remainingBalance > MONEY_EPSILON) {
            if (!input.refundPaymentMode || !input.refundSourceAccountId) {
                throw new ValidationError('Refund payment mode and source account are required');
            }

            const refund = await recordRefundInTx(tx, {
                orgId: input.orgId,
                userId: input.userId,
                creditNoteId: cancellationCredit.creditNoteId,
                refundDate: input.refundDate || input.nowIso.split('T')[0],
                amount: round2(input.refundAmount || remainingBalance),
                paymentMode: input.refundPaymentMode,
                sourceAccountId: input.refundSourceAccountId,
                reference: input.refundReference,
                notes: input.refundNotes || `Refund for cancelled invoice ${invoice.invoice_number}`,
                idempotencyKey: input.refundIdempotencyKey || null
            });

            refundId = refund.refundId;
        }
    }

    await tx
        .update(invoices)
        .set({
            status: 'cancelled',
            balance_due: 0,
            cancelled_at: input.nowIso,
            updated_at: input.nowIso,
            updated_by: input.userId
        })
        .where(eq(invoices.id, invoice.id));

    logDomainEvent('receivables.invoice_cancelled_with_credit_note', {
        orgId: input.orgId,
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoice_number,
        previousStatus: invoice.status,
        cashPaid,
        appliedCreditNotesTotal,
        appliedAdvancesTotal,
        cancellationCreditNoteId,
        refundId
    });

    return {
        cancellationCreditNoteId,
        cancellationCreditNoteNumber,
        refundId
    };
}
