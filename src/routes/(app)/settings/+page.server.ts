import { redirect, fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { organizations, users, number_series, app_settings, payment_modes, accounts } from '$lib/server/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { superValidate } from 'sveltekit-superforms';
import { zod4 as zod } from 'sveltekit-superforms/adapters';
import { orgSettingsSchema, profileSchema, numberSeriesSchema, smtpSettingsSchema } from './schema';
import { getCurrentFiscalYear, getDefaultPrefix } from '$lib/server/services';
import { setFlash } from '$lib/server/flash';
import { testSmtpConnection } from '$lib/server/email';
import { failActionFromError } from '$lib/server/platform/errors';
import { logger } from '$lib/server/platform/observability';
import { hasPaymentModes, seedPaymentModes } from '$lib/server/seed';
import { listDepositAccounts } from '$lib/server/modules/receivables/infra/queries';
import type { Actions, PageServerLoad } from './$types';

const MODULES = ['invoice', 'payment', 'expense', 'credit_note', 'journal'] as const;

export const load: PageServerLoad = async ({ locals }) => {
    try {
        if (!locals.user) {
            redirect(302, '/login');
        }

        const orgId = locals.user.orgId;
        const fy = getCurrentFiscalYear();

        const org = await db.query.organizations.findFirst({
            where: eq(organizations.id, orgId)
        });

        if (!org) {
            redirect(302, '/setup');
        }

        const user = await db.query.users.findFirst({
            where: eq(users.id, locals.user.id)
        });

        const seriesRows = await db
            .select()
            .from(number_series)
            .where(
                and(
                    eq(number_series.org_id, orgId),
                    eq(number_series.fy_year, fy),
                    inArray(number_series.module, MODULES)
                )
            );

        const seriesMap = new Map(seriesRows.map((row) => [row.module, row.prefix]));

        const orgForm = await superValidate(
            {
                name: org.name,
                email: org.email || '',
                phone: org.phone || '',
                address: org.address || '',
                city: org.city || '',
                state_code: org.state_code,
                pincode: org.pincode || '',
                gstin: org.gstin || '',
                pan: org.pan || '',
                currency: org.currency || 'INR',
                fy_start_month: org.fy_start_month || 4,
                bank_name: org.bank_name || '',
                branch: org.branch || '',
                account_number: org.account_number || '',
                ifsc: org.ifsc || '',
                upi_id: (org as any).upi_id || '',
                logo_url: org.logo_url || '',
                signature_url: (org as any).signature_url || '',
                invoice_notes_default: org.invoice_notes_default || '',
                invoice_terms_default: org.invoice_terms_default || '',
                prices_include_gst: (org as any).pricesIncludeGst || false
            },
            zod(orgSettingsSchema),
            { id: 'org-settings' }
        );

        const profileForm = await superValidate(
            {
                name: user?.name || '',
                email: user?.email || ''
            },
            zod(profileSchema),
            { id: 'profile-settings' }
        );

        const seriesForm = await superValidate(
            {
                invoice_prefix: seriesMap.get('invoice') || getDefaultPrefix('invoice'),
                payment_prefix: seriesMap.get('payment') || getDefaultPrefix('payment'),
                expense_prefix: seriesMap.get('expense') || getDefaultPrefix('expense'),
                credit_note_prefix: seriesMap.get('credit_note') || getDefaultPrefix('credit_note'),
                journal_prefix: seriesMap.get('journal') || getDefaultPrefix('journal')
            },
            zod(numberSeriesSchema),
            { id: 'series-settings' }
        );

        // Auto-seed payment modes for existing orgs
        if (!hasPaymentModes(orgId)) {
            seedPaymentModes(orgId);
        }

        // Load payment modes with linked account names
        const paymentModesList = db
            .select({
                id: payment_modes.id,
                mode_key: payment_modes.mode_key,
                label: payment_modes.label,
                linked_account_id: payment_modes.linked_account_id,
                linked_account_name: accounts.account_name,
                is_default: payment_modes.is_default,
                sort_order: payment_modes.sort_order,
                is_active: payment_modes.is_active
            })
            .from(payment_modes)
            .leftJoin(accounts, eq(payment_modes.linked_account_id, accounts.id))
            .where(eq(payment_modes.org_id, orgId))
            .orderBy(payment_modes.sort_order)
            .all();

        const depositAccounts = await listDepositAccounts(orgId);

        // Get SMTP settings
        const smtpSettings = await db.query.app_settings.findFirst({
            where: eq(app_settings.org_id, orgId)
        });

        const smtpForm = await superValidate(
            {
                smtp_host: smtpSettings?.smtp_host || '',
                smtp_port: smtpSettings?.smtp_port || 587,
                smtp_user: smtpSettings?.smtp_user || '',
                smtp_pass: smtpSettings?.smtp_pass || '',
                smtp_from: smtpSettings?.smtp_from || '',
                smtp_secure: smtpSettings?.smtp_secure || false
            },
            zod(smtpSettingsSchema),
            { id: 'smtp-settings' }
        );

        return {
            orgId,
            orgForm,
            profileForm,
            seriesForm,
            smtpForm,
            smtpEnabled: smtpSettings?.smtp_enabled || false,
            fyYear: fy,
            paymentModes: paymentModesList,
            depositAccounts
        };
    } catch (e) {
        logger.error('settings_load_failed', {}, e);
        throw e;
    }
};

export const actions: Actions = {
    updateOrg: async ({ locals, request, cookies }) => {
        if (!locals.user) {
            redirect(302, '/login');
        }

        const form = await superValidate(request, zod(orgSettingsSchema), {
            id: 'org-settings'
        });
        if (!form.valid) {
            return fail(400, { form });
        }

        db
            .update(organizations)
            .set({
                name: form.data.name,
                email: form.data.email || null,
                phone: form.data.phone || null,
                address: form.data.address || null,
                city: form.data.city || null,
                state_code: form.data.state_code,
                pincode: form.data.pincode || null,
                gstin: form.data.gstin || null,
                pan: form.data.pan || null,
                currency: form.data.currency,
                fy_start_month: form.data.fy_start_month,
                bank_name: form.data.bank_name || null,
                branch: form.data.branch || null,
                account_number: form.data.account_number || null,
                ifsc: form.data.ifsc || null,
                upi_id: form.data.upi_id || null,
                logo_url: form.data.logo_url || null,
                signature_url: form.data.signature_url || null,
                invoice_notes_default: form.data.invoice_notes_default || null,
                invoice_terms_default: form.data.invoice_terms_default || null,
                pricesIncludeGst: form.data.prices_include_gst,
                updated_at: new Date().toISOString()
            } as any)
            .where(eq(organizations.id, locals.user.orgId))
            .run();

        setFlash(cookies, {
            type: 'success',
            message: 'Organization settings updated.'
        });

        return { form };
    },

    updateProfile: async ({ locals, request, cookies }) => {
        if (!locals.user) {
            redirect(302, '/login');
        }

        const form = await superValidate(request, zod(profileSchema), {
            id: 'profile-settings'
        });
        if (!form.valid) {
            return fail(400, { form });
        }

        try {
            db
                .update(users)
                .set({
                    name: form.data.name,
                    email: form.data.email,
                    updatedAt: new Date()
                })
                .where(eq(users.id, locals.user.id))
                .run();
        } catch (error) {
            return failActionFromError(error, 'Profile update failed', { form });
        }

        setFlash(cookies, {
            type: 'success',
            message: 'Profile updated successfully.'
        });

        return { form };
    },

    updateSeries: async ({ locals, request, cookies }) => {
        if (!locals.user) {
            redirect(302, '/login');
        }

        const form = await superValidate(request, zod(numberSeriesSchema), {
            id: 'series-settings'
        });
        if (!form.valid) {
            return fail(400, { form });
        }

        const orgId = locals.user.orgId;
        const fy = getCurrentFiscalYear();

        const entries = [
            { module: 'invoice', prefix: form.data.invoice_prefix.toUpperCase() },
            { module: 'payment', prefix: form.data.payment_prefix.toUpperCase() },
            { module: 'expense', prefix: form.data.expense_prefix.toUpperCase() },
            { module: 'credit_note', prefix: form.data.credit_note_prefix.toUpperCase() },
            { module: 'journal', prefix: form.data.journal_prefix.toUpperCase() }
        ] as const;

        for (const entry of entries) {
            const existing = await db.query.number_series.findFirst({
                where: and(
                    eq(number_series.org_id, orgId),
                    eq(number_series.fy_year, fy),
                    eq(number_series.module, entry.module)
                )
            });

            if (existing) {
                db
                    .update(number_series)
                    .set({ prefix: entry.prefix })
                    .where(eq(number_series.id, existing.id))
                    .run();
            } else {
                db.insert(number_series).values({
                    id: crypto.randomUUID(),
                    org_id: orgId,
                    module: entry.module,
                    prefix: entry.prefix,
                    fy_year: fy,
                    current_number: 0,
                    reset_on_fy: true
                }).run();
            }
        }

        setFlash(cookies, {
            type: 'success',
            message: 'Number series updated.'
        });

        return { form };
    },

    updateSmtp: async ({ locals, request, cookies }) => {
        if (!locals.user) {
            redirect(302, '/login');
        }

        const form = await superValidate(request, zod(smtpSettingsSchema), {
            id: 'smtp-settings'
        });

        if (!form.valid) {
            return fail(400, { form });
        }

        const orgId = locals.user.orgId;

        try {
            // Check if settings exist
            const existing = await db.query.app_settings.findFirst({
                where: eq(app_settings.org_id, orgId)
            });

            if (existing) {
                db
                    .update(app_settings)
                    .set({
                        smtp_host: form.data.smtp_host,
                        smtp_port: form.data.smtp_port,
                        smtp_user: form.data.smtp_user,
                        smtp_pass: form.data.smtp_pass,
                        smtp_from: form.data.smtp_from || form.data.smtp_user,
                        smtp_secure: form.data.smtp_secure,
                        smtp_enabled: true,
                        updated_at: new Date().toISOString()
                    })
                    .where(eq(app_settings.id, existing.id))
                    .run();
            } else {
                db.insert(app_settings).values({
                    id: crypto.randomUUID(),
                    org_id: orgId,
                    smtp_host: form.data.smtp_host,
                    smtp_port: form.data.smtp_port,
                    smtp_user: form.data.smtp_user,
                    smtp_pass: form.data.smtp_pass,
                    smtp_from: form.data.smtp_from || form.data.smtp_user,
                    smtp_secure: form.data.smtp_secure,
                    smtp_enabled: true
                }).run();
            }

            setFlash(cookies, {
                type: 'success',
                message: 'Email settings saved successfully.'
            });

            return { form };
        } catch (error) {
            return failActionFromError(error, 'SMTP settings update failed', { form });
        }
    },

    testSmtp: async ({ locals, request }) => {
        if (!locals.user) {
            redirect(302, '/login');
        }

        const form = await superValidate(request, zod(smtpSettingsSchema), {
            id: 'smtp-settings'
        });

        if (!form.valid) {
            return fail(400, { form, testResult: { success: false, error: 'Invalid form data' } });
        }

        const result = await testSmtpConnection({
            host: form.data.smtp_host,
            port: form.data.smtp_port,
            user: form.data.smtp_user,
            pass: form.data.smtp_pass,
            from: form.data.smtp_from || form.data.smtp_user,
            secure: form.data.smtp_secure
        });

        return { form, testResult: result };
    },

    disableSmtp: async ({ locals, cookies }) => {
        if (!locals.user) {
            redirect(302, '/login');
        }

        const orgId = locals.user.orgId;

        db
            .update(app_settings)
            .set({
                smtp_enabled: false,
                updated_at: new Date().toISOString()
            })
            .where(eq(app_settings.org_id, orgId))
            .run();

        setFlash(cookies, {
            type: 'success',
            message: 'Email disabled.'
        });

        return { success: true };
    },

    addPaymentMode: async ({ locals, request, cookies }) => {
        if (!locals.user) {
            redirect(302, '/login');
        }

        const orgId = locals.user.orgId;
        const formData = await request.formData();
        const label = (formData.get('label') as string || '').trim();
        const linked_account_id = formData.get('linked_account_id') as string || null;

        if (!label) {
            return fail(400, { error: 'Label is required' });
        }

        // Generate mode_key from label
        const mode_key = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        // Get max sort_order
        const maxOrder = db
            .select({ sort_order: payment_modes.sort_order })
            .from(payment_modes)
            .where(eq(payment_modes.org_id, orgId))
            .orderBy(payment_modes.sort_order)
            .all();
        const nextOrder = (maxOrder.length > 0 ? Math.max(...maxOrder.map(r => r.sort_order || 0)) : 0) + 1;

        db.insert(payment_modes).values({
            id: crypto.randomUUID(),
            org_id: orgId,
            mode_key,
            label,
            linked_account_id: linked_account_id || null,
            is_default: false,
            sort_order: nextOrder,
            is_active: true
        }).run();

        setFlash(cookies, {
            type: 'success',
            message: `Payment mode "${label}" added.`
        });

        return { success: true };
    },

    updatePaymentMode: async ({ locals, request, cookies }) => {
        if (!locals.user) {
            redirect(302, '/login');
        }

        const orgId = locals.user.orgId;
        const formData = await request.formData();
        const id = formData.get('id') as string;
        const label = (formData.get('label') as string || '').trim();
        const linked_account_id = formData.get('linked_account_id') as string || null;

        if (!id || !label) {
            return fail(400, { error: 'ID and label are required' });
        }

        const mode_key = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        db.update(payment_modes)
            .set({
                label,
                mode_key,
                linked_account_id: linked_account_id || null
            })
            .where(and(eq(payment_modes.id, id), eq(payment_modes.org_id, orgId)))
            .run();

        setFlash(cookies, {
            type: 'success',
            message: `Payment mode "${label}" updated.`
        });

        return { success: true };
    },

    deletePaymentMode: async ({ locals, request, cookies }) => {
        if (!locals.user) {
            redirect(302, '/login');
        }

        const orgId = locals.user.orgId;
        const formData = await request.formData();
        const id = formData.get('id') as string;

        if (!id) {
            return fail(400, { error: 'ID is required' });
        }

        // Prevent deleting the last active mode
        const activeCount = db
            .select({ id: payment_modes.id })
            .from(payment_modes)
            .where(and(eq(payment_modes.org_id, orgId), eq(payment_modes.is_active, true)))
            .all();

        if (activeCount.length <= 1) {
            return fail(400, { error: 'Cannot delete the last active payment mode' });
        }

        // Soft-delete
        db.update(payment_modes)
            .set({ is_active: false })
            .where(and(eq(payment_modes.id, id), eq(payment_modes.org_id, orgId)))
            .run();

        setFlash(cookies, {
            type: 'success',
            message: 'Payment mode removed.'
        });

        return { success: true };
    },

    setDefaultPaymentMode: async ({ locals, request, cookies }) => {
        if (!locals.user) {
            redirect(302, '/login');
        }

        const orgId = locals.user.orgId;
        const formData = await request.formData();
        const id = formData.get('id') as string;

        if (!id) {
            return fail(400, { error: 'ID is required' });
        }

        // Unset all defaults, then set the chosen one
        db.update(payment_modes)
            .set({ is_default: false })
            .where(eq(payment_modes.org_id, orgId))
            .run();

        db.update(payment_modes)
            .set({ is_default: true })
            .where(and(eq(payment_modes.id, id), eq(payment_modes.org_id, orgId)))
            .run();

        setFlash(cookies, {
            type: 'success',
            message: 'Default payment mode updated.'
        });

        return { success: true };
    }
};
