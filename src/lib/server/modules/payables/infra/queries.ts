import { and, eq, gt, inArray, sql } from 'drizzle-orm';
import { db, type Tx } from '$lib/server/db';
import {
    expenses,
    payment_accounts,
    payment_method_account_map,
    payment_methods,
    supplier_credits,
    vendors
} from '$lib/server/db/schema';
import { round2 } from '$lib/utils/currency';

export type OpenSupplierExpenseRow = {
    id: string;
    expense_number: string;
    expense_date: string;
    total: number;
    amount_settled: number;
    balance_due: number;
    description: string | null;
};

// Derive outstanding from source amounts so dues remain correct even if legacy rows
// have stale `balance_due` values.
const AMOUNT_SETTLED_SQL = sql<number>`ROUND(COALESCE(${expenses.amount_settled}, 0)::numeric, 2)`;
const BALANCE_DUE_SQL = sql<number>`GREATEST(
    ROUND((${expenses.total} - COALESCE(${expenses.amount_settled}, 0))::numeric, 2),
    0
)`;

export async function listSupplierOptionsForPayment(orgId: string) {
    return db
        .select({
            id: vendors.id,
            name: vendors.name,
            display_name: vendors.display_name,
            company_name: vendors.company_name,
            balance: vendors.balance
        })
        .from(vendors)
        .where(and(eq(vendors.org_id, orgId), eq(vendors.is_active, true)))
        .orderBy(vendors.name);
}

export async function listOpenSupplierExpenses(orgId: string, vendorId: string): Promise<OpenSupplierExpenseRow[]> {
    const rows = await db
        .select({
            id: expenses.id,
            expense_number: expenses.expense_number,
            expense_date: expenses.expense_date,
            total: expenses.total,
            amount_settled: AMOUNT_SETTLED_SQL,
            balance_due: BALANCE_DUE_SQL,
            description: expenses.description
        })
        .from(expenses)
        .where(
            and(
                eq(expenses.org_id, orgId),
                eq(expenses.vendor_id, vendorId),
                gt(BALANCE_DUE_SQL, 0)
            )
        )
        .orderBy(expenses.expense_date, expenses.created_at);

    return rows.map((row) => ({
        ...row,
        total: round2(row.total || 0),
        amount_settled: round2(row.amount_settled || 0),
        balance_due: round2(row.balance_due || 0)
    }));
}

export async function findVendorInOrgInTx(tx: Tx, orgId: string, vendorId: string) {
    return tx.query.vendors.findFirst({
        where: and(
            eq(vendors.id, vendorId),
            eq(vendors.org_id, orgId),
            eq(vendors.is_active, true)
        )
    });
}

export async function findPaymentAccountByIdInTx(tx: Tx, orgId: string, accountId: string) {
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

export async function findOpenSupplierExpensesByIdsInTx(
    tx: Tx,
    orgId: string,
    vendorId: string,
    expenseIds: string[]
): Promise<OpenSupplierExpenseRow[]> {
    if (expenseIds.length === 0) {
        return [];
    }

    const rows = await tx
        .select({
            id: expenses.id,
            expense_number: expenses.expense_number,
            expense_date: expenses.expense_date,
            total: expenses.total,
            amount_settled: AMOUNT_SETTLED_SQL,
            balance_due: BALANCE_DUE_SQL,
            description: expenses.description
        })
        .from(expenses)
        .where(
            and(
                eq(expenses.org_id, orgId),
                eq(expenses.vendor_id, vendorId),
                gt(BALANCE_DUE_SQL, 0),
                inArray(expenses.id, expenseIds)
            )
        );

    return rows.map((row) => ({
        ...row,
        total: round2(row.total || 0),
        amount_settled: round2(row.amount_settled || 0),
        balance_due: round2(row.balance_due || 0)
    }));
}

export async function listOpenSupplierExpensesInTx(
    tx: Tx,
    orgId: string,
    vendorId: string
): Promise<OpenSupplierExpenseRow[]> {
    const rows = await tx
        .select({
            id: expenses.id,
            expense_number: expenses.expense_number,
            expense_date: expenses.expense_date,
            total: expenses.total,
            amount_settled: AMOUNT_SETTLED_SQL,
            balance_due: BALANCE_DUE_SQL,
            description: expenses.description
        })
        .from(expenses)
        .where(
            and(
                eq(expenses.org_id, orgId),
                eq(expenses.vendor_id, vendorId),
                gt(BALANCE_DUE_SQL, 0)
            )
        )
        .orderBy(expenses.expense_date, expenses.created_at);

    return rows.map((row) => ({
        ...row,
        total: round2(row.total || 0),
        amount_settled: round2(row.amount_settled || 0),
        balance_due: round2(row.balance_due || 0)
    }));
}

export async function getAvailableSupplierCredit(orgId: string, vendorId: string): Promise<number> {
    const rows = await db
        .select({
            total: sql<number>`COALESCE(SUM(${supplier_credits.balance}), 0)`
        })
        .from(supplier_credits)
        .where(
            and(
                eq(supplier_credits.org_id, orgId),
                eq(supplier_credits.vendor_id, vendorId),
                gt(supplier_credits.balance, 0)
            )
        );

    return round2(rows[0]?.total || 0);
}

export async function getAvailableSupplierCreditInTx(tx: Tx, orgId: string, vendorId: string): Promise<number> {
    const rows = await tx
        .select({
            total: sql<number>`COALESCE(SUM(${supplier_credits.balance}), 0)`
        })
        .from(supplier_credits)
        .where(
            and(
                eq(supplier_credits.org_id, orgId),
                eq(supplier_credits.vendor_id, vendorId),
                gt(supplier_credits.balance, 0)
            )
        );

    return round2(rows[0]?.total || 0);
}

export async function consumeSupplierCreditsInTx(
    tx: Tx,
    orgId: string,
    vendorId: string,
    amountToConsume: number
): Promise<number> {
    let remaining = round2(amountToConsume);
    if (remaining <= 0) return 0;

    const creditRows = await tx
        .select({
            id: supplier_credits.id,
            balance: supplier_credits.balance
        })
        .from(supplier_credits)
        .where(
            and(
                eq(supplier_credits.org_id, orgId),
                eq(supplier_credits.vendor_id, vendorId),
                gt(supplier_credits.balance, 0)
            )
        )
        .orderBy(supplier_credits.created_at);

    let consumed = 0;

    for (const row of creditRows) {
        if (remaining <= 0) break;
        const available = round2(row.balance || 0);
        if (available <= 0) continue;

        const used = round2(Math.min(available, remaining));
        const nextBalance = round2(available - used);
        await tx
            .update(supplier_credits)
            .set({ balance: nextBalance })
            .where(eq(supplier_credits.id, row.id));

        consumed = round2(consumed + used);
        remaining = round2(remaining - used);
    }

    return consumed;
}
