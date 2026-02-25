/**
 * In-memory cache for user org/role data.
 * Avoids a DB lookup on every request (TTL: 5 min).
 *
 * Extracted into its own module so both hooks.server.ts and
 * route actions (e.g. logout) can import safely — hooks.server.ts
 * is a special SvelteKit entry point and must not be imported by routes.
 */

const USER_CACHE_TTL_MS = 5 * 60 * 1000;
const userOrgCache = new Map<string, { orgId: string; role: string; expiresAt: number }>();

export function getCachedUserOrg(userId: string) {
    const cached = userOrgCache.get(userId);
    if (!cached || Date.now() > cached.expiresAt) {
        userOrgCache.delete(userId);
        return null;
    }
    return cached;
}

export function cacheUserOrg(userId: string, orgId: string, role: string) {
    // Never cache unlinked users (empty org); setup updates would otherwise be hidden behind stale cache.
    if (!orgId) {
        userOrgCache.delete(userId);
        return;
    }
    userOrgCache.set(userId, { orgId, role, expiresAt: Date.now() + USER_CACHE_TTL_MS });
}

/** Clear a user's cached org/role entry. Call on logout to prevent stale data. */
export function clearUserOrgCache(userId: string) {
    userOrgCache.delete(userId);
}
