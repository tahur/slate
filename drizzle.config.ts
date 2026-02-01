import type { Config } from 'drizzle-kit';

export default {
    schema: './src/lib/server/db/schema/index.ts',
    out: './migrations',
    dialect: 'sqlite',
    dbCredentials: {
        url: 'data/openbill.db'
    }
} satisfies Config;
