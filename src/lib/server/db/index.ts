import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import { env } from '$env/dynamic/private';

// Ensure data directory exists
import fs from 'node:fs';
if (!fs.existsSync('data')) {
    fs.mkdirSync('data');
}

const sqlite = new Database('data/openbill.db');
export const db = drizzle(sqlite, { schema });
