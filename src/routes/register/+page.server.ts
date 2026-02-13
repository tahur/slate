import { redirect } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';
import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { z } from 'zod';
import { superValidate } from 'sveltekit-superforms';
import { zod4 as zod } from 'sveltekit-superforms/adapters';
import { forwardAuthCookies } from '$lib/server/utils/cookies';

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
            body: { email: email.trim().toLowerCase(), password, name: name.trim() },
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
        forwardAuthCookies(result, event);

        redirect(302, '/setup');
    }
};
