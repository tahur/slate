import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import { env } from '$env/dynamic/private';
import { logger } from '$lib/server/platform/observability';

// Ensure data directory exists
import fs from 'node:fs';
import path from 'node:path';

const dbPath = env.SLATE_DB_PATH || 'data/slate.db';
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

export const SLATE_DB_PATH = dbPath;
export const sqlite = new Database(dbPath);

// ⚠️ ACID COMPLIANCE: Enable WAL mode for better concurrency and crash recovery
// WAL (Write-Ahead Logging) provides:
// - Atomicity: Transactions are all-or-nothing
// - Consistency: Database constraints are enforced
// - Isolation: Readers don't block writers
// - Durability: Data is safely written to disk
sqlite.pragma('journal_mode = WAL');

// Enable foreign key constraints (part of Consistency)
sqlite.pragma('foreign_keys = ON');

// NORMAL is safe with WAL mode — data is synced at checkpoints
// FULL causes excessive blocking on cloud disk I/O (e.g. Fly.io)
sqlite.pragma('synchronous = NORMAL');

// Wait up to 5s when the DB is locked instead of failing immediately
sqlite.pragma('busy_timeout = 5000');

export const db = drizzle(sqlite, { schema });

export interface StartupCheckSnapshot {
    checkedAt: string;
    dbPath: string;
    journalMode: string;
    foreignKeysEnabled: boolean;
    quickCheck: string;
    busyTimeoutMs: number;
}

function runStartupChecks(): StartupCheckSnapshot {
    const journalMode = String(sqlite.pragma('journal_mode', { simple: true }) || '').toLowerCase();
    const foreignKeysEnabled = Number(sqlite.pragma('foreign_keys', { simple: true })) === 1;
    const quickCheck = String(sqlite.pragma('quick_check', { simple: true }) || '');
    const busyTimeoutMs = Number(sqlite.pragma('busy_timeout', { simple: true }) || 0);

    sqlite.prepare('SELECT 1').get();

    if (journalMode !== 'wal') {
        throw new Error(`Startup check failed: journal_mode must be WAL, got "${journalMode}"`);
    }
    if (!foreignKeysEnabled) {
        throw new Error('Startup check failed: foreign_keys pragma is disabled');
    }
    if (quickCheck.toLowerCase() !== 'ok') {
        throw new Error(`Startup check failed: quick_check returned "${quickCheck}"`);
    }

    return {
        checkedAt: new Date().toISOString(),
        dbPath,
        journalMode,
        foreignKeysEnabled,
        quickCheck,
        busyTimeoutMs
    };
}

const startupCheckSnapshot = runStartupChecks();
logger.info('startup_checks_passed', { ...startupCheckSnapshot });

export function getStartupCheckSnapshot(): StartupCheckSnapshot {
    return startupCheckSnapshot;
}

/** Drizzle transaction type for passing transactions through service layers */
export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

// Graceful shutdown: checkpoint WAL so LiteStream can flush all data before container dies.
// Cloud Run/Fly.io send SIGTERM before killing the container.
process.on('SIGTERM', () => {
    logger.info('sigterm_received', { action: 'wal_checkpoint' });
    try {
        sqlite.pragma('wal_checkpoint(TRUNCATE)');
        sqlite.close();
        logger.info('db_closed_cleanly');
    } catch (err) {
        logger.error('shutdown_checkpoint_failed', {}, err);
    }
    // Give LiteStream 2s to replicate the final checkpoint, then exit
    setTimeout(() => process.exit(0), 2000);
});
