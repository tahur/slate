import { AsyncLocalStorage } from 'node:async_hooks';

export interface RequestContext {
    requestId: string;
    method: string;
    path: string;
    startTimeMs: number;
    orgId?: string;
    userId?: string;
}

const storage = new AsyncLocalStorage<RequestContext>();

export function runWithRequestContext<T>(context: RequestContext, callback: () => T): T {
    return storage.run(context, callback);
}

export function getRequestContext(): RequestContext | undefined {
    return storage.getStore();
}

export function patchRequestContext(patch: Partial<RequestContext>) {
    const context = storage.getStore();
    if (!context) return;
    Object.assign(context, patch);
}
