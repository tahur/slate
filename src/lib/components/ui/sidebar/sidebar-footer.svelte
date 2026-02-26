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
    data-slot="sidebar-footer"
    class={cn(
        "border-t border-sidebar-border/80 bg-surface-1/55 p-3 backdrop-blur-[1px]",
        className,
    )}
    {...restProps}
>
    {@render children?.()}
</div>
