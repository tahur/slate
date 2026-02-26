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
	data-slot="card"
	class={cn(
		"rounded-[var(--radius-card)] border border-border bg-surface-0 text-card-foreground shadow-hairline",
		className,
	)}
	{...restProps}
>
	{@render children?.()}
</div>
