import { writable } from 'svelte/store';

export type ToastType = 'success' | 'error' | 'info';

export type Toast = {
    id: string;
    type: ToastType;
    message: string;
};

function createId() {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
        return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export const toasts = writable<Toast[]>([]);

export function addToast(
    toast: Omit<Toast, 'id'>,
    duration: number = 4000
) {
    const id = createId();
    const nextToast: Toast = { id, ...toast };
    toasts.update((items) => [...items, nextToast]);

    if (duration > 0) {
        setTimeout(() => removeToast(id), duration);
    }

    return id;
}

export function removeToast(id: string) {
    toasts.update((items) => items.filter((toast) => toast.id !== id));
}
