import { db } from './src/lib/server/db';
import { number_series, credit_notes } from './src/lib/server/db/schema';
import { eq, and, desc } from 'drizzle-orm';

async function main() {
    console.log("Fixing Credit Note Number Series...");

    // Get the first org (assuming single org for now or getting from DB)
    const note = await db.query.credit_notes.findFirst();
    if (!note) {
        console.log("No credit notes found to sync from.");
        return;
    }
    const orgId = note.org_id;

    const fy = '2025-26'; // Hardcoded current FY
    const module = 'credit_note';

    // Find max number
    // We have to parse them because they are strings 'CN-2025-26-0001'
    const notes = await db.select().from(credit_notes).where(eq(credit_notes.org_id, orgId));

    let maxSeq = 0;
    for (const n of notes) {
        const parts = n.credit_note_number.split('-');
        // CN, 2025, 26, 0001
        // OR undefined, 2025, 26, 0001
        if (parts.length >= 3) {
            const seqStr = parts[parts.length - 1];
            const seq = parseInt(seqStr, 10);
            if (!isNaN(seq) && seq > maxSeq) {
                maxSeq = seq;
            }
        }
    }

    console.log(`Max Sequence found: ${maxSeq}`);

    // Update Number Series
    const existing = await db.query.number_series.findFirst({
        where: and(
            eq(number_series.org_id, orgId),
            eq(number_series.module, module),
            eq(number_series.fy_year, fy)
        )
    });

    if (existing) {
        console.log(`Updating existing series from ${existing.current_number} to ${maxSeq}`);
        await db.update(number_series)
            .set({ current_number: maxSeq })
            .where(eq(number_series.id, existing.id));
    } else {
        console.log(`Creating new series with current_number ${maxSeq}`);
        await db.insert(number_series).values({
            id: crypto.randomUUID(),
            org_id: orgId,
            module: module,
            prefix: 'CN',
            fy_year: fy,
            current_number: maxSeq,
            reset_on_fy: true
        });
    }

    console.log("Done.");
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
