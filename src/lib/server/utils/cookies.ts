import type { RequestEvent } from '@sveltejs/kit';

/**
 * Forward set-cookie headers from a Better Auth response to SvelteKit cookies.
 * Used after signInEmail / signUpEmail calls with asResponse: true.
 */
export function forwardAuthCookies(response: Response, event: RequestEvent) {
    const setCookieHeaders = response.headers.getSetCookie();
    for (const cookieStr of setCookieHeaders) {
        const eqIdx = cookieStr.indexOf('=');
        if (eqIdx === -1) continue;

        const name = cookieStr.substring(0, eqIdx);
        const rest = cookieStr.substring(eqIdx + 1);
        const semiIdx = rest.indexOf(';');
        const rawValue = semiIdx === -1 ? rest : rest.substring(0, semiIdx);
        const attrs = parseCookieAttributes(cookieStr);

        event.cookies.set(name, rawValue, {
            path: '/',
            encode: (v: string) => v,
            ...attrs
        });
    }
}

function parseCookieAttributes(cookie: string): Record<string, any> {
    const attrs: Record<string, any> = {};
    const parts = cookie.split(';').slice(1);
    for (const part of parts) {
        const trimmed = part.trim();
        const lower = trimmed.toLowerCase();
        if (lower === 'httponly') attrs.httpOnly = true;
        else if (lower === 'secure') attrs.secure = true;
        else if (lower.startsWith('samesite=')) {
            const raw = trimmed.split('=')[1];
            attrs.sameSite = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
        }
        else if (lower.startsWith('max-age=')) attrs.maxAge = parseInt(lower.split('=')[1]);
        else if (lower.startsWith('path=')) {
            // Use original case for path value
            const pathEqIdx = trimmed.indexOf('=');
            if (pathEqIdx !== -1) attrs.path = trimmed.substring(pathEqIdx + 1);
        }
    }
    return attrs;
}
