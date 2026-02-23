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

type DbErrorLike = Error & {
    code?: string;
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

function mapKnownDbError(error: unknown, traceId: string): HttpErrorResult | null {
    if (!(error instanceof Error)) return null;

    const dbCode = (error as DbErrorLike).code;
    const message = error.message.toLowerCase();
    if (!dbCode) return null;

    if (
        dbCode === '23502'
        && message.includes('column "paid_through"')
        && message.includes('relation "expenses"')
    ) {
        return {
            status: 500,
            payload: {
                message: 'Database schema is outdated for supplier payable entries. Run "npm run db:migrate" and retry.',
                code: 'INTERNAL_ERROR',
                traceId
            }
        };
    }

    if (dbCode === '23503') {
        return {
            status: 400,
            payload: { message: 'Linked record not found. Refresh and try again.', code: 'VALIDATION_ERROR', traceId }
        };
    }

    if (dbCode === '23502' || dbCode === '23514' || dbCode === '22P02') {
        return {
            status: 400,
            payload: { message: 'Invalid input data. Please review and retry.', code: 'VALIDATION_ERROR', traceId }
        };
    }

    if (dbCode === '40001' || dbCode === '40P01') {
        return {
            status: 409,
            payload: { message: 'Temporary database conflict. Please retry.', code: 'CONFLICT_ERROR', traceId }
        };
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

    const knownDbError = mapKnownDbError(error, traceId);
    if (knownDbError) {
        return knownDbError;
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
