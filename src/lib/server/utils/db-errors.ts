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

function messageIncludes(message: string, fragment: string): boolean {
    return message.toLowerCase().includes(fragment.toLowerCase());
}

export function isMissingColumnError(error: unknown, columnName?: string): boolean {
    if (!(error instanceof Error)) return false;

    const dbCode = (error as MaybeDbError).code;
    if (dbCode === '42703') {
        return true;
    }

    const message = getErrorMessage(error);
    if (messageIncludes(message, 'no such column')) {
        return true;
    }

    if (columnName && messageIncludes(message, columnName)) {
        return messageIncludes(message, 'column');
    }

    return false;
}

export function isMissingTableError(error: unknown, tableName?: string): boolean {
    if (!(error instanceof Error)) return false;

    const dbCode = (error as MaybeDbError).code;
    if (dbCode === '42P01') {
        return true;
    }

    const message = getErrorMessage(error);
    if (messageIncludes(message, 'no such table') || messageIncludes(message, 'relation') && messageIncludes(message, 'does not exist')) {
        return true;
    }

    if (tableName && messageIncludes(message, tableName)) {
        return messageIncludes(message, 'relation') || messageIncludes(message, 'table');
    }

    return false;
}

export function isForeignKeyConstraintError(error: unknown, constraintName?: string): boolean {
    if (!(error instanceof Error)) return false;

    const maybeDbError = error as MaybeDbError;
    const dbCode = maybeDbError.code;
    if (dbCode === '23503' || dbCode === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
        if (!constraintName) return true;
        return (maybeDbError.constraint || '').includes(constraintName);
    }

    const message = getErrorMessage(error);
    if (messageIncludes(message, 'foreign key constraint') || messageIncludes(message, 'FOREIGN KEY constraint failed')) {
        if (!constraintName) return true;
        return messageIncludes(message, constraintName);
    }

    return false;
}

export function isNotNullConstraintError(error: unknown, columnName?: string): boolean {
    if (!(error instanceof Error)) return false;

    const maybeDbError = error as MaybeDbError;
    const dbCode = maybeDbError.code;
    if (dbCode === '23502' || dbCode === 'SQLITE_CONSTRAINT_NOTNULL') {
        if (!columnName) return true;
        const message = getErrorMessage(error);
        return messageIncludes(message, `column "${columnName}"`)
            || messageIncludes(message, `column '${columnName}'`)
            || messageIncludes(message, columnName);
    }

    const message = getErrorMessage(error);
    if (messageIncludes(message, 'null value in column') && messageIncludes(message, 'violates not-null constraint')) {
        if (!columnName) return true;
        return messageIncludes(message, `column "${columnName}"`)
            || messageIncludes(message, `column '${columnName}'`)
            || messageIncludes(message, columnName);
    }

    return false;
}

/**
 * Covers common runtime failures when app code is newer than the DB schema.
 */
export function isSchemaOutOfDateError(error: unknown): boolean {
    return isMissingColumnError(error) || isMissingTableError(error);
}
