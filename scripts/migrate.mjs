import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';

const connectionString = process.env.DATABASE_URL_MIGRATION || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL_MIGRATION or DATABASE_URL must be set for migrations');
}

const client = postgres(connectionString, {
  ssl: 'require',
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10,
  prepare: false
});

const db = drizzle(client);

const migrationsFolder = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'migrations'
);

async function readMigrationHashes() {
  const journalPath = path.join(migrationsFolder, 'meta', '_journal.json');
  const journalRaw = await fs.readFile(journalPath, 'utf8');
  const journal = JSON.parse(journalRaw);
  const entries = Array.isArray(journal.entries) ? journal.entries : [];

  const hashes = [];
  for (const entry of entries) {
    const migrationPath = path.join(migrationsFolder, `${entry.tag}.sql`);
    const sqlText = await fs.readFile(migrationPath, 'utf8');
    hashes.push({
      tag: entry.tag,
      when: Number(entry.when),
      hash: createHash('sha256').update(sqlText).digest('hex')
    });
  }

  return hashes;
}

async function baselineIfSchemaAlreadyExists() {
  // Mirror Drizzle PG migrator metadata location.
  await client`CREATE SCHEMA IF NOT EXISTS drizzle`;
  await client`
    CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at bigint
    )
  `;

  const migrationRows = await client`
    SELECT COUNT(*)::int AS count
    FROM drizzle.__drizzle_migrations
  `;
  const migrationCount = migrationRows[0]?.count ?? 0;
  if (migrationCount > 0) {
    return;
  }

  // If core app tables already exist but migrations are untracked, baseline once.
  const orgTableRows = await client`
    SELECT to_regclass('public.organizations') IS NOT NULL AS exists
  `;
  const organizationsExists = orgTableRows[0]?.exists ?? false;
  if (!organizationsExists) {
    return;
  }

  const hashes = await readMigrationHashes();
  if (hashes.length === 0) {
    console.warn('[migrate] No migration entries found for baseline; skipping.');
    return;
  }

  await client.begin(async (tx) => {
    for (const entry of hashes) {
      await tx`
        INSERT INTO drizzle.__drizzle_migrations ("hash", "created_at")
        VALUES (${entry.hash}, ${entry.when})
      `;
    }
  });

  console.log(`[migrate] Baseline applied for ${hashes.length} migration(s).`);
}

try {
  await baselineIfSchemaAlreadyExists();
  await migrate(db, { migrationsFolder });
  console.log('[migrate] Postgres migrations applied successfully.');
} finally {
  await client.end({ timeout: 5 });
}
