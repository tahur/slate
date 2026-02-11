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
	class={cn("px-4 py-3 text-text-strong border-b border-border align-middle", className)}
	{...restProps}
>
	{@render children?.()}
</td>
