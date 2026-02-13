import Database from 'better-sqlite3';

const db = new Database('data/slate.db');

const tables = ['customer_advances', 'credit_allocations', 'credit_notes'];

for (const table of tables) {
    try {
        const info = db.prepare(`PRAGMA table_info(${table})`).all() as any[];
        if (info.length === 0) {
            console.log(`Missing table: ${table}`);
        } else {
            console.log(`Table ${table} exists with columns: ${info.map(c => c.name).join(', ')}`);
        }
    } catch (e) {
        console.error(`Error checking ${table}:`, e);
    }
}
