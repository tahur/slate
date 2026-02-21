import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL_MIGRATION || process.env.DATABASE_URL;

if (!connectionString) {
    console.log('Backup/restore drill skipped: DATABASE_URL_MIGRATION or DATABASE_URL is not configured');
    process.exit(0);
}

const sql = postgres(connectionString, {
    ssl: 'require',
    max: 1,
    idle_timeout: 10,
    connect_timeout: 10,
    prepare: false
});

const tableName = `drill_entries_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
const backupTableName = `${tableName}_backup`;

try {
    await sql.unsafe(`CREATE TABLE ${tableName} (id text primary key, amount numeric(14,2) not null)`);
    await sql.unsafe(`INSERT INTO ${tableName} (id, amount) VALUES ('a', 500), ('b', 250), ('c', 550)`);

    // Simulate backup artifact by taking a logical copy in DB.
    await sql.unsafe(`CREATE TABLE ${backupTableName} AS TABLE ${tableName}`);

    // Simulate data loss.
    await sql.unsafe(`TRUNCATE TABLE ${tableName}`);

    // Simulate restore operation.
    await sql.unsafe(`INSERT INTO ${tableName} (id, amount) SELECT id, amount FROM ${backupTableName}`);

    const summaryRows = await sql.unsafe(
        `SELECT COUNT(*)::int AS count, ROUND(COALESCE(SUM(amount), 0), 2) AS total FROM ${tableName}`
    );
    const summary = summaryRows[0];

    if (!summary || summary.count !== 3 || Number(summary.total) !== 1300) {
        throw new Error(
            `Restore verification mismatch: expected count=3,total=1300.00, got ${JSON.stringify(summary)}`
        );
    }

    console.log('Backup/restore verification drill passed.');
} finally {
    try {
        await sql.unsafe(`DROP TABLE IF EXISTS ${backupTableName}`);
        await sql.unsafe(`DROP TABLE IF EXISTS ${tableName}`);
    } catch {
        // Best-effort cleanup.
    }
    await sql.end({ timeout: 5 });
}
