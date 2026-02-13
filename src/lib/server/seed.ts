import { db, type Tx } from './db';
import { accounts } from './db/schema';

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

    (tx || db).insert(accounts).values(values);
}
