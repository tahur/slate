import { db } from '../src/lib/server/db';
import { credit_allocations } from '../src/lib/server/db/schema';
import { crypto } from 'crypto'; // Node crypto

async function main() {
    try {
        console.log('Checking if credit_allocations table works...');
        // We won't insert to avoid foreign key constraints failure with garbage IDs.
        // We will just select count.
        const res = await db.select().from(credit_allocations).limit(1);
        console.log('Select validation success:', res);
    } catch (e) {
        console.error('Validation failed:', e);
    }
}

main();
