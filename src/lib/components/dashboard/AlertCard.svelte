<script lang="ts">
    import { cn } from "$lib/utils";
    import type { Snippet } from "svelte";

    interface Props {
        title: string;
        amount: string;
        href: string;
        variant?: "warning" | "info";
        icon?: Snippet;
    }

    let { title, amount, href, variant = "warning", icon }: Props = $props();

    const variantClasses = {
        warning: "bg-warning/5 border-warning/20 hover:bg-warning/10",
        info: "bg-info/5 border-info/20 hover:bg-info/10",
    };

    const iconClasses = {
        warning: "text-warning",
        info: "text-info",
    };
</script>

<a
    {href}
    class={cn(
        "alert-card flex items-center gap-4 rounded-lg border px-4 py-3 transition-all hover:shadow-sm",
        variantClasses[variant],
    )}
>
    {#if icon}
        <span class={cn("flex-shrink-0", iconClasses[variant])}>
            {@render icon()}
        </span>
    {/if}
    <span class="flex-1 text-sm font-medium text-text-strong">
        {title}
    </span>
    <span class="font-mono text-sm font-semibold text-text-strong tabular-nums">
        {amount}
    </span>
    <span class="text-xs font-medium text-text-muted">
        View →
    </span>
</a>
