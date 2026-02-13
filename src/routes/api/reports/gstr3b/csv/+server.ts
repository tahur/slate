import {
    generateCSV,
    GSTR3B_VENDOR_COLUMNS
} from '$lib/server/utils/gst-export';
import {
    buildGstr3bReport,
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
        const gstr3bData = report.data;

        let csvContent = '=== GSTR-3B PURCHASE DATA ===\n';
        csvContent += `Period: ${range.startDate} to ${range.endDate}\n\n`;

        csvContent += '=== ITC SUMMARY ===\n';
        csvContent += `Total Purchases,${gstr3bData.summary.totalPurchases}\n`;
        csvContent += `Total Expense Value,${gstr3bData.summary.totalExpenseValue}\n`;
        csvContent += `Eligible ITC CGST,${gstr3bData.summary.eligibleItcCgst}\n`;
        csvContent += `Eligible ITC SGST,${gstr3bData.summary.eligibleItcSgst}\n`;
        csvContent += `Eligible ITC IGST,${gstr3bData.summary.eligibleItcIgst}\n`;
        csvContent += `Total Eligible ITC,${gstr3bData.summary.totalEligibleItc}\n`;
        csvContent += `Ineligible ITC,${gstr3bData.summary.ineligibleItc}\n\n`;

        csvContent += '=== VENDOR-WISE BREAKDOWN ===\n';
        csvContent += generateCSV(gstr3bData.vendorWise, GSTR3B_VENDOR_COLUMNS);

        const filename = `GSTR3B_${range.startDate}_to_${range.endDate}.csv`;

        return new Response(csvContent, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="${filename}"`
            }
        });
    } catch (error) {
        return jsonFromError(error, 'GSTR-3B CSV export failed');
    }
};
