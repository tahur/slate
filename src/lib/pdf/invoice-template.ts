import type { TDocumentDefinitions, Content, TableCell } from 'pdfmake/interfaces';
import type { InvoicePdfData } from './types';
import { numberToWords } from '$lib/utils/currency';

const STATE_NAMES: Record<string, string> = {
    '01': 'Jammu & Kashmir',
    '02': 'Himachal Pradesh',
    '03': 'Punjab',
    '04': 'Chandigarh',
    '05': 'Uttarakhand',
    '06': 'Haryana',
    '07': 'Delhi',
    '08': 'Rajasthan',
    '09': 'Uttar Pradesh',
    '10': 'Bihar',
    '11': 'Sikkim',
    '12': 'Arunachal Pradesh',
    '13': 'Nagaland',
    '14': 'Manipur',
    '15': 'Mizoram',
    '16': 'Tripura',
    '17': 'Meghalaya',
    '18': 'Assam',
    '19': 'West Bengal',
    '20': 'Jharkhand',
    '21': 'Odisha',
    '22': 'Chhattisgarh',
    '23': 'Madhya Pradesh',
    '24': 'Gujarat',
    '26': 'Dadra & Nagar Haveli and Daman & Diu',
    '27': 'Maharashtra',
    '29': 'Karnataka',
    '30': 'Goa',
    '31': 'Lakshadweep',
    '32': 'Kerala',
    '33': 'Tamil Nadu',
    '34': 'Puducherry',
    '35': 'Andaman & Nicobar Islands',
    '36': 'Telangana',
    '37': 'Andhra Pradesh',
    '38': 'Ladakh'
};

function stateName(code: string | null | undefined): string {
    if (!code) return '';
    return STATE_NAMES[code] || code;
}

function clean(value: string | null | undefined): string {
    return (value || '').trim();
}

function upper(value: string | null | undefined): string {
    return clean(value).toUpperCase();
}

function fmtMoney(value: number | null | undefined): string {
    const amount = Number(value || 0);
    return `Rs.${new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount)}`;
}

function fmtDate(value: string | null | undefined): string {
    if (!value) return '-';
    return new Date(value).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

function fmtQty(value: number | null | undefined): string {
    const qty = Number(value || 0);
    if (Number.isInteger(qty)) return String(qty);
    return qty.toFixed(3).replace(/\.?0+$/, '');
}

function buildMetaTable(pairs: Array<[string, string]>): Content {
    const rows: TableCell[][] = pairs
        .filter(([, value]) => clean(value).length > 0)
        .map(([label, value]) => [
            { text: label, style: 'metaLabel' },
            { text: value, style: 'metaValue' }
        ]);

    if (rows.length === 0) {
        rows.push([
            { text: '-', style: 'metaLabel' },
            { text: '-', style: 'metaValue' }
        ]);
    }

    return {
        table: {
            widths: [72, '*'],
            body: rows
        },
        layout: {
            hLineWidth: () => 0,
            vLineWidth: () => 0,
            paddingLeft: () => 0,
            paddingRight: () => 0,
            paddingTop: () => 1,
            paddingBottom: () => 1
        }
    };
}

function buildAddressLines(data: InvoicePdfData): string[] {
    const { customer } = data;
    const lines: string[] = [];

    const customerHeading = upper(customer?.company_name || customer?.name) || 'CUSTOMER';
    lines.push(customerHeading);

    if (customer?.company_name && customer?.name) {
        lines.push(`Attn: ${upper(customer.name)}`);
    }

    if (customer?.billing_address) lines.push(upper(customer.billing_address));

    const cityStatePin = [
        upper(customer?.city),
        customer?.state_code ? stateName(customer.state_code).toUpperCase() : '',
        customer?.pincode
    ]
        .filter((part) => clean(part).length > 0)
        .join(', ');

    if (cityStatePin) lines.push(cityStatePin);

    if (customer?.gstin) lines.push(`GSTIN: ${customer.gstin}`);

    return lines;
}

export function buildInvoiceDocDefinition(data: InvoicePdfData): TDocumentDefinitions {
    const { org, invoice, items, customer } = data;

    const isIntra = !invoice.is_inter_state;
    const amountPaid = Number(invoice.amount_paid || 0);
    const balanceDue = Number(invoice.balance_due || 0);
    const isPaid = balanceDue <= 0.01;

    const placeOfSupplyCode = customer?.place_of_supply || customer?.state_code || null;
    const supplyType = isIntra ? 'Intra-State (CGST + SGST)' : 'Inter-State (IGST)';

    const orgLines: Content[] = [
        {
            text: upper(org?.name) || 'COMPANY NAME',
            style: 'orgName'
        }
    ];

    const orgAddress = [
        upper(org?.address),
        upper(org?.city),
        org?.pincode
    ]
        .filter((part) => clean(part).length > 0)
        .join(', ');
    orgLines.push({
        text: orgAddress || 'Address not set in Settings',
        style: 'orgMeta'
    });
    orgLines.push({
        text: org?.state_code
            ? `State: ${stateName(org.state_code)} (${org.state_code})`
            : 'State: -',
        style: 'orgMeta'
    });
    orgLines.push({
        text: `GSTIN: ${org?.gstin || 'UNREGISTERED'}`,
        style: 'orgMetaStrong'
    });
    if (org?.phone) orgLines.push({ text: `Phone: ${org.phone}`, style: 'orgMeta' });
    if (org?.email) orgLines.push({ text: `Email: ${org.email}`, style: 'orgMeta' });

    const leftMetaPairs: Array<[string, string]> = [
        ['Invoice #', clean(invoice.invoice_number)],
        ['Invoice Date', fmtDate(invoice.invoice_date)],
        ['Due Date', fmtDate(invoice.due_date)],
        ['Order / PO', clean(invoice.order_number)]
    ];

    const rightMetaPairs: Array<[string, string]> = [
        ['Supply Type', supplyType],
        [
            'Place of Supply',
            placeOfSupplyCode
                ? `${stateName(placeOfSupplyCode)} (${placeOfSupplyCode})`
                : '-'
        ],
        ['GST Mode', invoice.prices_include_gst ? 'Prices include GST' : 'Prices exclude GST'],
        ['Status', String(invoice.status || '').toUpperCase()]
    ];

    const billAddressLines = buildAddressLines(data);
    const shipAddressLines = [...billAddressLines];

    const itemWidths = isIntra
        ? [18, '*', 50, 34, 50, 28, 46, 28, 46, 58]
        : [18, '*', 52, 36, 54, 30, 48, 64];

    const headerRows: TableCell[][] = isIntra
        ? [
              [
                  { text: '#', style: 'itemHead', alignment: 'center', rowSpan: 2 },
                  { text: 'Item & Description', style: 'itemHead', rowSpan: 2 },
                  { text: 'HSN/SAC', style: 'itemHead', alignment: 'center', rowSpan: 2 },
                  { text: 'Qty', style: 'itemHead', alignment: 'center', rowSpan: 2 },
                  { text: 'Rate', style: 'itemHead', alignment: 'right', rowSpan: 2 },
                  { text: 'CGST', style: 'itemHead', alignment: 'center', colSpan: 2 },
                  {} as TableCell,
                  { text: 'SGST', style: 'itemHead', alignment: 'center', colSpan: 2 },
                  {} as TableCell,
                  { text: 'Amount', style: 'itemHead', alignment: 'right', rowSpan: 2 }
              ],
              [
                  {} as TableCell,
                  {} as TableCell,
                  {} as TableCell,
                  {} as TableCell,
                  {} as TableCell,
                  { text: '%', style: 'itemSubHead', alignment: 'right' },
                  { text: 'Amt', style: 'itemSubHead', alignment: 'right' },
                  { text: '%', style: 'itemSubHead', alignment: 'right' },
                  { text: 'Amt', style: 'itemSubHead', alignment: 'right' },
                  {} as TableCell
              ]
          ]
        : [
              [
                  { text: '#', style: 'itemHead', alignment: 'center', rowSpan: 2 },
                  { text: 'Item & Description', style: 'itemHead', rowSpan: 2 },
                  { text: 'HSN/SAC', style: 'itemHead', alignment: 'center', rowSpan: 2 },
                  { text: 'Qty', style: 'itemHead', alignment: 'center', rowSpan: 2 },
                  { text: 'Rate', style: 'itemHead', alignment: 'right', rowSpan: 2 },
                  { text: 'IGST', style: 'itemHead', alignment: 'center', colSpan: 2 },
                  {} as TableCell,
                  { text: 'Amount', style: 'itemHead', alignment: 'right', rowSpan: 2 }
              ],
              [
                  {} as TableCell,
                  {} as TableCell,
                  {} as TableCell,
                  {} as TableCell,
                  {} as TableCell,
                  { text: '%', style: 'itemSubHead', alignment: 'right' },
                  { text: 'Amt', style: 'itemSubHead', alignment: 'right' },
                  {} as TableCell
              ]
          ];

    const itemRows: TableCell[][] = items.map((item, index) => {
        const descriptionParts = clean(item.description).split('\n');
        const itemName = descriptionParts[0] || '-';
        const itemNotes = descriptionParts.slice(1).join(' ').trim();

        const descriptionCell: TableCell = itemNotes
            ? {
                  stack: [
                      { text: itemName, style: 'itemName' },
                      { text: itemNotes, style: 'itemNote' }
                  ]
              }
            : {
                  text: itemName,
                  style: 'itemName'
              };

        if (isIntra) {
            const halfRate = Number(item.gst_rate || 0) / 2;
            return [
                { text: String(index + 1), style: 'cell', alignment: 'center' },
                descriptionCell,
                { text: clean(item.hsn_code) || '-', style: 'cell', alignment: 'center' },
                {
                    text: `${fmtQty(item.quantity)}${item.unit ? ` ${item.unit}` : ''}`,
                    style: 'cell',
                    alignment: 'center'
                },
                { text: fmtMoney(item.rate), style: 'cell', alignment: 'right' },
                { text: `${halfRate}%`, style: 'cellMuted', alignment: 'right' },
                { text: fmtMoney(item.cgst), style: 'cell', alignment: 'right' },
                { text: `${halfRate}%`, style: 'cellMuted', alignment: 'right' },
                { text: fmtMoney(item.sgst), style: 'cell', alignment: 'right' },
                { text: fmtMoney(item.total), style: 'cellStrong', alignment: 'right' }
            ];
        }

        return [
            { text: String(index + 1), style: 'cell', alignment: 'center' },
            descriptionCell,
            { text: clean(item.hsn_code) || '-', style: 'cell', alignment: 'center' },
            {
                text: `${fmtQty(item.quantity)}${item.unit ? ` ${item.unit}` : ''}`,
                style: 'cell',
                alignment: 'center'
            },
            { text: fmtMoney(item.rate), style: 'cell', alignment: 'right' },
            { text: `${Number(item.gst_rate || 0)}%`, style: 'cellMuted', alignment: 'right' },
            { text: fmtMoney(item.igst), style: 'cell', alignment: 'right' },
            { text: fmtMoney(item.total), style: 'cellStrong', alignment: 'right' }
        ];
    });

    if (itemRows.length === 0) {
        const colCount = isIntra ? 10 : 8;
        itemRows.push([
            {
                text: 'No line items',
                colSpan: colCount,
                alignment: 'center',
                style: 'emptyRow'
            },
            ...Array.from({ length: colCount - 1 }, () => ({} as TableCell))
        ]);
    }

    const taxRows: TableCell[][] = [
        [
            { text: 'Sub Total', style: 'summaryLabel' },
            { text: fmtMoney(invoice.subtotal), style: 'summaryValue', alignment: 'right' }
        ]
    ];

    if (isIntra) {
        taxRows.push(
            [
                { text: 'CGST', style: 'summaryLabel' },
                { text: fmtMoney(invoice.cgst), style: 'summaryValue', alignment: 'right' }
            ],
            [
                { text: 'SGST', style: 'summaryLabel' },
                { text: fmtMoney(invoice.sgst), style: 'summaryValue', alignment: 'right' }
            ]
        );
    } else {
        taxRows.push([
            { text: 'IGST', style: 'summaryLabel' },
            { text: fmtMoney(invoice.igst), style: 'summaryValue', alignment: 'right' }
        ]);
    }

    const roundOff =
        Math.round(
            (Number(invoice.total || 0) -
                (Number(invoice.subtotal || 0) +
                    Number(invoice.cgst || 0) +
                    Number(invoice.sgst || 0) +
                    Number(invoice.igst || 0))) *
                100,
        ) / 100;

    if (Math.abs(roundOff) >= 0.01) {
        taxRows.push([
            { text: 'Round Off', style: 'summaryLabel' },
            { text: fmtMoney(roundOff), style: 'summaryValue', alignment: 'right' }
        ]);
    }

    taxRows.push([
        { text: 'Grand Total', style: 'summaryTotalLabel', fillColor: '#eef2f7' },
        {
            text: fmtMoney(invoice.total),
            style: 'summaryTotalValue',
            alignment: 'right',
            fillColor: '#eef2f7'
        }
    ]);

    if (amountPaid > 0.01) {
        taxRows.push([
            { text: 'Payment Received', style: 'paymentLabel' },
            { text: `(-) ${fmtMoney(amountPaid)}`, style: 'paymentValue', alignment: 'right' }
        ]);
    }

    if (!isPaid) {
        taxRows.push([
            { text: 'Balance Due', style: 'balanceLabel' },
            { text: fmtMoney(balanceDue), style: 'balanceValue', alignment: 'right' }
        ]);
    }

    const bankDetails: string[] = [];
    if (org?.bank_name) bankDetails.push(`Bank: ${org.bank_name}`);
    if (org?.account_number) bankDetails.push(`A/c No: ${org.account_number}`);
    if (org?.ifsc) bankDetails.push(`IFSC: ${org.ifsc}`);
    if (org?.branch) bankDetails.push(`Branch: ${org.branch}`);
    if (org?.upi_id) bankDetails.push(`UPI: ${org.upi_id}`);

    const footerLeft: Content[] = [
        { text: 'Total In Words', style: 'sectionLabel' },
        { text: numberToWords(Number(invoice.total || 0)), style: 'wordsValue' }
    ];

    if (bankDetails.length > 0) {
        footerLeft.push(
            {
                text: 'Bank Details',
                style: 'sectionLabel',
                margin: [0, 8, 0, 0] as [number, number, number, number]
            },
            {
                text: bankDetails.join('\n'),
                style: 'detailText'
            }
        );
    }

    if (clean(invoice.notes)) {
        footerLeft.push(
            {
                text: 'Notes',
                style: 'sectionLabel',
                margin: [0, 8, 0, 0] as [number, number, number, number]
            },
            {
                text: clean(invoice.notes),
                style: 'detailText'
            }
        );
    }

    if (clean(invoice.terms)) {
        footerLeft.push(
            {
                text: 'Terms & Conditions',
                style: 'sectionLabel',
                margin: [0, 8, 0, 0] as [number, number, number, number]
            },
            {
                text: clean(invoice.terms),
                style: 'detailText'
            }
        );
    }

    const summaryAndSign: Content[] = [
        {
            table: {
                widths: ['*', 86],
                body: taxRows
            },
            layout: {
                hLineWidth: (i: number, node: any) =>
                    i === 0 || i === node.table.body.length ? 0 : 0.5,
                vLineWidth: () => 0,
                hLineColor: () => '#c6ccd4',
                paddingLeft: () => 4,
                paddingRight: () => 2,
                paddingTop: () => 3,
                paddingBottom: () => 3
            }
        },
        {
            stack: [
                { text: ' ', margin: [0, 20, 0, 0] as [number, number, number, number] },
                ...(org?.signature_url
                    ? [
                          {
                              image: org.signature_url,
                              width: 90,
                              alignment: 'center' as const,
                              margin: [0, 0, 0, 4] as [number, number, number, number]
                          }
                      ]
                    : []),
                {
                    canvas: [
                        {
                            type: 'line',
                            x1: 22,
                            y1: 0,
                            x2: 178,
                            y2: 0,
                            lineWidth: 0.7,
                            lineColor: '#9aa4b2'
                        }
                    ]
                },
                {
                    text: `For ${upper(org?.name) || 'COMPANY'}`,
                    style: 'signName',
                    alignment: 'center',
                    margin: [0, 4, 0, 0] as [number, number, number, number]
                },
                {
                    text: 'Authorized Signatory',
                    style: 'signLabel',
                    alignment: 'center',
                    margin: [0, 2, 0, 0] as [number, number, number, number]
                }
            ]
        }
    ];

    const mainSheet: Content = {
        table: {
            widths: ['*'],
            body: [
                [
                    {
                        columns: [
                            {
                                width: '70%',
                                stack: [
                                    org?.logo_url
                                        ? {
                                              columns: [
                                                  {
                                                      width: 58,
                                                      image: org.logo_url,
                                                      fit: [54, 54]
                                                  },
                                                  {
                                                      width: '*',
                                                      stack: orgLines,
                                                      margin: [8, 0, 0, 0] as [
                                                          number,
                                                          number,
                                                          number,
                                                          number
                                                      ]
                                                  }
                                              ]
                                          }
                                        : { stack: orgLines }
                                ]
                            },
                            {
                                width: '30%',
                                stack: [
                                    {
                                        text: 'TAX INVOICE',
                                        style: 'invoiceTitle',
                                        alignment: 'right' as const
                                    },
                                    ...(isPaid
                                        ? [
                                                  {
                                                      text: 'PAID',
                                                      style: 'paidStamp',
                                                      alignment: 'right' as const,
                                                      margin: [0, 6, 0, 0] as [
                                                          number,
                                                          number,
                                                      number,
                                                      number
                                                  ]
                                              }
                                          ]
                                        : [])
                                ]
                            }
                        ],
                        margin: [10, 8, 10, 8] as [number, number, number, number]
                    }
                ],
                [
                    {
                        columns: [
                            {
                                width: '50%',
                                stack: [
                                    { text: 'Invoice Details', style: 'sectionLabel' },
                                    buildMetaTable(leftMetaPairs)
                                ]
                            },
                            {
                                width: '50%',
                                stack: [
                                    { text: 'Supply Details', style: 'sectionLabel' },
                                    buildMetaTable(rightMetaPairs)
                                ]
                            }
                        ],
                        columnGap: 14,
                        margin: [10, 6, 10, 8] as [number, number, number, number]
                    }
                ],
                [
                    {
                        columns: [
                            {
                                width: '50%',
                                stack: [
                                    { text: 'Bill To', style: 'sectionLabel' },
                                    ...billAddressLines.map((line, idx) => ({
                                        text: line,
                                        style: idx === 0 ? 'partyName' : idx === billAddressLines.length - 1 && line.startsWith('GSTIN') ? 'partyMetaStrong' : 'partyMeta'
                                    }))
                                ]
                            },
                            {
                                width: '50%',
                                stack: [
                                    { text: 'Ship To', style: 'sectionLabel' },
                                    ...shipAddressLines.map((line, idx) => ({
                                        text: line,
                                        style: idx === 0 ? 'partyName' : idx === shipAddressLines.length - 1 && line.startsWith('GSTIN') ? 'partyMetaStrong' : 'partyMeta'
                                    }))
                                ]
                            }
                        ],
                        columnGap: 14,
                        margin: [10, 6, 10, 8] as [number, number, number, number]
                    }
                ],
                [
                    {
                        table: {
                            headerRows: 2,
                            widths: itemWidths,
                            body: [...headerRows, ...itemRows]
                        },
                        layout: {
                            hLineWidth: (i: number, node: any) =>
                                i === 0 || i === node.table.body.length ? 0 : 0.5,
                            vLineWidth: (i: number, node: any) =>
                                i === 0 || i === node.table.widths.length ? 0 : 0.5,
                            hLineColor: () => '#c6ccd4',
                            vLineColor: () => '#c6ccd4',
                            fillColor: (rowIndex: number) => {
                                if (rowIndex === 0) return '#eef2f7';
                                if (rowIndex === 1) return '#f8fafc';
                                return null;
                            },
                            paddingLeft: () => 4,
                            paddingRight: () => 4,
                            paddingTop: () => 4,
                            paddingBottom: () => 4
                        },
                        margin: [0, 0, 0, 0] as [number, number, number, number]
                    }
                ],
                [
                    {
                        columns: [
                            {
                                width: '58%',
                                stack: footerLeft
                            },
                            {
                                width: '42%',
                                stack: summaryAndSign
                            }
                        ],
                        columnGap: 12,
                        margin: [10, 8, 10, 10] as [number, number, number, number]
                    }
                ]
            ]
        },
        layout: {
            hLineWidth: () => 0.8,
            vLineWidth: () => 0.8,
            hLineColor: () => '#98a3b3',
            vLineColor: () => '#98a3b3',
            paddingLeft: () => 0,
            paddingRight: () => 0,
            paddingTop: () => 0,
            paddingBottom: () => 0
        }
    };

    return {
        pageSize: 'A4',
        pageMargins: [18, 16, 18, 16],
        content: [
            mainSheet,
            {
                text: 'This is a computer-generated invoice and does not require a physical signature.',
                alignment: 'center',
                fontSize: 7,
                color: '#7b8492',
                margin: [0, 8, 0, 0] as [number, number, number, number]
            }
        ],
        defaultStyle: {
            font: 'Helvetica',
            fontSize: 9,
            color: '#0f172a'
        },
        styles: {
            orgName: {
                fontSize: 14,
                bold: true
            },
            orgMeta: {
                fontSize: 8,
                color: '#1e293b'
            },
            orgMetaStrong: {
                fontSize: 8,
                bold: true,
                color: '#0f172a'
            },
            invoiceTitle: {
                fontSize: 22,
                bold: true,
                color: '#111827'
            },
            paidStamp: {
                fontSize: 10,
                bold: true,
                color: '#166534'
            },
            sectionLabel: {
                fontSize: 8,
                bold: true,
                color: '#1e293b'
            },
            metaLabel: {
                fontSize: 8,
                color: '#1e293b'
            },
            metaValue: {
                fontSize: 8.5,
                bold: true,
                color: '#0f172a'
            },
            partyName: {
                fontSize: 9,
                bold: true,
                color: '#0f172a'
            },
            partyMeta: {
                fontSize: 8,
                color: '#1e293b'
            },
            partyMetaStrong: {
                fontSize: 8,
                bold: true,
                color: '#0f172a'
            },
            itemHead: {
                fontSize: 8,
                bold: true,
                color: '#1e293b'
            },
            itemSubHead: {
                fontSize: 7.5,
                bold: true,
                color: '#334155'
            },
            itemName: {
                fontSize: 8.5,
                bold: true,
                color: '#0f172a'
            },
            itemNote: {
                fontSize: 7.5,
                color: '#334155'
            },
            cell: {
                fontSize: 8,
                color: '#0f172a'
            },
            cellMuted: {
                fontSize: 7.5,
                color: '#334155'
            },
            cellStrong: {
                fontSize: 8,
                bold: true,
                color: '#0f172a'
            },
            emptyRow: {
                fontSize: 8,
                italics: true,
                color: '#334155'
            },
            wordsValue: {
                fontSize: 9,
                bold: true,
                italics: true,
                color: '#111827'
            },
            detailText: {
                fontSize: 8,
                color: '#1e293b',
                lineHeight: 1.3
            },
            summaryLabel: {
                fontSize: 8.5,
                color: '#1e293b'
            },
            summaryValue: {
                fontSize: 8.5,
                color: '#0f172a'
            },
            summaryTotalLabel: {
                fontSize: 9,
                bold: true,
                color: '#0f172a'
            },
            summaryTotalValue: {
                fontSize: 9.5,
                bold: true,
                color: '#0f172a'
            },
            paymentLabel: {
                fontSize: 8,
                color: '#166534'
            },
            paymentValue: {
                fontSize: 8,
                color: '#166534'
            },
            balanceLabel: {
                fontSize: 9,
                bold: true,
                color: '#b91c1c'
            },
            balanceValue: {
                fontSize: 9.5,
                bold: true,
                color: '#b91c1c'
            },
            signName: {
                fontSize: 8,
                bold: true,
                color: '#0f172a'
            },
            signLabel: {
                fontSize: 7.5,
                color: '#334155'
            }
        }
    };
}
