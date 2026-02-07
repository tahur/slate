import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { items } from '$lib/server/db/schema';
import { superValidate } from 'sveltekit-superforms';
import { zod4 as zod } from 'sveltekit-superforms/adapters';
import { itemSchema } from './schema';
import { setFlash } from '$lib/server/flash';
import { logActivity } from '$lib/server/services';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.user) {
        redirect(302, '/login');
    }

    const form = await superValidate(zod(itemSchema));
    return { form };
};

export const actions: Actions = {
    default: async (event) => {
        const form = await superValidate(event, zod(itemSchema));

        if (!form.valid) {
            return fail(400, { form });
        }

        if (!event.locals.user) {
            return fail(401, { form, error: 'Unauthorized' });
        }

        try {
            const data = form.data;
            const itemId = crypto.randomUUID();

            await db.insert(items).values({
                id: itemId,
                org_id: event.locals.user.orgId,
                type: data.type,
                sku: data.sku || null,
                name: data.name,
                description: data.description || null,
                hsn_code: data.hsn_code || null,
                rate: data.rate,
                unit: data.unit,
                gst_rate: data.gst_rate,
                is_active: true,
                created_by: event.locals.user.id,
                updated_by: event.locals.user.id,
            });

            await logActivity({
                orgId: event.locals.user.orgId,
                userId: event.locals.user.id,
                entityType: 'item',
                entityId: itemId,
                action: 'created',
                changedFields: {
                    name: { new: data.name },
                    type: { new: data.type },
                    rate: { new: data.rate },
                }
            });

        } catch (e) {
            console.error(e);
            return fail(500, { form, error: 'Failed to create item' });
        }

        setFlash(event.cookies, {
            type: 'success',
            message: 'Item created successfully.'
        });
        redirect(302, '/items');
    }
};
