<script lang="ts">
	import { cn } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: HTMLAttributes<HTMLTableRowElement> & { ref?: HTMLElement | null; children?: any } = $props();
</script>

<tr
	bind:this={ref}
	data-slot="table-row"
	class={cn(
		"transition-colors duration-150 hover:bg-blue-50/50",
		className
	)}
	{...restProps}
>
	{@render children?.()}
</tr>
