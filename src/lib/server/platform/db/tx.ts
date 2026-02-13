import { db, type Tx } from '$lib/server/db';

type TxCallback<T> = (tx: Tx) => T;

function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
    return typeof value === 'object'
        && value !== null
        && 'then' in (value as object)
        && typeof (value as { then?: unknown }).then === 'function';
}

function assertSyncTxResult<T>(result: T): T {
    if (isPromiseLike(result)) {
        throw new TypeError(
            'Transaction callback must be synchronous for better-sqlite3. Move async work outside runInTx.'
        );
    }
    return result;
}

/**
 * Standard transaction entrypoint for this SQLite/better-sqlite3 stack.
 * The callback MUST be synchronous.
 */
export function runInTx<T>(callback: TxCallback<T>): T {
    return db.transaction((tx) => assertSyncTxResult(callback(tx)));
}

/**
 * Reuse an existing transaction when provided, otherwise open a new one.
 */
export function runInExistingOrNewTx<T>(tx: Tx | undefined, callback: TxCallback<T>): T {
    if (tx) {
        return assertSyncTxResult(callback(tx));
    }
    return runInTx(callback);
}
