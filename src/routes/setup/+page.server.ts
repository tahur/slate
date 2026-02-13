import { fail, redirect } from '@sveltejs/kit';
import { db, type Tx } from '$lib/server/db';
import { organizations, users, fiscal_years } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { superValidate } from 'sveltekit-superforms';
import { zod4 as zod } from 'sveltekit-superforms/adapters';
import { setupSchema } from './schema';
import { seedChartOfAccounts } from '$lib/server/seed';
import { setFlash } from '$lib/server/flash';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
    // If not logged in, redirect to login
    if (!event.locals.user) {
        redirect(302, '/login');
    }

    // Check if already has an org
    if (event.locals.user.orgId) {
        const org = await db.query.organizations.findFirst({
            where: eq(organizations.id, event.locals.user.orgId)
        });
        // If org exists and setup is basically done (has name), redirect to dashboard
        if (org && org.name) {
            redirect(302, '/dashboard');
        }
    }

    const form = await superValidate(zod(setupSchema));
    return { form };
};

export const actions: Actions = {
    default: async (event) => {
        const form = await superValidate(event, zod(setupSchema));

        if (!form.valid) {
            return fail(400, { form });
        }

        if (!event.locals.user) {
            return fail(401, { form, error: 'Unauthorized' });
        }
        const userId = event.locals.user.id;

        try {
            const data = form.data;
            const orgId = crypto.randomUUID();
            const fyStartYear = new Date().getFullYear();
            const fyEndYear = fyStartYear + 1;

            db.transaction((tx) => {
                // 1. Create Organization
                tx.insert(organizations).values({
                    id: orgId,
                    name: data.name,
                    email: data.email || null,
                    phone: data.phone || null,
                    address: data.address,
                    state_code: data.state_code,
                    pincode: data.pincode,
                    gstin: data.gstin || null,
                    fy_start_month: data.fy_start_month
                });

                // 2. Link User to Org
                tx
                    .update(users)
                    .set({ orgId: orgId, role: 'admin' })
                    .where(eq(users.id, userId));

                // 3. Create Fiscal Year
                tx.insert(fiscal_years).values({
                    id: crypto.randomUUID(),
                    org_id: orgId,
                    name: `FY ${fyStartYear}-${String(fyEndYear).slice(-2)}`,
                    start_date: `${fyStartYear}-04-01`,
                    end_date: `${fyEndYear}-03-31`,
                    is_locked: false
                });

                // 4. Seed Chart of Accounts
                seedChartOfAccounts(orgId, tx);
            });

            // 5. Delete Better Auth cookie cache so next request reads fresh user from DB
            //    Without this, the cached session still has orgId=null for up to 5 minutes
            event.cookies.delete('better-auth.session_data', { path: '/' });
            event.cookies.delete('__Secure-better-auth.session_data', { path: '/' });
        } catch (e) {
            console.error(e);
            return fail(500, { form, error: 'Failed to setup organization' });
        }

        setFlash(event.cookies, {
            type: 'success',
            message: 'Organization setup complete.'
        });
        redirect(302, '/dashboard');
    }
};
