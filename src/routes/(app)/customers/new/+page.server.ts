import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { customers } from '$lib/server/db/schema';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { customerSchema } from './schema';
import { setFlash } from '$lib/server/flash';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.user) {
        redirect(302, '/login');
    }

    const form = await superValidate(zod4(customerSchema));
    return { form };
};

export const actions: Actions = {
    default: async (event) => {
        const form = await superValidate(event, zod4(customerSchema));

        if (!form.valid) {
            return fail(400, { form });
        }

        if (!event.locals.user) {
            return fail(401, { form, error: 'Unauthorized' });
        }

        try {
            const data = form.data;
            const customerId = crypto.randomUUID();

            await db.insert(customers).values({
                id: customerId,
                org_id: event.locals.user.orgId,
                name: data.name,
                company_name: data.company_name || null,
                email: data.email || null,
                phone: data.phone || null,
                billing_address: data.billing_address || null,
                city: data.city || null,
                state_code: data.state_code || null,
                pincode: data.pincode || null,
                gstin: data.gstin || null,
                gst_treatment: data.gst_treatment,
                place_of_supply: data.state_code || null,
                payment_terms: data.payment_terms,
                balance: 0,
                status: 'active',
                created_by: event.locals.user.id,
                updated_by: event.locals.user.id,
            });

        } catch (e) {
            console.error(e);
            return fail(500, { form, error: 'Failed to create customer' });
        }

        setFlash(event.cookies, {
            type: 'success',
            message: 'Customer created successfully.'
        });
        redirect(302, '/customers');
    }
};
