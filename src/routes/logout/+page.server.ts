import { redirect } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';
import type { Actions } from './$types';

export const actions: Actions = {
    default: async (event) => {
        if (!event.locals.session) {
            return redirect(302, '/login');
        }

        await auth.api.signOut({
            headers: event.request.headers
        });

        // Clear the session cookie
        event.cookies.delete('better-auth.session_token', { path: '/' });

        redirect(302, '/login');
    }
};
