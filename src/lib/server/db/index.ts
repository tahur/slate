import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { env } from '$env/dynamic/private';
import { building } from '$app/environment';
import { logger } from '$lib/server/platform/observability';

const privateEnv = env as Record<string, string | undefined>;

function readPositiveIntEnv(key: string, fallback: number): number {
    const raw = privateEnv[key];
    if (!raw) return fallback;
    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const connectionString = env.DATABASE_URL;
const hasDatabaseUrl = Boolean(connectionString);
const shouldInitDbClient = hasDatabaseUrl && !building;

if (!hasDatabaseUrl && !building) {
    throw new Error('DATABASE_URL environment variable is required');
}

const realClient = shouldInitDbClient
    ? postgres(connectionString!, {
        ssl: 'require',
        max: readPositiveIntEnv('DB_POOL_MAX', 10),
        idle_timeout: readPositiveIntEnv('DB_IDLE_TIMEOUT', 20),
        connect_timeout: readPositiveIntEnv('DB_CONNECT_TIMEOUT', 10),
        // Supabase transaction pooler is not compatible with prepared statements.
        prepare: privateEnv.DB_PREPARE === 'true'
    })
    : undefined;

export const client = realClient ?? null;

export const db = realClient ? drizzle(realClient, { schema }) : drizzle.mock({ schema });

export interface StartupCheckSnapshot {
    checkedAt: string;
    connectionOk: boolean;
    error?: string;
}

let startupCheckSnapshot: StartupCheckSnapshot = {
    checkedAt: new Date().toISOString(),
    connectionOk: false
};

export async function runStartupChecks(): Promise<StartupCheckSnapshot> {
    const checkedAt = new Date().toISOString();

    if (!realClient) {
        startupCheckSnapshot = {
            checkedAt,
            connectionOk: false,
            error: hasDatabaseUrl
                ? 'Database client is not initialized during build'
                : 'DATABASE_URL environment variable is not configured'
        };
        logger.warn('startup_checks_skipped', { ...startupCheckSnapshot });
        return startupCheckSnapshot;
    }

    try {
        await realClient`SELECT 1`;
        startupCheckSnapshot = {
            checkedAt,
            connectionOk: true
        };
        logger.info('startup_checks_passed', { ...startupCheckSnapshot });
        return startupCheckSnapshot;
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        startupCheckSnapshot = {
            checkedAt,
            connectionOk: false,
            error: message
        };
        logger.error('startup_checks_failed', {}, error);
        return startupCheckSnapshot;
    }
}

// Start checks during boot. Health endpoint can read snapshot while this runs.
if (realClient) {
    void runStartupChecks();
}

export function getStartupCheckSnapshot(): StartupCheckSnapshot {
    return startupCheckSnapshot;
}

/** Drizzle transaction type for passing transactions through service layers */
export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

if (typeof process !== 'undefined' && typeof process.on === 'function') {
    process.on('SIGTERM', async () => {
        logger.info('sigterm_received', { action: 'closing_pool' });
        try {
            if (client) {
                await client.end();
            }
            logger.info('db_pool_closed');
        } catch (error) {
            logger.error('shutdown_failed', {}, error);
        }
        process.exit(0);
    });
}
