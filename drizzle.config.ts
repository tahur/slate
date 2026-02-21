import type { Config } from 'drizzle-kit';

export default {
    schema: './src/lib/server/db/schema/index.ts',
    out: './migrations',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL_MIGRATION || process.env.DATABASE_URL || ''
    }
} satisfies Config;
