import { json, type RequestHandler } from '@sveltejs/kit';
import { db, getStartupCheckSnapshot } from '$lib/server/db';
import { getReportCacheStats, logger } from '$lib/server/platform/observability';
import { sql } from 'drizzle-orm';

const serviceStartedAt = Date.now();

async function pingDatabase() {
    const started = Date.now();
    try {
        await db.execute(sql`SELECT 1 as ok`);
        return {
            ok: true,
            latencyMs: Date.now() - started
        };
    } catch (error) {
        logger.error('health_db_ping_failed', {}, error);
        return {
            ok: false,
            latencyMs: Date.now() - started
        };
    }
}

export const GET: RequestHandler = async ({ locals }) => {
    const dbPing = await pingDatabase();
    const startup = getStartupCheckSnapshot();
    const healthy = dbPing.ok && startup.connectionOk;
    const status = healthy ? 200 : 503;
    const reportCache = getReportCacheStats();

    const response = json(
        {
            status: healthy ? 'ok' : 'degraded',
            service: 'slate',
            uptimeSec: Math.floor((Date.now() - serviceStartedAt) / 1000),
            now: new Date().toISOString(),
            checks: {
                dbPing,
                startup,
                reportCache
            }
        },
        {
            status,
            headers: {
                'cache-control': 'no-store'
            }
        }
    );

    if (locals.requestId) {
        response.headers.set('x-request-id', locals.requestId);
    }

    return response;
};
