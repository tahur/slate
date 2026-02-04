import { db } from '$lib/server/db';
import { accounts } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

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
