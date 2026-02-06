<script lang="ts">
	import { Tabs as TabsPrimitive } from "bits-ui";
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: TabsPrimitive.ContentProps = $props();
</script>

<TabsPrimitive.Content
	bind:ref
	class={cn(
		"mt-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
		className,
	)}
	{...restProps}
>
	{@render children?.()}
</TabsPrimitive.Content>
