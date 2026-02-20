import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { items, invoice_items, invoices, customers } from '$lib/server/db/schema';
import { eq, and, ne, desc, sum, count, sql, isNotNull } from 'drizzle-orm';
import { superValidate } from 'sveltekit-superforms';
import { zod4 as zod } from 'sveltekit-superforms/adapters';
import { itemSchema } from '../new/schema';
import { setFlash } from '$lib/server/flash';
import { logActivity } from '$lib/server/services';
import { failActionFromError } from '$lib/server/platform/errors';
import type { Actions, PageServerLoad } from './$types';

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

    // Usage stats: count of invoices, total quantity, total revenue
    const [stats] = await db
        .select({
            invoiceCount: count(sql`DISTINCT ${invoice_items.invoice_id}`),
            totalQuantity: sum(invoice_items.quantity),
            totalRevenue: sum(invoice_items.amount),
        })
        .from(invoice_items)
        .innerJoin(invoices, eq(invoice_items.invoice_id, invoices.id))
        .where(
            and(
                eq(invoice_items.item_id, itemId),
                eq(invoices.org_id, orgId)
            )
        );

    const usageStats = {
        invoiceCount: Number(stats?.invoiceCount ?? 0),
        totalQuantity: Number(stats?.totalQuantity ?? 0),
        totalRevenue: Number(stats?.totalRevenue ?? 0),
    };

    // Recent invoices using this item (last 10)
    const recentInvoices = await db
        .select({
            invoiceId: invoices.id,
            invoiceNumber: invoices.invoice_number,
            invoiceDate: invoices.invoice_date,
            customerName: customers.name,
            quantity: invoice_items.quantity,
            amount: invoice_items.amount,
            status: invoices.status,
        })
        .from(invoice_items)
        .innerJoin(invoices, eq(invoice_items.invoice_id, invoices.id))
        .innerJoin(customers, eq(invoices.customer_id, customers.id))
        .where(
            and(
                eq(invoice_items.item_id, itemId),
                eq(invoices.org_id, orgId)
            )
        )
        .orderBy(desc(invoices.invoice_date))
        .limit(10);

    const isUsedInInvoices = usageStats.invoiceCount > 0;

    // Fetch previously used HSN codes for this org
    const usedHsnRecords = await db
        .select({ hsn_code: items.hsn_code })
        .from(items)
        .where(
            and(
                eq(items.org_id, orgId),
                isNotNull(items.hsn_code),
                ne(items.hsn_code, '')
            )
        )
        .groupBy(items.hsn_code);
    const usedHsnCodes = usedHsnRecords.map(r => r.hsn_code as string);

    const form = await superValidate({
        name: item.name,
        type: item.type as 'product' | 'service',
        sku: item.sku || '',
        description: item.description || '',
        hsn_code: item.hsn_code || '',
        rate: item.rate,
        unit: item.unit || 'nos',
        min_quantity: item.min_quantity ?? 1,
        gst_rate: item.gst_rate,
    }, zod(itemSchema));

    return {
        item,
        form,
        isUsedInInvoices,
        usageStats,
        recentInvoices,
        usedHsnCodes,
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
            const sku = data.sku || null;

            if (sku && await isSkuTaken(event.locals.user.orgId, sku, event.params.id)) {
                return fail(400, { form, error: 'An item with this SKU already exists.' });
            }

            db.update(items)
                .set({
                    type: data.type,
                    sku,
                    name: data.name,
                    description: data.description || null,
                    hsn_code: data.hsn_code || null,
                    rate: data.rate,
                    unit: data.unit,
                    min_quantity: data.min_quantity,
                    gst_rate: data.gst_rate,
                    updated_by: event.locals.user.id,
                    updated_at: new Date().toISOString(),
                })
                .where(and(
                    eq(items.id, event.params.id),
                    eq(items.org_id, event.locals.user.orgId)
                ))
                .run();

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
        } catch (error) {
            return failActionFromError(error, 'Item update failed', { form });
        }
    },

    toggleActive: async (event) => {
        if (!event.locals.user) {
            return fail(401, { error: 'Unauthorized' });
        }

        const formData = await event.request.formData();
        const newStatus = formData.get('is_active') === 'true';

        db.update(items)
            .set({
                is_active: newStatus,
                updated_by: event.locals.user.id,
                updated_at: new Date().toISOString(),
            })
            .where(and(
                eq(items.id, event.params.id),
                eq(items.org_id, event.locals.user.orgId)
            ))
            .run();

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

        db.delete(items)
            .where(and(
                eq(items.id, event.params.id),
                eq(items.org_id, event.locals.user.orgId)
            ))
            .run();

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
