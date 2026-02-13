import { getRequestContext } from './context';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type LogMeta = Record<string, unknown>;

function serializeError(error: unknown): Record<string, unknown> {
    if (error instanceof Error) {
        return {
            name: error.name,
            message: error.message,
            stack: error.stack
        };
    }
    return { value: error };
}

function baseFields() {
    const context = getRequestContext();
    return {
        requestId: context?.requestId,
        method: context?.method,
        path: context?.path,
        orgId: context?.orgId,
        userId: context?.userId
    };
}

function write(level: LogLevel, event: string, meta: LogMeta = {}, error?: unknown) {
    const payload: Record<string, unknown> = {
        ts: new Date().toISOString(),
        level,
        event,
        ...baseFields(),
        ...meta
    };

    if (error !== undefined) {
        payload.error = serializeError(error);
    }

    const line = JSON.stringify(payload);

    if (level === 'error') {
        console.error(line);
        return;
    }
    if (level === 'warn') {
        console.warn(line);
        return;
    }
    console.log(line);
}

export const logger = {
    debug(event: string, meta?: LogMeta) {
        write('debug', event, meta);
    },
    info(event: string, meta?: LogMeta) {
        write('info', event, meta);
    },
    warn(event: string, meta?: LogMeta, error?: unknown) {
        write('warn', event, meta, error);
    },
    error(event: string, meta?: LogMeta, error?: unknown) {
        write('error', event, meta, error);
    }
};

export function logDomainEvent(domainEvent: string, meta: LogMeta = {}) {
    logger.info('domain_event', {
        domainEvent,
        ...meta
    });
}
