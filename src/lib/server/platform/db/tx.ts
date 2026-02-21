import { db, type Tx } from '$lib/server/db';

type TxCallback<T> = (tx: Tx) => Promise<T>;

/**
 * Run a callback inside a Postgres transaction.
 */
export async function runInTx<T>(callback: TxCallback<T>): Promise<T> {
    return db.transaction(async (tx) => callback(tx));
}

/**
 * Reuse an existing transaction when provided, otherwise open a new one.
 */
export async function runInExistingOrNewTx<T>(tx: Tx | undefined, callback: TxCallback<T>): Promise<T> {
    if (tx) {
        return callback(tx);
    }
    return runInTx(callback);
}
