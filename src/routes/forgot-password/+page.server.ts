import { fail, redirect } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';
import { isEmailConfigured } from '$lib/server/email';
import { superValidate } from 'sveltekit-superforms';
import { zod4 as zod } from 'sveltekit-superforms/adapters';
import { z } from 'zod';
import type { Actions, PageServerLoad } from './$types';

const forgotPasswordSchema = z.object({
    email: z.string().email('Please enter a valid email address')
});

export const load: PageServerLoad = async ({ locals }) => {
    if (locals.user) {
        redirect(302, '/dashboard');
    }

    const emailConfigured = await isEmailConfigured();
    const form = await superValidate(zod(forgotPasswordSchema));

    return { form, emailConfigured };
};

export const actions: Actions = {
    default: async ({ request, url }) => {
        const form = await superValidate(request, zod(forgotPasswordSchema));

        if (!form.valid) {
            return fail(400, { form });
        }

        const email = form.data.email.toLowerCase().trim();

        const emailConfigured = await isEmailConfigured();
        if (!emailConfigured) {
            return fail(400, {
                form,
                error: 'Email is not configured. Please contact your administrator or set up SMTP in Settings.'
            });
        }

        try {
            await auth.api.forgetPassword({
                body: {
                    email,
                    redirectTo: `${url.origin}/reset-password`
                }
            });
        } catch {
            // Swallow errors to prevent email enumeration
        }

        // Always show success to prevent email enumeration
        return {
            form,
            success: true,
            message: 'If an account exists with that email, you will receive a password reset link.'
        };
    }
};
