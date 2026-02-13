import {
    ConflictError,
    DomainError,
    ForbiddenError,
    InvariantError,
    NotFoundError,
    UnauthorizedError,
    ValidationError
} from './domain';

export interface PublicErrorPayload {
    message: string;
    code: string;
    traceId: string;
}

export interface HttpErrorResult {
    status: number;
    payload: PublicErrorPayload;
}

type HttpErrorLike = {
    status?: number;
    body?: unknown;
};

function getHttpStatusFromUnknown(error: unknown): number | null {
    if (!error || typeof error !== 'object') {
        return null;
    }

    const maybeHttpError = error as HttpErrorLike;
    if (typeof maybeHttpError.status === 'number') {
        return maybeHttpError.status;
    }

    return null;
}

export function mapErrorToHttp(error: unknown, traceId: string): HttpErrorResult {
    if (error instanceof ValidationError) {
        return {
            status: 400,
            payload: { message: error.message, code: error.code, traceId }
        };
    }

    if (error instanceof InvariantError) {
        return {
            status: 422,
            payload: { message: error.message, code: error.code, traceId }
        };
    }

    if (error instanceof ConflictError) {
        return {
            status: 409,
            payload: { message: error.message, code: error.code, traceId }
        };
    }

    if (error instanceof NotFoundError) {
        return {
            status: 404,
            payload: { message: error.message, code: error.code, traceId }
        };
    }

    if (error instanceof UnauthorizedError) {
        return {
            status: 401,
            payload: { message: error.message, code: error.code, traceId }
        };
    }

    if (error instanceof ForbiddenError) {
        return {
            status: 403,
            payload: { message: error.message, code: error.code, traceId }
        };
    }

    if (error instanceof DomainError) {
        return {
            status: 400,
            payload: { message: error.message, code: error.code, traceId }
        };
    }

    const maybeStatus = getHttpStatusFromUnknown(error);
    if (maybeStatus === 401) {
        return {
            status: 401,
            payload: { message: 'Unauthorized', code: 'UNAUTHORIZED', traceId }
        };
    }

    if (maybeStatus === 403) {
        return {
            status: 403,
            payload: { message: 'Forbidden', code: 'FORBIDDEN', traceId }
        };
    }

    if (maybeStatus === 404) {
        return {
            status: 404,
            payload: { message: 'Not found', code: 'NOT_FOUND', traceId }
        };
    }

    return {
        status: 500,
        payload: {
            message: 'Internal server error',
            code: 'INTERNAL_ERROR',
            traceId
        }
    };
}
