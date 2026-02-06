import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users, password_reset_tokens } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { hash } from '@node-rs/argon2';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
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
    // If already logged in, redirect to dashboard
    if (locals.user) {
        redirect(302, '/dashboard');
    }

    const token = url.searchParams.get('token');

    if (!token) {
        return {
            form: await superValidate(zod4(resetPasswordSchema)),
            valid: false,
            error: 'Invalid reset link. Please request a new one.'
        };
    }

    // Hash token and check if valid
    const tokenHash = await hashToken(token);
    const resetToken = await db.query.password_reset_tokens.findFirst({
        where: eq(password_reset_tokens.token_hash, tokenHash)
    });

    if (!resetToken) {
        return {
            form: await superValidate(zod4(resetPasswordSchema)),
            valid: false,
            error: 'Invalid reset link. Please request a new one.'
        };
    }

    if (resetToken.expires_at < Date.now()) {
        // Delete expired token
        await db.delete(password_reset_tokens).where(eq(password_reset_tokens.id, resetToken.id));
        return {
            form: await superValidate(zod4(resetPasswordSchema)),
            valid: false,
            error: 'This reset link has expired. Please request a new one.'
        };
    }

    return {
        form: await superValidate(zod4(resetPasswordSchema)),
        valid: true,
        token
    };
};

export const actions: Actions = {
    default: async ({ request, url }) => {
        const form = await superValidate(request, zod4(resetPasswordSchema));

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

        // Hash token and find it
        const tokenHash = await hashToken(token);
        const resetToken = await db.query.password_reset_tokens.findFirst({
            where: eq(password_reset_tokens.token_hash, tokenHash)
        });

        if (!resetToken || resetToken.expires_at < Date.now()) {
            return fail(400, {
                form,
                error: 'This reset link is invalid or has expired.'
            });
        }

        // Hash new password
        const passwordHash = await hash(form.data.password, {
            memoryCost: 19456,
            timeCost: 2,
            outputLen: 32,
            parallelism: 1
        });

        // Update user password
        await db
            .update(users)
            .set({
                password_hash: passwordHash,
                updated_at: new Date().toISOString()
            })
            .where(eq(users.id, resetToken.user_id));

        // Delete all reset tokens for this user
        await db.delete(password_reset_tokens).where(eq(password_reset_tokens.user_id, resetToken.user_id));

        return {
            form,
            success: true
        };
    }
};

async function hashToken(token: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(token);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
