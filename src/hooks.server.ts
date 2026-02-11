import { lucia } from '$lib/server/auth';
import { getFlash, clearFlash } from '$lib/server/flash';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
    const flash = getFlash(event.cookies);
    event.locals.flash = flash;
    if (flash) {
        clearFlash(event.cookies);
    }

    const sessionId = event.cookies.get(lucia.sessionCookieName);
    if (!sessionId) {
        event.locals.user = null;
        event.locals.session = null;
        return resolve(event);
    }

    let session = null;
    let user = null;

    try {
        const result = await lucia.validateSession(sessionId);
        session = result.session;
        user = result.user;
    } catch (e) {
        console.error('Session validation failed:', e);
        // DB hiccup — don't wipe the cookie, just treat as unauthenticated for this request
        event.locals.user = null;
        event.locals.session = null;
        return resolve(event);
    }

    if (session && session.fresh) {
        const sessionCookie = lucia.createSessionCookie(session.id);
        // sveltekit types deviates from the cookie api
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        event.cookies.set(sessionCookie.name, sessionCookie.value, {
            path: '.',
            ...sessionCookie.attributes
        });
    }
    if (!session) {
        const sessionCookie = lucia.createBlankSessionCookie();
        event.cookies.set(sessionCookie.name, sessionCookie.value, {
            path: '.',
            ...sessionCookie.attributes
        });
    }
    event.locals.user = user;
    event.locals.session = session;
    return resolve(event);
};
