<script lang="ts">
	import type { HTMLInputAttributes, HTMLInputTypeAttribute } from "svelte/elements";
	import { cn, type WithElementRef } from "$lib/utils.js";

	type InputType = Exclude<HTMLInputTypeAttribute, "file">;

	type Props = WithElementRef<
		Omit<HTMLInputAttributes, "type"> &
			({ type: "file"; files?: FileList } | { type?: InputType; files?: undefined })
	>;

	let {
		ref = $bindable(null),
		value = $bindable(),
		type,
		files = $bindable(),
		class: className,
		"data-slot": dataSlot = "input",
		...restProps
	}: Props = $props();
</script>

{#if type === "file"}
	<input
		bind:this={ref}
		data-slot={dataSlot}
		class={cn(
			"flex h-10 w-full min-w-0 rounded-[var(--radius-control)] border border-border-strong bg-surface-0 px-3 py-2 text-sm text-text-strong shadow-hairline outline-none transition-[color,border-color,box-shadow,background-color] selection:bg-surface-3 selection:text-text-strong placeholder:text-text-placeholder disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-text-muted",
			"focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-ring/20",
			"aria-invalid:border-destructive aria-invalid:ring-destructive/25",
			className
		)}
		type="file"
		bind:files
		bind:value
		{...restProps}
	/>
{:else}
	<input
		bind:this={ref}
		data-slot={dataSlot}
		class={cn(
			"flex h-10 w-full min-w-0 rounded-[var(--radius-control)] border border-border-strong bg-surface-0 px-3 py-2 text-sm text-text-strong shadow-hairline outline-none transition-[color,border-color,box-shadow,background-color] selection:bg-surface-3 selection:text-text-strong placeholder:text-text-placeholder disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-text-muted",
			"focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-ring/20",
			"aria-invalid:border-destructive aria-invalid:ring-destructive/25",
			className
		)}
		{type}
		bind:value
		{...restProps}
	/>
{/if}
