import { auth } from '$lib/server/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { getFlash, clearFlash } from '$lib/server/flash';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
    const flash = getFlash(event.cookies);
    event.locals.flash = flash;
    if (flash) {
        clearFlash(event.cookies);
    }

    const session = await auth.api.getSession({ headers: event.request.headers });
    if (session) {
        event.locals.user = {
            id: session.user.id,
            email: session.user.email,
            name: session.user.name,
            role: (session.user as any).role || 'admin',
            orgId: (session.user as any).orgId || null
        };
        event.locals.session = session.session;
    } else {
        event.locals.user = null;
        event.locals.session = null;
    }

    return svelteKitHandler({ event, resolve, auth });
};
