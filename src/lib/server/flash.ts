import type { Cookies } from '@sveltejs/kit';

export type FlashMessage = {
    type: 'success' | 'error' | 'info';
    message: string;
};

const FLASH_COOKIE = 'openbill_flash';

export function setFlash(cookies: Cookies, flash: FlashMessage) {
    cookies.set(FLASH_COOKIE, JSON.stringify(flash), {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 10
    });
}

export function getFlash(cookies: Cookies): FlashMessage | null {
    const raw = cookies.get(FLASH_COOKIE);
    if (!raw) return null;
    try {
        return JSON.parse(raw) as FlashMessage;
    } catch {
        return null;
    }
}

export function clearFlash(cookies: Cookies) {
    cookies.set(FLASH_COOKIE, '', {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 0
    });
}
