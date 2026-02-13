import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const projectRoot = process.cwd();
const failures = [];

function assertCondition(condition, message) {
    if (!condition) {
        failures.push(message);
    }
}

function runCommand(command, args) {
    return spawnSync(command, args, {
        cwd: projectRoot,
        encoding: 'utf8'
    });
}

async function readText(relPath) {
    return fs.readFile(path.join(projectRoot, relPath), 'utf8');
}

function runGuardrails() {
    const txGuard = runCommand('node', ['scripts/check-sync-transactions.mjs']);
    if (txGuard.status !== 0) {
        failures.push(`Sync transaction guard failed.\nSTDOUT:\n${txGuard.stdout}\nSTDERR:\n${txGuard.stderr}`);
    }

    const integrityGuard = runCommand('node', ['scripts/check-integrity.mjs']);
    if (integrityGuard.status !== 0) {
        failures.push(`Integrity guard failed.\nSTDOUT:\n${integrityGuard.stdout}\nSTDERR:\n${integrityGuard.stderr}`);
    }
}

async function runStaticChecks() {
    const txWrapper = await readText('src/lib/server/platform/db/tx.ts');
    assertCondition(
        txWrapper.includes('assertSyncTxResult') && txWrapper.includes('Transaction callback must be synchronous'),
        'Transaction wrapper must enforce sync callback policy'
    );

    const postingEngine = await readText('src/lib/server/services/posting-engine.ts');
    assertCondition(
        postingEngine.includes('runInExistingOrNewTx'),
        'Posting engine must run under shared transaction boundary helper'
    );

    const criticalWriteRoutes = [
        'src/routes/(app)/invoices/new/+page.server.ts',
        'src/routes/(app)/invoices/[id]/+page.server.ts',
        'src/routes/(app)/payments/new/+page.server.ts',
        'src/routes/(app)/credit-notes/new/+page.server.ts',
        'src/routes/(app)/expenses/new/+page.server.ts'
    ];

    for (const relPath of criticalWriteRoutes) {
        const content = await readText(relPath);
        assertCondition(content.includes('runInTx('), `${relPath} must use runInTx transaction wrapper`);
    }
}

runGuardrails();
await runStaticChecks();

if (failures.length > 0) {
    console.error('Phase 4 transaction model checks failed:\n');
    for (const failure of failures) {
        console.error(`- ${failure}`);
    }
    process.exit(1);
}

console.log('Phase 4 transaction model checks passed.');
