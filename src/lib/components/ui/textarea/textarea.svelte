<script lang="ts">
	import { cn, type WithElementRef, type WithoutChildren } from "$lib/utils.js";
	import type { HTMLTextareaAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		value = $bindable(),
		class: className,
		"data-slot": dataSlot = "textarea",
		...restProps
	}: WithoutChildren<WithElementRef<HTMLTextareaAttributes>> = $props();
</script>

<textarea
	bind:this={ref}
	data-slot={dataSlot}
	class={cn(
		"flex field-sizing-content min-h-16 w-full rounded-[var(--radius-control)] border border-border-strong bg-surface-0 px-3 py-2 text-sm leading-relaxed text-text-strong shadow-hairline outline-none transition-[color,border-color,box-shadow,background-color] placeholder:text-text-placeholder focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-ring/20 aria-invalid:border-destructive aria-invalid:ring-destructive/25 disabled:cursor-not-allowed disabled:bg-surface-2 disabled:opacity-60",
		className
	)}
	bind:value
	{...restProps}
></textarea>
