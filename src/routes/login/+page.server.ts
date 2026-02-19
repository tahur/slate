import { fail, redirect } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';
import { superValidate } from 'sveltekit-superforms';
import { zod4 as zod } from 'sveltekit-superforms/adapters';
import { loginSchema } from './schema';
import { forwardAuthCookies } from '$lib/server/utils/cookies';
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
            body: { email: email.trim().toLowerCase(), password },
            asResponse: true
        });

        if (!result.ok) {
            return fail(400, { form, error: 'Incorrect email or password' });
        }

        forwardAuthCookies(result, event);

        // Read user from response to determine redirect target
        const body = await result.clone().json().catch(() => null);
        const userOrgId = body?.user?.orgId;
        redirect(302, userOrgId ? '/dashboard' : '/setup');
    }
};
