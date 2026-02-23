import { and, eq, inArray, sql } from 'drizzle-orm';
import type { Tx } from '$lib/server/db';
import {
    expenses,
    supplier_credits,
    supplier_payment_allocations,
    supplier_payments,
    vendors
} from '$lib/server/db/schema';
import { postVendorPayment } from '$lib/server/services/posting-engine';
import { getNextNumberTx } from '$lib/server/services/number-series';
import { buildSupplierPaymentReason } from '$lib/server/services/statement-reasons';
import { round2 } from '$lib/utils/currency';
import { NotFoundError, ValidationError } from '$lib/server/platform/errors';
import { logDomainEvent } from '$lib/server/platform/observability';
import {
    consumeSupplierCreditsInTx,
    findOpenSupplierExpensesByIdsInTx,
    findPaymentAccountByIdInTx,
    findPaymentMethodByKeyInTx,
    findVendorInOrgInTx,
    getAvailableSupplierCreditInTx,
    isPaymentMethodMappedToAccountInTx,
    listOpenSupplierExpensesInTx
} from '../infra/queries';

export const MONEY_EPSILON = 0.01;

export type SupplierPaymentAllocationInput = {
    expense_id: string;
    amount: number;
};

export function parseSupplierPaymentAllocationsFromFormData(formData: FormData): SupplierPaymentAllocationInput[] {
    const allocations: SupplierPaymentAllocationInput[] = [];
    const seenExpenseIds = new Set<string>();

    let i = 0;
    while (formData.has(`allocations[${i}].expense_id`)) {
        const expenseId = (formData.get(`allocations[${i}].expense_id`) as string) || '';
        const allocAmount = round2(parseFloat(formData.get(`allocations[${i}].amount`) as string) || 0);

        if (!expenseId || allocAmount <= MONEY_EPSILON) {
            i++;
            continue;
        }

        if (seenExpenseIds.has(expenseId)) {
            throw new ValidationError('Duplicate bill allocations are not allowed');
        }

        seenExpenseIds.add(expenseId);
        allocations.push({ expense_id: expenseId, amount: allocAmount });
        i++;
    }

    return allocations;
}

async function resolvePaymentSelectionInTx(tx: Tx, orgId: string, paymentMode: string, paidFrom: string) {
    const paymentMethod = await findPaymentMethodByKeyInTx(tx, orgId, paymentMode);
    if (!paymentMethod) {
        throw new ValidationError('Invalid payment method');
    }

    const paymentAccount = await findPaymentAccountByIdInTx(tx, orgId, paidFrom);
    if (!paymentAccount) {
        throw new ValidationError('Invalid payment account');
    }

    const isMapped = await isPaymentMethodMappedToAccountInTx(tx, orgId, paymentMethod.id, paymentAccount.id);
    if (!isMapped) {
        throw new ValidationError('Selected payment account is not linked to the selected payment method');
    }

    return { paymentMethod, paymentAccount };
}

type CreateSupplierPaymentInTxInput = {
    orgId: string;
    userId: string;
    vendorId: string;
    paymentDate: string;
    amount: number;
    paymentMode: string;
    paidFrom: string;
    reference?: string;
    notes?: string;
    allocations: SupplierPaymentAllocationInput[];
    idempotencyKey?: string | null;
};

export async function createSupplierPaymentInTx(
    tx: Tx,
    input: CreateSupplierPaymentInTxInput
): Promise<{
    paymentId: string;
    paymentNumber: string;
    totalAllocated: number;
    excessAmount: number;
}> {
    const amount = round2(input.amount);
    if (amount <= MONEY_EPSILON) {
        throw new ValidationError('Amount must be positive');
    }

    const vendor = await findVendorInOrgInTx(tx, input.orgId, input.vendorId);
    if (!vendor) {
        throw new NotFoundError('Supplier not found');
    }

    const { paymentMethod, paymentAccount } = await resolvePaymentSelectionInTx(
        tx,
        input.orgId,
        input.paymentMode,
        input.paidFrom
    );

    const totalRequested = round2(input.allocations.reduce((sum, allocation) => sum + allocation.amount, 0));
    if (totalRequested > amount + MONEY_EPSILON) {
        throw new ValidationError('Adjusted amount cannot exceed payment amount');
    }

    const openExpenseMap = new Map<
        string,
        {
            id: string;
            expense_number: string;
            balance_due: number;
        }
    >();

    const requestedExpenseIds = input.allocations.map((allocation) => allocation.expense_id);
    if (requestedExpenseIds.length > 0) {
        const rows = await findOpenSupplierExpensesByIdsInTx(tx, input.orgId, input.vendorId, requestedExpenseIds);
        for (const row of rows) {
            openExpenseMap.set(row.id, {
                id: row.id,
                expense_number: row.expense_number,
                balance_due: round2(row.balance_due)
            });
        }

        for (const allocation of input.allocations) {
            const expense = openExpenseMap.get(allocation.expense_id);
            if (!expense) {
                throw new ValidationError('One or more allocations reference invalid supplier bills');
            }
            if (allocation.amount > expense.balance_due + MONEY_EPSILON) {
                throw new ValidationError('Allocation amount exceeds bill balance due');
            }
        }
    }

    const finalAllocations = input.allocations.map((allocation) => ({
        expense_id: allocation.expense_id,
        amount: round2(allocation.amount)
    }));
    const allocatedByExpense = new Map<string, number>();
    for (const allocation of finalAllocations) {
        allocatedByExpense.set(
            allocation.expense_id,
            round2((allocatedByExpense.get(allocation.expense_id) || 0) + allocation.amount)
        );
    }

    let remaining = round2(amount - totalRequested);
    if (remaining > MONEY_EPSILON) {
        const openExpenses = await listOpenSupplierExpensesInTx(tx, input.orgId, input.vendorId);
        for (const expense of openExpenses) {
            if (remaining <= MONEY_EPSILON) break;
            const alreadyAllocated = round2(allocatedByExpense.get(expense.id) || 0);
            const available = round2(expense.balance_due - alreadyAllocated);
            if (available <= MONEY_EPSILON) continue;

            const autoAmount = round2(Math.min(available, remaining));
            if (autoAmount <= MONEY_EPSILON) continue;

            finalAllocations.push({
                expense_id: expense.id,
                amount: autoAmount
            });
            allocatedByExpense.set(expense.id, round2(alreadyAllocated + autoAmount));
            remaining = round2(remaining - autoAmount);
        }
    }

    const totalAllocated = round2(finalAllocations.reduce((sum, allocation) => sum + allocation.amount, 0));
    const excessAmount = round2(amount - totalAllocated);

    const paymentId = crypto.randomUUID();
    const paymentNumber = await getNextNumberTx(tx, input.orgId, 'supplier_payment');

    const paidFromMode = paymentAccount.account_code === '1000' ? 'cash' : 'bank';
    const allocatedExpenseNumbers = Array.from(
        new Set(
            finalAllocations
                .map((allocation) => {
                    const matched = openExpenseMap.get(allocation.expense_id);
                    if (matched) return matched.expense_number;
                    return '';
                })
                .filter(Boolean)
        )
    ).sort();
    const reasonSnapshot = buildSupplierPaymentReason(amount, totalAllocated, allocatedExpenseNumbers);

    const postingResult = await postVendorPayment(
        input.orgId,
        {
            paymentId,
            paymentNumber,
            date: input.paymentDate,
            vendorId: input.vendorId,
            amount,
            paidFromMode,
            paidFromAccountCode: paymentAccount.account_code,
            userId: input.userId
        },
        tx
    );

    await tx.insert(supplier_payments).values({
        id: paymentId,
        org_id: input.orgId,
        vendor_id: input.vendorId,
        supplier_payment_number: paymentNumber,
        payment_date: input.paymentDate,
        amount,
        payment_mode: input.paymentMode,
        reference: input.reference || '',
        notes: input.notes || '',
        reason_snapshot: reasonSnapshot,
        paid_from: paymentAccount.id,
        payment_account_id: paymentAccount.id,
        payment_method_id: paymentMethod.id,
        journal_entry_id: postingResult.journalEntryId,
        idempotency_key: input.idempotencyKey || null,
        created_by: input.userId
    });

    for (const allocation of finalAllocations) {
        await tx.insert(supplier_payment_allocations).values({
            id: crypto.randomUUID(),
            supplier_payment_id: paymentId,
            expense_id: allocation.expense_id,
            amount: allocation.amount
        });

        await tx
            .update(expenses)
            .set({
                amount_settled: sql`ROUND((${expenses.amount_settled})::numeric + (${allocation.amount})::numeric, 2)`,
                balance_due: sql`GREATEST(ROUND((${expenses.balance_due})::numeric - (${allocation.amount})::numeric, 2), 0)`,
                updated_at: new Date().toISOString()
            })
            .where(and(eq(expenses.id, allocation.expense_id), eq(expenses.org_id, input.orgId)));
    }

    const settledExpenseIds = Array.from(new Set(finalAllocations.map((allocation) => allocation.expense_id)));
    if (settledExpenseIds.length > 0) {
        await tx
            .update(expenses)
            .set({
                payment_status: sql`CASE WHEN ${expenses.balance_due} <= 0 THEN 'paid' ELSE 'unpaid' END`,
                updated_at: new Date().toISOString()
            })
            .where(and(eq(expenses.org_id, input.orgId), inArray(expenses.id, settledExpenseIds)));
    }

    if (excessAmount > MONEY_EPSILON) {
        await tx.insert(supplier_credits).values({
            id: crypto.randomUUID(),
            org_id: input.orgId,
            vendor_id: input.vendorId,
            supplier_payment_id: paymentId,
            source_type: 'payment_excess',
            amount: excessAmount,
            balance: excessAmount,
            notes: `Advance from supplier payment ${paymentNumber}`
        });
    }

    await tx
        .update(vendors)
        .set({
            balance: sql`ROUND((${vendors.balance})::numeric - (${amount})::numeric, 2)`,
            updated_at: new Date().toISOString()
        })
        .where(and(eq(vendors.id, input.vendorId), eq(vendors.org_id, input.orgId)));

    logDomainEvent('payables.supplier_payment_recorded', {
        orgId: input.orgId,
        vendorId: input.vendorId,
        paymentId,
        paymentNumber,
        amount,
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

export async function applySupplierCreditToExpenseInTx(
    tx: Tx,
    orgId: string,
    vendorId: string,
    requestedCreditAmount: number
): Promise<number> {
    const requested = round2(requestedCreditAmount);
    if (requested <= MONEY_EPSILON) return 0;

    const available = await getAvailableSupplierCreditInTx(tx, orgId, vendorId);
    if (requested > available + MONEY_EPSILON) {
        throw new ValidationError('Applied credit exceeds available supplier credit');
    }

    return consumeSupplierCreditsInTx(tx, orgId, vendorId, requested);
}
