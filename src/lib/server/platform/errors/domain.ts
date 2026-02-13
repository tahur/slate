export type DomainErrorCode =
    | 'VALIDATION_ERROR'
    | 'INVARIANT_ERROR'
    | 'CONFLICT_ERROR'
    | 'NOT_FOUND'
    | 'UNAUTHORIZED'
    | 'FORBIDDEN'
    | 'INTERNAL_ERROR';

export abstract class DomainError extends Error {
    readonly code: DomainErrorCode;
    readonly details?: Record<string, unknown>;

    protected constructor(message: string, code: DomainErrorCode, details?: Record<string, unknown>) {
        super(message);
        this.name = new.target.name;
        this.code = code;
        this.details = details;
    }
}

export class ValidationError extends DomainError {
    constructor(message: string, details?: Record<string, unknown>) {
        super(message, 'VALIDATION_ERROR', details);
    }
}

export class InvariantError extends DomainError {
    constructor(message: string, details?: Record<string, unknown>) {
        super(message, 'INVARIANT_ERROR', details);
    }
}

export class ConflictError extends DomainError {
    constructor(message: string, details?: Record<string, unknown>) {
        super(message, 'CONFLICT_ERROR', details);
    }
}

export class NotFoundError extends DomainError {
    constructor(message: string, details?: Record<string, unknown>) {
        super(message, 'NOT_FOUND', details);
    }
}

export class UnauthorizedError extends DomainError {
    constructor(message = 'Unauthorized', details?: Record<string, unknown>) {
        super(message, 'UNAUTHORIZED', details);
    }
}

export class ForbiddenError extends DomainError {
    constructor(message = 'Forbidden', details?: Record<string, unknown>) {
        super(message, 'FORBIDDEN', details);
    }
}
