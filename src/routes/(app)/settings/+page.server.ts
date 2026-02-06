import { redirect, fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { organizations, users, number_series, app_settings } from '$lib/server/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { orgSettingsSchema, profileSchema, numberSeriesSchema, smtpSettingsSchema } from './schema';
import { getCurrentFiscalYear, getDefaultPrefix } from '$lib/server/services';
import { setFlash } from '$lib/server/flash';
import { testSmtpConnection } from '$lib/server/email';
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
                invoice_terms_default: org.invoice_terms_default || ''
            },
            zod4(orgSettingsSchema),
            { id: 'org-settings' }
        );

        const profileForm = await superValidate(
            {
                name: user?.name || '',
                email: user?.email || ''
            },
            zod4(profileSchema),
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
            zod4(numberSeriesSchema),
            { id: 'series-settings' }
        );

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
            zod4(smtpSettingsSchema),
            { id: 'smtp-settings' }
        );

        return {
            orgForm,
            profileForm,
            seriesForm,
            smtpForm,
            smtpEnabled: smtpSettings?.smtp_enabled || false,
            fyYear: fy
        };
    } catch (e) {
        console.error("SETTINGS LOAD ERROR:", e);
        throw e;
    }
};

export const actions: Actions = {
    updateOrg: async ({ locals, request, cookies }) => {
        if (!locals.user) {
            redirect(302, '/login');
        }

        const form = await superValidate(request, zod4(orgSettingsSchema), {
            id: 'org-settings'
        });
        if (!form.valid) {
            return fail(400, { form });
        }

        await db
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
                updated_at: new Date().toISOString()
            } as any)
            .where(eq(organizations.id, locals.user.orgId));

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

        const form = await superValidate(request, zod4(profileSchema), {
            id: 'profile-settings'
        });
        if (!form.valid) {
            return fail(400, { form });
        }

        try {
            await db
                .update(users)
                .set({
                    name: form.data.name,
                    email: form.data.email,
                    updated_at: new Date().toISOString()
                })
                .where(eq(users.id, locals.user.id));
        } catch (error) {
            return fail(500, {
                form,
                error: 'Failed to update profile'
            });
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

        const form = await superValidate(request, zod4(numberSeriesSchema), {
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
                await db
                    .update(number_series)
                    .set({ prefix: entry.prefix })
                    .where(eq(number_series.id, existing.id));
            } else {
                await db.insert(number_series).values({
                    id: crypto.randomUUID(),
                    org_id: orgId,
                    module: entry.module,
                    prefix: entry.prefix,
                    fy_year: fy,
                    current_number: 0,
                    reset_on_fy: true
                });
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

        const form = await superValidate(request, zod4(smtpSettingsSchema), {
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
                await db
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
                    .where(eq(app_settings.id, existing.id));
            } else {
                await db.insert(app_settings).values({
                    id: crypto.randomUUID(),
                    org_id: orgId,
                    smtp_host: form.data.smtp_host,
                    smtp_port: form.data.smtp_port,
                    smtp_user: form.data.smtp_user,
                    smtp_pass: form.data.smtp_pass,
                    smtp_from: form.data.smtp_from || form.data.smtp_user,
                    smtp_secure: form.data.smtp_secure,
                    smtp_enabled: true
                });
            }

            setFlash(cookies, {
                type: 'success',
                message: 'Email settings saved successfully.'
            });

            return { form };
        } catch (error) {
            console.error('Failed to save SMTP settings:', error);
            return fail(500, {
                form,
                error: 'Failed to save email settings'
            });
        }
    },

    testSmtp: async ({ locals, request }) => {
        if (!locals.user) {
            redirect(302, '/login');
        }

        const form = await superValidate(request, zod4(smtpSettingsSchema), {
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

        await db
            .update(app_settings)
            .set({
                smtp_enabled: false,
                updated_at: new Date().toISOString()
            })
            .where(eq(app_settings.org_id, orgId));

        setFlash(cookies, {
            type: 'success',
            message: 'Email disabled.'
        });

        return { success: true };
    }
};
