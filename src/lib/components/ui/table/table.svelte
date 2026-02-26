<script lang="ts">
	import { cn } from "$lib/utils.js";
	import type { HTMLTableAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: HTMLTableAttributes & { ref?: HTMLElement | null; children?: any } = $props();
</script>

<table
	bind:this={ref}
	data-slot="table"
	class={cn(
		"w-full border-collapse type-table text-text-strong",
		className
	)}
	{...restProps}
>
	{@render children?.()}
</table>
