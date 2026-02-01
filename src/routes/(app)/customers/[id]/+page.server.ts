import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { customers } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { customerSchema } from '../new/schema';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
    if (!locals.user) {
        redirect(302, '/login');
    }

    const customer = await db.query.customers.findFirst({
        where: and(
            eq(customers.id, params.id),
            eq(customers.org_id, locals.user.orgId)
        )
    });

    if (!customer) {
        redirect(302, '/customers');
    }

    // Pre-populate form with customer data
    const form = await superValidate({
        name: customer.name,
        company_name: customer.company_name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        billing_address: customer.billing_address || '',
        city: customer.city || '',
        state_code: customer.state_code || '',
        pincode: customer.pincode || '',
        gstin: customer.gstin || '',
        gst_treatment: customer.gst_treatment as 'registered' | 'unregistered' | 'consumer' | 'overseas',
        payment_terms: customer.payment_terms || 0,
    }, zod4(customerSchema));

    return { customer, form };
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

            await db.update(customers)
                .set({
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
                    updated_by: event.locals.user.id,
                    updated_at: new Date().toISOString(),
                })
                .where(and(
                    eq(customers.id, event.params.id),
                    eq(customers.org_id, event.locals.user.orgId)
                ));

            return { form, success: true };
        } catch (e) {
            console.error(e);
            return fail(500, { form, error: 'Failed to update customer' });
        }
    }
};
