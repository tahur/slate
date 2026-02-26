<script lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import { cn, type WithElementRef } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();
</script>

<div
	bind:this={ref}
	data-slot="card-title"
	class={cn(
		"font-display text-[0.9375rem] leading-tight font-semibold tracking-[-0.012em] text-text-strong",
		className
	)}
	{...restProps}
>
	{@render children?.()}
</div>
