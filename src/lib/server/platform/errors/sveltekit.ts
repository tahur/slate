import { fail, isHttpError, isRedirect, json } from '@sveltejs/kit';
import { mapErrorToHttp } from './http';
import { logger } from '$lib/server/platform/observability';

type ErrorContextData = Record<string, unknown>;

function mapAndLogError(error: unknown, context: string) {
    if (isRedirect(error) || isHttpError(error)) {
        throw error;
    }

    const traceId = crypto.randomUUID();
    const mapped = mapErrorToHttp(error, traceId);

    if (mapped.status >= 500) {
        logger.error('action_error', { context, traceId, status: mapped.status }, error);
    } else {
        logger.warn('action_error', { context, traceId, status: mapped.status }, error);
    }

    return mapped;
}

export function failActionFromError(error: unknown, context: string, data: ErrorContextData = {}) {
    const mapped = mapAndLogError(error, context);

    return fail(mapped.status, {
        ...data,
        error: mapped.payload.message,
        code: mapped.payload.code,
        traceId: mapped.payload.traceId
    });
}

export function jsonFromError(error: unknown, context: string, data: ErrorContextData = {}) {
    const mapped = mapAndLogError(error, context);

    return json(
        {
            ...data,
            error: mapped.payload.message,
            code: mapped.payload.code,
            traceId: mapped.payload.traceId
        },
        { status: mapped.status }
    );
}
