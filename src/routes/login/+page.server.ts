import { fail, redirect } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { users, sessions, auth_accounts, verification } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { superValidate } from 'sveltekit-superforms';
import { zod4 as zod } from 'sveltekit-superforms/adapters';
import { loginSchema } from './schema';
import { forwardAuthCookies } from '$lib/server/utils/cookies';
import { isRegistrationOpen } from '$lib/server/utils/registration';
import { clearUserOrgCache } from '../../hooks.server';
import { env } from '$env/dynamic/private';
import { logger } from '$lib/server/platform/observability';
import type { Actions, PageServerLoad } from './$types';

/**
 * Delete an incomplete "ghost" user — one who signed up (email or OAuth)
 * but never finished org setup. This lets them register again cleanly.
 */
async function deleteGhostUser(userId: string, headers: Headers, cookies: any) {
    try {
        // 1. Sign out the active session via Better Auth
        await auth.api.signOut({ headers }).catch(() => { });

        // 2. Delete DB records in dependency order (sessions → accounts → user)
        await db.delete(sessions).where(eq(sessions.userId, userId));
        await db.delete(auth_accounts).where(eq(auth_accounts.userId, userId));
        await db.delete(users).where(eq(users.id, userId));

        // 3. Clear in-memory cache
        clearUserOrgCache(userId);

        // 4. Clear cookies
        const cookiesToClear = [
            'better-auth.session_token',
            '__Secure-better-auth.session_token',
            'better-auth.session_data',
            '__Secure-better-auth.session_data'
        ];
        for (const name of cookiesToClear) {
            cookies.delete(name, { path: '/' });
        }

        logger.info('ghost_user_deleted', { userId });
    } catch (error) {
        logger.error('ghost_user_delete_failed', { userId }, error);
    }
}

export const load: PageServerLoad = async (event) => {
    if (event.locals.user) {
        // If user has orgId, they're fully set up → go to dashboard
        if (event.locals.user.orgId) {
            redirect(302, '/dashboard');
        }

        // Ghost user: signed up but never completed setup.
        // Delete them so they can start fresh.
        await deleteGhostUser(
            event.locals.user.id,
            event.request.headers,
            event.cookies
        );
        // Fall through to show login page
    }

    const form = await superValidate(zod(loginSchema));
    const registrationOpen = await isRegistrationOpen();
    const googleEnabled = !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
    return { form, registrationOpen, googleEnabled };
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
