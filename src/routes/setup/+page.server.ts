import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { organizations, users, fiscal_years } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { setupSchema } from './schema';
import { seedChartOfAccounts } from '$lib/server/seed';
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

    const form = await superValidate(zod4(setupSchema));
    return { form };
};

export const actions: Actions = {
    default: async (event) => {
        const form = await superValidate(event, zod4(setupSchema));

        if (!form.valid) {
            return fail(400, { form });
        }

        if (!event.locals.user) {
            return fail(401, { form, error: 'Unauthorized' });
        }

        try {
            const data = form.data;
            const orgId = crypto.randomUUID();
            const fyStartYear = new Date().getFullYear();
            const fyEndYear = fyStartYear + 1;

            // 1. Create Organization
            await db.insert(organizations).values({
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
            await db
                .update(users)
                .set({ org_id: orgId, role: 'admin' }) // Ensure they are admin
                .where(eq(users.id, event.locals.user.id));

            // 3. Create Fiscal Year - FIXED: Removed is_current
            await db.insert(fiscal_years).values({
                id: crypto.randomUUID(),
                org_id: orgId,
                name: `FY ${fyStartYear}-${String(fyEndYear).slice(-2)}`,
                start_date: `${fyStartYear}-04-01`,
                end_date: `${fyEndYear}-03-31`,
                is_locked: false
            });
            // Note: is_current logic removed for simpler MVP, assume active FY based on dates

            // 4. Seed Chart of Accounts
            await seedChartOfAccounts(orgId);

            // Refresh session/user data might be needed, but redirect handles it
        } catch (e) {
            console.error(e);
            return fail(500, { form, error: 'Failed to setup organization' });
        }

        redirect(302, '/dashboard');
    }
};
