import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { sql } from 'drizzle-orm';

// Once a user exists, registration is permanently closed for this process lifetime.
// This avoids a DB query on every /register and /login page load.
let registrationClosed = false;

export async function isRegistrationOpen(): Promise<boolean> {
    if (registrationClosed) return false;

    const result = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(users)
        .limit(1);

    const count = Number(result[0]?.count) || 0;

    if (count > 0) {
        registrationClosed = true;
        return false;
    }

    return true;
}
