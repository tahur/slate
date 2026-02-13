import { generateGSTR1JSON } from '$lib/server/utils/gst-export';
import {
    buildGstr1Report,
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
        const report = await buildGstr1Report(orgId, range);

        const fp = filingPeriodFromDate(range.startDate);
        const jsonData = generateGSTR1JSON(report.data, report.org?.gstin || '', fp);
        const filename = `GSTR1_${range.startDate}_to_${range.endDate}.json`;

        return new Response(JSON.stringify(jsonData, null, 2), {
            headers: {
                'Content-Type': 'application/json',
                'Content-Disposition': `attachment; filename="${filename}"`
            }
        });
    } catch (error) {
        return jsonFromError(error, 'GSTR-1 JSON export failed');
    }
};
