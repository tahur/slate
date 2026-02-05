import Database from 'better-sqlite3';

const db = new Database('data/openbill.db');

console.log('Dropping conflicting indexes...');

// Fetch all indexes
const indexes = db.prepare(`
    SELECT name 
    FROM sqlite_master 
    WHERE type = 'index' AND name NOT LIKE 'sqlite_%'
`).all() as any[];

console.log(`Found ${indexes.length} indexes to drop.`);

for (const idx of indexes) {
    try {
        db.prepare(`DROP INDEX IF EXISTS "${idx.name}"`).run();
        console.log(`Dropped ${idx.name}`);
    } catch (e) {
        console.error(`Failed to drop ${idx.name}:`, e);
    }
}

console.log('Done.');
