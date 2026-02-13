import {
    buildGstr1Report,
    parseDateRangeQueryFromUrl
} from '$lib/server/modules/reporting/application/gst-reports';
import { buildGSTR1DocDefinition } from '$lib/pdf/gstr1-template';
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
        const report = await buildGstr1Report(orgId, range);

        const doc = buildGSTR1DocDefinition({
            orgName: report.org?.name || 'Slate',
            gstin: report.org?.gstin || '',
            period: report.data.period,
            data: report.data
        });

        const pdf = await generatePdfBuffer(doc);
        const filename = `GSTR1_${range.startDate}_to_${range.endDate}.pdf`;

        return new Response(pdf as BodyInit, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${filename}"`
            }
        });
    } catch (error) {
        return jsonFromError(error, 'GSTR-1 PDF export failed');
    }
};
