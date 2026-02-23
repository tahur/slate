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
    class={cn("flex h-14 items-center border-b border-sidebar-border px-4", className)}
    {...restProps}
>
    {@render children?.()}
</div>

