<script lang="ts">
    import { cn, type WithElementRef } from "$lib/utils.js";
    import type { HTMLAttributes } from "svelte/elements";

    let {
        ref = $bindable(null),
        class: className,
        children,
        ...restProps
    }: WithElementRef<HTMLAttributes<HTMLHeadingElement>> = $props();
</script>

<h3
    bind:this={ref}
    data-slot="sidebar-group-label"
    class={cn(
        "mb-2 px-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-text-muted",
        className,
    )}
    {...restProps}
>
    {@render children?.()}
</h3>

