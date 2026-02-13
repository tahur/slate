import type { TDocumentDefinitions, Content, TableCell } from 'pdfmake/interfaces';
import type { GSTR3BData } from '$lib/server/utils/gst-export';

function fmt(amount: number | null | undefined): string {
    const value = amount || 0;
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2
    }).format(value);
}

export type GSTR3BPdfData = {
    orgName: string;
    gstin: string;
    period: string;
    data: GSTR3BData;
};

export function buildGSTR3BDocDefinition(pdfData: GSTR3BPdfData): TDocumentDefinitions {
    const { orgName, gstin, period, data } = pdfData;

    const content: Content[] = [
        {
            table: {
                widths: ['*'],
                body: [
                    [
                        {
                            stack: [
                                // Header
                                {
                                    columns: [
                                        {
                                            width: '*',
                                            stack: [
                                                { text: orgName || 'Slate', fontSize: 14, bold: true },
                                                { text: `GSTIN: ${gstin || 'N/A'}`, fontSize: 9, margin: [0, 2, 0, 0] }
                                            ]
                                        },
                                        {
                                            width: 'auto',
                                            stack: [
                                                { text: 'GSTR-3B', fontSize: 22, bold: true, alignment: 'right' },
                                                { text: 'Purchase / ITC Data', fontSize: 9, alignment: 'right', margin: [0, 2, 0, 0] },
                                                { text: period, fontSize: 9, alignment: 'right', margin: [0, 4, 0, 0] }
                                            ]
                                        }
                                    ],
                                    margin: [0, 0, 0, 8]
                                },

                                // Separator
                                { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5 }] },

                                // Summary Section
                                {
                                    text: 'ITC Summary',
                                    bold: true,
                                    fontSize: 11,
                                    margin: [0, 10, 0, 6]
                                },
                                {
                                    table: {
                                        widths: ['*', '*', '*', '*', '*'],
                                        body: [
                                            [
                                                { text: 'Total Purchases', style: 'summaryLabel' },
                                                { text: 'Expense Value', style: 'summaryLabel' },
                                                { text: 'Eligible ITC', style: 'summaryLabel' },
                                                { text: 'Ineligible ITC', style: 'summaryLabel' },
                                                { text: 'Net ITC', style: 'summaryLabel' }
                                            ],
                                            [
                                                { text: String(data.summary.totalPurchases), style: 'summaryValue' },
                                                { text: fmt(data.summary.totalExpenseValue), style: 'summaryValue' },
                                                { text: fmt(data.summary.totalEligibleItc), style: 'summaryValueGreen' },
                                                { text: fmt(data.summary.ineligibleItc), style: 'summaryValueRed' },
                                                { text: fmt(data.summary.totalEligibleItc), style: 'summaryValueGreen' }
                                            ]
                                        ]
                                    },
                                    layout: {
                                        hLineWidth: () => 0.5,
                                        vLineWidth: () => 0.5,
                                        hLineColor: () => '#ddd',
                                        vLineColor: () => '#ddd',
                                        paddingLeft: () => 6,
                                        paddingRight: () => 6,
                                        paddingTop: () => 4,
                                        paddingBottom: () => 4
                                    }
                                },

                                // ITC Breakdown
                                {
                                    text: 'Eligible ITC Breakdown',
                                    bold: true,
                                    fontSize: 10,
                                    margin: [0, 16, 0, 6]
                                },
                                {
                                    table: {
                                        widths: ['*', '*', '*'],
                                        body: [
                                            [
                                                { text: 'CGST', style: 'tableHeader', alignment: 'center' },
                                                { text: 'SGST', style: 'tableHeader', alignment: 'center' },
                                                { text: 'IGST', style: 'tableHeader', alignment: 'center' }
                                            ],
                                            [
                                                { text: fmt(data.summary.eligibleItcCgst), alignment: 'center', bold: true },
                                                { text: fmt(data.summary.eligibleItcSgst), alignment: 'center', bold: true },
                                                { text: fmt(data.summary.eligibleItcIgst), alignment: 'center', bold: true }
                                            ]
                                        ]
                                    },
                                    layout: {
                                        hLineWidth: () => 0.5,
                                        vLineWidth: () => 0.5,
                                        hLineColor: () => '#ddd',
                                        vLineColor: () => '#ddd',
                                        fillColor: (rowIndex: number) => rowIndex === 0 ? '#f3f4f6' : null,
                                        paddingLeft: () => 8,
                                        paddingRight: () => 8,
                                        paddingTop: () => 6,
                                        paddingBottom: () => 6
                                    }
                                },

                                // Vendor-wise Section
                                ...(data.vendorWise.length > 0 ? [
                                    {
                                        text: `Vendor-wise Breakdown (${data.vendorWise.length} vendors)`,
                                        bold: true,
                                        fontSize: 10,
                                        margin: [0, 16, 0, 6] as [number, number, number, number]
                                    },
                                    buildVendorTable(data.vendorWise)
                                ] : []),

                                // Note
                                {
                                    text: 'Note: ITC is only eligible from GST-registered vendors. Please reconcile with GSTR-2B before filing.',
                                    fontSize: 8,
                                    color: '#666',
                                    italics: true,
                                    margin: [0, 12, 0, 0]
                                }
                            ],
                            margin: [8, 8, 8, 8]
                        }
                    ]
                ]
            },
            layout: {
                hLineWidth: () => 1,
                vLineWidth: () => 1,
                hLineColor: () => '#000',
                vLineColor: () => '#000'
            }
        },
        {
            text: 'This is a computer generated document.',
            alignment: 'center',
            fontSize: 8,
            color: '#666',
            margin: [0, 12, 0, 0]
        }
    ];

    return {
        pageSize: 'A4',
        pageOrientation: 'landscape',
        pageMargins: [28, 28, 28, 28],
        content,
        defaultStyle: {
            font: 'Helvetica',
            fontSize: 8
        },
        styles: {
            tableHeader: {
                bold: true,
                fontSize: 7,
                fillColor: '#f3f4f6'
            },
            summaryLabel: {
                fontSize: 8,
                color: '#666',
                alignment: 'center' as const
            },
            summaryValue: {
                fontSize: 10,
                bold: true,
                alignment: 'center' as const
            },
            summaryValueGreen: {
                fontSize: 10,
                bold: true,
                alignment: 'center' as const,
                color: '#16a34a'
            },
            summaryValueRed: {
                fontSize: 10,
                bold: true,
                alignment: 'center' as const,
                color: '#dc2626'
            }
        }
    };
}

function buildVendorTable(vendors: GSTR3BData['vendorWise']): Content {
    const headerRow: TableCell[] = [
        { text: 'Vendor Name', style: 'tableHeader' },
        { text: 'GSTIN', style: 'tableHeader' },
        { text: 'Expenses', style: 'tableHeader', alignment: 'center' },
        { text: 'Amount', style: 'tableHeader', alignment: 'right' },
        { text: 'CGST', style: 'tableHeader', alignment: 'right' },
        { text: 'SGST', style: 'tableHeader', alignment: 'right' },
        { text: 'IGST', style: 'tableHeader', alignment: 'right' },
        { text: 'Total Tax', style: 'tableHeader', alignment: 'right' },
        { text: 'ITC Eligible', style: 'tableHeader', alignment: 'center' }
    ];

    const rows: TableCell[][] = vendors.map(vendor => [
        { text: vendor.vendorName },
        { text: vendor.gstin || '-', fontSize: 6 },
        { text: String(vendor.expenseCount), alignment: 'center' },
        { text: fmt(vendor.totalAmount), alignment: 'right' },
        { text: fmt(vendor.cgst), alignment: 'right' },
        { text: fmt(vendor.sgst), alignment: 'right' },
        { text: fmt(vendor.igst), alignment: 'right' },
        { text: fmt(vendor.totalTax), alignment: 'right', bold: true },
        { text: vendor.isRegistered ? 'Yes' : 'No', alignment: 'center', color: vendor.isRegistered ? '#16a34a' : '#dc2626' }
    ]);

    // Footer row
    const totalAmount = vendors.reduce((sum, v) => sum + v.totalAmount, 0);
    const totalCgst = vendors.reduce((sum, v) => sum + v.cgst, 0);
    const totalSgst = vendors.reduce((sum, v) => sum + v.sgst, 0);
    const totalIgst = vendors.reduce((sum, v) => sum + v.igst, 0);
    const totalTax = vendors.reduce((sum, v) => sum + v.totalTax, 0);
    const totalExpenses = vendors.reduce((sum, v) => sum + v.expenseCount, 0);

    const footerRow: TableCell[] = [
        { text: 'Total', bold: true },
        { text: '' },
        { text: String(totalExpenses), alignment: 'center', bold: true },
        { text: fmt(totalAmount), alignment: 'right', bold: true },
        { text: fmt(totalCgst), alignment: 'right', bold: true },
        { text: fmt(totalSgst), alignment: 'right', bold: true },
        { text: fmt(totalIgst), alignment: 'right', bold: true },
        { text: fmt(totalTax), alignment: 'right', bold: true },
        { text: '' }
    ];

    return {
        table: {
            headerRows: 1,
            widths: ['*', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'],
            body: [headerRow, ...rows, footerRow]
        },
        layout: {
            hLineWidth: (i: number, node: { table: { body: unknown[] } }) => {
                if (i === 0 || i === 1 || i === node.table.body.length - 1 || i === node.table.body.length) {
                    return 0.5;
                }
                return 0.25;
            },
            vLineWidth: () => 0.5,
            hLineColor: (i: number, node: { table: { body: unknown[] } }) => {
                if (i === node.table.body.length - 1) return '#000';
                return '#ddd';
            },
            vLineColor: () => '#ddd',
            fillColor: (rowIndex: number, node: { table: { body: unknown[] } }) => {
                if (rowIndex === 0) return '#f3f4f6';
                if (rowIndex === node.table.body.length - 1) return '#f3f4f6';
                return null;
            },
            paddingLeft: () => 4,
            paddingRight: () => 4,
            paddingTop: () => 3,
            paddingBottom: () => 3
        }
    };
}
