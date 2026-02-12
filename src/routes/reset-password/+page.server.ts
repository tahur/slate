import { fail, redirect } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';
import { superValidate } from 'sveltekit-superforms';
import { zod4 as zod } from 'sveltekit-superforms/adapters';
import { z } from 'zod';
import type { Actions, PageServerLoad } from './$types';

const resetPasswordSchema = z.object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword']
});

export const load: PageServerLoad = async ({ url, locals }) => {
    if (locals.user) {
        redirect(302, '/dashboard');
    }

    const token = url.searchParams.get('token');

    if (!token) {
        return {
            form: await superValidate(zod(resetPasswordSchema)),
            valid: false,
            error: 'Invalid reset link. Please request a new one.'
        };
    }

    return {
        form: await superValidate(zod(resetPasswordSchema)),
        valid: true,
        token
    };
};

export const actions: Actions = {
    default: async ({ request, url }) => {
        const form = await superValidate(request, zod(resetPasswordSchema));

        if (!form.valid) {
            return fail(400, { form });
        }

        const token = url.searchParams.get('token');
        if (!token) {
            return fail(400, {
                form,
                error: 'Invalid reset link.'
            });
        }

        try {
            await auth.api.resetPassword({
                body: {
                    newPassword: form.data.password,
                    token
                }
            });
        } catch {
            return fail(400, {
                form,
                error: 'This reset link is invalid or has expired.'
            });
        }

        return {
            form,
            success: true
        };
    }
};
