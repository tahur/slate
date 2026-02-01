import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Snippet } from "svelte";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export type WithElementRef<T> = T & {
    ref?: HTMLElement | null;
};

// Types needed by shadcn-svelte components
export type WithoutChild<T> = T extends { child?: infer _ } ? Omit<T, 'child'> : T;
export type WithoutChildren<T> = T extends { children?: infer _ } ? Omit<T, 'children'> : T;
export type WithoutChildrenOrChild<T> = WithoutChild<WithoutChildren<T>>;
