import Database from 'better-sqlite3';

const db = new Database('data/openbill.db');

try {
    const columns = db.prepare("PRAGMA table_info(organizations)").all();
    console.log('Columns in organizations table:');
    columns.forEach(col => console.log(`- ${col.name} (${col.type})`));
} catch (e) {
    console.error('Error reading table info:', e);
}
