import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

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

async function runTaxGoldenTests() {
    const gstChunkPath = path.join(projectRoot, '.svelte-kit', 'output', 'server', 'chunks', 'gst.js');
    if (!fs.existsSync(gstChunkPath)) {
        failures.push('Build output not found. Run `npm run build` before `npm run check:phase2`.');
        return;
    }

    const gstMod = await import(pathToFileURL(gstChunkPath).href);
    const calculateLineTax = requireFunction(gstMod, 'calculateLineTax', gstChunkPath);
    const calculateInvoiceTaxTotals = requireFunction(gstMod, 'calculateInvoiceTaxTotals', gstChunkPath);
    const resolvePricesIncludeGst = requireFunction(gstMod, 'resolvePricesIncludeGst', gstChunkPath);

    // Case 1: exclusive + intra-state
    const case1 = calculateLineTax(
        { quantity: 10, rate: 250, gstRate: 18 },
        { isInterState: false, pricesIncludeGst: false }
    );
    assertApprox(case1.taxableAmount, 2500, 0.01, 'Case 1 taxable');
    assertApprox(case1.cgst, 225, 0.01, 'Case 1 CGST');
    assertApprox(case1.sgst, 225, 0.01, 'Case 1 SGST');
    assertApprox(case1.igst, 0, 0.01, 'Case 1 IGST');
    assertApprox(case1.total, 2950, 0.01, 'Case 1 total');

    // Case 2: inclusive + inter-state
    const case2 = calculateLineTax(
        { quantity: 2, rate: 560, gstRate: 12 },
        { isInterState: true, pricesIncludeGst: true }
    );
    assertApprox(case2.amount, 1120, 0.01, 'Case 2 amount');
    assertApprox(case2.taxableAmount, 1000, 0.01, 'Case 2 taxable');
    assertApprox(case2.taxAmount, 120, 0.01, 'Case 2 tax');
    assertApprox(case2.igst, 120, 0.01, 'Case 2 IGST');
    assertApprox(case2.total, 1120, 0.01, 'Case 2 total');

    // Case 3: mixed rates invoice totals
    const case3 = calculateInvoiceTaxTotals(
        [
            { quantity: 1, rate: 1000, gstRate: 18 },
            { quantity: 3, rate: 200, gstRate: 5 },
            { quantity: 2, rate: 150, gstRate: 0 }
        ],
        { isInterState: false, pricesIncludeGst: false }
    );
    assertApprox(case3.subtotal, 1900, 0.01, 'Case 3 subtotal');
    assertApprox(case3.taxableAmount, 1900, 0.01, 'Case 3 taxable');
    assertApprox(case3.cgst, 105, 0.01, 'Case 3 CGST');
    assertApprox(case3.sgst, 105, 0.01, 'Case 3 SGST');
    assertApprox(case3.igst, 0, 0.01, 'Case 3 IGST');
    assertApprox(case3.total, 2110, 0.01, 'Case 3 total');

    // Case 4: discount scenario (discounted rate) remains deterministic
    const nonDiscounted = calculateInvoiceTaxTotals(
        [{ quantity: 5, rate: 100, gstRate: 18 }],
        { isInterState: false, pricesIncludeGst: false }
    );
    const discounted = calculateInvoiceTaxTotals(
        [{ quantity: 5, rate: 90, gstRate: 18 }],
        { isInterState: false, pricesIncludeGst: false }
    );

    assertCondition(
        discounted.total < nonDiscounted.total,
        'Discount scenario should reduce grand total'
    );
    assertApprox(nonDiscounted.total - discounted.total, 59, 0.01, 'Discount scenario total delta');
    assertApprox(nonDiscounted.cgst - discounted.cgst, 4.5, 0.01, 'Discount scenario CGST delta');
    assertApprox(nonDiscounted.sgst - discounted.sgst, 4.5, 0.01, 'Discount scenario SGST delta');

    // Case 5: global/invoice GST mode precedence
    assertCondition(
        resolvePricesIncludeGst(true, false) === true,
        'Invoice GST mode should override org default when explicitly true'
    );
    assertCondition(
        resolvePricesIncludeGst(false, true) === false,
        'Invoice GST mode should override org default when explicitly false'
    );
    assertCondition(
        resolvePricesIncludeGst(undefined, true) === true,
        'Org default should apply when invoice GST mode is missing'
    );
}

async function runStaticAdoptionChecks() {
    const invoicingWorkflow = await readText('src/lib/server/modules/invoicing/application/workflows.ts');
    assertCondition(
        invoicingWorkflow.includes('calculateInvoiceTaxTotals'),
        'Invoicing workflow must use canonical invoice tax calculator'
    );
    assertCondition(
        invoicingWorkflow.includes('resolvePricesIncludeGst'),
        'Invoicing workflow must resolve invoice/global GST mode centrally'
    );

    const invoiceSchema = await readText('src/routes/(app)/invoices/new/schema.ts');
    assertCondition(
        invoiceSchema.includes('calculateInvoiceTaxTotals') && invoiceSchema.includes('calculateLineTax'),
        'Invoice schema helpers must use canonical GST utilities'
    );

    const expenseRoute = await readText('src/routes/(app)/expenses/new/+page.server.ts');
    assertCondition(
        expenseRoute.includes('calculateLineTax('),
        'Expense create flow must use canonical GST calculator'
    );
}

await runTaxGoldenTests();
await runStaticAdoptionChecks();

if (failures.length > 0) {
    console.error('Phase 2 tax consolidation checks failed:\n');
    for (const failure of failures) {
        console.error(`- ${failure}`);
    }
    process.exit(1);
}

console.log('Phase 2 tax consolidation checks passed.');
