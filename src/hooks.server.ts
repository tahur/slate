import { auth } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { getFlash, clearFlash } from '$lib/server/flash';
import { mapErrorToHttp } from '$lib/server/platform/errors';
import { logger, patchRequestContext, runWithRequestContext } from '$lib/server/platform/observability';
import { eq } from 'drizzle-orm';
import type { Handle, HandleServerError, RequestEvent } from '@sveltejs/kit';
import { building, dev } from '$app/environment';

const API_CORS_ALLOWED_METHODS = 'GET,POST,PUT,PATCH,DELETE,OPTIONS';
const API_CORS_ALLOWED_HEADERS = 'Content-Type, Authorization, X-Requested-With, X-Request-Id';
const CONTENT_SECURITY_POLICY = [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self'"
].join('; ');

const TRUSTED_ORIGINS = new Set(
    [
        process.env.ORIGIN,
        ...(process.env.BETTER_AUTH_TRUSTED_ORIGINS || '').split(',')
    ]
        .map((origin) => {
            const normalized = normalizeOrigin(origin);
            return normalized;
        })
        .filter((origin): origin is string => Boolean(origin))
);

function normalizeOrigin(value: string | null | undefined): string | null {
    if (!value) return null;
    try {
        return new URL(value).origin;
    } catch {
        return null;
    }
}

function appendVaryHeader(response: Response, value: string) {
    const existing = response.headers.get('vary');
    if (!existing) {
        response.headers.set('vary', value);
        return;
    }

    const normalizedValues = existing.split(',').map((item) => item.trim().toLowerCase());
    if (!normalizedValues.includes(value.toLowerCase())) {
        response.headers.set('vary', `${existing}, ${value}`);
    }
}

function isHttpsRequest(event: RequestEvent): boolean {
    if (event.url.protocol === 'https:') return true;
    const forwardedProto = event.request.headers.get('x-forwarded-proto');
    if (!forwardedProto) return false;
    return forwardedProto
        .split(',')
        .map((value) => value.trim().toLowerCase())
        .includes('https');
}

function isAllowedCorsOrigin(requestOrigin: string | null, event: RequestEvent): boolean {
    if (!requestOrigin) return true;
    if (requestOrigin === event.url.origin) return true;
    return TRUSTED_ORIGINS.has(requestOrigin);
}

function applyApiCorsHeaders(response: Response, requestOrigin: string | null, event: RequestEvent) {
    if (!requestOrigin || !isAllowedCorsOrigin(requestOrigin, event)) {
        return;
    }

    response.headers.set('access-control-allow-origin', requestOrigin);
    response.headers.set('access-control-allow-methods', API_CORS_ALLOWED_METHODS);
    response.headers.set('access-control-allow-headers', API_CORS_ALLOWED_HEADERS);
    response.headers.set('access-control-allow-credentials', 'true');
    response.headers.set('access-control-max-age', '86400');
    appendVaryHeader(response, 'Origin');
}

function applySecurityHeaders(response: Response, event: RequestEvent) {
    response.headers.set('x-content-type-options', 'nosniff');
    response.headers.set('x-frame-options', 'DENY');
    response.headers.set('referrer-policy', 'strict-origin-when-cross-origin');
    response.headers.set('permissions-policy', 'camera=(), microphone=(), geolocation=()');

    if (!dev) {
        response.headers.set('content-security-policy', CONTENT_SECURITY_POLICY);
    }

    if (!dev && isHttpsRequest(event)) {
        response.headers.set('strict-transport-security', 'max-age=31536000; includeSubDomains; preload');
    }
}

export const handle: Handle = async ({ event, resolve }) => {
    const requestId = crypto.randomUUID();
    event.locals.requestId = requestId;
    const startTimeMs = Date.now();
    const requestOrigin = normalizeOrigin(event.request.headers.get('origin'));
    const isApiRequest = event.url.pathname.startsWith('/api');

    return runWithRequestContext(
        {
            requestId,
            method: event.request.method,
            path: event.url.pathname,
            startTimeMs
        },
        async () => {
            logger.info('request_started');

            if (isApiRequest && requestOrigin && !isAllowedCorsOrigin(requestOrigin, event)) {
                logger.warn('cors_origin_rejected', { origin: requestOrigin, path: event.url.pathname });
                const denied = new Response(
                    JSON.stringify({ error: 'CORS origin denied', code: 'CORS_ORIGIN_DENIED', traceId: requestId }),
                    {
                        status: 403,
                        headers: {
                            'content-type': 'application/json; charset=utf-8'
                        }
                    }
                );
                denied.headers.set('x-request-id', requestId);
                applySecurityHeaders(denied, event);
                logger.info('request_completed', {
                    status: denied.status,
                    durationMs: Date.now() - startTimeMs
                });
                return denied;
            }

            if (isApiRequest && event.request.method === 'OPTIONS') {
                const preflight = new Response(null, { status: 204 });
                preflight.headers.set('x-request-id', requestId);
                applySecurityHeaders(preflight, event);
                applyApiCorsHeaders(preflight, requestOrigin, event);
                logger.info('request_completed', {
                    status: preflight.status,
                    durationMs: Date.now() - startTimeMs
                });
                return preflight;
            }

            const flash = getFlash(event.cookies);
            event.locals.flash = flash;
            if (flash) {
                clearFlash(event.cookies);
            }

            const session = await auth.api.getSession({ headers: event.request.headers });
            if (session) {
                let resolvedOrgId = (session.user as any).orgId || '';
                let resolvedRole = (session.user as any).role || 'admin';

                // Better Auth cookie cache can hold stale user payload right after setup.
                // Fall back to DB truth if cached orgId is missing.
                if (!resolvedOrgId) {
                    const persistedUser = await db.query.users.findFirst({
                        where: eq(users.id, session.user.id),
                        columns: { orgId: true, role: true }
                    });

                    if (persistedUser?.orgId) {
                        resolvedOrgId = persistedUser.orgId;
                        resolvedRole = persistedUser.role || resolvedRole;

                        // Force Better Auth to refresh cached user payload on next request.
                        event.cookies.delete('better-auth.session_data', { path: '/' });
                        event.cookies.delete('__Secure-better-auth.session_data', { path: '/' });
                    }
                }

                event.locals.user = {
                    id: session.user.id,
                    email: session.user.email,
                    name: session.user.name,
                    role: resolvedRole,
                    orgId: resolvedOrgId
                };
                event.locals.session = session.session;

                patchRequestContext({
                    orgId: event.locals.user.orgId,
                    userId: event.locals.user.id
                });
            } else {
                event.locals.user = null;
                event.locals.session = null;
            }

            const response = await svelteKitHandler({ event, resolve, auth, building });
            response.headers.set('x-request-id', requestId);
            applySecurityHeaders(response, event);
            if (isApiRequest) {
                applyApiCorsHeaders(response, requestOrigin, event);
            }

            logger.info('request_completed', {
                status: response.status,
                durationMs: Date.now() - startTimeMs
            });

            return response;
        }
    );
};

export const handleError: HandleServerError = async ({ error, event }) => {
    const traceId = event.locals.requestId || crypto.randomUUID();
    const mapped = mapErrorToHttp(error, traceId);

    logger.error('request_failed', {
        method: event.request.method,
        path: event.url.pathname,
        status: mapped.status,
        traceId
    }, error);

    return mapped.payload;
};
