import { and, eq, gt, inArray, ne, sql } from 'drizzle-orm';
import { db, type Tx } from '$lib/server/db';
import {
    credit_notes,
    customer_advances,
    customers,
    invoices,
    payment_accounts,
    payment_method_account_map,
    payment_methods
} from '$lib/server/db/schema';
import { round2 } from '$lib/utils/currency';

export type InvoiceSettlementRow = {
    id: string;
    customer_id: string;
    total: number;
    amount_paid: number | null;
    balance_due: number;
    status: string;
};

export type OpenCustomerInvoiceRow = {
    id: string;
    total: number;
    amount_paid: number | null;
    balance_due: number;
};

export async function findAvailableAdvanceInTx(
    tx: Tx,
    orgId: string,
    customerId: string,
    advanceId: string,
    epsilon: number
) {
    return tx.query.customer_advances.findFirst({
        where: and(
            eq(customer_advances.id, advanceId),
            eq(customer_advances.org_id, orgId),
            eq(customer_advances.customer_id, customerId),
            gt(customer_advances.balance, epsilon)
        )
    });
}

export async function findAvailableCreditNoteInTx(
    tx: Tx,
    orgId: string,
    customerId: string,
    creditNoteId: string,
    epsilon: number
) {
    return tx.query.credit_notes.findFirst({
        where: and(
            eq(credit_notes.id, creditNoteId),
            eq(credit_notes.org_id, orgId),
            eq(credit_notes.customer_id, customerId),
            eq(credit_notes.status, 'issued'),
            gt(credit_notes.balance, epsilon)
        )
    });
}

export async function findDepositAccountForModeInTx(tx: Tx, orgId: string, paymentMode: string) {
    const methodRows = await tx
        .select({
            methodId: payment_methods.id
        })
        .from(payment_methods)
        .where(
            and(
                eq(payment_methods.org_id, orgId),
                eq(payment_methods.method_key, paymentMode),
                eq(payment_methods.is_active, true)
            )
        )
        .limit(1);

    const methodId = methodRows[0]?.methodId;
    if (methodId) {
        const mappedRows = await tx
            .select({
                id: payment_accounts.id,
                account_code: payment_accounts.ledger_code,
                account_name: payment_accounts.label
            })
            .from(payment_method_account_map)
            .innerJoin(payment_accounts, eq(payment_method_account_map.payment_account_id, payment_accounts.id))
            .where(
                and(
                    eq(payment_method_account_map.org_id, orgId),
                    eq(payment_method_account_map.payment_method_id, methodId),
                    eq(payment_method_account_map.is_active, true),
                    eq(payment_accounts.org_id, orgId),
                    eq(payment_accounts.is_active, true)
                )
            )
            .orderBy(sql`CASE WHEN ${payment_method_account_map.is_default} THEN 0 ELSE 1 END`, payment_accounts.sort_order);

        if (mappedRows[0]) {
            return mappedRows[0];
        }
    }

    const fallbackCode = paymentMode === 'cash' ? '1000' : '1100';
    const fallbackRows = await tx
        .select({
            id: payment_accounts.id,
            account_code: payment_accounts.ledger_code,
            account_name: payment_accounts.label
        })
        .from(payment_accounts)
        .where(
            and(
                eq(payment_accounts.org_id, orgId),
                eq(payment_accounts.is_active, true),
                eq(payment_accounts.ledger_code, fallbackCode)
            )
        )
        .orderBy(payment_accounts.sort_order, payment_accounts.label)
        .limit(1);

    return fallbackRows[0];
}

export async function findInvoiceForSettlementInTx(
    tx: Tx,
    orgId: string,
    invoiceId: string
): Promise<InvoiceSettlementRow | undefined> {
    return tx.query.invoices.findFirst({
        where: and(eq(invoices.id, invoiceId), eq(invoices.org_id, orgId)),
        columns: {
            id: true,
            customer_id: true,
            total: true,
            amount_paid: true,
            balance_due: true,
            status: true
        }
    });
}

export async function findCustomerInOrgInTx(tx: Tx, orgId: string, customerId: string) {
    return tx.query.customers.findFirst({
        where: and(eq(customers.id, customerId), eq(customers.org_id, orgId))
    });
}

export async function findDepositAccountByIdInTx(tx: Tx, orgId: string, accountId: string) {
    const rows = await tx
        .select({
            id: payment_accounts.id,
            account_code: payment_accounts.ledger_code,
            account_name: payment_accounts.label
        })
        .from(payment_accounts)
        .where(
            and(
                eq(payment_accounts.id, accountId),
                eq(payment_accounts.org_id, orgId),
                eq(payment_accounts.is_active, true)
            )
        )
        .limit(1);

    return rows[0];
}

export async function findPaymentMethodByKeyInTx(tx: Tx, orgId: string, paymentMode: string) {
    const rows = await tx
        .select({
            id: payment_methods.id,
            method_key: payment_methods.method_key,
            label: payment_methods.label
        })
        .from(payment_methods)
        .where(
            and(
                eq(payment_methods.org_id, orgId),
                eq(payment_methods.method_key, paymentMode),
                eq(payment_methods.is_active, true)
            )
        )
        .limit(1);

    return rows[0];
}

export async function isPaymentMethodMappedToAccountInTx(
    tx: Tx,
    orgId: string,
    paymentMethodId: string,
    paymentAccountId: string
) {
    const rows = await tx
        .select({ id: payment_method_account_map.id })
        .from(payment_method_account_map)
        .where(
            and(
                eq(payment_method_account_map.org_id, orgId),
                eq(payment_method_account_map.payment_method_id, paymentMethodId),
                eq(payment_method_account_map.payment_account_id, paymentAccountId),
                eq(payment_method_account_map.is_active, true)
            )
        )
        .limit(1);

    return Boolean(rows[0]);
}

export async function findOpenInvoicesByIdsInTx(
    tx: Tx,
    orgId: string,
    customerId: string,
    invoiceIds: string[]
): Promise<OpenCustomerInvoiceRow[]> {
    if (invoiceIds.length === 0) {
        return [];
    }

    return tx
        .select({
            id: invoices.id,
            total: invoices.total,
            amount_paid: invoices.amount_paid,
            balance_due: invoices.balance_due
        })
        .from(invoices)
        .where(
            and(
                eq(invoices.org_id, orgId),
                eq(invoices.customer_id, customerId),
                inArray(invoices.id, invoiceIds),
                ne(invoices.status, 'paid'),
                ne(invoices.status, 'cancelled'),
                ne(invoices.status, 'draft')
            )
        );
}

export async function setInvoiceSettlementStateInTx(
    tx: Tx,
    invoiceId: string,
    invoiceTotal: number,
    newBalanceDue: number,
    epsilon: number,
    nowIso: string
) {
    const normalizedBalanceDue = round2(Math.max(0, newBalanceDue));
    const normalizedAmountPaid = round2(invoiceTotal - normalizedBalanceDue);
    const newStatus = normalizedBalanceDue <= epsilon ? 'paid' : 'partially_paid';

    await tx
        .update(invoices)
        .set({
            amount_paid: normalizedAmountPaid,
            balance_due: normalizedBalanceDue,
            status: newStatus,
            updated_at: nowIso
        })
        .where(eq(invoices.id, invoiceId));

    return {
        amountPaid: normalizedAmountPaid,
        balanceDue: normalizedBalanceDue,
        status: newStatus as 'paid' | 'partially_paid'
    };
}

export async function decreaseCustomerBalanceInTx(tx: Tx, customerId: string, amount: number, nowIso: string) {
    await tx
        .update(customers)
        .set({
            balance: sql`${customers.balance} - ${amount}`,
            updated_at: nowIso
        })
        .where(eq(customers.id, customerId));
}

export async function listPaymentCustomers(orgId: string) {
    return await db
        .select({
            id: customers.id,
            name: customers.name,
            company_name: customers.company_name,
            balance: customers.balance
        })
        .from(customers)
        .where(eq(customers.org_id, orgId))
        .orderBy(customers.name);
}

export async function listDepositAccounts(orgId: string) {
    return await db
        .select({
            id: payment_accounts.id,
            name: payment_accounts.label,
            code: payment_accounts.ledger_code
        })
        .from(payment_accounts)
        .where(
            and(
                eq(payment_accounts.org_id, orgId),
                eq(payment_accounts.is_active, true)
            )
        )
        .orderBy(payment_accounts.sort_order, payment_accounts.label);
}

/**
 * Business-facing settlement account list:
 * 1) Prefer accounts linked to active payment modes from Settings
 * 2) Fallback to legacy liquidity account filter when no links exist yet
 */
export async function listDepositAccountsForPaymentModes(orgId: string) {
    const linkedRows = await db
        .select({
            id: payment_accounts.id,
            name: payment_accounts.label,
            code: payment_accounts.ledger_code
        })
        .from(payment_method_account_map)
        .innerJoin(payment_methods, eq(payment_method_account_map.payment_method_id, payment_methods.id))
        .innerJoin(payment_accounts, eq(payment_method_account_map.payment_account_id, payment_accounts.id))
        .where(
            and(
                eq(payment_method_account_map.org_id, orgId),
                eq(payment_method_account_map.is_active, true),
                eq(payment_methods.org_id, orgId),
                eq(payment_methods.is_active, true),
                eq(payment_accounts.org_id, orgId),
                eq(payment_accounts.is_active, true)
            )
        )
        .orderBy(payment_accounts.sort_order, payment_accounts.label);

    if (linkedRows.length > 0) {
        const uniqueById = new Map<string, (typeof linkedRows)[number]>();
        for (const row of linkedRows) {
            if (!uniqueById.has(row.id)) {
                uniqueById.set(row.id, row);
            }
        }
        return Array.from(uniqueById.values());
    }

    return listDepositAccounts(orgId);
}

export type PaymentOptionForForm = {
    methodId: string;
    methodKey: string;
    methodLabel: string;
    accountId: string;
    accountLabel: string;
    displayLabel: string;
    ledgerCode: string;
    isDefault: boolean;
};

// In-memory cache for payment options (rarely changes, queried on every form load)
const PAYMENT_OPTIONS_TTL_MS = 2 * 60 * 1000; // 2 minutes
const paymentOptionsCache = new Map<string, { data: PaymentOptionForForm[]; expiresAt: number }>();

/** Call after any payment method/account/mapping mutation to bust the cache for an org. */
export function invalidatePaymentOptionsCache(orgId: string) {
    paymentOptionsCache.delete(orgId);
}

export async function listPaymentOptionsForForm(orgId: string): Promise<PaymentOptionForForm[]> {
    const cached = paymentOptionsCache.get(orgId);
    if (cached && Date.now() < cached.expiresAt) {
        return cached.data;
    }

    const rows = await db
        .select({
            methodId: payment_methods.id,
            methodKey: payment_methods.method_key,
            methodLabel: payment_methods.label,
            methodIsDefault: payment_methods.is_default,
            accountId: payment_accounts.id,
            accountLabel: payment_accounts.label,
            accountKind: payment_accounts.kind,
            ledgerCode: payment_accounts.ledger_code,
            mapIsDefault: payment_method_account_map.is_default
        })
        .from(payment_method_account_map)
        .innerJoin(payment_methods, eq(payment_method_account_map.payment_method_id, payment_methods.id))
        .innerJoin(payment_accounts, eq(payment_method_account_map.payment_account_id, payment_accounts.id))
        .where(
            and(
                eq(payment_method_account_map.org_id, orgId),
                eq(payment_method_account_map.is_active, true),
                eq(payment_methods.org_id, orgId),
                eq(payment_methods.is_active, true),
                eq(payment_accounts.org_id, orgId),
                eq(payment_accounts.is_active, true)
            )
        )
        .orderBy(payment_methods.sort_order, payment_accounts.sort_order);

    if (rows.length === 0) {
        // Fallback: build options from old listActivePaymentModes + listDepositAccountsForPaymentModes
        const [modes, accounts] = await Promise.all([
            listActivePaymentModes(orgId),
            listDepositAccountsForPaymentModes(orgId)
        ]);

        if (modes.length === 0 || accounts.length === 0) {
            paymentOptionsCache.set(orgId, { data: [], expiresAt: Date.now() + PAYMENT_OPTIONS_TTL_MS });
            return [];
        }

        const fallbackResult = modes.map((mode) => {
            const account = (mode.linked_account_id
                ? accounts.find((a) => a.id === mode.linked_account_id)
                : null) || accounts[0];
            return {
                methodId: mode.id,
                methodKey: mode.mode_key,
                methodLabel: mode.label,
                accountId: account.id,
                accountLabel: account.name,
                displayLabel: mode.label,
                ledgerCode: account.code,
                isDefault: mode.is_default || false
            };
        });
        paymentOptionsCache.set(orgId, { data: fallbackResult, expiresAt: Date.now() + PAYMENT_OPTIONS_TTL_MS });
        return fallbackResult;
    }

    const result = rows.map((row) => {
        const accountLabel = row.accountLabel;
        const methodLabel = row.methodLabel;
        const displayLabel =
            accountLabel === methodLabel || row.accountKind === 'cash'
                ? methodLabel
                : `${accountLabel} · ${methodLabel}`;

        return {
            methodId: row.methodId,
            methodKey: row.methodKey,
            methodLabel,
            accountId: row.accountId,
            accountLabel,
            displayLabel,
            ledgerCode: row.ledgerCode,
            isDefault: Boolean(row.methodIsDefault && row.mapIsDefault)
        };
    });
    paymentOptionsCache.set(orgId, { data: result, expiresAt: Date.now() + PAYMENT_OPTIONS_TTL_MS });
    return result;
}

export async function listActivePaymentModes(orgId: string) {
    return await db
        .select({
            id: payment_methods.id,
            mode_key: payment_methods.method_key,
            label: payment_methods.label,
            linked_account_id: payment_accounts.id,
            is_default: payment_methods.is_default
        })
        .from(payment_methods)
        .leftJoin(
            payment_method_account_map,
            and(
                eq(payment_method_account_map.payment_method_id, payment_methods.id),
                eq(payment_method_account_map.org_id, orgId),
                eq(payment_method_account_map.is_default, true),
                eq(payment_method_account_map.is_active, true)
            )
        )
        .leftJoin(
            payment_accounts,
            and(
                eq(payment_accounts.id, payment_method_account_map.payment_account_id),
                eq(payment_accounts.org_id, orgId),
                eq(payment_accounts.is_active, true)
            )
        )
        .where(and(eq(payment_methods.org_id, orgId), eq(payment_methods.is_active, true)))
        .orderBy(payment_methods.sort_order, payment_methods.label);
}

export async function listUnpaidCustomerInvoices(orgId: string, customerId: string) {
    return await db
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
