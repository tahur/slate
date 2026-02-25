/**
 * Registration gate.
 * Currently always open for testing/multi-user phase.
 * To close registration later, set REGISTRATION_MODE=closed in .env.
 */

import { env } from '$env/dynamic/private';

type RegistrationMode = 'open' | 'closed';

function getRegistrationMode(): RegistrationMode {
    const mode = env.REGISTRATION_MODE?.trim().toLowerCase();
    if (mode === 'closed') return 'closed';
    return 'open';
}

export async function isRegistrationOpen(): Promise<boolean> {
    return getRegistrationMode() === 'open';
}
