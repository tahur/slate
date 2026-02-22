import { db, type Tx } from './db';
import { accounts, payment_accounts, payment_method_account_map, payment_methods } from './db/schema';
import { eq } from 'drizzle-orm';

export const INDIAN_COA_TEMPLATE = [
    // Assets
    { code: '1000', name: 'Cash', type: 'asset', is_system: true },
    { code: '1100', name: 'Bank Accounts', type: 'asset', is_system: true },
    { code: '1200', name: 'Accounts Receivable', type: 'asset', is_system: true },
    { code: '1300', name: 'Input CGST', type: 'asset', is_system: true },
    { code: '1301', name: 'Input SGST', type: 'asset', is_system: true },
    { code: '1302', name: 'Input IGST', type: 'asset', is_system: true },

    // Liabilities
    { code: '2000', name: 'Accounts Payable', type: 'liability', is_system: true },
    { code: '2100', name: 'Output CGST', type: 'liability', is_system: true },
    { code: '2101', name: 'Output SGST', type: 'liability', is_system: true },
    { code: '2102', name: 'Output IGST', type: 'liability', is_system: true },

    // Equity
    { code: '3000', name: 'Capital Account', type: 'equity', is_system: true },
    { code: '3100', name: 'Opening Balance Equity', type: 'equity', is_system: true },

    // Income
    { code: '4000', name: 'Sales Revenue', type: 'income', is_system: true },
    { code: '4100', name: 'Other Income', type: 'income', is_system: true },

    // Expenses
    { code: '5000', name: 'Cost of Goods Sold', type: 'expense', is_system: true },
    { code: '6000', name: 'Operating Expenses', type: 'expense', is_system: true },
    { code: '6100', name: 'Rent', type: 'expense', is_system: true },
    { code: '6200', name: 'Utilities', type: 'expense', is_system: true },
    { code: '6300', name: 'Salaries', type: 'expense', is_system: true },
    { code: '6400', name: 'Office Supplies', type: 'expense', is_system: true },
    { code: '6500', name: 'Transportation', type: 'expense', is_system: true },
    { code: '6600', name: 'Professional Fees', type: 'expense', is_system: true },
    { code: '6900', name: 'Miscellaneous', type: 'expense', is_system: true }
];

const DEFAULT_PAYMENT_ACCOUNTS = [
    {
        key: 'primary-bank',
        label: 'Primary Bank',
        kind: 'bank',
        ledger_code: '1100',
        is_default_receive: true,
        is_default_pay: true,
        sort_order: 1
    },
    {
        key: 'cash',
        label: 'Cash',
        kind: 'cash',
        ledger_code: '1000',
        is_default_receive: false,
        is_default_pay: false,
        sort_order: 2
    }
];

const DEFAULT_PAYMENT_METHODS = [
    { method_key: 'netbanking', label: 'Net Banking', is_default: true, sort_order: 1, account_key: 'primary-bank' },
    { method_key: 'upi', label: 'UPI', is_default: false, sort_order: 2, account_key: 'primary-bank' },
    { method_key: 'cheque', label: 'Cheque', is_default: false, sort_order: 3, account_key: 'primary-bank' },
    { method_key: 'card', label: 'Card', is_default: false, sort_order: 4, account_key: 'primary-bank' },
    { method_key: 'cash', label: 'Cash', is_default: false, sort_order: 5, account_key: 'cash' }
];

export async function seedChartOfAccounts(orgId: string, tx?: Tx) {
    const values = INDIAN_COA_TEMPLATE.map((acc) => ({
        id: crypto.randomUUID(),
        org_id: orgId,
        account_code: acc.code,
        account_name: acc.name,
        account_type: acc.type,
        is_system: acc.is_system,
        is_active: true,
        balance: 0
    }));

    await (tx || db).insert(accounts).values(values);
}

export async function seedPaymentConfiguration(orgId: string, tx?: Tx) {
    const runner = tx || db;

    const accountIdByKey = new Map<string, string>();
    for (const account of DEFAULT_PAYMENT_ACCOUNTS) {
        const value = {
            id: crypto.randomUUID(),
            org_id: orgId,
            label: account.label,
            kind: account.kind,
            ledger_code: account.ledger_code,
            is_active: true,
            is_default_receive: account.is_default_receive,
            is_default_pay: account.is_default_pay,
            sort_order: account.sort_order
        };
        await runner.insert(payment_accounts).values([value]);
        accountIdByKey.set(account.key, value.id);
    }

    for (const method of DEFAULT_PAYMENT_METHODS) {
        const methodId = crypto.randomUUID();
        await runner.insert(payment_methods).values({
            id: methodId,
            org_id: orgId,
            method_key: method.method_key,
            label: method.label,
            direction: 'both',
            is_default: method.is_default,
            is_active: true,
            sort_order: method.sort_order
        });

        const accountId = accountIdByKey.get(method.account_key);
        if (accountId) {
            await runner.insert(payment_method_account_map).values({
                id: crypto.randomUUID(),
                org_id: orgId,
                payment_method_id: methodId,
                payment_account_id: accountId,
                is_default: true,
                is_active: true
            });
        }
    }

    orgsWithPaymentConfig.add(orgId);
}

/** In-memory set of orgs known to have payment config (avoids repeated DB checks) */
const orgsWithPaymentConfig = new Set<string>();

/** Returns true if the org already has payment config seeded */
export async function hasPaymentConfiguration(orgId: string): Promise<boolean> {
    if (orgsWithPaymentConfig.has(orgId)) return true;
    const rows = await db
        .select({ id: payment_methods.id })
        .from(payment_methods)
        .where(eq(payment_methods.org_id, orgId))
        .limit(1);
    if (rows[0]) {
        orgsWithPaymentConfig.add(orgId);
        return true;
    }
    return false;
}

