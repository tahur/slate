import { redirect } from '@sveltejs/kit';
import { generateId } from 'lucia';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { lucia } from '$lib/server/auth';
import { hashPassword } from '$lib/server/password';
import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { z } from 'zod';
import { superValidate } from 'sveltekit-superforms';
import { zod4 as zod } from 'sveltekit-superforms/adapters';
import { eq } from 'drizzle-orm';

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

        // Check if email already exists
        const existingUser = await db.query.users.findFirst({
            where: eq(users.email, email.toLowerCase())
        });

        if (existingUser) {
            return fail(400, {
                form,
                error: 'An account with this email already exists. Please login instead.'
            });
        }

        const userId = generateId(15);
        const hashedPassword = await hashPassword(password);

        try {
            await db.insert(users).values({
                id: userId,
                email: email.toLowerCase(),
                password_hash: hashedPassword,
                name,
                role: 'admin',
                is_active: true
            });

            const session = await lucia.createSession(userId, {});
            const sessionCookie = lucia.createSessionCookie(session.id);
            event.cookies.set(sessionCookie.name, sessionCookie.value, {
                path: '.',
                ...sessionCookie.attributes
            });

        } catch (e) {
            console.error(e);
            return fail(500, {
                form,
                error: 'Failed to create account. Please try again.'
            });
        }

        redirect(302, '/setup');
    }
};
