import { fail, redirect } from '@sveltejs/kit';
import { lucia } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { verifyPassword } from '$lib/server/password';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
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

        const existingUser = await db.query.users.findFirst({
            where: eq(users.email, email)
        });

        if (!existingUser) {
            // Don't reveal user existence
            return fail(400, { form, error: 'Incorrect email or password' });
        }

        const validPassword = await verifyPassword(existingUser.password_hash, password);
        if (!validPassword) {
            return fail(400, { form, error: 'Incorrect email or password' });
        }

        const session = await lucia.createSession(existingUser.id, {});
        const sessionCookie = lucia.createSessionCookie(session.id);
        event.cookies.set(sessionCookie.name, sessionCookie.value, {
            path: '.',
            ...sessionCookie.attributes
        });

        redirect(302, '/dashboard');
    }
};
