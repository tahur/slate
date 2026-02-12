import { fail, redirect } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';
import { superValidate } from 'sveltekit-superforms';
import { zod4 as zod } from 'sveltekit-superforms/adapters';
import { loginSchema } from './schema';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
    if (event.locals.user) {
        redirect(302, '/dashboard');
    }

    const form = await superValidate(zod(loginSchema));
    return { form };
};

export const actions: Actions = {
    default: async (event) => {
        const form = await superValidate(event, zod(loginSchema));

        if (!form.valid) {
            return fail(400, { form });
        }

        const { email, password } = form.data;

        const result = await auth.api.signInEmail({
            body: { email: email.toLowerCase(), password },
            asResponse: true
        });

        if (!result.ok) {
            return fail(400, { form, error: 'Incorrect email or password' });
        }

        // Forward set-cookie headers from better-auth response
        forwardCookies(result, event);

        redirect(302, '/dashboard');
    }
};

function forwardCookies(response: Response, event: any) {
    const setCookieHeaders = response.headers.getSetCookie();
    for (const cookieStr of setCookieHeaders) {
        const name = cookieStr.split('=')[0];
        const rawValue = cookieStr.split('=').slice(1).join('=').split(';')[0];
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
        const trimmed = part.trim().toLowerCase();
        if (trimmed === 'httponly') attrs.httpOnly = true;
        else if (trimmed === 'secure') attrs.secure = true;
        else if (trimmed.startsWith('samesite=')) attrs.sameSite = trimmed.split('=')[1];
        else if (trimmed.startsWith('max-age=')) attrs.maxAge = parseInt(trimmed.split('=')[1]);
        else if (trimmed.startsWith('path=')) attrs.path = part.trim().split('=')[1];
    }
    return attrs;
}
