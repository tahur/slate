<script lang="ts">
    import { fly } from "svelte/transition";
    import { addToast, removeToast, toasts } from "$lib/stores/toast";
    import type { FlashMessage } from "$lib/server/flash";

    export let flash: FlashMessage | null = null;

    let appliedFlash = false;

    $: if (flash && !appliedFlash) {
        addToast({ type: flash.type, message: flash.message });
        appliedFlash = true;
    }

    function getToastClasses(type: string) {
        switch (type) {
            case "success":
                return "border-green-200 bg-green-50 text-green-900";
            case "error":
                return "border-red-200 bg-red-50 text-red-900";
            default:
                return "border-slate-200 bg-white text-slate-900";
        }
    }
</script>

<div class="pointer-events-none fixed right-4 top-4 z-50 space-y-2">
    {#each $toasts as toast (toast.id)}
        <div
            class="pointer-events-auto flex items-start gap-3 rounded-md border px-3 py-2 shadow-sm {getToastClasses(
                toast.type,
            )}"
            transition:fly={{ y: -8, duration: 200 }}
        >
            <div class="text-sm font-medium">{toast.message}</div>
            <button
                type="button"
                class="ml-auto text-xs text-muted-foreground hover:text-foreground"
                onclick={() => removeToast(toast.id)}
            >
                Close
            </button>
        </div>
    {/each}
</div>
