<script lang="ts">
    import { cn, type WithElementRef } from "$lib/utils.js";
    import type { HTMLAttributes } from "svelte/elements";

    let {
        ref = $bindable(null),
        class: className,
        children,
        ...restProps
    }: WithElementRef<HTMLAttributes<HTMLUListElement>> = $props();
</script>

<ul
    bind:this={ref}
    data-slot="sidebar-menu-sub"
    class={cn("ml-4 mt-1 space-y-0.5 border-l border-sidebar-border pl-2.5", className)}
    {...restProps}
>
    {@render children?.()}
</ul>

