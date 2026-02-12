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
        baseURL: env.BETTER_AUTH_URL || 'http://localhost:5173',
        secret: env.BETTER_AUTH_SECRET,
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
            cookieCache: { enabled: true, maxAge: 300 }
        }
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
