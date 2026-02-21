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

const tables = ['customer_advances', 'credit_allocations', 'credit_notes'];

for (const table of tables) {
    try {
        const info = await sql.unsafe(
            `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1 ORDER BY ordinal_position`,
            [table]
        );
        if (info.length === 0) {
            console.log(`Missing table: ${table}`);
        } else {
            console.log(`Table ${table} exists with columns: ${info.map((c) => c.column_name).join(', ')}`);
        }
    } catch (e) {
        console.error(`Error checking ${table}:`, e);
    }
}

await sql.end({ timeout: 5 });
