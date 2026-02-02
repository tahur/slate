import { redirect } from '@sveltejs/kit';
import { generateId } from 'lucia';
import { Argon2id } from 'oslo/password';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { lucia } from '$lib/server/auth';
import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { z } from 'zod';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

const schema = z.object({
    email: z.email(),
    password: z.string().min(8),
    name: z.string().min(2)
});

export const load: PageServerLoad = async (event) => {
    if (event.locals.user) {
        redirect(302, '/dashboard');
    }
    const form = await superValidate(zod4(schema));
    return { form };
};

export const actions: Actions = {
    default: async (event) => {
        const form = await superValidate(event, zod4(schema));
        if (!form.valid) {
            return fail(400, { form });
        }

        const { email, password, name } = form.data;
        const userId = generateId(15);
        const hashedPassword = await new Argon2id().hash(password);

        try {
            await db.insert(users).values({
                id: userId,
                email,
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
                error: 'An unknown error occurred'
            });
        }

        redirect(302, '/setup');
    }
};
