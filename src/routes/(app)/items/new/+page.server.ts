import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { items } from '$lib/server/db/schema';
import { eq, and, count, ne, desc, isNotNull } from 'drizzle-orm';
import { superValidate } from 'sveltekit-superforms';
import { zod4 as zod } from 'sveltekit-superforms/adapters';
import { itemSchema } from './schema';
import { setFlash } from '$lib/server/flash';
import { logActivity } from '$lib/server/services';
import { failActionFromError } from '$lib/server/platform/errors';
import type { Actions, PageServerLoad } from './$types';

async function generateNextSku(orgId: string): Promise<string> {
    const [result] = await db
        .select({ total: count() })
        .from(items)
        .where(eq(items.org_id, orgId));

    const next = (result?.total ?? 0) + 1;
    return `ITEM-${String(next).padStart(4, '0')}`;
}

async function isSkuTaken(orgId: string, sku: string, excludeItemId?: string): Promise<boolean> {
    if (!sku) return false;
    const conditions = [eq(items.org_id, orgId), eq(items.sku, sku)];
    if (excludeItemId) {
        conditions.push(ne(items.id, excludeItemId));
    }
    const existing = await db
        .select({ id: items.id })
        .from(items)
        .where(and(...conditions))
        .limit(1);
    return existing.length > 0;
}

export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.user) {
        redirect(302, '/login');
    }

    const [nextSku, lastItemResult, usedHsnRecords] = await Promise.all([
        generateNextSku(locals.user.orgId),
        db
            .select({ unit: items.unit })
            .from(items)
            .where(eq(items.org_id, locals.user.orgId))
            .orderBy(desc(items.created_at))
            .limit(1),
        db
            .select({ hsn_code: items.hsn_code })
            .from(items)
            .where(
                and(
                    eq(items.org_id, locals.user.orgId),
                    isNotNull(items.hsn_code),
                    ne(items.hsn_code, '')
                )
            )
            .groupBy(items.hsn_code)
    ]);

    const lastUsedUnit = lastItemResult[0]?.unit || 'nos';
    const form = await superValidate({ unit: lastUsedUnit }, zod(itemSchema));
    const usedHsnCodes = usedHsnRecords.map(r => r.hsn_code as string);

    return { form, nextSku, lastUsedUnit, usedHsnCodes };
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
            const sku = data.sku || null;

            if (sku && await isSkuTaken(event.locals.user.orgId, sku)) {
                return fail(400, { form, error: 'An item with this SKU already exists.' });
            }

            const itemId = crypto.randomUUID();

            await db.insert(items).values({
                id: itemId,
                org_id: event.locals.user.orgId,
                type: data.type,
                sku,
                name: data.name,
                description: data.description || null,
                hsn_code: data.hsn_code || null,
                rate: data.rate,
                unit: data.unit,
                min_quantity: data.min_quantity,
                gst_rate: data.gst_rate,
                is_active: true,
                created_by: event.locals.user.id,
                updated_by: event.locals.user.id,
            });

            void logActivity({
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

        } catch (error) {
            return failActionFromError(error, 'Item creation failed', { form });
        }

        setFlash(event.cookies, {
            type: 'success',
            message: 'Item created successfully.'
        });
        redirect(302, '/items');
    }
};
