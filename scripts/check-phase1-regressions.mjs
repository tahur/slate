import fs from 'node:fs/promises';
import path from 'node:path';

async function readText(relPath) {
    const absPath = path.join(process.cwd(), relPath);
    return fs.readFile(absPath, 'utf8');
}

async function walk(dirPath) {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
            files.push(...(await walk(fullPath)));
            continue;
        }
        files.push(fullPath);
    }

    return files;
}

const failures = [];

function assertCondition(condition, message) {
    if (!condition) {
        failures.push(message);
    }
}

const invoiceShowPath = 'src/routes/(app)/invoices/[id]/+page.server.ts';
const invoiceWorkflowsPath = 'src/lib/server/modules/invoicing/application/workflows.ts';
const receivablesWorkflowsPath = 'src/lib/server/modules/receivables/application/workflows.ts';
const paymentsNewPath = 'src/routes/(app)/payments/new/+page.server.ts';
const forgotPath = 'src/routes/forgot-password/+page.server.ts';
const resetPath = 'src/routes/reset-password/+page.server.ts';

const invoiceShow = await readText(invoiceShowPath);
const invoiceWorkflows = await readText(invoiceWorkflowsPath);
const receivablesWorkflows = await readText(receivablesWorkflowsPath);
const paymentsNew = await readText(paymentsNewPath);
const forgot = await readText(forgotPath);
const reset = await readText(resetPath);

const routeCancelsViaWorkflow = /cancel:\s*async[\s\S]*?cancelInvoiceInTx\(/.test(invoiceShow);
const routeCancelsViaReverse = /cancel:\s*async[\s\S]*?reverse\(orgId,\s*invoice\.journal_entry_id/.test(invoiceShow);
const workflowCancelsViaReverse = /export function cancelInvoiceInTx[\s\S]*?reverse\(orgId,\s*invoice\.journal_entry_id/.test(invoiceWorkflows);

assertCondition(
    routeCancelsViaReverse || (routeCancelsViaWorkflow && workflowCancelsViaReverse),
    'Invoice cancel flow must reverse journal entries instead of mutating ledger state.'
);

assertCondition(
    /totalAllocated\s*>\s*amount\s*\+\s*MONEY_EPSILON/.test(paymentsNew)
        || /totalAllocated\s*>\s*input\.amount\s*\+\s*MONEY_EPSILON/.test(receivablesWorkflows),
    'Payment flow must block total allocations above payment amount.'
);

assertCondition(
    /allocation\.amount\s*>\s*invoice\.balance_due\s*\+\s*MONEY_EPSILON/.test(paymentsNew)
        || /allocation\.amount\s*>\s*invoice\.balance_due\s*\+\s*MONEY_EPSILON/.test(receivablesWorkflows),
    'Payment flow must block allocation amounts above current invoice balance.'
);

assertCondition(
    /requested\.amount\s*>\s*available\s*\+\s*MONEY_EPSILON/.test(invoiceShow)
        || /requested\.amount\s*>\s*available\s*\+\s*MONEY_EPSILON/.test(receivablesWorkflows),
    'Credit application must validate requested amount against DB-available credit/advance balance.'
);

assertCondition(
    /auth\.api\.requestPasswordReset/.test(forgot),
    'Forgot password flow must use auth.api.requestPasswordReset.'
);

assertCondition(
    /auth\.api\.resetPassword/.test(reset),
    'Reset password flow must use auth.api.resetPassword.'
);

const idempotencySchemaChecks = [
    ['src/lib/server/db/schema/invoices.ts', /idx_invoices_org_idempotency/],
    ['src/lib/server/db/schema/payments.ts', /idx_payments_org_idempotency/],
    ['src/lib/server/db/schema/expenses.ts', /idx_expenses_org_idempotency/],
    ['src/lib/server/db/schema/credit_notes.ts', /idx_credit_notes_org_idempotency/]
];

for (const [filePath, regex] of idempotencySchemaChecks) {
    const fileContent = await readText(filePath);
    assertCondition(
        regex.test(fileContent),
        `Missing idempotency unique index declaration in ${filePath}.`
    );
}

const migration = await readText('migrations/0002_majestic_weapon_omega.sql');
for (const indexName of [
    'idx_invoices_org_idempotency',
    'idx_payments_org_idempotency',
    'idx_expenses_org_idempotency',
    'idx_credit_notes_org_idempotency'
]) {
    assertCondition(
        migration.includes(`CREATE UNIQUE INDEX IF NOT EXISTS \`${indexName}\``),
        `Missing idempotency unique index migration for ${indexName}.`
    );
}

const routeFiles = (await walk(path.join(process.cwd(), 'src/routes'))).filter(
    (filePath) => filePath.endsWith('+server.ts') || filePath.endsWith('+page.server.ts')
);

for (const absPath of routeFiles) {
    const relPath = path.relative(process.cwd(), absPath);
    const content = await fs.readFile(absPath, 'utf8');

    const lowerPath = relPath.toLowerCase();
    if (lowerPath.includes('/debug/') || lowerPath.includes('/test-db/')) {
        failures.push(`Potential debug route present: ${relPath}`);
    }

    if (/error\.stack/.test(content)) {
        failures.push(`Sensitive stack leakage pattern found in ${relPath}`);
    }

    if (/fail\(\s*500\s*,\s*\{\s*error:\s*(?:error|e)\s+instanceof\s+Error\s*\?\s*(?:error|e)\.message/.test(content)) {
        failures.push(`Raw error.message returned to client in ${relPath}`);
    }

    if (/new Response\(\s*(?:error|e)\.message/.test(content)) {
        failures.push(`Raw error.message response found in ${relPath}`);
    }
}

if (failures.length > 0) {
    console.error('Phase 1 regression checks failed:\n');
    for (const failure of failures) {
        console.error(`- ${failure}`);
    }
    process.exit(1);
}

console.log('Phase 1 regression checks passed.');
