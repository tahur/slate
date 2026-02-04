// @ts-ignore pdfmake CJS module resolved via ssr.external in vite.config
import pdfmake from 'pdfmake';
import type { TDocumentDefinitions } from 'pdfmake/interfaces';

pdfmake.addFonts({
	Helvetica: {
		normal: 'Helvetica',
		bold: 'Helvetica-Bold',
		italics: 'Helvetica-Oblique',
		bolditalics: 'Helvetica-BoldOblique'
	}
});

export async function generatePdfBuffer(docDefinition: TDocumentDefinitions): Promise<Uint8Array> {
	const doc = pdfmake.createPdf(docDefinition);
	const buffer: Buffer = await doc.getBuffer();
	return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
}
