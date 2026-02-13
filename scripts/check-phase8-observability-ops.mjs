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

async function readText(relPath) {
    return fs.readFile(path.join(projectRoot, relPath), 'utf8');
}

function runCommand(command, args) {
    return spawnSync(command, args, {
        cwd: projectRoot,
        encoding: 'utf8'
    });
}

async function runStaticChecks() {
    const hooks = await readText('src/hooks.server.ts');
    assertCondition(hooks.includes('runWithRequestContext'), 'hooks.server.ts must wrap requests in runWithRequestContext');
    assertCondition(hooks.includes("response.headers.set('x-request-id'"), 'hooks.server.ts must set x-request-id header');
    assertCondition(hooks.includes("logger.info('request_started'"), 'hooks.server.ts must log request_started');
    assertCondition(hooks.includes("logger.info('request_completed'"), 'hooks.server.ts must log request_completed');

    const appTypes = await readText('src/app.d.ts');
    assertCondition(appTypes.includes('requestId: string;'), 'src/app.d.ts must include App.Locals.requestId');

    const dbIndex = await readText('src/lib/server/db/index.ts');
    assertCondition(dbIndex.includes('runStartupChecks'), 'src/lib/server/db/index.ts must define startup checks');
    assertCondition(dbIndex.includes('getStartupCheckSnapshot'), 'src/lib/server/db/index.ts must export startup snapshot');

    const health = await readText('src/routes/api/health/+server.ts');
    assertCondition(health.includes('getStartupCheckSnapshot'), 'health endpoint must include startup check snapshot');
    assertCondition(health.includes("SELECT 1 as ok"), 'health endpoint must ping DB');
    assertCondition(health.includes("status: healthy ? 'ok' : 'degraded'"), 'health endpoint must expose health status');

    const postingEngine = await readText('src/lib/server/services/posting-engine.ts');
    assertCondition(postingEngine.includes("logDomainEvent('ledger.entry.posted'"), 'posting-engine must emit ledger.entry.posted domain event');
    assertCondition(postingEngine.includes("logDomainEvent('ledger.entry.reversed'"), 'posting-engine must emit ledger.entry.reversed domain event');

    const invoicingWorkflow = await readText('src/lib/server/modules/invoicing/application/workflows.ts');
    assertCondition(invoicingWorkflow.includes('invoicing.invoice'), 'invoicing workflows must emit invoice domain events');

    const receivablesWorkflow = await readText('src/lib/server/modules/receivables/application/workflows.ts');
    assertCondition(receivablesWorkflow.includes('receivables.'), 'receivables workflows must emit receivables domain events');

    const runbook = await readText('docs/ops/backup-restore-runbook.md');
    assertCondition(runbook.toLowerCase().includes('restore drill'), 'backup runbook must include restore drill process');

    const phaseDoc = await readText('docs/refactor/phase8-observability-ops.md');
    assertCondition(phaseDoc.includes('check:phase8'), 'phase8 doc must document completion gate command');
}

function runRestoreDrill() {
    const result = runCommand('node', ['scripts/verify-backup-restore.mjs']);
    if (result.status !== 0) {
        failures.push(`Backup/restore drill failed.\nSTDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`);
    }
}

await runStaticChecks();
runRestoreDrill();

if (failures.length > 0) {
    console.error('Phase 8 observability/ops checks failed:\n');
    for (const failure of failures) {
        console.error(`- ${failure}`);
    }
    process.exit(1);
}

console.log('Phase 8 observability/ops checks passed.');
