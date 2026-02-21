import fsp from 'node:fs/promises';
import path from 'node:path';
import postgres from 'postgres';

const projectRoot = process.cwd();
const failures = [];

function assertCondition(condition, message) {
    if (!condition) {
        failures.push(message);
    }
}

async function readText(relPath) {
    return fsp.readFile(path.join(projectRoot, relPath), 'utf8');
}

function percentile(values, p) {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
}

async function queryP95(sqlClient, query, params, runs = 20) {
    const samples = [];

    for (let i = 0; i < runs; i++) {
        const started = process.hrtime.bigint();
        await sqlClient.unsafe(query, params);
        const elapsedMs = Number(process.hrtime.bigint() - started) / 1_000_000;
        samples.push(elapsedMs);
    }

    return percentile(samples, 95);
}

async function explainDetail(sqlClient, query, params) {
    const planRows = await sqlClient.unsafe(`EXPLAIN ${query}`, params);
    return planRows
        .map((row) => String(row['QUERY PLAN'] ?? Object.values(row)[0] ?? ''))
        .join(' | ');
}

async function runStaticChecks() {
    const gstReports = await readText('src/lib/server/modules/reporting/application/gst-reports.ts');
    assertCondition(gstReports.includes('getCachedReport'), 'GST reports must read from report cache');
    assertCondition(gstReports.includes('setCachedReport'), 'GST reports must write to report cache');
    assertCondition(gstReports.includes('invalidateReportingCacheForOrg'), 'GST reports must export cache invalidation helper');

    const invalidationRoutes = [
        'src/routes/(app)/invoices/new/+page.server.ts',
        'src/routes/(app)/invoices/[id]/+page.server.ts',
        'src/routes/(app)/credit-notes/new/+page.server.ts',
        'src/routes/(app)/expenses/new/+page.server.ts'
    ];

    for (const relPath of invalidationRoutes) {
        const content = await readText(relPath);
        assertCondition(
            content.includes('invalidateReportingCacheForOrg'),
            `${relPath} must invalidate reporting cache after write operations`
        );
    }

    const phaseDoc = await readText('docs/refactor/phase9-performance-scale.md');
    assertCondition(phaseDoc.toLowerCase().includes('p95'), 'phase9 doc must define p95 targets');
    assertCondition(phaseDoc.includes('check:phase9'), 'phase9 doc must document completion gate command');
}

async function runPerformanceChecks() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        console.log('Phase 9 SQL performance checks skipped: DATABASE_URL is not configured');
        return;
    }

    const sqlClient = postgres(databaseUrl, {
        ssl: 'require',
        max: 1,
        idle_timeout: 10,
        connect_timeout: 10,
        prepare: false
    });

    try {
        const orgRow = (await sqlClient`SELECT id FROM organizations LIMIT 1`)[0];
        const customerRow = (await sqlClient`SELECT id FROM customers LIMIT 1`)[0];

        if (!orgRow?.id) {
            console.log('Phase 9 SQL performance checks skipped: no organizations found');
            return;
        }

        const orgId = orgRow.id;
        const customerId = customerRow?.id;

        /** @type {Array<{name:string, sql:string, params:unknown[], maxP95Ms:number, requiresIndexText:string[]}>} */
        const specs = [
            {
                name: 'invoices_list',
                sql: `
                    SELECT id, invoice_number, total
                    FROM invoices
                    WHERE org_id = $1 AND status IN ('issued', 'partially_paid', 'paid')
                    ORDER BY invoice_date DESC
                    LIMIT 50
                `,
                params: [orgId],
                maxP95Ms: 80,
                requiresIndexText: ['Index Scan', 'Index Only Scan', 'Bitmap Index Scan']
            },
            {
                name: 'audit_recent',
                sql: `
                    SELECT id, entity_type, action
                    FROM audit_log
                    WHERE org_id = $1
                    ORDER BY created_at DESC
                    LIMIT 100
                `,
                params: [orgId],
                maxP95Ms: 90,
                requiresIndexText: ['Index Scan', 'Index Only Scan', 'Bitmap Index Scan']
            },
            {
                name: 'journals_recent',
                sql: `
                    SELECT id, entry_number
                    FROM journal_entries
                    WHERE org_id = $1
                    ORDER BY entry_date DESC
                    LIMIT 100
                `,
                params: [orgId],
                maxP95Ms: 90,
                requiresIndexText: ['Index Scan', 'Index Only Scan', 'Bitmap Index Scan']
            }
        ];

        if (customerId) {
            specs.push({
                name: 'payments_by_customer',
                sql: `
                    SELECT id, payment_number, amount
                    FROM payments
                    WHERE org_id = $1 AND customer_id = $2
                    ORDER BY payment_date DESC
                    LIMIT 50
                `,
                params: [orgId, customerId],
                maxP95Ms: 70,
                requiresIndexText: ['Index Scan', 'Index Only Scan', 'Bitmap Index Scan']
            });
        } else {
            console.log('Phase 9 note: skipping payments_by_customer benchmark (no customers found)');
        }

        for (const spec of specs) {
            const detail = await explainDetail(sqlClient, spec.sql, spec.params);
            const hasIndexUsage = spec.requiresIndexText.some((needle) => detail.includes(needle));
            assertCondition(hasIndexUsage, `${spec.name} query plan must use an index. Plan: ${detail}`);

            const p95 = await queryP95(sqlClient, spec.sql, spec.params);
            assertCondition(
                p95 <= spec.maxP95Ms,
                `${spec.name} p95 exceeded budget (${p95.toFixed(2)}ms > ${spec.maxP95Ms}ms)`
            );
        }
    } finally {
        await sqlClient.end({ timeout: 5 });
    }
}

await runStaticChecks();
await runPerformanceChecks();

if (failures.length > 0) {
    console.error('Phase 9 performance checks failed:\n');
    for (const failure of failures) {
        console.error(`- ${failure}`);
    }
    process.exit(1);
}

console.log('Phase 9 performance checks passed.');
