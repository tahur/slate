import {
    buildGstr3bReport,
    parseDateRangeQueryFromUrl
} from '$lib/server/modules/reporting/application/gst-reports';
import { buildGSTR3BDocDefinition } from '$lib/pdf/gstr3b-template';
import { generatePdfBuffer } from '$lib/pdf/generate';
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

        const doc = buildGSTR3BDocDefinition({
            orgName: report.org?.name || 'Slate',
            gstin: report.org?.gstin || '',
            period: report.data.period,
            data: report.data
        });

        const pdf = await generatePdfBuffer(doc);
        const filename = `GSTR3B_${range.startDate}_to_${range.endDate}.pdf`;

        return new Response(pdf as BodyInit, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${filename}"`
            }
        });
    } catch (error) {
        return jsonFromError(error, 'GSTR-3B PDF export failed');
    }
};
