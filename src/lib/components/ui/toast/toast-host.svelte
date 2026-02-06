<script lang="ts">
    import { fly } from "svelte/transition";
    import { addToast, removeToast, toasts } from "$lib/stores/toast";
    import type { FlashMessage } from "$lib/server/flash";
    import { CheckCircle2, XCircle, Info, X } from "lucide-svelte";

    export let flash: FlashMessage | null = null;

    let appliedFlash = false;

    $: if (flash && !appliedFlash) {
        addToast({ type: flash.type, message: flash.message });
        appliedFlash = true;
    }

    function getToastStyles(type: string) {
        switch (type) {
            case "success":
                return {
                    container:
                        "bg-white dark:bg-zinc-900 border-l-4 border-l-emerald-500 border-y border-r border-zinc-200 dark:border-zinc-800",
                    icon: "text-emerald-500",
                    text: "text-zinc-900 dark:text-zinc-100",
                    iconComponent: CheckCircle2,
                };
            case "error":
                return {
                    container:
                        "bg-white dark:bg-zinc-900 border-l-4 border-l-red-500 border-y border-r border-zinc-200 dark:border-zinc-800",
                    icon: "text-red-500",
                    text: "text-zinc-900 dark:text-zinc-100",
                    iconComponent: XCircle,
                };
            default:
                return {
                    container:
                        "bg-white dark:bg-zinc-900 border-l-4 border-l-blue-500 border-y border-r border-zinc-200 dark:border-zinc-800",
                    icon: "text-blue-500",
                    text: "text-zinc-900 dark:text-zinc-100",
                    iconComponent: Info,
                };
        }
    }
</script>

<div
    class="pointer-events-none fixed right-4 top-4 z-50 flex flex-col gap-2 min-w-[320px]"
>
    {#each $toasts as toast (toast.id)}
        {@const styles = getToastStyles(toast.type)}
        <div
            class="pointer-events-auto flex items-start gap-3 rounded-lg border p-4 shadow-lg shadow-black/5 {styles.container}"
            transition:fly={{ y: -8, duration: 300 }}
            role="alert"
        >
            <svelte:component
                this={styles.iconComponent}
                class="h-5 w-5 shrink-0 mt-0.5 {styles.icon}"
            />

            <div class="flex-1 pt-0.5">
                <p class="text-sm font-medium leading-tight {styles.text}">
                    {toast.message}
                </p>
            </div>

            <button
                type="button"
                class="shrink-0 -mr-1 -mt-1 p-1 rounded-md opacity-60 hover:opacity-100 transition-opacity {styles.text}"
                on:click={() => removeToast(toast.id)}
                aria-label="Close notification"
            >
                <X class="h-4 w-4" />
            </button>
        </div>
    {/each}
</div>
