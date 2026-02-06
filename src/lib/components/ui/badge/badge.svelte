<script lang="ts" module>
	import { type VariantProps, tv } from "tailwind-variants";

	export const badgeVariants = tv({
		base: "focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] [&>svg]:pointer-events-none [&>svg]:size-3",
		variants: {
			variant: {
				default:
					"bg-surface-2 text-text-strong border-border [a&]:hover:bg-surface-3",
				secondary:
					"bg-surface-1 text-text-subtle border-border [a&]:hover:bg-surface-2",
				destructive:
					"bg-negative/15 [a&]:hover:bg-negative/25 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-negative/30 border-negative/35 text-negative",
				outline: "text-text-subtle border-border-strong [a&]:hover:bg-surface-2",
				success:
					"bg-positive/12 text-positive border-positive/30 [a&]:hover:bg-positive/20",
				warning:
					"bg-warning/12 text-warning-foreground border-warning/35 [a&]:hover:bg-warning/20",
				info: "bg-info/12 text-info border-info/35 [a&]:hover:bg-info/20",
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
