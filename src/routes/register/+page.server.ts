import { redirect } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';
import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { z } from 'zod';
import { superValidate } from 'sveltekit-superforms';
import { zod4 as zod } from 'sveltekit-superforms/adapters';

const schema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().min(2)
});

export const load: PageServerLoad = async (event) => {
    if (event.locals.user) {
        redirect(302, '/dashboard');
    }
    const form = await superValidate(zod(schema));
    return { form };
};

export const actions: Actions = {
    default: async (event) => {
        const form = await superValidate(event, zod(schema));
        if (!form.valid) {
            return fail(400, { form });
        }

        const { email, password, name } = form.data;

        const result = await auth.api.signUpEmail({
            body: { email: email.toLowerCase(), password, name },
            asResponse: true
        });

        if (!result.ok) {
            const body = await result.json().catch(() => null);
            const code = body?.code || '';
            if (code === 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL' || code === 'USER_ALREADY_EXISTS') {
                return fail(400, {
                    form,
                    error: 'An account with this email already exists. Please login instead.'
                });
            }
            return fail(500, {
                form,
                error: 'Failed to create account. Please try again.'
            });
        }

        // Forward set-cookie headers from better-auth response
        forwardCookies(result, event);

        redirect(302, '/setup');
    }
};

function forwardCookies(response: Response, event: any) {
    const setCookieHeaders = response.headers.getSetCookie();
    for (const cookieStr of setCookieHeaders) {
        const name = cookieStr.split('=')[0];
        const rawValue = cookieStr.split('=').slice(1).join('=').split(';')[0];
        const attrs = parseCookieAttributes(cookieStr);
        // Use encode: v => v to prevent SvelteKit from double-encoding the already-encoded value
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
