<script lang="ts">
	import { Label as LabelPrimitive } from "bits-ui";
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		variant,
		...restProps
	}: LabelPrimitive.RootProps & { variant?: "form" } = $props();

	const formClasses = "text-[0.6875rem] font-semibold uppercase tracking-[0.05em] text-text-subtle";
</script>

<LabelPrimitive.Root
	bind:ref
	data-slot="label"
	class={cn(
		"flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
		variant === "form" && formClasses,
		className
	)}
	{...restProps}
/>
