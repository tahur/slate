import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { organizations, users, fiscal_years } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { superValidate } from 'sveltekit-superforms';
import { zod4 as zod } from 'sveltekit-superforms/adapters';
import { setupSchema } from './schema';
import { seedChartOfAccounts, seedPaymentModes } from '$lib/server/seed';
import { setFlash } from '$lib/server/flash';
import { runInTx } from '$lib/server/platform/db/tx';
import { failActionFromError, InvariantError } from '$lib/server/platform/errors';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
    // If not logged in, redirect to login
    if (!event.locals.user) {
        redirect(302, '/login');
    }

    // Check if already has an org (orgId is always fresh from DB via hooks)
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

        // Prevent duplicate org creation when setup is re-submitted with stale client session.
        const persistedUser = await db.query.users.findFirst({
            where: eq(users.id, userId),
            columns: { orgId: true }
        });
        if (persistedUser?.orgId) {
            const existingOrg = await db.query.organizations.findFirst({
                where: eq(organizations.id, persistedUser.orgId),
                columns: { id: true }
            });
            if (existingOrg) {
                redirect(302, '/dashboard');
            }
        }

        try {
            const data = form.data;
            const orgId = crypto.randomUUID();
            const fyStartYear = new Date().getFullYear();
            const fyEndYear = fyStartYear + 1;

            runInTx((tx) => {
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
                }).run();

                // 2. Link User to Org
                tx
                    .update(users)
                    .set({ orgId: orgId, role: 'admin' })
                    .where(eq(users.id, userId))
                    .run();

                // 3. Create Fiscal Year
                tx.insert(fiscal_years).values({
                    id: crypto.randomUUID(),
                    org_id: orgId,
                    name: `FY ${fyStartYear}-${String(fyEndYear).slice(-2)}`,
                    start_date: `${fyStartYear}-04-01`,
                    end_date: `${fyEndYear}-03-31`,
                    is_locked: false
                }).run();

                // 4. Seed Chart of Accounts
                seedChartOfAccounts(orgId, tx);

                // 5. Seed Payment Modes
                seedPaymentModes(orgId, tx);
            });

            const linkedUser = await db.query.users.findFirst({
                where: eq(users.id, userId),
                columns: { orgId: true }
            });
            if (!linkedUser?.orgId || linkedUser.orgId !== orgId) {
                throw new InvariantError('Organization setup failed to link the user');
            }

            const createdOrg = await db.query.organizations.findFirst({
                where: eq(organizations.id, orgId),
                columns: { id: true }
            });
            if (!createdOrg) {
                throw new InvariantError('Organization setup failed to persist organization');
            }

        } catch (error) {
            return failActionFromError(error, 'Organization setup failed', { form });
        }

        setFlash(event.cookies, {
            type: 'success',
            message: 'Organization setup complete.'
        });
        redirect(302, '/dashboard');
    }
};
