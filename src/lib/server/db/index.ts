import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import { env } from '$env/dynamic/private';

// Ensure data directory exists
import fs from 'node:fs';
import path from 'node:path';

const dbPath = env.OPENBILL_DB_PATH || 'data/openbill.db';
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const sqlite = new Database(dbPath);

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

/** Drizzle transaction type for passing transactions through service layers */
export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
