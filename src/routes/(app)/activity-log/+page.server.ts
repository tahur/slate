import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { audit_log, users } from '$lib/server/db/schema';
import { eq, desc, and, gte, lte } from 'drizzle-orm';
import { parsePagination } from '$lib/server/platform/db/pagination';
import { localDateStr } from '$lib/utils/date';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
    if (!locals.user) {
        redirect(302, '/login');
    }

    const orgId = locals.user.orgId;

    // Date filter - default to last 30 days
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const fromParam = url.searchParams.get('from');
    const toParam = url.searchParams.get('to');
    const entityTypeParam = url.searchParams.get('type');

    const startDate = fromParam || localDateStr(thirtyDaysAgo);
    const endDate = toParam || localDateStr(today);
    const pagination = parsePagination(url.searchParams, { defaultPageSize: 200, maxPageSize: 500 });

    // Build where conditions
    const conditions = [
        eq(audit_log.org_id, orgId),
        gte(audit_log.created_at, startDate),
        lte(audit_log.created_at, endDate + 'T23:59:59')
    ];

    if (entityTypeParam && entityTypeParam !== 'all') {
        conditions.push(eq(audit_log.entity_type, entityTypeParam));
    }

    // Fetch activity logs with user info
    const logs = await db
        .select({
            id: audit_log.id,
            entity_type: audit_log.entity_type,
            entity_id: audit_log.entity_id,
            action: audit_log.action,
            changed_fields: audit_log.changed_fields,
            created_at: audit_log.created_at,
            user_id: audit_log.user_id,
            user_name: users.name,
            user_email: users.email
        })
        .from(audit_log)
        .leftJoin(users, eq(audit_log.user_id, users.id))
        .where(and(...conditions))
        .orderBy(desc(audit_log.created_at))
        .limit(pagination.pageSize)
        .offset(pagination.offset);

    return {
        logs,
        startDate,
        endDate,
        entityType: entityTypeParam || 'all',
        page: pagination.page,
        pageSize: pagination.pageSize
    };
};
