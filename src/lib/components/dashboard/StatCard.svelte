<script lang="ts">
    import { cn } from "$lib/utils";
    import type { Snippet } from "svelte";

    interface Props {
        label: string;
        value: string;
        tooltip?: string;
        variant?: "default" | "positive" | "warning" | "negative";
        href?: string;
        icon?: Snippet;
    }

    let { label, value, tooltip, variant = "default", href, icon }: Props =
        $props();

    const variantClasses = {
        default: "bg-surface-1 border-border",
        positive: "bg-positive/5 border-positive/20",
        warning: "bg-warning/5 border-warning/20",
        negative: "bg-negative/5 border-negative/20",
    };

    const labelClasses = {
        default: "text-text-secondary",
        positive: "text-positive",
        warning: "text-warning",
        negative: "text-negative",
    };
</script>

{#if href}
    <a
        {href}
        class={cn(
            "stat-card flex flex-col gap-1 rounded-lg border p-4 transition-all hover:shadow-md hover:scale-[1.01]",
            variantClasses[variant],
        )}
    >
        <div class="flex items-center justify-between">
            <span
                class={cn(
                    "text-[11px] font-bold uppercase tracking-widest",
                    labelClasses[variant],
                )}
            >
                {label}
            </span>
            <div class="flex items-center gap-1.5">
                {#if icon}
                    {@render icon()}
                {/if}
                {#if tooltip}
                    <span
                        class="cursor-help text-text-muted hover:text-text-secondary transition-colors"
                        title={tooltip}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        >
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M12 16v-4"></path>
                            <path d="M12 8h.01"></path>
                        </svg>
                    </span>
                {/if}
            </div>
        </div>
        <div class="text-2xl font-bold tracking-tight text-text-strong">
            {value}
        </div>
    </a>
{:else}
    <div
        class={cn(
            "stat-card flex flex-col gap-1 rounded-lg border p-4",
            variantClasses[variant],
        )}
    >
        <div class="flex items-center justify-between">
            <span
                class={cn(
                    "text-[11px] font-bold uppercase tracking-widest",
                    labelClasses[variant],
                )}
            >
                {label}
            </span>
            <div class="flex items-center gap-1.5">
                {#if icon}
                    {@render icon()}
                {/if}
                {#if tooltip}
                    <span
                        class="cursor-help text-text-muted hover:text-text-secondary transition-colors"
                        title={tooltip}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        >
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M12 16v-4"></path>
                            <path d="M12 8h.01"></path>
                        </svg>
                    </span>
                {/if}
            </div>
        </div>
        <div class="text-2xl font-bold tracking-tight text-text-strong">
            {value}
        </div>
    </div>
{/if}
