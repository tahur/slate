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

<thead
	bind:this={ref}
	data-slot="table-header"
	class={cn("bg-surface-1 border-b border-border", className)}
	{...restProps}
>
	{@render children?.()}
</thead>
