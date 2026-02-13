import { json, type RequestHandler } from '@sveltejs/kit';
import { getStartupCheckSnapshot, sqlite } from '$lib/server/db';
import { getReportCacheStats, logger } from '$lib/server/platform/observability';

const serviceStartedAt = Date.now();

function pingDatabase() {
    const started = Date.now();
    try {
        const row = sqlite.prepare('SELECT 1 as ok').get() as { ok?: number } | undefined;
        return {
            ok: row?.ok === 1,
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
    const dbPing = pingDatabase();
    const startup = getStartupCheckSnapshot();
    const healthy = dbPing.ok && startup.foreignKeysEnabled && startup.quickCheck.toLowerCase() === 'ok';
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
