<script lang="ts">
	import { cn } from "$lib/utils.js";
	import type { HTMLThAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: HTMLThAttributes & { ref?: HTMLElement | null; children?: any } = $props();
</script>

<th
	bind:this={ref}
	data-slot="table-head"
	class={cn(
		"px-4 py-2.5 text-left text-[0.6875rem] font-semibold uppercase tracking-[0.05em] text-text-muted whitespace-nowrap",
		className
	)}
	{...restProps}
>
	{@render children?.()}
</th>
