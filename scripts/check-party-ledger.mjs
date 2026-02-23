import fs from 'node:fs/promises';
import path from 'node:path';

async function readText(relPath) {
    const absPath = path.join(process.cwd(), relPath);
    return fs.readFile(absPath, 'utf8');
}

function assertCondition(condition, message, failures) {
    if (!condition) failures.push(message);
}

const failures = [];

const paymentsSchema = await readText('src/lib/server/db/schema/payments.ts');
assertCondition(
    paymentsSchema.includes("reason_snapshot: text('reason_snapshot')"),
    'Payments schema must persist reason_snapshot.',
    failures
);

const expensesSchema = await readText('src/lib/server/db/schema/expenses.ts');
assertCondition(
    expensesSchema.includes("payment_status: text('payment_status').notNull().default('paid')"),
    'Expenses schema must include payment_status default.',
    failures
);
assertCondition(
    expensesSchema.includes("reason_snapshot: text('reason_snapshot')"),
    'Expenses schema must persist reason_snapshot.',
    failures
);
assertCondition(
    expensesSchema.includes("paid_through: text('paid_through')"),
    'Expenses paid_through must allow nullable values for unpaid supplier bills.',
    failures
);

const receivablesWorkflows = await readText('src/lib/server/modules/receivables/application/workflows.ts');
assertCondition(
    /reason_snapshot:\s*buildCustomerReceiptReason\(/.test(receivablesWorkflows),
    'Receivables workflow must persist customer receipt reason_snapshot.',
    failures
);

const expenseRoute = await readText('src/routes/(app)/expenses/new/+page.server.ts');
assertCondition(
    expenseRoute.includes("const payment_status = formData.get('payment_status') === 'unpaid' ? 'unpaid' : 'paid';"),
    'Expense route must parse payment_status from form.',
    failures
);
assertCondition(
    expenseRoute.includes('reason_snapshot: reasonSnapshot'),
    'Expense route must persist reason_snapshot.',
    failures
);
assertCondition(
    expenseRoute.includes('if (isPayableEntry && vendor_id)'),
    'Expense route must update vendor balance for payable entries.',
    failures
);

const ledgerService = await readText('src/lib/server/modules/reporting/application/party-ledger.ts');
assertCondition(
    ledgerService.includes('coalesceReasonSnapshot'),
    'Party ledger service must use persisted reason snapshots with fallback.',
    failures
);
assertCondition(
    ledgerService.includes('paymentStatus: expenses.payment_status'),
    'Supplier ledger must read payment_status for payable math.',
    failures
);

const ledgerRoute = await readText('src/routes/(app)/reports/ledger/+page.server.ts');
assertCondition(
    ledgerRoute.includes('buildPartyLedger'),
    'Ledger route must use shared party-ledger service.',
    failures
);

const ledgerCsvRoute = await readText('src/routes/api/reports/ledger/csv/+server.ts');
assertCondition(
    ledgerCsvRoute.includes('buildPartyLedger'),
    'Ledger CSV route must use shared party-ledger service.',
    failures
);

if (failures.length > 0) {
    console.error('Party ledger checks failed:\n');
    for (const failure of failures) {
        console.error(`- ${failure}`);
    }
    process.exit(1);
}

console.log('Party ledger checks passed.');
