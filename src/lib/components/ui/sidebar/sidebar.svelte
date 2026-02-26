<script lang="ts">
    import { cn, type WithElementRef } from "$lib/utils.js";
    import type { HTMLAttributes } from "svelte/elements";

    let {
        ref = $bindable(null),
        class: className,
        children,
        ...restProps
    }: WithElementRef<HTMLAttributes<HTMLElement>> = $props();
</script>

<aside
    bind:this={ref}
    data-slot="sidebar"
	class={cn(
		"sidebar-atmosphere flex flex-col border-r border-sidebar-border text-sidebar-fg",
		className,
	)}
    {...restProps}
>
    {@render children?.()}
</aside>
