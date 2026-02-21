import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL_MIGRATION || process.env.DATABASE_URL;

if (!connectionString) {
    console.error('DATABASE_URL_MIGRATION or DATABASE_URL is required');
    process.exit(1);
}

const sql = postgres(connectionString, {
    ssl: 'require',
    max: 1,
    idle_timeout: 10,
    connect_timeout: 10,
    prepare: false
});

console.log('Ensuring balance column exists on credit_notes...');

try {
    await sql.unsafe(
        "ALTER TABLE credit_notes ADD COLUMN IF NOT EXISTS balance numeric(14,2) DEFAULT 0"
    );
    console.log("Success: Ensured 'balance' column exists.");
} catch (e) {
    console.error('Error adding/verifying column:', e);
}

try {
    const tableInfo = await sql.unsafe(
        "SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='credit_notes' ORDER BY ordinal_position"
    );
    console.log('Current columns:', tableInfo.map((c) => c.column_name).join(', '));
} catch (e) {
    console.error('Error verifying columns:', e);
}

await sql.end({ timeout: 5 });
