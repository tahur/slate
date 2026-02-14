import { db, type Tx } from './db';
import { accounts, payment_modes } from './db/schema';
import { eq, and } from 'drizzle-orm';

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

const DEFAULT_PAYMENT_MODES = [
    { mode_key: 'bank', label: 'Bank Transfer', account_code: '1100', is_default: true, sort_order: 1 },
    { mode_key: 'upi', label: 'UPI', account_code: '1100', is_default: false, sort_order: 2 },
    { mode_key: 'cash', label: 'Cash', account_code: '1000', is_default: false, sort_order: 3 },
    { mode_key: 'cheque', label: 'Cheque', account_code: '1100', is_default: false, sort_order: 4 }
];

export function seedChartOfAccounts(orgId: string, tx?: Tx) {
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

    (tx || db).insert(accounts).values(values).run();
}

export function seedPaymentModes(orgId: string, tx?: Tx) {
    const runner = tx || db;

    // Look up account IDs by code
    const orgAccounts = runner
        .select({ id: accounts.id, code: accounts.account_code })
        .from(accounts)
        .where(eq(accounts.org_id, orgId))
        .all();

    const accountByCode = new Map(orgAccounts.map((a) => [a.code, a.id]));

    const values = DEFAULT_PAYMENT_MODES.map((mode) => ({
        id: crypto.randomUUID(),
        org_id: orgId,
        mode_key: mode.mode_key,
        label: mode.label,
        linked_account_id: accountByCode.get(mode.account_code) || null,
        is_default: mode.is_default,
        sort_order: mode.sort_order,
        is_active: true
    }));

    runner.insert(payment_modes).values(values).run();
}

/** Returns true if the org already has payment modes seeded */
export function hasPaymentModes(orgId: string): boolean {
    const row = db
        .select({ id: payment_modes.id })
        .from(payment_modes)
        .where(eq(payment_modes.org_id, orgId))
        .limit(1)
        .get();
    return !!row;
}
