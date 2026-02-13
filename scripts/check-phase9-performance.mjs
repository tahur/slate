import fs from 'node:fs';
import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import Database from 'better-sqlite3';

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

function queryP95(db, sql, params, runs = 30) {
    const stmt = db.prepare(sql);
    const samples = [];

    for (let i = 0; i < runs; i++) {
        const started = process.hrtime.bigint();
        stmt.all(...params);
        const elapsedMs = Number(process.hrtime.bigint() - started) / 1_000_000;
        samples.push(elapsedMs);
    }

    return percentile(samples, 95);
}

function explainDetail(db, sql, params) {
    const planRows = db.prepare(`EXPLAIN QUERY PLAN ${sql}`).all(...params);
    return planRows.map((row) => String(row.detail || '')).join(' | ');
}

function createSyntheticBenchmarkDb() {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'slate-phase9-'));
    const dbPath = path.join(tempDir, 'phase9.db');
    const db = new Database(dbPath);

    db.exec(`
        CREATE TABLE organizations (id TEXT PRIMARY KEY);
        CREATE TABLE customers (id TEXT PRIMARY KEY, org_id TEXT NOT NULL);
        CREATE TABLE invoices (
            id TEXT PRIMARY KEY,
            org_id TEXT NOT NULL,
            customer_id TEXT NOT NULL,
            invoice_number TEXT NOT NULL,
            invoice_date TEXT NOT NULL,
            status TEXT NOT NULL,
            total REAL NOT NULL,
            cgst REAL DEFAULT 0,
            sgst REAL DEFAULT 0,
            igst REAL DEFAULT 0
        );
        CREATE INDEX idx_invoices_org_status ON invoices(org_id, status);
        CREATE INDEX idx_invoices_org_date ON invoices(org_id, invoice_date);

        CREATE TABLE payments (
            id TEXT PRIMARY KEY,
            org_id TEXT NOT NULL,
            customer_id TEXT NOT NULL,
            payment_number TEXT NOT NULL,
            payment_date TEXT NOT NULL,
            amount REAL NOT NULL
        );
        CREATE INDEX idx_payments_org_customer ON payments(org_id, customer_id);

        CREATE TABLE audit_log (
            id TEXT PRIMARY KEY,
            org_id TEXT NOT NULL,
            entity_type TEXT,
            entity_id TEXT,
            action TEXT,
            created_at TEXT NOT NULL
        );
        CREATE INDEX idx_audit_date ON audit_log(org_id, created_at);

        CREATE TABLE journal_entries (
            id TEXT PRIMARY KEY,
            org_id TEXT NOT NULL,
            entry_number TEXT NOT NULL,
            entry_date TEXT NOT NULL
        );
        CREATE INDEX idx_journals_date ON journal_entries(org_id, entry_date);
    `);

    const orgId = 'org_perf';
    const customerId = 'cust_perf';
    db.prepare('INSERT INTO organizations (id) VALUES (?)').run(orgId);
    db.prepare('INSERT INTO customers (id, org_id) VALUES (?, ?)').run(customerId, orgId);

    const insertInvoice = db.prepare(
        `INSERT INTO invoices (id, org_id, customer_id, invoice_number, invoice_date, status, total, cgst, sgst, igst)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const insertPayment = db.prepare(
        `INSERT INTO payments (id, org_id, customer_id, payment_number, payment_date, amount)
         VALUES (?, ?, ?, ?, ?, ?)`
    );
    const insertAudit = db.prepare(
        `INSERT INTO audit_log (id, org_id, entity_type, entity_id, action, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`
    );
    const insertJournal = db.prepare(
        `INSERT INTO journal_entries (id, org_id, entry_number, entry_date)
         VALUES (?, ?, ?, ?)`
    );

    const baseDate = new Date('2026-01-01T00:00:00.000Z');

    const tx = db.transaction(() => {
        for (let i = 0; i < 2000; i++) {
            const date = new Date(baseDate.getTime() + i * 86_400_000).toISOString().slice(0, 10);
            const status = i % 3 === 0 ? 'issued' : i % 3 === 1 ? 'partially_paid' : 'paid';

            insertInvoice.run(
                `inv_${i}`,
                orgId,
                customerId,
                `INV-${String(i + 1).padStart(6, '0')}`,
                date,
                status,
                1000 + i,
                90,
                90,
                0
            );

            insertPayment.run(
                `pay_${i}`,
                orgId,
                customerId,
                `PAY-${String(i + 1).padStart(6, '0')}`,
                date,
                500 + i
            );

            insertAudit.run(
                `aud_${i}`,
                orgId,
                'invoice',
                `inv_${i}`,
                'updated',
                `${date}T10:00:00.000Z`
            );

            insertJournal.run(
                `je_${i}`,
                orgId,
                `JE-${String(i + 1).padStart(6, '0')}`,
                date
            );
        }
    });

    tx();

    return {
        db,
        cleanup: () => {
            db.close();
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    };
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

function runPerformanceChecks() {
    const configuredDbPath = process.env.SLATE_DB_PATH
        ? path.resolve(process.env.SLATE_DB_PATH)
        : path.join(projectRoot, 'data', 'slate.db');

    let db;
    let cleanup;

    if (fs.existsSync(configuredDbPath)) {
        db = new Database(configuredDbPath, { readonly: true });
        cleanup = () => db.close();
    } else {
        const synthetic = createSyntheticBenchmarkDb();
        db = synthetic.db;
        cleanup = synthetic.cleanup;
    }

    try {
        const orgRow = db.prepare('SELECT id FROM organizations LIMIT 1').get();
        const customerRow = db.prepare('SELECT id FROM customers LIMIT 1').get();

        const orgId = orgRow?.id || 'org_perf';
        const customerId = customerRow?.id || 'cust_perf';

        const specs = [
            {
                name: 'invoices_list',
                sql: `
                    SELECT id, invoice_number, total
                    FROM invoices
                    WHERE org_id = ? AND status IN ('issued', 'partially_paid', 'paid')
                    ORDER BY invoice_date DESC
                    LIMIT 50
                `,
                params: [orgId],
                maxP95Ms: 80,
                requiresIndexText: ['USING INDEX', 'USING COVERING INDEX']
            },
            {
                name: 'payments_by_customer',
                sql: `
                    SELECT id, payment_number, amount
                    FROM payments
                    WHERE org_id = ? AND customer_id = ?
                    ORDER BY payment_date DESC
                    LIMIT 50
                `,
                params: [orgId, customerId],
                maxP95Ms: 70,
                requiresIndexText: ['USING INDEX', 'USING COVERING INDEX']
            },
            {
                name: 'audit_recent',
                sql: `
                    SELECT id, entity_type, action
                    FROM audit_log
                    WHERE org_id = ?
                    ORDER BY created_at DESC
                    LIMIT 100
                `,
                params: [orgId],
                maxP95Ms: 90,
                requiresIndexText: ['USING INDEX', 'USING COVERING INDEX']
            },
            {
                name: 'journals_recent',
                sql: `
                    SELECT id, entry_number
                    FROM journal_entries
                    WHERE org_id = ?
                    ORDER BY entry_date DESC
                    LIMIT 100
                `,
                params: [orgId],
                maxP95Ms: 90,
                requiresIndexText: ['USING INDEX', 'USING COVERING INDEX']
            }
        ];

        for (const spec of specs) {
            const detail = explainDetail(db, spec.sql, spec.params);
            const hasIndexUsage = spec.requiresIndexText.some((needle) => detail.includes(needle));
            assertCondition(hasIndexUsage, `${spec.name} query plan must use an index. Plan: ${detail}`);

            const p95 = queryP95(db, spec.sql, spec.params);
            assertCondition(
                p95 <= spec.maxP95Ms,
                `${spec.name} p95 exceeded budget (${p95.toFixed(2)}ms > ${spec.maxP95Ms}ms)`
            );
        }
    } finally {
        cleanup();
    }
}

await runStaticChecks();
runPerformanceChecks();

if (failures.length > 0) {
    console.error('Phase 9 performance checks failed:\n');
    for (const failure of failures) {
        console.error(`- ${failure}`);
    }
    process.exit(1);
}

console.log('Phase 9 performance checks passed.');
