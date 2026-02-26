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
        "mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-text-muted/85",
        className,
    )}
    {...restProps}
>
    {@render children?.()}
</h3>
