<script lang="ts">
	import { Tabs as TabsPrimitive } from "bits-ui";
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: TabsPrimitive.TriggerProps = $props();
</script>

<TabsPrimitive.Trigger
	bind:ref
	class={cn(
		"inline-flex items-center justify-center gap-2 whitespace-nowrap px-1 pb-2.5 -mb-px text-sm font-medium text-text-muted border-b-2 border-transparent transition-colors",
		"hover:text-text-strong hover:border-border-strong",
		"data-[state=active]:text-primary data-[state=active]:border-primary",
		"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
		"disabled:pointer-events-none disabled:opacity-50",
		className,
	)}
	{...restProps}
>
	{@render children?.()}
</TabsPrimitive.Trigger>
