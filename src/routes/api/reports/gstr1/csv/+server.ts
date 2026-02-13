import {
    generateCSV,
    GSTR1_B2B_COLUMNS,
    GSTR1_B2CL_COLUMNS,
    GSTR1_B2CS_COLUMNS,
    GSTR1_CDNR_COLUMNS,
    GSTR1_HSN_COLUMNS
} from '$lib/server/utils/gst-export';
import {
    buildGstr1Report,
    parseDateRangeQueryFromUrl,
    parseGstr1CsvSectionFromUrl
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
        const section = parseGstr1CsvSectionFromUrl(url);

        const report = await buildGstr1Report(orgId, range);
        const gstr1Data = report.data;

        let csvContent = '';
        const periodStr = `${range.startDate}_to_${range.endDate}`;

        if (section === 'all') {
            csvContent += '=== B2B SUPPLIES ===\n';
            csvContent += generateCSV(gstr1Data.b2b, GSTR1_B2B_COLUMNS) + '\n\n';

            csvContent += '=== B2CL SUPPLIES ===\n';
            csvContent += generateCSV(gstr1Data.b2cl, GSTR1_B2CL_COLUMNS) + '\n\n';

            csvContent += '=== B2CS SUPPLIES ===\n';
            csvContent += generateCSV(gstr1Data.b2cs, GSTR1_B2CS_COLUMNS) + '\n\n';

            csvContent += '=== CREDIT/DEBIT NOTES ===\n';
            csvContent += generateCSV(gstr1Data.cdnr, GSTR1_CDNR_COLUMNS) + '\n\n';

            csvContent += '=== HSN SUMMARY ===\n';
            csvContent += generateCSV(gstr1Data.hsn, GSTR1_HSN_COLUMNS);
        } else if (section === 'b2b') {
            csvContent = generateCSV(gstr1Data.b2b, GSTR1_B2B_COLUMNS);
        } else if (section === 'b2cl') {
            csvContent = generateCSV(gstr1Data.b2cl, GSTR1_B2CL_COLUMNS);
        } else if (section === 'b2cs') {
            csvContent = generateCSV(gstr1Data.b2cs, GSTR1_B2CS_COLUMNS);
        } else if (section === 'cdnr') {
            csvContent = generateCSV(gstr1Data.cdnr, GSTR1_CDNR_COLUMNS);
        } else if (section === 'hsn') {
            csvContent = generateCSV(gstr1Data.hsn, GSTR1_HSN_COLUMNS);
        }

        const filename = `GSTR1_${section}_${periodStr}.csv`;

        return new Response(csvContent, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="${filename}"`
            }
        });
    } catch (error) {
        return jsonFromError(error, 'GSTR-1 CSV export failed');
    }
};
