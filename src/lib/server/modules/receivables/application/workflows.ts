import { and, eq } from 'drizzle-orm';
import type { Tx } from '$lib/server/db';
import {
    credit_allocations,
    credit_notes,
    customer_advances,
    payment_allocations,
    payments
} from '$lib/server/db/schema';
import { postCreditNote, postPaymentReceipt } from '$lib/server/services/posting-engine';
import { bumpNumberSeriesIfHigher, getNextNumberTx } from '$lib/server/services/number-series';
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
    customer_id: string;
    total: number;
    amount_paid: number | null;
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

    // Mapping is enforced by the UI (combined picker only shows mapped combos).
    // We validate method and account individually but don't require the mapping to exist,
    // which also fixes backward compat for old records without explicit mappings.

    return { paymentMethod, depositAccount };
}

export async function recordInvoicePaymentInTx(
    tx: Tx,
    input: RecordInvoicePaymentInTxInput
): Promise<{ paymentNumber: string; paymentId: string }> {
    const amount = round2(input.amount);

    if (input.invoice.status === 'paid' || input.invoice.status === 'cancelled') {
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
    const newBalanceDue = round2(input.invoice.total - newAmountPaid);
    const nowIso = new Date().toISOString();

    await setInvoiceSettlementStateInTx(
        tx,
        input.invoice.id,
        input.invoice.total,
        newBalanceDue,
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
): Promise<{ totalApplied: number; newStatus: 'paid' | 'partially_paid' }> {
    const invoice = await findInvoiceForSettlementInTx(tx, input.orgId, input.invoiceId);

    if (!invoice) {
        throw new NotFoundError('Invoice not found');
    }
    if (invoice.status === 'paid' || invoice.status === 'cancelled') {
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
        applied.remainingBalanceDue,
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
    resultingStatus: 'paid' | 'partially_paid';
}> {
    const invoice = await findInvoiceForSettlementInTx(tx, input.orgId, input.invoiceId);

    if (!invoice) {
        throw new NotFoundError('Invoice not found');
    }
    if (invoice.status === 'paid' || invoice.status === 'cancelled') {
        throw new ValidationError('Invoice is already paid or cancelled');
    }
    if (invoice.balance_due <= MONEY_EPSILON) {
        throw new ValidationError('Invoice has no balance due');
    }

    let currentBalanceDue = round2(invoice.balance_due);
    let creditSettled = 0;
    let paymentSettled = 0;

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
    }

    const totalSettled = round2(creditSettled + paymentSettled);
    if (totalSettled <= MONEY_EPSILON) {
        throw new ValidationError('No settlement was applied');
    }

    const settlement = await setInvoiceSettlementStateInTx(
        tx,
        input.invoiceId,
        invoice.total,
        currentBalanceDue,
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
            total: number;
            amount_paid: number | null;
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
            invoice.balance_due - allocation.amount,
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
    amount: number;
    reason: string;
    notes?: string;
    date: string;
    providedNumber?: string;
    idempotencyKey?: string | null;
}

export async function createCreditNoteInTx(
    tx: Tx,
    input: CreateCreditNoteInTxInput
): Promise<{ creditNoteId: string; creditNoteNumber: string; total: number }> {
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
            subtotal: input.amount,
            cgst: 0,
            sgst: 0,
            igst: 0,
            total: input.amount,
            userId: input.userId
        },
        tx
    );

    await tx.insert(credit_notes).values({
        id: creditNoteId,
        org_id: input.orgId,
        customer_id: input.customerId,
        credit_note_number: creditNoteNumber,
        credit_note_date: input.date,
        subtotal: input.amount,
        total: input.amount,
        balance: input.amount,
        reason: input.reason,
        notes: input.notes || '',
        status: 'issued',
        journal_entry_id: postingResult.journalEntryId,
        idempotency_key: input.idempotencyKey || null,
        created_by: input.userId
    });

    await decreaseCustomerBalanceInTx(tx, input.customerId, input.amount, new Date().toISOString());

    await bumpNumberSeriesIfHigher(input.orgId, 'credit_note', creditNoteNumber, tx);

    logDomainEvent('receivables.credit_note_issued', {
        orgId: input.orgId,
        customerId: input.customerId,
        creditNoteId,
        creditNoteNumber,
        total: input.amount
    });

    return {
        creditNoteId,
        creditNoteNumber,
        total: input.amount
    };
}
