import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { accounts } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { PageServerLoad, Actions } from './$types';
import { setFlash } from '$lib/server/flash';
import { isUniqueConstraintError } from '$lib/server/utils/db-errors';
import { failActionFromError } from '$lib/server/platform/errors';

const VALID_TYPES = ['asset', 'liability', 'equity', 'income', 'expense'] as const;

export const load: PageServerLoad = async ({ locals }) => {
    const orgId = locals.user!.orgId;

    const accountList = await db
        .select({
            id: accounts.id,
            account_code: accounts.account_code,
            account_name: accounts.account_name,
            account_type: accounts.account_type,
            balance: accounts.balance,
            is_active: accounts.is_active,
        })
        .from(accounts)
        .where(eq(accounts.org_id, orgId))
        .orderBy(accounts.account_code);

    return {
        accounts: accountList
    };
};

export const actions: Actions = {
    create: async ({ request, locals, cookies }) => {
        if (!locals.user) {
            redirect(302, '/login');
        }

        const orgId = locals.user.orgId;
        const formData = await request.formData();

        const code = (formData.get('code') as string || '').trim();
        const name = (formData.get('name') as string || '').trim();
        const type = (formData.get('type') as string || '').trim();

        // Validation
        if (!code) {
            return fail(400, { error: 'Account code is required', code, name, type });
        }
        if (code.length > 10 || !/^[a-zA-Z0-9]+$/.test(code)) {
            return fail(400, { error: 'Code must be 1-10 alphanumeric characters', code, name, type });
        }
        if (!name) {
            return fail(400, { error: 'Account name is required', code, name, type });
        }
        if (name.length > 100) {
            return fail(400, { error: 'Account name must be 100 characters or less', code, name, type });
        }
        if (!VALID_TYPES.includes(type as typeof VALID_TYPES[number])) {
            return fail(400, { error: 'Invalid account type', code, name, type });
        }

        try {
            await db.insert(accounts).values({
                id: crypto.randomUUID(),
                org_id: orgId,
                account_code: code,
                account_name: name,
                account_type: type,
                is_system: false,
                is_active: true,
                balance: 0
            });
        } catch (error) {
            if (isUniqueConstraintError(error)) {
                return fail(409, { error: `Account code "${code}" already exists`, code, name, type });
            }
            return failActionFromError(error, 'Account creation failed');
        }

        setFlash(cookies, { type: 'success', message: `Account "${name}" created` });
        redirect(302, '/accounts');
    }
};
