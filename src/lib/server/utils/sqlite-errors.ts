type MaybeSqliteError = Error & {
    code?: string;
};

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : '';
}

/**
 * Returns true when the error comes from a SQLite UNIQUE/PRIMARY KEY constraint.
 */
export function isUniqueConstraintError(error: unknown): boolean {
    if (!(error instanceof Error)) return false;

    const sqliteCode = (error as MaybeSqliteError).code;
    if (sqliteCode === 'SQLITE_CONSTRAINT_UNIQUE' || sqliteCode === 'SQLITE_CONSTRAINT_PRIMARYKEY') {
        return true;
    }

    const message = getErrorMessage(error);
    return message.includes('UNIQUE constraint failed');
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

    const message = getErrorMessage(error);
    const signature = columns.map((column) => `${table}.${column}`).join(', ');
    return message.includes(signature);
}

/**
 * Helper for idempotency unique index conflicts (`org_id`, `idempotency_key`).
 */
export function isIdempotencyConstraintError(error: unknown, table: string): boolean {
    return isUniqueConstraintOnColumns(error, table, ['org_id', 'idempotency_key']);
}
