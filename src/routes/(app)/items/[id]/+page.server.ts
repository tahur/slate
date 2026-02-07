import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { items, invoice_items } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { superValidate } from 'sveltekit-superforms';
import { zod4 as zod } from 'sveltekit-superforms/adapters';
import { itemSchema } from '../new/schema';
import { setFlash } from '$lib/server/flash';
import { logActivity } from '$lib/server/services';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
    if (!locals.user) {
        redirect(302, '/login');
    }

    const orgId = locals.user.orgId;
    const itemId = params.id;

    const item = await db.query.items.findFirst({
        where: and(
            eq(items.id, itemId),
            eq(items.org_id, orgId)
        )
    });

    if (!item) {
        redirect(302, '/items');
    }

    // Check if item is used in any invoices
    const usageCount = await db
        .select({ id: invoice_items.id })
        .from(invoice_items)
        .where(eq(invoice_items.item_id, itemId))
        .limit(1);

    const isUsedInInvoices = usageCount.length > 0;

    const form = await superValidate({
        name: item.name,
        type: item.type as 'product' | 'service',
        sku: item.sku || '',
        description: item.description || '',
        hsn_code: item.hsn_code || '',
        rate: item.rate,
        unit: item.unit || 'nos',
        gst_rate: item.gst_rate,
    }, zod(itemSchema));

    return {
        item,
        form,
        isUsedInInvoices,
    };
};

export const actions: Actions = {
    update: async (event) => {
        const form = await superValidate(event, zod(itemSchema));

        if (!form.valid) {
            return fail(400, { form });
        }

        if (!event.locals.user) {
            return fail(401, { form, error: 'Unauthorized' });
        }

        try {
            const data = form.data;

            await db.update(items)
                .set({
                    type: data.type,
                    sku: data.sku || null,
                    name: data.name,
                    description: data.description || null,
                    hsn_code: data.hsn_code || null,
                    rate: data.rate,
                    unit: data.unit,
                    gst_rate: data.gst_rate,
                    updated_by: event.locals.user.id,
                    updated_at: new Date().toISOString(),
                })
                .where(and(
                    eq(items.id, event.params.id),
                    eq(items.org_id, event.locals.user.orgId)
                ));

            await logActivity({
                orgId: event.locals.user.orgId,
                userId: event.locals.user.id,
                entityType: 'item',
                entityId: event.params.id,
                action: 'updated',
                changedFields: {
                    name: { new: data.name },
                    rate: { new: data.rate },
                }
            });

            return { form, success: true };
        } catch (e) {
            console.error(e);
            return fail(500, { form, error: 'Failed to update item' });
        }
    },

    toggleActive: async (event) => {
        if (!event.locals.user) {
            return fail(401, { error: 'Unauthorized' });
        }

        const formData = await event.request.formData();
        const newStatus = formData.get('is_active') === 'true';

        await db.update(items)
            .set({
                is_active: newStatus,
                updated_by: event.locals.user.id,
                updated_at: new Date().toISOString(),
            })
            .where(and(
                eq(items.id, event.params.id),
                eq(items.org_id, event.locals.user.orgId)
            ));

        await logActivity({
            orgId: event.locals.user.orgId,
            userId: event.locals.user.id,
            entityType: 'item',
            entityId: event.params.id,
            action: newStatus ? 'activated' : 'deactivated',
            changedFields: {
                is_active: { old: !newStatus, new: newStatus }
            }
        });

        return { success: true };
    },

    delete: async (event) => {
        if (!event.locals.user) {
            return fail(401, { error: 'Unauthorized' });
        }

        // Check if used in invoices
        const usageCount = await db
            .select({ id: invoice_items.id })
            .from(invoice_items)
            .where(eq(invoice_items.item_id, event.params.id))
            .limit(1);

        if (usageCount.length > 0) {
            return fail(400, { error: 'Cannot delete item that is used in invoices. Deactivate it instead.' });
        }

        await db.delete(items)
            .where(and(
                eq(items.id, event.params.id),
                eq(items.org_id, event.locals.user.orgId)
            ));

        await logActivity({
            orgId: event.locals.user.orgId,
            userId: event.locals.user.id,
            entityType: 'item',
            entityId: event.params.id,
            action: 'deleted',
            changedFields: {}
        });

        setFlash(event.cookies, {
            type: 'success',
            message: 'Item deleted.'
        });
        redirect(302, '/items');
    }
};
