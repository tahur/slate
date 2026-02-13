import fs from 'node:fs/promises';
import path from 'node:path';

const projectRoot = process.cwd();
const failures = [];

function assertCondition(condition, message) {
    if (!condition) {
        failures.push(message);
    }
}

async function readText(relPath) {
    return fs.readFile(path.join(projectRoot, relPath), 'utf8');
}

function assertImports(content, relPath, requiredImports) {
    for (const imp of requiredImports) {
        assertCondition(content.includes(imp), `${relPath} must import/use ${imp}`);
    }
}

async function checkRouteOrchestration() {
    const invoiceNew = 'src/routes/(app)/invoices/new/+page.server.ts';
    const invoiceShow = 'src/routes/(app)/invoices/[id]/+page.server.ts';
    const paymentsNew = 'src/routes/(app)/payments/new/+page.server.ts';
    const creditNotesNew = 'src/routes/(app)/credit-notes/new/+page.server.ts';

    const invoiceNewContent = await readText(invoiceNew);
    assertImports(invoiceNewContent, invoiceNew, [
        'createInvoiceInTx',
        'parseInvoiceLineItemsFromFormData',
        'parsePricesIncludeGst',
        'runInTx('
    ]);
    assertCondition(!invoiceNewContent.includes('postInvoiceIssuance('), `${invoiceNew} must not call posting engine directly`);

    const invoiceShowContent = await readText(invoiceShow);
    assertImports(invoiceShowContent, invoiceShow, [
        'issueDraftInvoiceInTx',
        'cancelInvoiceInTx',
        'updateDraftInvoiceInTx',
        'recordInvoicePaymentInTx',
        'applyCreditsToInvoiceInTx',
        'settleInvoiceInTx',
        'runInTx('
    ]);
    assertCondition(!invoiceShowContent.includes('postInvoiceIssuance('), `${invoiceShow} must not call posting engine directly`);
    assertCondition(!invoiceShowContent.includes('reverse('), `${invoiceShow} must not call ledger reversal directly from route`);

    const paymentsNewContent = await readText(paymentsNew);
    assertImports(paymentsNewContent, paymentsNew, [
        'createCustomerPaymentInTx',
        'parsePaymentAllocationsFromFormData',
        'runInTx('
    ]);
    assertCondition(!paymentsNewContent.includes('postPaymentReceipt('), `${paymentsNew} must not call posting engine directly`);

    const creditNotesNewContent = await readText(creditNotesNew);
    assertImports(creditNotesNewContent, creditNotesNew, [
        'createCreditNoteInTx',
        'runInTx('
    ]);
    assertCondition(!creditNotesNewContent.includes('postCreditNote('), `${creditNotesNew} must not call posting engine directly`);
}

async function checkModuleBoundaries() {
    const requiredFiles = [
        'src/lib/server/modules/invoicing/application/workflows.ts',
        'src/lib/server/modules/invoicing/infra/queries.ts',
        'src/lib/server/modules/receivables/application/workflows.ts',
        'src/lib/server/modules/receivables/infra/queries.ts',
        'src/lib/server/modules/reporting/application/gst-reports.ts',
        'src/lib/server/modules/reporting/infra/gst-queries.ts'
    ];

    for (const relPath of requiredFiles) {
        const content = await readText(relPath);
        assertCondition(content.length > 0, `${relPath} must exist and be non-empty`);
    }

    const invoicingWorkflow = await readText('src/lib/server/modules/invoicing/application/workflows.ts');
    assertCondition(
        invoicingWorkflow.includes("from '../infra/queries'"),
        'Invoicing workflow must consume module infra query helpers'
    );

    const receivablesWorkflow = await readText('src/lib/server/modules/receivables/application/workflows.ts');
    assertCondition(
        receivablesWorkflow.includes("from '../infra/queries'"),
        'Receivables workflow must consume module infra query helpers'
    );
}

await checkRouteOrchestration();
await checkModuleBoundaries();

if (failures.length > 0) {
    console.error('Phase 3 domain extraction checks failed:\n');
    for (const failure of failures) {
        console.error(`- ${failure}`);
    }
    process.exit(1);
}

console.log('Phase 3 domain extraction checks passed.');
