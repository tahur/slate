import { db } from '$lib/server/db';
import { payment_methods, supplier_payments, vendors } from '$lib/server/db/schema';
import { and, desc, eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
    const orgId = locals.user!.orgId;

    const rows = await db
        .select({
            id: supplier_payments.id,
            supplier_payment_number: supplier_payments.supplier_payment_number,
            payment_date: supplier_payments.payment_date,
            amount: supplier_payments.amount,
            payment_mode: supplier_payments.payment_mode,
            reference: supplier_payments.reference,
            vendor_id: supplier_payments.vendor_id,
            vendor_name: vendors.name,
            vendor_display_name: vendors.display_name,
            method_label: payment_methods.label
        })
        .from(supplier_payments)
        .leftJoin(vendors, eq(supplier_payments.vendor_id, vendors.id))
        .leftJoin(
            payment_methods,
            and(
                eq(supplier_payments.payment_method_id, payment_methods.id),
                eq(payment_methods.org_id, orgId)
            )
        )
        .where(eq(supplier_payments.org_id, orgId))
        .orderBy(desc(supplier_payments.payment_date), desc(supplier_payments.created_at));

    return {
        payments: rows
    };
};

