import type { TDocumentDefinitions, Content, TableCell } from 'pdfmake/interfaces';
import type { InvoicePdfData } from './types';
import { numberToWords } from '$lib/utils/currency';

// Indian state code → name mapping for PDF
const STATE_NAMES: Record<string, string> = {
	'01': 'Jammu & Kashmir', '02': 'Himachal Pradesh', '03': 'Punjab', '04': 'Chandigarh',
	'05': 'Uttarakhand', '06': 'Haryana', '07': 'Delhi', '08': 'Rajasthan',
	'09': 'Uttar Pradesh', '10': 'Bihar', '11': 'Sikkim', '12': 'Arunachal Pradesh',
	'13': 'Nagaland', '14': 'Manipur', '15': 'Mizoram', '16': 'Tripura',
	'17': 'Meghalaya', '18': 'Assam', '19': 'West Bengal', '20': 'Jharkhand',
	'21': 'Odisha', '22': 'Chhattisgarh', '23': 'Madhya Pradesh', '24': 'Gujarat',
	'26': 'Dadra & Nagar Haveli and Daman & Diu', '27': 'Maharashtra', '29': 'Karnataka',
	'30': 'Goa', '31': 'Lakshadweep', '32': 'Kerala', '33': 'Tamil Nadu',
	'34': 'Puducherry', '35': 'Andaman & Nicobar Islands', '36': 'Telangana',
	'37': 'Andhra Pradesh', '38': 'Ladakh'
};

function stateName(code: string | null | undefined): string {
	if (!code) return '';
	return STATE_NAMES[code] || code;
}

/** Format INR amount — uses Rs. prefix (Helvetica lacks ₹ glyph) */
function fmt(amount: number | null | undefined): string {
	const value = amount || 0;
	return 'Rs.' + new Intl.NumberFormat('en-IN', {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
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

/** Uppercase text for names/addresses */
function uc(text: string | null | undefined): string {
	return (text || '').toUpperCase();
}

export function buildInvoiceDocDefinition(data: InvoicePdfData): TDocumentDefinitions {
	const { org, invoice, items, customer } = data;
	const isIntra = !invoice.is_inter_state;
	const isPaid = (invoice.balance_due || 0) <= 0.01;

	// ── Header: Logo + Company Info + "TAX INVOICE" ──
	const headerLeft: Content[] = [];

	// Logo (if available)
	if (org?.logo_url) {
		headerLeft.push({
			image: org.logo_url,
			width: 60,
			margin: [0, 0, 0, 6] as [number, number, number, number]
		});
	}

	headerLeft.push(
		{ text: uc(org?.name) || 'COMPANY NAME', fontSize: 14, bold: true },
		{ text: uc(org?.address), fontSize: 8, margin: [0, 2, 0, 0] as [number, number, number, number] },
		{
			text: [uc(org?.city), org?.pincode ? ' - ' + org.pincode : ''].filter(Boolean).join(''),
			fontSize: 8
		},
		{
			text: org?.state_code ? `State: ${stateName(org.state_code)} (${org.state_code})` : '',
			fontSize: 8
		}
	);

	if (org?.gstin) {
		headerLeft.push({ text: `GSTIN: ${org.gstin}`, fontSize: 8, bold: true, margin: [0, 2, 0, 0] as [number, number, number, number] });
	}
	if (org?.email) {
		headerLeft.push({ text: `Email: ${org.email}`, fontSize: 8 });
	}
	if (org?.phone) {
		headerLeft.push({ text: `Phone: ${org.phone}`, fontSize: 8 });
	}

	// ── Item rows ──
	const itemHeaderCols: TableCell[] = [
		{ text: '#', style: 'tableHeader', alignment: 'center' },
		{ text: 'Description', style: 'tableHeader' },
		{ text: 'HSN/SAC', style: 'tableHeader', alignment: 'center' },
		{ text: 'Qty', style: 'tableHeader', alignment: 'center' },
		{ text: 'Rate', style: 'tableHeader', alignment: 'right' },
		{ text: 'Amount', style: 'tableHeader', alignment: 'right' }
	];

	if (isIntra) {
		itemHeaderCols.splice(5, 0,
			{ text: 'CGST', style: 'tableHeader', alignment: 'right' },
			{ text: 'SGST', style: 'tableHeader', alignment: 'right' }
		);
	} else {
		itemHeaderCols.splice(5, 0,
			{ text: 'IGST', style: 'tableHeader', alignment: 'right' }
		);
	}

	const itemRows: TableCell[][] = items.map((item, i) => {
		const rate = item.gst_rate || 0;
		const halfRate = rate / 2;
		const lineCgst = item.cgst || 0;
		const lineSgst = item.sgst || 0;
		const lineIgst = item.igst || 0;

		const row: TableCell[] = [
			{ text: String(i + 1), alignment: 'center', fontSize: 8 },
			{
				stack: [
					{ text: item.description || '', fontSize: 9 },
					...(item.hsn_code ? [{ text: '', fontSize: 0 }] : [])
				]
			},
			{ text: item.hsn_code || '', alignment: 'center', fontSize: 8 },
			{ text: `${item.quantity}  ${item.unit || ''}`, alignment: 'center', fontSize: 8 },
			{ text: fmt(item.rate), alignment: 'right', fontSize: 8 }
		];

		if (isIntra) {
			row.push(
				{
					stack: [
						{ text: `${halfRate}%`, fontSize: 7, color: '#666' },
						{ text: fmt(lineCgst), fontSize: 8 }
					],
					alignment: 'right'
				},
				{
					stack: [
						{ text: `${halfRate}%`, fontSize: 7, color: '#666' },
						{ text: fmt(lineSgst), fontSize: 8 }
					],
					alignment: 'right'
				}
			);
		} else {
			row.push({
				stack: [
					{ text: `${rate}%`, fontSize: 7, color: '#666' },
					{ text: fmt(lineIgst), fontSize: 8 }
				],
				alignment: 'right'
			});
		}

		row.push({ text: fmt(item.total), alignment: 'right', bold: true, fontSize: 9 });
		return row;
	});

	const itemWidths = isIntra
		? [20, '*', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto']
		: [20, '*', 'auto', 'auto', 'auto', 'auto', 'auto'];

	// ── Tax summary (right side) ──
	const taxRows: TableCell[][] = [];

	taxRows.push([
		{ text: 'Sub Total', fontSize: 9 },
		{ text: fmt(invoice.subtotal), alignment: 'right', fontSize: 9 }
	]);

	if (isIntra) {
		taxRows.push(
			[
				{ text: 'CGST', fontSize: 9 },
				{ text: fmt(invoice.cgst), alignment: 'right', fontSize: 9 }
			],
			[
				{ text: 'SGST', fontSize: 9 },
				{ text: fmt(invoice.sgst), alignment: 'right', fontSize: 9 }
			]
		);
	} else {
		taxRows.push([
			{ text: 'IGST', fontSize: 9 },
			{ text: fmt(invoice.igst), alignment: 'right', fontSize: 9 }
		]);
	}

	// Total row (highlighted)
	taxRows.push([
		{ text: 'TOTAL', bold: true, fontSize: 10, fillColor: '#f0f0f0' },
		{ text: fmt(invoice.total), bold: true, fontSize: 10, alignment: 'right', fillColor: '#f0f0f0' }
	]);

	// Only show payment/balance if partially paid (not for fully paid or unpaid)
	if ((invoice.amount_paid || 0) > 0.01) {
		taxRows.push([
			{ text: 'Less: Payment Received', fontSize: 8, color: '#16a34a' },
			{ text: `(-) ${fmt(invoice.amount_paid)}`, alignment: 'right', fontSize: 8, color: '#16a34a' }
		]);

		if (!isPaid) {
			taxRows.push([
				{ text: 'BALANCE DUE', bold: true, fontSize: 10, color: '#dc2626' },
				{ text: fmt(invoice.balance_due), bold: true, fontSize: 10, alignment: 'right', color: '#dc2626' }
			]);
		}
	}

	// ── Total in words ──
	const totalWords = numberToWords(invoice.total || 0);

	// ── Bank details ──
	const bankLines: string[] = [];
	if (org?.bank_name) bankLines.push(`Bank: ${org.bank_name}`);
	if (org?.account_number) bankLines.push(`A/c No: ${org.account_number}`);
	if (org?.ifsc) bankLines.push(`IFSC: ${org.ifsc}`);
	if (org?.branch) bankLines.push(`Branch: ${org.branch}`);
	if ((org as any)?.upi_id) bankLines.push(`UPI: ${(org as any).upi_id}`);

	// ── Customer address block ──
	const customerAddress: Content[] = [
		{ text: uc(customer?.name) || 'UNKNOWN', bold: true, fontSize: 10 }
	];
	if (customer?.company_name) {
		customerAddress.push({ text: uc(customer.company_name), fontSize: 8 });
	}
	if (customer?.billing_address) {
		customerAddress.push({ text: uc(customer.billing_address), fontSize: 8 });
	}
	const cityLine = [uc(customer?.city), customer?.pincode].filter(Boolean).join(' - ');
	if (cityLine) {
		customerAddress.push({ text: cityLine, fontSize: 8 });
	}
	if (customer?.state_code) {
		customerAddress.push({
			text: `State: ${stateName(customer.state_code)} (${customer.state_code})`,
			fontSize: 8
		});
	}
	if (customer?.gstin) {
		customerAddress.push({
			text: `GSTIN: ${customer.gstin}`,
			fontSize: 8, bold: true,
			margin: [0, 2, 0, 0] as [number, number, number, number]
		});
	}

	// ── Place of Supply ──
	const placeOfSupply = customer?.place_of_supply || customer?.state_code || '';

	// ── Build document ──
	const content: Content[] = [
		{
			table: {
				widths: ['*'],
				body: [[{
					stack: [
						// ─── Header ───
						{
							columns: [
								{ width: '*', stack: headerLeft },
								{
									width: 'auto',
									stack: [
										{ text: 'TAX INVOICE', fontSize: 18, bold: true, alignment: 'right' },
										...(isPaid ? [{
											text: 'PAID',
											fontSize: 12, bold: true, color: '#16a34a',
											alignment: 'right' as const,
											margin: [0, 4, 0, 0] as [number, number, number, number]
										}] : [])
									]
								}
							],
							margin: [0, 0, 0, 8] as [number, number, number, number]
						},

						// ─── Separator ───
						{ canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#000' }] },

						// ─── Invoice meta + Customer info ───
						{
							columns: [
								{
									width: '50%',
									stack: [
										{ text: 'Bill To', bold: true, fontSize: 8, color: '#666', margin: [0, 6, 0, 4] as [number, number, number, number] },
										...customerAddress
									]
								},
								{
									width: '50%',
									stack: [
										{
											text: [
												{ text: 'Invoice No: ', fontSize: 9 },
												{ text: invoice.invoice_number, bold: true, fontSize: 10 }
											],
											margin: [0, 6, 0, 0] as [number, number, number, number]
										},
										{
											text: [
												{ text: 'Date: ', fontSize: 9 },
												{ text: fmtDate(invoice.invoice_date), fontSize: 9, bold: true }
											],
											margin: [0, 3, 0, 0] as [number, number, number, number]
										},
										{
											text: [
												{ text: 'Due Date: ', fontSize: 9 },
												{ text: fmtDate(invoice.due_date), fontSize: 9, bold: true }
											],
											margin: [0, 3, 0, 0] as [number, number, number, number]
										},
										...(placeOfSupply ? [{
											text: [
												{ text: 'Place of Supply: ', fontSize: 8 },
												{ text: `${stateName(placeOfSupply)} (${placeOfSupply})`, fontSize: 8, bold: true }
											],
											margin: [0, 3, 0, 0] as [number, number, number, number]
										}] : []),
										...(invoice.order_number ? [{
											text: [
												{ text: 'Order No: ', fontSize: 8 },
												{ text: invoice.order_number, fontSize: 8 }
											],
											margin: [0, 3, 0, 0] as [number, number, number, number]
										}] : [])
									],
									alignment: 'right'
								}
							],
							margin: [0, 0, 0, 8] as [number, number, number, number],
							columnGap: 10
						},

						// ─── Separator ───
						{ canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5 }] },

						// ─── Items table ───
						{
							table: {
								headerRows: 1,
								widths: itemWidths,
								body: [itemHeaderCols, ...itemRows]
							},
							layout: {
								hLineWidth: (i: number, node: any) => (i === 0 || i === 1 || i === node.table.body.length) ? 0.5 : 0.3,
								vLineWidth: () => 0.3,
								hLineColor: (i: number, node: any) => (i === 0 || i === 1 || i === node.table.body.length) ? '#000' : '#ccc',
								vLineColor: () => '#ccc',
								fillColor: (rowIndex: number) => rowIndex === 0 ? '#f3f4f6' : null,
								paddingLeft: () => 4,
								paddingRight: () => 4,
								paddingTop: () => 4,
								paddingBottom: () => 4
							},
							fontSize: 9,
							margin: [0, 4, 0, 0] as [number, number, number, number]
						},

						// ─── Footer: Total in words + Bank | Totals + Signature ───
						{
							columns: [
								{
									width: '55%',
									stack: [
										{ text: 'Total In Words:', fontSize: 8, color: '#666', margin: [0, 8, 0, 2] as [number, number, number, number] },
										{ text: totalWords, italics: true, bold: true, fontSize: 9, margin: [0, 0, 0, 12] as [number, number, number, number] },
										...(bankLines.length > 0 ? [
											{ text: 'Bank Details', bold: true, fontSize: 9, margin: [0, 0, 0, 2] as [number, number, number, number] },
											{ text: bankLines.join('\n'), fontSize: 8, lineHeight: 1.5 }
										] as Content[] : []),
										...(invoice.notes ? [
											{ text: 'Notes:', bold: true, fontSize: 8, color: '#666', margin: [0, 8, 0, 2] as [number, number, number, number] },
											{ text: invoice.notes, fontSize: 8, color: '#333' }
										] as Content[] : []),
										...(invoice.terms ? [
											{ text: 'Terms & Conditions:', bold: true, fontSize: 8, color: '#666', margin: [0, 6, 0, 2] as [number, number, number, number] },
											{ text: invoice.terms, fontSize: 8, color: '#333' }
										] as Content[] : [])
									]
								},
								{
									width: '45%',
									stack: [
										{
											table: {
												widths: ['*', 'auto'],
												body: taxRows
											},
											layout: {
												hLineWidth: () => 0,
												vLineWidth: () => 0,
												paddingLeft: () => 4,
												paddingRight: () => 4,
												paddingTop: () => 3,
												paddingBottom: () => 3
											},
											margin: [0, 4, 0, 0] as [number, number, number, number]
										},
										// Signature
										{
											stack: [
												{ text: '', margin: [0, 20, 0, 0] as [number, number, number, number] },
												...(((org as any)?.signature_url) ? [{
													image: (org as any).signature_url,
													width: 80,
													alignment: 'center' as const,
													margin: [0, 0, 0, 4] as [number, number, number, number]
												}] : []),
												{ canvas: [{ type: 'line', x1: 30, y1: 0, x2: 180, y2: 0, lineWidth: 0.5 }] },
												{
													text: `For ${uc(org?.name) || 'COMPANY'}`,
													bold: true, alignment: 'center', fontSize: 8,
													margin: [0, 4, 0, 0] as [number, number, number, number]
												},
												{
													text: 'Authorized Signatory',
													alignment: 'center', fontSize: 7, color: '#666',
													margin: [0, 2, 0, 0] as [number, number, number, number]
												}
											]
										}
									]
								}
							],
							columnGap: 10
						}
					],
					margin: [10, 10, 10, 10]
				}]]
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
			text: 'This is a computer-generated invoice and does not require a physical signature.',
			alignment: 'center',
			fontSize: 7,
			color: '#999',
			margin: [0, 8, 0, 0]
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
