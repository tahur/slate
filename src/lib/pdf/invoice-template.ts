import type { TDocumentDefinitions, Content, TableCell } from 'pdfmake/interfaces';
import type { InvoicePdfData } from './types';
import { numberToWords } from '$lib/utils/currency';

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

export function buildInvoiceDocDefinition(data: InvoicePdfData): TDocumentDefinitions {
	const { org, invoice, items, customer } = data;
	const isIntra = !invoice.is_inter_state;

	// --- Item rows ---
	const itemHeaderCols: TableCell[] = [
		{ text: '#', style: 'tableHeader', alignment: 'center' },
		{ text: 'Item & Description', style: 'tableHeader', alignment: 'left' },
		{ text: 'HSN/SAC', style: 'tableHeader', alignment: 'center' },
		{ text: 'Qty', style: 'tableHeader', alignment: 'center' },
		{ text: 'Rate', style: 'tableHeader', alignment: 'right' }
	];

	if (isIntra) {
		itemHeaderCols.push(
			{ text: 'CGST', style: 'tableHeader', alignment: 'right' },
			{ text: 'SGST', style: 'tableHeader', alignment: 'right' }
		);
	} else {
		itemHeaderCols.push({ text: 'IGST', style: 'tableHeader', alignment: 'right' });
	}
	itemHeaderCols.push({ text: 'Amount', style: 'tableHeader', alignment: 'right' });

	const itemRows: TableCell[][] = items.map((item, i) => {
		const rate = item.gst_rate || 0;
		const splitRate = isIntra ? rate / 2 : rate;
		const gstAmt = (item.amount * rate) / 100;
		const splitAmt = isIntra ? gstAmt / 2 : gstAmt;

		const row: TableCell[] = [
			{ text: String(i + 1), alignment: 'center' },
			{ text: item.description || '' },
			{ text: item.hsn_code || '', alignment: 'center' },
			{ text: `${item.quantity} ${item.unit || ''}`, alignment: 'center' },
			{ text: fmt(item.rate), alignment: 'right' }
		];

		if (isIntra) {
			row.push(
				{ text: `${splitRate}%\n${fmt(splitAmt)}`, alignment: 'right', fontSize: 8 },
				{ text: `${splitRate}%\n${fmt(splitAmt)}`, alignment: 'right', fontSize: 8 }
			);
		} else {
			row.push({ text: fmt(gstAmt), alignment: 'right' });
		}

		row.push({ text: fmt(item.total), alignment: 'right', bold: true });
		return row;
	});

	// Table widths
	const itemWidths = isIntra
		? ['auto', '*', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto']
		: ['auto', '*', 'auto', 'auto', 'auto', 'auto', 'auto'];

	// --- Tax summary rows ---
	const taxRows: TableCell[][] = [];
	taxRows.push([
		{ text: 'Sub Total', border: [false, false, false, true] },
		{ text: fmt(invoice.subtotal), alignment: 'right', border: [false, false, false, true] }
	]);

	if (isIntra) {
		taxRows.push(
			[
				{ text: 'CGST', border: [false, false, false, true] },
				{
					text: fmt(invoice.cgst),
					alignment: 'right',
					border: [false, false, false, true]
				}
			],
			[
				{ text: 'SGST', border: [false, false, false, true] },
				{
					text: fmt(invoice.sgst),
					alignment: 'right',
					border: [false, false, false, true]
				}
			]
		);
	} else {
		taxRows.push([
			{ text: 'IGST', border: [false, false, false, true] },
			{ text: fmt(invoice.igst), alignment: 'right', border: [false, false, false, true] }
		]);
	}

	taxRows.push([
		{
			text: 'Total',
			bold: true,
			fillColor: '#e5e7eb',
			border: [false, false, false, false]
		},
		{
			text: fmt(invoice.total),
			bold: true,
			alignment: 'right',
			fillColor: '#e5e7eb',
			border: [false, false, false, false]
		}
	]);

	taxRows.push([
		{ text: 'Payment Made', color: '#dc2626', border: [false, false, false, true] },
		{
			text: `(-) ${fmt(invoice.amount_paid)}`,
			alignment: 'right',
			color: '#dc2626',
			border: [false, false, false, true]
		}
	]);

	taxRows.push([
		{ text: 'Balance Due', bold: true, fontSize: 12, border: [false, false, false, false] },
		{
			text: fmt(invoice.balance_due),
			bold: true,
			fontSize: 12,
			alignment: 'right',
			border: [false, false, false, false]
		}
	]);

	// --- Footer left content ---
	const totalWords = numberToWords(invoice.total || 0);
	const bankLines = [
		`Bank: ${org?.bank_name || '\u2014'}`,
		`A/c No: ${org?.account_number || '\u2014'}`,
		`IFSC: ${org?.ifsc || '\u2014'}`,
		`Branch: ${org?.branch || '\u2014'}`
	];
	// Add UPI if available
	if ((org as any)?.upi_id) {
		bankLines.push(`UPI: ${(org as any).upi_id}`);
	}

	const footerLeftContent: Content[] = [
		{ text: 'Total In Words', fontSize: 8, color: '#666' },
		{ text: totalWords, italics: true, bold: true, fontSize: 9, margin: [0, 2, 0, 12] },
		{ text: 'Bank Details', bold: true, fontSize: 9, margin: [0, 0, 0, 2] },
		{
			text: bankLines.join('\n'),
			fontSize: 8,
			lineHeight: 1.4
		}
	];

	if (invoice.notes) {
		footerLeftContent.push({
			text: `Note: ${invoice.notes}`,
			fontSize: 8,
			color: '#666',
			margin: [0, 10, 0, 0]
		});
	}

	// --- Build document ---
	const content: Content[] = [
		// --- Outer border table wrapping everything ---
		{
			table: {
				widths: ['*'],
				body: [
					[
						{
							stack: [
								// Header row
								{
									columns: [
										{
											width: '*',
											stack: [
												{
													text: org?.name || 'OpenBill',
													fontSize: 14,
													bold: true
												},
												{
													text: org?.address || '',
													fontSize: 9,
													margin: [0, 2, 0, 0]
												},
												{
													text: `${org?.city || ''} ${org?.pincode || ''}, ${org?.state_code || ''}`,
													fontSize: 9
												},
												{
													text: `GSTIN: ${org?.gstin || ''}`,
													fontSize: 9
												},
												{ text: org?.email || '', fontSize: 9 }
											],
											margin: [0, 0, 0, 0]
										},
										{
											width: 'auto',
											text: 'TAX INVOICE',
											fontSize: 22,
											bold: true,
											alignment: 'right',
											margin: [0, 20, 0, 0]
										}
									],
									margin: [0, 0, 0, 8]
								},

								// Separator
								{ canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5 }] },

								// Invoice meta
								{
									columns: [
										{
											width: '50%',
											stack: [
												{
													text: [
														{ text: 'Invoice No: ', bold: true },
														{
															text: invoice.invoice_number,
															bold: true
														}
													],
													fontSize: 9
												},
												{
													text: [
														{ text: 'Date: ', bold: true },
														fmtDate(invoice.invoice_date)
													],
													fontSize: 9,
													margin: [0, 2, 0, 0]
												}
											],
											margin: [0, 6, 0, 6]
										},
										{
											width: '50%',
											stack: [
												{
													text: [
														{ text: 'Due Date: ', bold: true },
														fmtDate(invoice.due_date)
													],
													fontSize: 9
												}
											],
											margin: [0, 6, 0, 6]
										}
									]
								},

								// Separator
								{ canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5 }] },

								// Bill To / Ship To headers
								{
									columns: [
										{
											width: '50%',
											text: 'Bill To',
											bold: true,
											fontSize: 9,
											fillColor: '#f3f4f6'
										},
										{
											width: '50%',
											text: 'Ship To',
											bold: true,
											fontSize: 9,
											fillColor: '#f3f4f6'
										}
									],
									margin: [0, 4, 0, 2],
									columnGap: 10
								},

								// Bill To / Ship To details
								{
									columns: [
										{
											width: '50%',
											stack: [
												{
													text: customer?.name || 'Unknown',
													bold: true,
													fontSize: 9
												},
												{
													text: customer?.company_name || '',
													fontSize: 8
												},
												{
													text: customer?.billing_address || '',
													fontSize: 8
												},
												{
													text: `${customer?.city || ''} ${customer?.pincode || ''}`,
													fontSize: 8
												},
												{
													text: [
														'GSTIN: ',
														{
															text: customer?.gstin || '',
															bold: true
														}
													],
													fontSize: 8,
													margin: [0, 3, 0, 0]
												}
											]
										},
										{
											width: '50%',
											stack: [
												{
													text: customer?.name || 'Unknown',
													bold: true,
													fontSize: 9
												},
												{
													text: customer?.company_name || '',
													fontSize: 8
												},
												{
													text: customer?.billing_address || '',
													fontSize: 8
												},
												{
													text: `${customer?.city || ''} ${customer?.pincode || ''}`,
													fontSize: 8
												},
												{
													text: [
														'GSTIN: ',
														{
															text: customer?.gstin || '',
															bold: true
														}
													],
													fontSize: 8,
													margin: [0, 3, 0, 0]
												}
											]
										}
									],
									margin: [0, 0, 0, 8],
									columnGap: 10
								},

								// Separator
								{ canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5 }] },

								// Items table
								{
									table: {
										headerRows: 1,
										widths: itemWidths,
										body: [itemHeaderCols, ...itemRows]
									},
									layout: {
										hLineWidth: () => 0.5,
										vLineWidth: () => 0.5,
										hLineColor: () => '#000',
										vLineColor: () => '#000',
										fillColor: (rowIndex: number) =>
											rowIndex === 0 ? '#f3f4f6' : null,
										paddingLeft: () => 4,
										paddingRight: () => 4,
										paddingTop: () => 4,
										paddingBottom: () => 4
									},
									fontSize: 9,
									margin: [0, 0, 0, 0]
								},

								// Separator
								{ canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5 }] },

								// Footer: left (words + bank) and right (totals + signature)
								{
									columns: [
										{
											width: '58%',
											stack: footerLeftContent,
											margin: [0, 6, 10, 0]
										},
										{
											width: '42%',
											stack: [
												// Totals table
												{
													table: {
														widths: ['*', 'auto'],
														body: taxRows
													},
													layout: {
														hLineWidth: () => 0,
														vLineWidth: () => 0,
														hLineColor: () => '#eee',
														paddingLeft: () => 4,
														paddingRight: () => 4,
														paddingTop: () => 3,
														paddingBottom: () => 3
													},
													fontSize: 9
												},
												// Signature box
												(org as any)?.signature_url
													? {
															image: (org as any).signature_url,
															width: 80,
															alignment: 'center' as const,
															margin: [0, 10, 0, 5] as [number, number, number, number]
														}
													: {
															text: '',
															margin: [0, 30, 0, 0] as [number, number, number, number]
														},
												{
													text: 'Authorized Signature',
													bold: true,
													alignment: 'center',
													fontSize: 9
												}
											],
											margin: [0, 0, 0, 0]
										}
									]
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
		// Disclaimer
		{
			text: 'This is a computer generated invoice.',
			alignment: 'center',
			fontSize: 8,
			color: '#666',
			margin: [0, 12, 0, 0]
		}
	];

	return {
		pageSize: 'A4',
		pageMargins: [28, 28, 28, 28],
		content,
		defaultStyle: {
			font: 'Helvetica',
			fontSize: 10
		},
		styles: {
			tableHeader: {
				bold: true,
				fontSize: 8,
				fillColor: '#f3f4f6'
			}
		}
	};
}
