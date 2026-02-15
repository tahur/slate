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

        // Clear ALL Better Auth cookies (plain + __Secure- HTTPS variants)
        const cookiesToClear = [
            'better-auth.session_token',
            '__Secure-better-auth.session_token',
            'better-auth.session_data',
            '__Secure-better-auth.session_data'
        ];
        for (const name of cookiesToClear) {
            event.cookies.delete(name, { path: '/' });
        }

        redirect(302, '/login');
    }
};
