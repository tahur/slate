import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

const projectRoot = process.cwd();
const failures = [];

function assertCondition(condition, message) {
    if (!condition) {
        failures.push(message);
    }
}

function assertApprox(actual, expected, tolerance, label) {
    if (Math.abs(actual - expected) > tolerance) {
        failures.push(`${label}: expected ${expected}, got ${actual}`);
    }
}

async function readText(relPath) {
    return fsp.readFile(path.join(projectRoot, relPath), 'utf8');
}

function findExportedFunction(mod, fnName) {
    return Object.values(mod).find((value) => typeof value === 'function' && value.name === fnName);
}

function requireFunction(mod, fnName, modulePath) {
    const fn = findExportedFunction(mod, fnName);
    if (!fn) {
        throw new Error(`Function "${fnName}" not found in ${modulePath}`);
    }
    return fn;
}

function runCommand(command, args) {
    return spawnSync(command, args, {
        cwd: projectRoot,
        encoding: 'utf8'
    });
}

async function runTaxRuntimeTests() {
    const gstChunkPath = path.join(projectRoot, '.svelte-kit', 'output', 'server', 'chunks', 'gst.js');
    if (!fs.existsSync(gstChunkPath)) {
        failures.push('Build output not found. Run `npm run build` before `npm run check:phase7`.');
        return;
    }

    const gstMod = await import(pathToFileURL(gstChunkPath).href);
    const calculateLineTax = requireFunction(gstMod, 'calculateLineTax', gstChunkPath);
    const calculateInvoiceTaxTotals = requireFunction(gstMod, 'calculateInvoiceTaxTotals', gstChunkPath);
    const resolvePricesIncludeGst = requireFunction(gstMod, 'resolvePricesIncludeGst', gstChunkPath);

    // Unit test 1: exclusive intrastate line
    const exclusiveIntra = calculateLineTax(
        { quantity: 2, rate: 500, gstRate: 18 },
        { isInterState: false, pricesIncludeGst: false }
    );
    assertApprox(exclusiveIntra.amount, 1000, 0.01, 'Exclusive intra amount');
    assertApprox(exclusiveIntra.taxableAmount, 1000, 0.01, 'Exclusive intra taxable amount');
    assertApprox(exclusiveIntra.taxAmount, 180, 0.01, 'Exclusive intra tax amount');
    assertApprox(exclusiveIntra.cgst, 90, 0.01, 'Exclusive intra CGST');
    assertApprox(exclusiveIntra.sgst, 90, 0.01, 'Exclusive intra SGST');
    assertApprox(exclusiveIntra.igst, 0, 0.01, 'Exclusive intra IGST');
    assertApprox(exclusiveIntra.total, 1180, 0.01, 'Exclusive intra total');

    // Unit test 2: inclusive intrastate line
    const inclusiveIntra = calculateLineTax(
        { quantity: 1, rate: 118, gstRate: 18 },
        { isInterState: false, pricesIncludeGst: true }
    );
    assertApprox(inclusiveIntra.amount, 118, 0.01, 'Inclusive intra amount');
    assertApprox(inclusiveIntra.taxableAmount, 100, 0.01, 'Inclusive intra taxable amount');
    assertApprox(inclusiveIntra.taxAmount, 18, 0.01, 'Inclusive intra tax amount');
    assertApprox(inclusiveIntra.cgst, 9, 0.01, 'Inclusive intra CGST');
    assertApprox(inclusiveIntra.sgst, 9, 0.01, 'Inclusive intra SGST');
    assertApprox(inclusiveIntra.total, 118, 0.01, 'Inclusive intra total');

    // Unit test 3: exclusive interstate line
    const exclusiveInter = calculateLineTax(
        { quantity: 3, rate: 250, gstRate: 12 },
        { isInterState: true, pricesIncludeGst: false }
    );
    assertApprox(exclusiveInter.amount, 750, 0.01, 'Exclusive inter amount');
    assertApprox(exclusiveInter.taxAmount, 90, 0.01, 'Exclusive inter tax');
    assertApprox(exclusiveInter.cgst, 0, 0.01, 'Exclusive inter CGST');
    assertApprox(exclusiveInter.sgst, 0, 0.01, 'Exclusive inter SGST');
    assertApprox(exclusiveInter.igst, 90, 0.01, 'Exclusive inter IGST');
    assertApprox(exclusiveInter.total, 840, 0.01, 'Exclusive inter total');

    // Unit test 4: invoice totals
    const totals = calculateInvoiceTaxTotals(
        [
            { quantity: 2, rate: 100, gstRate: 18 },
            { quantity: 1, rate: 50, gstRate: 5 }
        ],
        { isInterState: false, pricesIncludeGst: false }
    );

    assertApprox(totals.subtotal, 250, 0.01, 'Invoice subtotal');
    assertApprox(totals.taxableAmount, 250, 0.01, 'Invoice taxable total');
    assertApprox(totals.cgst, 19.25, 0.01, 'Invoice CGST total');
    assertApprox(totals.sgst, 19.25, 0.01, 'Invoice SGST total');
    assertApprox(totals.igst, 0, 0.01, 'Invoice IGST total');
    assertApprox(totals.total, 288.5, 0.01, 'Invoice grand total');

    // Unit test 5: GST mode fallback rules
    assertCondition(
        resolvePricesIncludeGst(undefined, true) === true,
        'resolvePricesIncludeGst should fallback to org default when invoice setting is absent'
    );
    assertCondition(
        resolvePricesIncludeGst(false, true) === false,
        'resolvePricesIncludeGst should prefer explicit invoice-level setting'
    );
}

async function runInvariantAndScenarioChecks() {
    const invariants = await readText('src/lib/server/accounting/invariants.ts');
    assertCondition(
        /export function validateNewEntry[\s\S]*assertMinimumLines\(lines\);[\s\S]*assertValidLines\(lines\);[\s\S]*assertBalanced\(lines\);/.test(
            invariants
        ),
        'validateNewEntry must enforce minimum-lines + valid-lines + balanced invariants'
    );

    const postingEngine = await readText('src/lib/server/services/posting-engine.ts');
    assertCondition(
        /validateNewEntry\(lineData\);/.test(postingEngine),
        'posting-engine must validate invariants before posting journal lines'
    );

    const invoicingWorkflow = await readText('src/lib/server/modules/invoicing/application/workflows.ts');
    assertCondition(
        /cancelInvoiceInTx[\s\S]*reverse\(/.test(invoicingWorkflow),
        'invoice cancel workflow must use ledger reversal path'
    );
    assertCondition(
        /calculateInvoiceTaxTotals/.test(invoicingWorkflow),
        'invoice workflow must use centralized GST tax totals helper'
    );

    const receivablesWorkflow = await readText('src/lib/server/modules/receivables/application/workflows.ts');
    assertCondition(
        /totalAllocated\s*>\s*input\.amount\s*\+\s*MONEY_EPSILON/.test(receivablesWorkflow),
        'receivables workflow must cap allocations to payment amount'
    );
    assertCondition(
        /allocation\.amount\s*>\s*invoice\.balance_due\s*\+\s*MONEY_EPSILON/.test(receivablesWorkflow),
        'receivables workflow must cap per-invoice allocation to invoice balance'
    );
    assertCondition(
        /requested\.amount\s*>\s*available\s*\+\s*MONEY_EPSILON/.test(receivablesWorkflow),
        'receivables workflow must validate credit/advance availability from DB state'
    );

    const idempotencyCreateRoutes = [
        'src/routes/(app)/invoices/new/+page.server.ts',
        'src/routes/(app)/payments/new/+page.server.ts',
        'src/routes/(app)/expenses/new/+page.server.ts',
        'src/routes/(app)/credit-notes/new/+page.server.ts'
    ];

    for (const relPath of idempotencyCreateRoutes) {
        const content = await readText(relPath);
        assertCondition(
            content.includes('checkIdempotency<') || content.includes('checkIdempotency('),
            `${relPath} must check idempotency before write`
        );
        assertCondition(
            content.includes('isIdempotencyConstraintError'),
            `${relPath} must recover from idempotency unique-constraint races`
        );
    }

    const reportApis = [
        'src/routes/api/reports/gstr1/csv/+server.ts',
        'src/routes/api/reports/gstr1/json/+server.ts',
        'src/routes/api/reports/gstr1/pdf/+server.ts',
        'src/routes/api/reports/gstr3b/csv/+server.ts',
        'src/routes/api/reports/gstr3b/json/+server.ts',
        'src/routes/api/reports/gstr3b/pdf/+server.ts'
    ];

    for (const relPath of reportApis) {
        const content = await readText(relPath);
        assertCondition(
            content.includes('parseDateRangeQueryFromUrl('),
            `${relPath} must use strict report date-range parser`
        );
        assertCondition(
            content.includes('jsonFromError('),
            `${relPath} must return structured API errors via jsonFromError`
        );
    }
}

function runIntegrityCheck() {
    const result = runCommand('node', ['scripts/check-integrity.mjs']);
    if (result.status !== 0) {
        failures.push(
            `Integrity check failed in phase 7 suite.\nSTDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`
        );
    }
}

await runTaxRuntimeTests();
await runInvariantAndScenarioChecks();
runIntegrityCheck();

if (failures.length > 0) {
    console.error('Phase 7 critical test suite failed:\n');
    for (const failure of failures) {
        console.error(`- ${failure}`);
    }
    process.exit(1);
}

console.log('Phase 7 critical test suite passed.');
