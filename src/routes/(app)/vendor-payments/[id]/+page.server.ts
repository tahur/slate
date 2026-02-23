import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import {
    expenses,
    organizations,
    payment_accounts,
    payment_methods,
    supplier_payment_allocations,
    supplier_payments,
    vendors
} from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
    if (!locals.user) {
        redirect(302, '/login');
    }

    const orgId = locals.user.orgId;

    const paymentRows = await db
        .select({
            id: supplier_payments.id,
            supplier_payment_number: supplier_payments.supplier_payment_number,
            payment_date: supplier_payments.payment_date,
            amount: supplier_payments.amount,
            payment_mode: supplier_payments.payment_mode,
            reference: supplier_payments.reference,
            notes: supplier_payments.notes,
            vendor_id: supplier_payments.vendor_id,
            vendor_name: vendors.name,
            vendor_display_name: vendors.display_name,
            method_label: payment_methods.label,
            account_label: payment_accounts.label,
            created_at: supplier_payments.created_at
        })
        .from(supplier_payments)
        .leftJoin(vendors, eq(supplier_payments.vendor_id, vendors.id))
        .leftJoin(payment_methods, eq(supplier_payments.payment_method_id, payment_methods.id))
        .leftJoin(payment_accounts, eq(supplier_payments.payment_account_id, payment_accounts.id))
        .where(and(eq(supplier_payments.id, params.id), eq(supplier_payments.org_id, orgId)))
        .limit(1);

    const payment = paymentRows[0];
    if (!payment) {
        redirect(302, '/vendor-payments');
    }

    const [allocations, org] = await Promise.all([
        db
            .select({
                id: supplier_payment_allocations.id,
                amount: supplier_payment_allocations.amount,
                expense_id: expenses.id,
                expense_number: expenses.expense_number,
                expense_date: expenses.expense_date,
                expense_total: expenses.total
            })
            .from(supplier_payment_allocations)
            .leftJoin(expenses, eq(supplier_payment_allocations.expense_id, expenses.id))
            .where(eq(supplier_payment_allocations.supplier_payment_id, params.id)),
        db.query.organizations.findFirst({
            where: eq(organizations.id, orgId)
        })
    ]);

    return {
        payment,
        allocations,
        org
    };
};

