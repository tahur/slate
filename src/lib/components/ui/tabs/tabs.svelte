<script lang="ts">
	import { Tabs as TabsPrimitive } from "bits-ui";
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: TabsPrimitive.RootProps = $props();
</script>

<TabsPrimitive.Root
	bind:ref
	class={cn("w-full", className)}
	{...restProps}
>
	{@render children?.()}
</TabsPrimitive.Root>
