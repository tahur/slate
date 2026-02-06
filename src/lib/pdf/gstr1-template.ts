import type { TDocumentDefinitions, Content, TableCell } from 'pdfmake/interfaces';
import type { GSTR1Data } from '$lib/server/utils/gst-export';

function fmt(amount: number | null | undefined): string {
    const value = amount || 0;
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2
    }).format(value);
}

function fmtDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '\u2014';
    return new Date(dateStr).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

export type GSTR1PdfData = {
    orgName: string;
    gstin: string;
    period: string;
    data: GSTR1Data;
};

export function buildGSTR1DocDefinition(pdfData: GSTR1PdfData): TDocumentDefinitions {
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
                                                { text: orgName || 'OpenBill', fontSize: 14, bold: true },
                                                { text: `GSTIN: ${gstin || 'N/A'}`, fontSize: 9, margin: [0, 2, 0, 0] }
                                            ]
                                        },
                                        {
                                            width: 'auto',
                                            stack: [
                                                { text: 'GSTR-1', fontSize: 22, bold: true, alignment: 'right' },
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
                                    text: 'Summary',
                                    bold: true,
                                    fontSize: 11,
                                    margin: [0, 10, 0, 6]
                                },
                                {
                                    table: {
                                        widths: ['*', '*', '*', '*'],
                                        body: [
                                            [
                                                { text: 'Total Invoices', style: 'summaryLabel' },
                                                { text: 'Taxable Value', style: 'summaryLabel' },
                                                { text: 'Total GST', style: 'summaryLabel' },
                                                { text: 'Total Value', style: 'summaryLabel' }
                                            ],
                                            [
                                                { text: String(data.summary.totalInvoices), style: 'summaryValue' },
                                                { text: fmt(data.summary.totalTaxableValue), style: 'summaryValue' },
                                                { text: fmt(data.summary.totalCgst + data.summary.totalSgst + data.summary.totalIgst), style: 'summaryValue' },
                                                { text: fmt(data.summary.totalValue), style: 'summaryValue' }
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

                                // B2B Section
                                ...(data.b2b.length > 0 ? [
                                    {
                                        text: `B2B Supplies (${data.b2b.length} invoices)`,
                                        bold: true,
                                        fontSize: 10,
                                        margin: [0, 16, 0, 6] as [number, number, number, number]
                                    },
                                    buildB2BTable(data.b2b)
                                ] : []),

                                // B2CL Section
                                ...(data.b2cl.length > 0 ? [
                                    {
                                        text: `B2CL Supplies (${data.b2cl.length} invoices)`,
                                        bold: true,
                                        fontSize: 10,
                                        margin: [0, 16, 0, 6] as [number, number, number, number]
                                    },
                                    buildB2CLTable(data.b2cl)
                                ] : []),

                                // B2CS Section
                                ...(data.b2cs.length > 0 ? [
                                    {
                                        text: `B2CS Supplies (${data.b2cs.length} entries)`,
                                        bold: true,
                                        fontSize: 10,
                                        margin: [0, 16, 0, 6] as [number, number, number, number]
                                    },
                                    buildB2CSTable(data.b2cs)
                                ] : []),

                                // CDNR Section
                                ...(data.cdnr.length > 0 ? [
                                    {
                                        text: `Credit/Debit Notes (${data.cdnr.length} notes)`,
                                        bold: true,
                                        fontSize: 10,
                                        margin: [0, 16, 0, 6] as [number, number, number, number]
                                    },
                                    buildCDNRTable(data.cdnr)
                                ] : []),

                                // HSN Section
                                ...(data.hsn.length > 0 ? [
                                    {
                                        text: `HSN Summary (${data.hsn.length} items)`,
                                        bold: true,
                                        fontSize: 10,
                                        margin: [0, 16, 0, 6] as [number, number, number, number]
                                    },
                                    buildHSNTable(data.hsn)
                                ] : [])
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
            }
        }
    };
}

function buildB2BTable(b2b: GSTR1Data['b2b']): Content {
    const headerRow: TableCell[] = [
        { text: 'GSTIN', style: 'tableHeader' },
        { text: 'Invoice No', style: 'tableHeader' },
        { text: 'Date', style: 'tableHeader' },
        { text: 'POS', style: 'tableHeader' },
        { text: 'Taxable', style: 'tableHeader', alignment: 'right' },
        { text: 'CGST', style: 'tableHeader', alignment: 'right' },
        { text: 'SGST', style: 'tableHeader', alignment: 'right' },
        { text: 'IGST', style: 'tableHeader', alignment: 'right' },
        { text: 'Total', style: 'tableHeader', alignment: 'right' }
    ];

    const rows: TableCell[][] = b2b.map(entry => [
        { text: entry.gstin, fontSize: 6 },
        { text: entry.invoiceNumber },
        { text: fmtDate(entry.invoiceDate) },
        { text: entry.placeOfSupply },
        { text: fmt(entry.taxableValue), alignment: 'right' },
        { text: fmt(entry.cgst), alignment: 'right' },
        { text: fmt(entry.sgst), alignment: 'right' },
        { text: fmt(entry.igst), alignment: 'right' },
        { text: fmt(entry.invoiceValue), alignment: 'right', bold: true }
    ]);

    return {
        table: {
            headerRows: 1,
            widths: ['auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'],
            body: [headerRow, ...rows]
        },
        layout: {
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => '#ddd',
            vLineColor: () => '#ddd',
            fillColor: (rowIndex: number) => rowIndex === 0 ? '#f3f4f6' : null,
            paddingLeft: () => 4,
            paddingRight: () => 4,
            paddingTop: () => 3,
            paddingBottom: () => 3
        }
    };
}

function buildB2CLTable(b2cl: GSTR1Data['b2cl']): Content {
    const headerRow: TableCell[] = [
        { text: 'Invoice No', style: 'tableHeader' },
        { text: 'Date', style: 'tableHeader' },
        { text: 'POS', style: 'tableHeader' },
        { text: 'Taxable', style: 'tableHeader', alignment: 'right' },
        { text: 'IGST', style: 'tableHeader', alignment: 'right' },
        { text: 'Total', style: 'tableHeader', alignment: 'right' }
    ];

    const rows: TableCell[][] = b2cl.map(entry => [
        { text: entry.invoiceNumber },
        { text: fmtDate(entry.invoiceDate) },
        { text: entry.placeOfSupply },
        { text: fmt(entry.taxableValue), alignment: 'right' },
        { text: fmt(entry.igst), alignment: 'right' },
        { text: fmt(entry.invoiceValue), alignment: 'right', bold: true }
    ]);

    return {
        table: {
            headerRows: 1,
            widths: ['auto', 'auto', 'auto', '*', 'auto', 'auto'],
            body: [headerRow, ...rows]
        },
        layout: {
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => '#ddd',
            vLineColor: () => '#ddd',
            fillColor: (rowIndex: number) => rowIndex === 0 ? '#f3f4f6' : null,
            paddingLeft: () => 4,
            paddingRight: () => 4,
            paddingTop: () => 3,
            paddingBottom: () => 3
        }
    };
}

function buildB2CSTable(b2cs: GSTR1Data['b2cs']): Content {
    const headerRow: TableCell[] = [
        { text: 'Place of Supply', style: 'tableHeader' },
        { text: 'Type', style: 'tableHeader' },
        { text: 'Rate', style: 'tableHeader', alignment: 'right' },
        { text: 'Taxable', style: 'tableHeader', alignment: 'right' },
        { text: 'CGST', style: 'tableHeader', alignment: 'right' },
        { text: 'SGST', style: 'tableHeader', alignment: 'right' },
        { text: 'IGST', style: 'tableHeader', alignment: 'right' }
    ];

    const rows: TableCell[][] = b2cs.map(entry => [
        { text: entry.placeOfSupply },
        { text: entry.type },
        { text: `${entry.rate}%`, alignment: 'right' },
        { text: fmt(entry.taxableValue), alignment: 'right' },
        { text: fmt(entry.cgst), alignment: 'right' },
        { text: fmt(entry.sgst), alignment: 'right' },
        { text: fmt(entry.igst), alignment: 'right' }
    ]);

    return {
        table: {
            headerRows: 1,
            widths: ['*', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'],
            body: [headerRow, ...rows]
        },
        layout: {
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => '#ddd',
            vLineColor: () => '#ddd',
            fillColor: (rowIndex: number) => rowIndex === 0 ? '#f3f4f6' : null,
            paddingLeft: () => 4,
            paddingRight: () => 4,
            paddingTop: () => 3,
            paddingBottom: () => 3
        }
    };
}

function buildCDNRTable(cdnr: GSTR1Data['cdnr']): Content {
    const headerRow: TableCell[] = [
        { text: 'GSTIN', style: 'tableHeader' },
        { text: 'Note No', style: 'tableHeader' },
        { text: 'Date', style: 'tableHeader' },
        { text: 'Type', style: 'tableHeader' },
        { text: 'Taxable', style: 'tableHeader', alignment: 'right' },
        { text: 'CGST', style: 'tableHeader', alignment: 'right' },
        { text: 'SGST', style: 'tableHeader', alignment: 'right' },
        { text: 'IGST', style: 'tableHeader', alignment: 'right' },
        { text: 'Total', style: 'tableHeader', alignment: 'right' }
    ];

    const rows: TableCell[][] = cdnr.map(entry => [
        { text: entry.gstin, fontSize: 6 },
        { text: entry.noteNumber },
        { text: fmtDate(entry.noteDate) },
        { text: entry.noteType === 'C' ? 'Credit' : 'Debit' },
        { text: fmt(entry.taxableValue), alignment: 'right' },
        { text: fmt(entry.cgst), alignment: 'right' },
        { text: fmt(entry.sgst), alignment: 'right' },
        { text: fmt(entry.igst), alignment: 'right' },
        { text: fmt(entry.noteValue), alignment: 'right', bold: true }
    ]);

    return {
        table: {
            headerRows: 1,
            widths: ['auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'],
            body: [headerRow, ...rows]
        },
        layout: {
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => '#ddd',
            vLineColor: () => '#ddd',
            fillColor: (rowIndex: number) => rowIndex === 0 ? '#f3f4f6' : null,
            paddingLeft: () => 4,
            paddingRight: () => 4,
            paddingTop: () => 3,
            paddingBottom: () => 3
        }
    };
}

function buildHSNTable(hsn: GSTR1Data['hsn']): Content {
    const headerRow: TableCell[] = [
        { text: 'HSN/SAC', style: 'tableHeader' },
        { text: 'Description', style: 'tableHeader' },
        { text: 'UQC', style: 'tableHeader' },
        { text: 'Qty', style: 'tableHeader', alignment: 'right' },
        { text: 'Taxable', style: 'tableHeader', alignment: 'right' },
        { text: 'CGST', style: 'tableHeader', alignment: 'right' },
        { text: 'SGST', style: 'tableHeader', alignment: 'right' },
        { text: 'IGST', style: 'tableHeader', alignment: 'right' },
        { text: 'Total', style: 'tableHeader', alignment: 'right' }
    ];

    const rows: TableCell[][] = hsn.map(entry => [
        { text: entry.hsnCode },
        { text: entry.description.substring(0, 30) + (entry.description.length > 30 ? '...' : '') },
        { text: entry.uqc },
        { text: String(entry.totalQuantity), alignment: 'right' },
        { text: fmt(entry.taxableValue), alignment: 'right' },
        { text: fmt(entry.cgst), alignment: 'right' },
        { text: fmt(entry.sgst), alignment: 'right' },
        { text: fmt(entry.igst), alignment: 'right' },
        { text: fmt(entry.totalValue), alignment: 'right', bold: true }
    ]);

    return {
        table: {
            headerRows: 1,
            widths: ['auto', '*', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'],
            body: [headerRow, ...rows]
        },
        layout: {
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => '#ddd',
            vLineColor: () => '#ddd',
            fillColor: (rowIndex: number) => rowIndex === 0 ? '#f3f4f6' : null,
            paddingLeft: () => 4,
            paddingRight: () => 4,
            paddingTop: () => 3,
            paddingBottom: () => 3
        }
    };
}
