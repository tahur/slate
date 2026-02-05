import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { vendors } from '$lib/server/db/schema';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { vendorSchema } from './schema';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.user) {
        redirect(302, '/login');
    }

    const form = await superValidate(zod4(vendorSchema));

    return { form };
};

export const actions: Actions = {
    default: async (event) => {
        const form = await superValidate(event, zod4(vendorSchema));

        if (!form.valid) {
            return fail(400, { form });
        }

        if (!event.locals.user) {
            return fail(401, { form, error: 'Unauthorized' });
        }

        const data = form.data;
        const id = crypto.randomUUID();

        try {
            await db.insert(vendors).values({
                id,
                org_id: event.locals.user.orgId,
                name: data.name,
                company_name: data.company_name || null,
                display_name: data.display_name || data.name,
                email: data.email || null,
                phone: data.phone || null,
                website: data.website || null,
                billing_address: data.billing_address || null,
                city: data.city || null,
                state_code: data.state_code || null,
                pincode: data.pincode || null,
                gstin: data.gstin || null,
                gst_treatment: data.gst_treatment,
                pan: data.pan || null,
                payment_terms: data.payment_terms,
                tds_applicable: data.tds_applicable ? 1 : 0,
                tds_section: data.tds_section || null,
                notes: data.notes || null,
                created_by: event.locals.user.id,
            });
        } catch (e) {
            console.error(e);
            return fail(500, { form, error: 'Failed to create vendor' });
        }

        redirect(302, '/vendors');
    }
};
