import { generateGSTR3BJSON } from '$lib/server/utils/gst-export';
import {
    buildGstr3bReport,
    filingPeriodFromDate,
    parseDateRangeQueryFromUrl
} from '$lib/server/modules/reporting/application/gst-reports';
import {
    UnauthorizedError,
    jsonFromError
} from '$lib/server/platform/errors';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, url }) => {
    try {
        if (!locals.user) {
            throw new UnauthorizedError();
        }

        const orgId = locals.user.orgId;
        const range = parseDateRangeQueryFromUrl(url);
        const report = await buildGstr3bReport(orgId, range);

        const fp = filingPeriodFromDate(range.startDate);
        const jsonData = generateGSTR3BJSON(report.data, report.org?.gstin || '', fp);
        const filename = `GSTR3B_${range.startDate}_to_${range.endDate}.json`;

        return new Response(JSON.stringify(jsonData, null, 2), {
            headers: {
                'Content-Type': 'application/json',
                'Content-Disposition': `attachment; filename="${filename}"`
            }
        });
    } catch (error) {
        return jsonFromError(error, 'GSTR-3B JSON export failed');
    }
};
