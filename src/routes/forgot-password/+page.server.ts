import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users, password_reset_tokens, organizations } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { sendPasswordResetEmail, isEmailConfigured } from '$lib/server/email';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { z } from 'zod';
import type { Actions, PageServerLoad } from './$types';

const forgotPasswordSchema = z.object({
    email: z.email('Please enter a valid email address')
});

export const load: PageServerLoad = async ({ locals }) => {
    // If already logged in, redirect to dashboard
    if (locals.user) {
        redirect(302, '/dashboard');
    }

    const emailConfigured = await isEmailConfigured();
    const form = await superValidate(zod4(forgotPasswordSchema));

    return { form, emailConfigured };
};

export const actions: Actions = {
    default: async ({ request, url }) => {
        const form = await superValidate(request, zod4(forgotPasswordSchema));

        if (!form.valid) {
            return fail(400, { form });
        }

        const email = form.data.email.toLowerCase().trim();

        // Check if email is configured
        const emailConfigured = await isEmailConfigured();
        if (!emailConfigured) {
            return fail(400, {
                form,
                error: 'Email is not configured. Please contact your administrator or set up SMTP in Settings.'
            });
        }

        // Find user by email
        const user = await db.query.users.findFirst({
            where: eq(users.email, email)
        });

        // Always show success message to prevent email enumeration
        if (!user) {
            return {
                form,
                success: true,
                message: 'If an account exists with that email, you will receive a password reset link.'
            };
        }

        // Generate secure token
        const token = crypto.randomUUID() + crypto.randomUUID();
        const tokenHash = await hashToken(token);
        const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour

        // Delete any existing tokens for this user
        await db.delete(password_reset_tokens).where(eq(password_reset_tokens.user_id, user.id));

        // Create new token
        await db.insert(password_reset_tokens).values({
            id: crypto.randomUUID(),
            user_id: user.id,
            token_hash: tokenHash,
            expires_at: expiresAt
        });

        // Build reset URL
        const resetUrl = `${url.origin}/reset-password?token=${token}`;

        // Get org name if available
        let orgName: string | undefined;
        if (user.org_id) {
            const org = await db.query.organizations.findFirst({
                where: eq(organizations.id, user.org_id)
            });
            orgName = org?.name;
        }

        // Send email
        const result = await sendPasswordResetEmail(email, resetUrl, orgName);

        if (!result.success) {
            console.error('Failed to send password reset email:', result.error);
            return fail(500, {
                form,
                error: 'Failed to send email. Please try again later.'
            });
        }

        return {
            form,
            success: true,
            message: 'If an account exists with that email, you will receive a password reset link.'
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
