import type { TDocumentDefinitions, Content, TableCell } from 'pdfmake/interfaces';
import type { StatementData } from './types';

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

export function buildStatementDocDefinition(data: StatementData): TDocumentDefinitions {
	const { org, customer, startDate, endDate, openingBalance, closingBalance, entries } = data;

	// --- Transaction rows ---
	const headerRow: TableCell[] = [
		{ text: 'Date', style: 'tableHeader', alignment: 'center' },
		{ text: 'Number', style: 'tableHeader' },
		{ text: 'Description', style: 'tableHeader' },
		{ text: 'Debit', style: 'tableHeader', alignment: 'right' },
		{ text: 'Credit', style: 'tableHeader', alignment: 'right' },
		{ text: 'Balance', style: 'tableHeader', alignment: 'right' }
	];

	const entryRows: TableCell[][] = entries.map((entry) => [
		{ text: fmtDate(entry.date), alignment: 'center' },
		{ text: entry.number },
		{ text: entry.description },
		{ text: entry.debit > 0 ? fmt(entry.debit) : '-', alignment: 'right' },
		{ text: entry.credit > 0 ? fmt(entry.credit) : '-', alignment: 'right' },
		{ text: fmt(entry.balance), alignment: 'right' }
	]);

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
													text: `${org?.city || ''} ${org?.pincode || ''}`,
													fontSize: 9
												}
											]
										},
										{
											width: 'auto',
											stack: [
												{
													text: 'STATEMENT',
													fontSize: 22,
													bold: true,
													alignment: 'right'
												},
												{
													text: `${fmtDate(startDate)} to ${fmtDate(endDate)}`,
													fontSize: 9,
													alignment: 'right',
													margin: [0, 4, 0, 0]
												}
											]
										}
									],
									margin: [0, 0, 0, 8]
								},

								// Separator
								{
									canvas: [
										{
											type: 'line',
											x1: 0,
											y1: 0,
											x2: 515,
											y2: 0,
											lineWidth: 0.5
										}
									]
								},

								// Customer info + balances
								{
									columns: [
										{
											width: '50%',
											stack: [
												{
													text: 'To',
													bold: true,
													fontSize: 8,
													color: '#666'
												},
												{
													text: customer.name,
													bold: true,
													fontSize: 12,
													margin: [0, 2, 0, 0]
												},
												{
													text: customer.company_name || '',
													fontSize: 9
												},
												{
													text: `GSTIN: ${customer.gstin || ''}`,
													fontSize: 9
												}
											],
											margin: [0, 6, 0, 6]
										},
										{
											width: '50%',
											stack: [
												{
													text: [
														{ text: 'Opening: ', bold: true },
														fmt(openingBalance)
													],
													fontSize: 9
												},
												{
													text: [
														{ text: 'Closing: ', bold: true },
														fmt(closingBalance)
													],
													fontSize: 9,
													margin: [0, 2, 0, 0]
												}
											],
											margin: [0, 6, 0, 6]
										}
									]
								},

								// Separator
								{
									canvas: [
										{
											type: 'line',
											x1: 0,
											y1: 0,
											x2: 515,
											y2: 0,
											lineWidth: 0.5
										}
									]
								},

								// Transaction table
								{
									table: {
										headerRows: 1,
										widths: ['auto', 'auto', '*', 'auto', 'auto', 'auto'],
										body: [headerRow, ...entryRows]
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
