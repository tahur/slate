<script lang="ts">
	import { cn } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: HTMLAttributes<HTMLTableSectionElement> & { ref?: HTMLElement | null; children?: any } = $props();
</script>

<tfoot
	bind:this={ref}
	data-slot="table-footer"
	class={cn("border-t-2 border-border font-semibold bg-surface-1", className)}
	{...restProps}
>
	{@render children?.()}
</tfoot>
