import Database from 'better-sqlite3';

const db = new Database('data/openbill.db');

console.log('Adding balance column to credit_notes...');

try {
    // Check if column exists
    const tableInfo = db.prepare("PRAGMA table_info(credit_notes)").all() as any[];
    const hasBalance = tableInfo.some(col => col.name === 'balance');

    if (!hasBalance) {
        db.prepare("ALTER TABLE credit_notes ADD COLUMN balance REAL DEFAULT 0").run();
        console.log("Success: Added 'balance' column.");
    } else {
        console.log("Info: 'balance' column already exists.");
    }
} catch (e) {
    console.error("Error adding column:", e);
}

// Verify
try {
    const tableInfo = db.prepare("PRAGMA table_info(credit_notes)").all() as any[];
    console.log("Current columns:", tableInfo.map(c => c.name).join(', '));
} catch (e) {
    console.error("Error verifying:", e);
}
