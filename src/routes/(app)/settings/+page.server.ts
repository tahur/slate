import { redirect, fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import {
    organizations,
    users,
    number_series,
    app_settings,
    payment_accounts,
    payment_method_account_map,
    payment_methods
} from '$lib/server/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { superValidate } from 'sveltekit-superforms';
import { zod4 as zod } from 'sveltekit-superforms/adapters';
import { orgSettingsSchema, profileSchema, numberSeriesSchema, smtpSettingsSchema } from './schema';
import { getCurrentFiscalYear, getDefaultPrefix } from '$lib/server/services';
import { setFlash } from '$lib/server/flash';
import { testSmtpConnection } from '$lib/server/email';
import { failActionFromError } from '$lib/server/platform/errors';
import { logger } from '$lib/server/platform/observability';
import { hasPaymentConfiguration, seedPaymentConfiguration } from '$lib/server/seed';
import { listDepositAccounts, invalidatePaymentOptionsCache } from '$lib/server/modules/receivables/infra/queries';
import type { Actions, PageServerLoad } from './$types';

const MODULES = ['invoice', 'payment', 'expense', 'credit_note', 'journal'] as const;

export const load: PageServerLoad = async ({ locals }) => {
    try {
        if (!locals.user) {
            redirect(302, '/login');
        }

        const orgId = locals.user.orgId;
        const fy = getCurrentFiscalYear();

        // Fetch org, user, and series in parallel
        const [org, user, seriesRows] = await Promise.all([
            db.query.organizations.findFirst({
                where: eq(organizations.id, orgId)
            }),
            db.query.users.findFirst({
                where: eq(users.id, locals.user.id)
            }),
            db.select()
                .from(number_series)
                .where(
                    and(
                        eq(number_series.org_id, orgId),
                        eq(number_series.fy_year, fy),
                        inArray(number_series.module, MODULES)
                    )
                )
        ]);

        if (!org) {
            redirect(302, '/setup');
        }

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

        // Auto-seed payment config for existing orgs
        if (!(await hasPaymentConfiguration(orgId))) {
            await seedPaymentConfiguration(orgId);
        }

        // Run all payment + SMTP queries in parallel (all independent reads)
        const [paymentModesList, allMappings, depositAccountsList, paymentAccountsList, smtpSettings] = await Promise.all([
            // Payment methods with default mapped account names
            db.select({
                id: payment_methods.id,
                mode_key: payment_methods.method_key,
                label: payment_methods.label,
                linked_account_id: payment_accounts.id,
                linked_account_name: payment_accounts.label,
                is_default: payment_methods.is_default,
                sort_order: payment_methods.sort_order,
                is_active: payment_methods.is_active
            })
            .from(payment_methods)
            .leftJoin(
                payment_method_account_map,
                and(
                    eq(payment_method_account_map.payment_method_id, payment_methods.id),
                    eq(payment_method_account_map.org_id, orgId),
                    eq(payment_method_account_map.is_default, true),
                    eq(payment_method_account_map.is_active, true)
                )
            )
            .leftJoin(payment_accounts, eq(payment_method_account_map.payment_account_id, payment_accounts.id))
            .where(eq(payment_methods.org_id, orgId))
            .orderBy(payment_methods.sort_order, payment_methods.label),

            // All method-account mappings (for multi-account editing)
            db.select({
                methodId: payment_method_account_map.payment_method_id,
                accountId: payment_method_account_map.payment_account_id,
                accountLabel: payment_accounts.label,
                isDefault: payment_method_account_map.is_default
            })
            .from(payment_method_account_map)
            .innerJoin(payment_accounts, eq(payment_method_account_map.payment_account_id, payment_accounts.id))
            .where(and(
                eq(payment_method_account_map.org_id, orgId),
                eq(payment_method_account_map.is_active, true),
                eq(payment_accounts.is_active, true)
            )),

            // Deposit accounts
            listDepositAccounts(orgId),

            // All payment accounts
            db.select({
                id: payment_accounts.id,
                label: payment_accounts.label,
                kind: payment_accounts.kind,
                ledger_code: payment_accounts.ledger_code,
                bank_name: payment_accounts.bank_name,
                account_number_last4: payment_accounts.account_number_last4,
                ifsc: payment_accounts.ifsc,
                upi_id: payment_accounts.upi_id,
                card_label: payment_accounts.card_label,
                is_active: payment_accounts.is_active,
                is_default_receive: payment_accounts.is_default_receive,
                is_default_pay: payment_accounts.is_default_pay,
                sort_order: payment_accounts.sort_order
            })
            .from(payment_accounts)
            .where(eq(payment_accounts.org_id, orgId))
            .orderBy(payment_accounts.sort_order, payment_accounts.label),

            // SMTP settings
            db.query.app_settings.findFirst({
                where: eq(app_settings.org_id, orgId)
            })
        ]);

        // Group mappings by methodId
        const methodMappings: Record<string, { accountId: string; accountLabel: string; isDefault: boolean | null }[]> = {};
        for (const m of allMappings) {
            if (!methodMappings[m.methodId]) methodMappings[m.methodId] = [];
            methodMappings[m.methodId].push({ accountId: m.accountId, accountLabel: m.accountLabel, isDefault: m.isDefault });
        }

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
            depositAccounts: depositAccountsList,
            paymentAccounts: paymentAccountsList,
            methodMappings
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
                pricesIncludeGst: form.data.prices_include_gst,
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

        const form = await superValidate(request, zod(profileSchema), {
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
                    updatedAt: new Date()
                })
                .where(eq(users.id, locals.user.id));
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
    },

    addPaymentMode: async ({ locals, request, cookies }) => {
        if (!locals.user) {
            redirect(302, '/login');
        }

        const orgId = locals.user.orgId;
        const formData = await request.formData();
        const label = (formData.get('label') as string || '').trim();
        const linkedAccountIds = formData.getAll('linked_account_ids').map(v => String(v)).filter(Boolean);

        if (!label) {
            return fail(400, { error: 'Label is required' });
        }

        // Generate method_key from label
        const mode_key = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        if (linkedAccountIds.length > 0) {
            const validAccounts = await db
                .select({ id: payment_accounts.id })
                .from(payment_accounts)
                .where(
                    and(
                        inArray(payment_accounts.id, linkedAccountIds),
                        eq(payment_accounts.org_id, orgId),
                        eq(payment_accounts.is_active, true)
                    )
                );
            if (validAccounts.length !== linkedAccountIds.length) {
                return fail(400, { error: 'Invalid linked payment account' });
            }
        }

        // Get max sort_order
        const maxOrder = await db
            .select({ sort_order: payment_methods.sort_order })
            .from(payment_methods)
            .where(eq(payment_methods.org_id, orgId))
            .orderBy(payment_methods.sort_order);
        const nextOrder = (maxOrder.length > 0 ? Math.max(...maxOrder.map(r => r.sort_order || 0)) : 0) + 1;

        const methodId = crypto.randomUUID();
        await db.insert(payment_methods).values({
            id: methodId,
            org_id: orgId,
            method_key: mode_key,
            label,
            direction: 'both',
            is_default: false,
            sort_order: nextOrder,
            is_active: true
        });

        for (let i = 0; i < linkedAccountIds.length; i++) {
            await db.insert(payment_method_account_map).values({
                id: crypto.randomUUID(),
                org_id: orgId,
                payment_method_id: methodId,
                payment_account_id: linkedAccountIds[i],
                is_default: i === 0,
                is_active: true
            });
        }

        invalidatePaymentOptionsCache(orgId);
        setFlash(cookies, {
            type: 'success',
            message: `Payment method "${label}" added.`
        });

        return { success: true };
    },

    addPaymentAccount: async ({ locals, request, cookies }) => {
        if (!locals.user) {
            redirect(302, '/login');
        }

        const orgId = locals.user.orgId;
        const formData = await request.formData();

        const label = (formData.get('label') as string || '').trim();
        const kindRaw = (formData.get('kind') as string || '').trim().toLowerCase();
        const kind = kindRaw === 'cash' ? 'cash' : kindRaw === 'bank' ? 'bank' : '';

        if (!label) {
            return fail(400, { error: 'Label is required' });
        }
        if (!kind) {
            return fail(400, { error: 'Account type is required' });
        }

        const bank_name = (formData.get('bank_name') as string || '').trim() || null;
        const account_number_last4 = (formData.get('account_number_last4') as string || '').trim() || null;
        const ifsc = (formData.get('ifsc') as string || '').trim().toUpperCase() || null;
        const upi_id = (formData.get('upi_id') as string || '').trim() || null;
        const card_label = (formData.get('card_label') as string || '').trim() || null;

        const maxOrder = await db
            .select({ sort_order: payment_accounts.sort_order })
            .from(payment_accounts)
            .where(eq(payment_accounts.org_id, orgId))
            .orderBy(payment_accounts.sort_order);
        const nextOrder = (maxOrder.length > 0 ? Math.max(...maxOrder.map((r) => r.sort_order || 0)) : 0) + 1;

        await db.insert(payment_accounts).values({
            id: crypto.randomUUID(),
            org_id: orgId,
            label,
            kind,
            ledger_code: kind === 'cash' ? '1000' : '1100',
            bank_name,
            account_number_last4,
            ifsc,
            upi_id,
            card_label,
            is_active: true,
            is_default_receive: false,
            is_default_pay: false,
            sort_order: nextOrder
        });

        invalidatePaymentOptionsCache(orgId);
        setFlash(cookies, {
            type: 'success',
            message: `Payment account "${label}" added.`
        });

        return { success: true };
    },

    updatePaymentAccount: async ({ locals, request, cookies }) => {
        if (!locals.user) {
            redirect(302, '/login');
        }

        const orgId = locals.user.orgId;
        const formData = await request.formData();

        const id = formData.get('id') as string;
        const label = (formData.get('label') as string || '').trim();
        const kindRaw = (formData.get('kind') as string || '').trim().toLowerCase();
        const kind = kindRaw === 'cash' ? 'cash' : kindRaw === 'bank' ? 'bank' : '';

        if (!id || !label || !kind) {
            return fail(400, { error: 'ID, label and type are required' });
        }

        const bank_name = (formData.get('bank_name') as string || '').trim() || null;
        const account_number_last4 = (formData.get('account_number_last4') as string || '').trim() || null;
        const ifsc = (formData.get('ifsc') as string || '').trim().toUpperCase() || null;
        const upi_id = (formData.get('upi_id') as string || '').trim() || null;
        const card_label = (formData.get('card_label') as string || '').trim() || null;

        await db
            .update(payment_accounts)
            .set({
                label,
                kind,
                ledger_code: kind === 'cash' ? '1000' : '1100',
                bank_name,
                account_number_last4,
                ifsc,
                upi_id,
                card_label
            })
            .where(and(eq(payment_accounts.id, id), eq(payment_accounts.org_id, orgId)));

        invalidatePaymentOptionsCache(orgId);
        setFlash(cookies, {
            type: 'success',
            message: `Payment account "${label}" updated.`
        });

        return { success: true };
    },

    deletePaymentAccount: async ({ locals, request, cookies }) => {
        if (!locals.user) {
            redirect(302, '/login');
        }

        const orgId = locals.user.orgId;
        const formData = await request.formData();
        const id = formData.get('id') as string;

        if (!id) {
            return fail(400, { error: 'ID is required' });
        }

        const activeAccounts = await db
            .select({ id: payment_accounts.id })
            .from(payment_accounts)
            .where(and(eq(payment_accounts.org_id, orgId), eq(payment_accounts.is_active, true)));

        if (activeAccounts.length <= 1) {
            return fail(400, { error: 'Cannot delete the last active payment account' });
        }

        const mappedActive = await db
            .select({ id: payment_method_account_map.id })
            .from(payment_method_account_map)
            .innerJoin(payment_methods, eq(payment_method_account_map.payment_method_id, payment_methods.id))
            .where(
                and(
                    eq(payment_method_account_map.org_id, orgId),
                    eq(payment_method_account_map.payment_account_id, id),
                    eq(payment_method_account_map.is_active, true),
                    eq(payment_methods.is_active, true)
                )
            )
            .limit(1);

        if (mappedActive[0]) {
            return fail(400, { error: 'Account is mapped to an active method. Update mapping first.' });
        }

        await db
            .update(payment_accounts)
            .set({ is_active: false })
            .where(and(eq(payment_accounts.id, id), eq(payment_accounts.org_id, orgId)));

        invalidatePaymentOptionsCache(orgId);
        setFlash(cookies, {
            type: 'success',
            message: 'Payment account removed.'
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
        const linkedAccountIds = formData.getAll('linked_account_ids').map(v => String(v)).filter(Boolean);

        if (!id || !label) {
            return fail(400, { error: 'ID and label are required' });
        }

        // Validate all submitted account IDs exist
        if (linkedAccountIds.length > 0) {
            const validAccounts = await db
                .select({ id: payment_accounts.id })
                .from(payment_accounts)
                .where(
                    and(
                        inArray(payment_accounts.id, linkedAccountIds),
                        eq(payment_accounts.org_id, orgId),
                        eq(payment_accounts.is_active, true)
                    )
                );
            const validIds = new Set(validAccounts.map(a => a.id));
            for (const aid of linkedAccountIds) {
                if (!validIds.has(aid)) {
                    return fail(400, { error: 'Invalid linked payment account' });
                }
            }
        }

        // Only update label — keep the original method_key stable
        await db.update(payment_methods)
            .set({ label })
            .where(and(eq(payment_methods.id, id), eq(payment_methods.org_id, orgId)));

        // Sync mappings: get existing, diff, insert/delete
        const existingMappings = await db
            .select({
                id: payment_method_account_map.id,
                accountId: payment_method_account_map.payment_account_id,
                isDefault: payment_method_account_map.is_default
            })
            .from(payment_method_account_map)
            .where(
                and(
                    eq(payment_method_account_map.org_id, orgId),
                    eq(payment_method_account_map.payment_method_id, id),
                    eq(payment_method_account_map.is_active, true)
                )
            );

        const existingAccountIds = new Set(existingMappings.map(m => m.accountId));
        const desiredAccountIds = new Set(linkedAccountIds);

        // Delete mappings that are no longer desired
        for (const existing of existingMappings) {
            if (!desiredAccountIds.has(existing.accountId)) {
                await db.delete(payment_method_account_map)
                    .where(eq(payment_method_account_map.id, existing.id));
            }
        }

        // Insert new mappings
        let isFirstNew = !existingMappings.some(m => desiredAccountIds.has(m.accountId) && m.isDefault);
        for (const accountId of linkedAccountIds) {
            if (!existingAccountIds.has(accountId)) {
                await db.insert(payment_method_account_map).values({
                    id: crypto.randomUUID(),
                    org_id: orgId,
                    payment_method_id: id,
                    payment_account_id: accountId,
                    is_default: isFirstNew,
                    is_active: true
                });
                isFirstNew = false;
            }
        }

        // Ensure at least one mapping is default if any exist
        if (linkedAccountIds.length > 0) {
            const hasDefault = existingMappings.some(m => desiredAccountIds.has(m.accountId) && m.isDefault);
            if (!hasDefault) {
                // Set the first mapping as default
                const firstMapping = await db.query.payment_method_account_map.findFirst({
                    where: and(
                        eq(payment_method_account_map.org_id, orgId),
                        eq(payment_method_account_map.payment_method_id, id),
                        eq(payment_method_account_map.is_active, true)
                    )
                });
                if (firstMapping) {
                    await db.update(payment_method_account_map)
                        .set({ is_default: true })
                        .where(eq(payment_method_account_map.id, firstMapping.id));
                }
            }
        }

        invalidatePaymentOptionsCache(orgId);
        setFlash(cookies, {
            type: 'success',
            message: `Payment method "${label}" updated.`
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
        const activeCount = await db
            .select({ id: payment_methods.id })
            .from(payment_methods)
            .where(and(eq(payment_methods.org_id, orgId), eq(payment_methods.is_active, true)));

        if (activeCount.length <= 1) {
            return fail(400, { error: 'Cannot delete the last active payment method' });
        }

        // Soft-delete
        await db.update(payment_methods)
            .set({ is_active: false })
            .where(and(eq(payment_methods.id, id), eq(payment_methods.org_id, orgId)));

        await db
            .delete(payment_method_account_map)
            .where(
                and(
                    eq(payment_method_account_map.org_id, orgId),
                    eq(payment_method_account_map.payment_method_id, id)
                )
            );

        invalidatePaymentOptionsCache(orgId);
        setFlash(cookies, {
            type: 'success',
            message: 'Payment method removed.'
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
        await db.update(payment_methods)
            .set({ is_default: false })
            .where(eq(payment_methods.org_id, orgId));

        await db.update(payment_methods)
            .set({ is_default: true })
            .where(and(eq(payment_methods.id, id), eq(payment_methods.org_id, orgId)));

        invalidatePaymentOptionsCache(orgId);
        setFlash(cookies, {
            type: 'success',
            message: 'Default payment method updated.'
        });

        return { success: true };
    }
};
