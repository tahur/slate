
import Database from 'better-sqlite3';
const db = new Database('data/openbill.db');

try {
    db.prepare("ALTER TABLE organizations ADD COLUMN bank_name text").run();
    db.prepare("ALTER TABLE organizations ADD COLUMN branch text").run();
    db.prepare("ALTER TABLE organizations ADD COLUMN account_number text").run();
    db.prepare("ALTER TABLE organizations ADD COLUMN ifsc text").run();
    console.log("Columns added successfully");
} catch (e) {
    console.log("Error adding columns (might already exist):", e.message);
}
