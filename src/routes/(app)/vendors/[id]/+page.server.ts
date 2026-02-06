import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { vendors, expenses } from '$lib/server/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { superValidate } from 'sveltekit-superforms';
import { zod4 as zod } from 'sveltekit-superforms/adapters';
import { vendorSchema } from '../new/schema';
import { addCurrency } from '$lib/utils/currency';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
    if (!locals.user) {
        redirect(302, '/login');
    }

    const orgId = locals.user.orgId;
    const vendorId = params.id;

    const vendor = await db.query.vendors.findFirst({
        where: and(
            eq(vendors.id, vendorId),
            eq(vendors.org_id, orgId)
        )
    });

    if (!vendor) {
        redirect(302, '/vendors');
    }

    // Fetch all expenses for this vendor
    const vendorExpenses = await db
        .select({
            id: expenses.id,
            expense_number: expenses.expense_number,
            expense_date: expenses.expense_date,
            category: expenses.category,
            description: expenses.description,
            amount: expenses.amount,
            cgst: expenses.cgst,
            sgst: expenses.sgst,
            igst: expenses.igst,
            total: expenses.total,
        })
        .from(expenses)
        .where(and(
            eq(expenses.org_id, orgId),
            eq(expenses.vendor_id, vendorId)
        ))
        .orderBy(desc(expenses.expense_date));

    // Calculate summary stats
    const totalExpenses = vendorExpenses.reduce((sum, exp) => addCurrency(sum, exp.total), 0);
    const totalInputGst = vendorExpenses.reduce((sum, exp) =>
        addCurrency(sum, exp.cgst || 0, exp.sgst || 0, exp.igst || 0), 0);

    // Pre-populate form with vendor data for edit modal
    const form = await superValidate({
        name: vendor.name,
        company_name: vendor.company_name || '',
        display_name: vendor.display_name || '',
        email: vendor.email || '',
        phone: vendor.phone || '',
        website: vendor.website || '',
        billing_address: vendor.billing_address || '',
        city: vendor.city || '',
        state_code: vendor.state_code || '',
        pincode: vendor.pincode || '',
        gstin: vendor.gstin || '',
        gst_treatment: vendor.gst_treatment as 'registered' | 'unregistered' | 'composition' | 'overseas',
        pan: vendor.pan || '',
        payment_terms: vendor.payment_terms || 30,
        tds_applicable: vendor.tds_applicable === 1,
        tds_section: vendor.tds_section || '',
        notes: vendor.notes || '',
    }, zod(vendorSchema));

    return {
        vendor,
        form,
        expenses: vendorExpenses,
        summary: {
            totalExpenses,
            totalInputGst,
            expenseCount: vendorExpenses.length,
            balance: vendor.balance || 0,
        }
    };
};

export const actions: Actions = {
    default: async (event) => {
        const form = await superValidate(event, zod(vendorSchema));

        if (!form.valid) {
            return fail(400, { form });
        }

        if (!event.locals.user) {
            return fail(401, { form, error: 'Unauthorized' });
        }

        try {
            const data = form.data;

            await db.update(vendors)
                .set({
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
                    updated_by: event.locals.user.id,
                    updated_at: new Date().toISOString(),
                })
                .where(and(
                    eq(vendors.id, event.params.id),
                    eq(vendors.org_id, event.locals.user.orgId)
                ));

            return { form, success: true };
        } catch (e) {
            console.error(e);
            return fail(500, { form, error: 'Failed to update vendor' });
        }
    }
};
