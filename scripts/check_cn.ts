import { db } from '../src/lib/server/db';
import { credit_notes } from '../src/lib/server/db/schema';
import { eq } from 'drizzle-orm';

async function check() {
    const id = 'b0427e24-8ee2-45d4-9b10-40a69acb3452';
    console.log(`Checking for Credit Note ID: ${id}`);

    const cn = await db.query.credit_notes.findFirst({
        where: eq(credit_notes.id, id)
    });

    if (cn) {
        console.log('FOUND:', cn);
    } else {
        console.log('NOT FOUND');
    }
}

check();
