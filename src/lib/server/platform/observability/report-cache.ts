const DEFAULT_TTL_MS = 60_000;

interface CacheEntry<T> {
    expiresAt: number;
    value: T;
}

const reportCache = new Map<string, CacheEntry<unknown>>();

function cloneValue<T>(value: T): T {
    if (typeof structuredClone === 'function') {
        return structuredClone(value);
    }
    return JSON.parse(JSON.stringify(value)) as T;
}

export function createReportCacheKey(
    orgId: string,
    reportType: string,
    startDate: string,
    endDate: string
): string {
    return `report:${orgId}:${reportType}:${startDate}:${endDate}`;
}

export function getCachedReport<T>(cacheKey: string): T | null {
    const entry = reportCache.get(cacheKey);
    if (!entry) return null;

    if (entry.expiresAt <= Date.now()) {
        reportCache.delete(cacheKey);
        return null;
    }

    return cloneValue(entry.value as T);
}

export function setCachedReport<T>(cacheKey: string, value: T, ttlMs = DEFAULT_TTL_MS) {
    reportCache.set(cacheKey, {
        value: cloneValue(value),
        expiresAt: Date.now() + ttlMs
    });
}

export function invalidateOrgReportCache(orgId: string): number {
    const prefix = `report:${orgId}:`;
    let deleted = 0;

    for (const key of reportCache.keys()) {
        if (!key.startsWith(prefix)) continue;
        reportCache.delete(key);
        deleted++;
    }

    return deleted;
}

export function getReportCacheStats() {
    let activeEntries = 0;
    const now = Date.now();

    for (const entry of reportCache.values()) {
        if (entry.expiresAt > now) {
            activeEntries++;
        }
    }

    return {
        activeEntries,
        totalEntries: reportCache.size
    };
}
