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
	data-slot="table-container"
	class={cn(
		"w-full overflow-x-auto overscroll-x-contain rounded-[var(--radius-card)] [scrollbar-gutter:stable] type-table",
		className
	)}
	{...restProps}
>
	{@render children?.()}
</div>
