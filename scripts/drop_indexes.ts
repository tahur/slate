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

console.log('Dropping non-primary indexes from public schema...');

const indexes = await sql.unsafe(`
    SELECT indexname
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname NOT LIKE '%_pkey'
`);

console.log(`Found ${indexes.length} indexes to drop.`);

for (const idx of indexes) {
    try {
        await sql.unsafe(`DROP INDEX IF EXISTS "${idx.indexname}"`);
        console.log(`Dropped ${idx.indexname}`);
    } catch (e) {
        console.error(`Failed to drop ${idx.indexname}:`, e);
    }
}

await sql.end({ timeout: 5 });

console.log('Done.');
