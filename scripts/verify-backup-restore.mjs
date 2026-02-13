import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import Database from 'better-sqlite3';

function escapeSqlString(value) {
    return value.replace(/'/g, "''");
}

function validateDatabase(dbPath, label) {
    const db = new Database(dbPath, { readonly: true });
    try {
        const integrity = String(db.pragma('integrity_check', { simple: true }) || '');
        if (integrity.toLowerCase() !== 'ok') {
            throw new Error(`${label} integrity_check failed: ${integrity}`);
        }

        const summary = db
            .prepare('SELECT COUNT(*) AS count, ROUND(COALESCE(SUM(amount), 0), 2) AS total FROM drill_entries')
            .get();

        if (!summary || summary.count !== 3 || Number(summary.total) !== 1300) {
            throw new Error(
                `${label} content mismatch: expected count=3,total=1300.00, got ${JSON.stringify(summary)}`
            );
        }
    } finally {
        db.close();
    }
}

const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'slate-restore-drill-'));
const sourcePath = path.join(tempRoot, 'source.db');
const backupPath = path.join(tempRoot, 'backup.db');
const restoredPath = path.join(tempRoot, 'restored.db');

try {
    const sourceDb = new Database(sourcePath);
    try {
        sourceDb.pragma('journal_mode = WAL');
        sourceDb.pragma('foreign_keys = ON');

        sourceDb.exec(`
            CREATE TABLE drill_entries (
                id TEXT PRIMARY KEY,
                amount REAL NOT NULL
            );
        `);

        const insert = sourceDb.prepare('INSERT INTO drill_entries (id, amount) VALUES (?, ?)');
        insert.run('a', 500);
        insert.run('b', 250);
        insert.run('c', 550);

        sourceDb.exec(`VACUUM INTO '${escapeSqlString(backupPath)}'`);
    } finally {
        sourceDb.close();
    }

    validateDatabase(backupPath, 'Backup database');

    await fs.copyFile(backupPath, restoredPath);
    validateDatabase(restoredPath, 'Restored database');

    console.log('Backup/restore verification drill passed.');
} finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
}
