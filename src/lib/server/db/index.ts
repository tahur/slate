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

// Ensure synchronous mode for durability (FULL = safest)
// FULL: Wait for data to be written to disk before continuing
sqlite.pragma('synchronous = FULL');

export const db = drizzle(sqlite, { schema });
