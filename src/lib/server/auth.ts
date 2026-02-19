import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from './db';
import * as schema from './db/schema';

let _auth: ReturnType<typeof betterAuth> | null = null;

function createAuth() {
    const { env } = process;
    return betterAuth({
        database: drizzleAdapter(db, {
            provider: 'sqlite',
            schema: {
                user: schema.users,
                session: schema.sessions,
                account: schema.auth_accounts,
                verification: schema.verification
            }
        }),
        baseURL: env.ORIGIN || 'http://localhost:5173',
        secret: env.BETTER_AUTH_SECRET,
        trustedOrigins: (env.BETTER_AUTH_TRUSTED_ORIGINS || env.ORIGIN || '')
            .split(',')
            .map((s: string) => s.trim())
            .filter(Boolean),
        emailAndPassword: {
            enabled: true,
            sendResetPassword: async ({ user, url }) => {
                const { sendPasswordResetEmail } = await import('./email');
                await sendPasswordResetEmail(user.email, url);
            }
        },
        user: {
            additionalFields: {
                orgId: { type: 'string', required: false, input: false },
                role: { type: 'string', required: false, defaultValue: 'admin', input: false },
                isActive: { type: 'boolean', required: false, defaultValue: true, input: false }
            }
        },
        session: {
            expiresIn: 60 * 60 * 24 * 30,       // 30 days
            updateAge: 60 * 60 * 24,             // refresh DB session daily
            // cookieCache disabled — SQLite lookups are sub-ms; eliminates stale orgId bugs
        },
        advanced: {
            useSecureCookies: !!env.ORIGIN?.startsWith('https'),
        },
    });
}

export const auth = new Proxy({} as ReturnType<typeof betterAuth>, {
    get(_, prop) {
        if (!_auth) {
            _auth = createAuth();
        }
        return (_auth as any)[prop];
    }
});
