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
    data-slot="sidebar-menu"
    class={cn("space-y-1", className)}
    {...restProps}
>
    {@render children?.()}
</ul>
