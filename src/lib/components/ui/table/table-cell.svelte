<script lang="ts">
	import { cn } from "$lib/utils.js";
	import type { HTMLTdAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: HTMLTdAttributes & { ref?: HTMLElement | null; children?: any } = $props();
</script>

<td
	bind:this={ref}
	data-slot="table-cell"
	class={cn(
		"align-middle border-b border-border-subtle px-4 py-3 text-[var(--text-table-size)] leading-[1.35] text-text-strong",
		className
	)}
	{...restProps}
>
	{@render children?.()}
</td>
