<script lang="ts" module>
	import { type VariantProps, tv } from "tailwind-variants";

	export const badgeVariants = tv({
		base: "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-[var(--radius-chip)] border px-2.5 py-1 text-[10px] leading-none font-semibold uppercase tracking-[0.08em] whitespace-nowrap transition-[color,background-color,border-color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/25 [&>svg]:pointer-events-none [&>svg]:size-3",
		variants: {
			variant: {
				default:
					"border-border-strong bg-surface-2 text-text-subtle [a&]:hover:bg-surface-3",
				secondary:
					"border-border bg-surface-1 text-text-muted [a&]:hover:bg-surface-2",
				destructive:
					"border-destructive/30 bg-destructive/10 text-destructive [a&]:hover:bg-destructive/15",
				outline: "border-border-strong bg-transparent text-text-subtle [a&]:hover:bg-surface-2",
				success:
					"border-positive/30 bg-positive/10 text-positive [a&]:hover:bg-positive/15",
				warning:
					"border-warning/30 bg-warning/10 text-warning-foreground [a&]:hover:bg-warning/15",
				info: "border-info/25 bg-info/10 text-info [a&]:hover:bg-info/15",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	});

	export type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];
</script>

<script lang="ts">
	import type { HTMLAnchorAttributes } from "svelte/elements";
	import { cn, type WithElementRef } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		href,
		class: className,
		variant = "default",
		children,
		...restProps
	}: WithElementRef<HTMLAnchorAttributes> & {
		variant?: BadgeVariant;
	} = $props();
</script>

<svelte:element
	this={href ? "a" : "span"}
	bind:this={ref}
	data-slot="badge"
	{href}
	class={cn(badgeVariants({ variant }), className)}
	{...restProps}
>
	{@render children?.()}
</svelte:element>
