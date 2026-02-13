import { redirect } from '@sveltejs/kit';
import {
    buildGstr3bReport,
    resolveDateRangeFromUrl
} from '$lib/server/modules/reporting/application/gst-reports';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
    if (!locals.user) {
        redirect(302, '/login');
    }

    const orgId = locals.user.orgId;
    const range = resolveDateRangeFromUrl(url);
    const report = await buildGstr3bReport(orgId, range);

    return {
        startDate: range.startDate,
        endDate: range.endDate,
        period: report.data.period,
        gstin: report.org?.gstin || '',
        data: report.data
    };
};
