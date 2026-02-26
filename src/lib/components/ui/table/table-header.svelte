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
	class={cn("border-b border-border bg-surface-2/70", className)}
	{...restProps}
>
	{@render children?.()}
</thead>
