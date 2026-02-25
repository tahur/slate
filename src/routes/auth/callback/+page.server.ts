import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// Post-OAuth redirect handler.
// After Google sign-in, Better Auth redirects here.
// We check if the user has completed org setup and route accordingly.
export const load: PageServerLoad = async (event) => {
    if (!event.locals.user) {
        redirect(302, '/login');
    }

    if (event.locals.user.orgId) {
        redirect(302, '/dashboard');
    }

    // User authenticated via OAuth but has no org (new user).
    // Redirect to /setup so they can complete onboarding.
    // If they abandon setup and come back to /login, the ghost cleanup there
    // will delete this user so they can start fresh.
    redirect(302, '/setup');
};
