<script lang="ts">
    import { cn, type WithElementRef } from "$lib/utils.js";
    import type { HTMLAttributes } from "svelte/elements";

    let {
        ref = $bindable(null),
        class: className,
        children,
        ...restProps
    }: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();
</script>

<div
    bind:this={ref}
    data-slot="sidebar-header"
    class={cn(
        "flex items-center border-b border-sidebar-border/80 bg-sidebar-bg/70 px-4 py-3",
        className,
    )}
    {...restProps}
>
    {@render children?.()}
</div>
