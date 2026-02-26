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
		"whitespace-nowrap px-4 py-2.5 text-left text-[var(--text-section-label-size)] leading-[1.35] font-semibold uppercase tracking-[0.08em] text-text-muted",
		className
	)}
	{...restProps}
>
	{@render children?.()}
</th>
