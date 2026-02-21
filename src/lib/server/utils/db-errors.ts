type MaybeDbError = Error & {
    code?: string;
    constraint?: string;
    detail?: string;
};

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : '';
}

export function isUniqueConstraintError(error: unknown): boolean {
    if (!(error instanceof Error)) return false;

    const dbCode = (error as MaybeDbError).code;
    // PostgreSQL unique_violation
    if (dbCode === '23505') {
        return true;
    }

    // SQLite fallback (kept for transitional compatibility)
    if (dbCode === 'SQLITE_CONSTRAINT_UNIQUE' || dbCode === 'SQLITE_CONSTRAINT_PRIMARYKEY') {
        return true;
    }

    const message = getErrorMessage(error);
    return message.includes('duplicate key value violates unique constraint')
        || message.includes('UNIQUE constraint failed');
}

/**
 * Returns true when a unique constraint failure matches a specific table+columns tuple.
 */
export function isUniqueConstraintOnColumns(
    error: unknown,
    table: string,
    columns: string[]
): boolean {
    if (!isUniqueConstraintError(error)) return false;

    const maybeDbError = error as MaybeDbError;
    if (maybeDbError.constraint) {
        if (columns.join('_').length > 0) {
            const columnHint = columns.join('_');
            if (maybeDbError.constraint.includes(columnHint)) {
                return true;
            }
        }
    }

    if (maybeDbError.detail) {
        const tupleHint = `(${columns.join(', ')})`;
        if (maybeDbError.detail.includes(tupleHint)) {
            return true;
        }
    }

    const message = getErrorMessage(error);
    const signature = columns.map((column) => `${table}.${column}`).join(', ');
    if (message.includes(signature)) {
        return true;
    }

    // PostgreSQL error detail format: Key (col1, col2)=(...) already exists.
    const tupleHint = `(${columns.join(', ')})`;
    return message.includes(tupleHint);
}

/**
 * Helper for idempotency unique index conflicts (`org_id`, `idempotency_key`).
 */
export function isIdempotencyConstraintError(error: unknown, table: string): boolean {
    return isUniqueConstraintOnColumns(error, table, ['org_id', 'idempotency_key']);
}
