<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type {
		HTMLAnchorAttributes,
		HTMLButtonAttributes,
	} from "svelte/elements";
	import { type VariantProps, tv } from "tailwind-variants";

	export const buttonVariants = tv({
		base: "focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive inline-flex shrink-0 items-center justify-center gap-2 rounded-[4px] text-[13px] font-medium tracking-[0.01em] whitespace-nowrap transition-all outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
		variants: {
			variant: {
				default:
					"bg-primary text-primary-foreground border border-primary/60 hover:bg-primary/90 shadow-hairline",
				destructive:
					"bg-destructive hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60 text-white border border-destructive/60 shadow-hairline",
				outline:
					"bg-surface-0 hover:bg-surface-1 text-text-strong border border-border-strong shadow-hairline",
				secondary:
					"bg-secondary text-secondary-foreground hover:bg-surface-3 border border-border-strong shadow-hairline",
				ghost: "text-text-subtle hover:bg-surface-2 hover:text-text-strong",
				link: "text-primary underline-offset-4 hover:underline",
			},
			size: {
				xs: "h-6 gap-1 rounded-[4px] px-2 text-[11px] has-[>svg]:px-1.5",
				default: "h-8 px-3 has-[>svg]:px-2.5",
				sm: "h-7 gap-1.5 rounded-[4px] px-2.5 text-xs has-[>svg]:px-2",
				lg: "h-9 rounded-[4px] px-4 has-[>svg]:px-3",
				icon: "size-8",
				"icon-sm": "size-7",
				"icon-lg": "size-9",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	});

	export type ButtonVariant = VariantProps<typeof buttonVariants>["variant"];
	export type ButtonSize = VariantProps<typeof buttonVariants>["size"];

	export type ButtonProps = WithElementRef<HTMLButtonAttributes> &
		WithElementRef<HTMLAnchorAttributes> & {
			variant?: ButtonVariant;
			size?: ButtonSize;
		};
</script>

<script lang="ts">
	let {
		class: className,
		variant = "default",
		size = "default",
		ref = $bindable(null),
		href = undefined,
		type = "button",
		disabled,
		children,
		...restProps
	}: ButtonProps = $props();
</script>

{#if href}
	<a
		bind:this={ref}
		data-slot="button"
		class={cn(buttonVariants({ variant, size }), className)}
		href={disabled ? undefined : href}
		aria-disabled={disabled}
		role={disabled ? "link" : undefined}
		tabindex={disabled ? -1 : undefined}
		{...restProps}
	>
		{@render children?.()}
	</a>
{:else}
	<button
		bind:this={ref}
		data-slot="button"
		class={cn(buttonVariants({ variant, size }), className)}
		{type}
		{disabled}
		{...restProps}
	>
		{@render children?.()}
	</button>
{/if}
