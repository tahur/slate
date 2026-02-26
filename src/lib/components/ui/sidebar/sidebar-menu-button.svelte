<script lang="ts">
    import { cn, type WithElementRef } from "$lib/utils.js";
    import type { HTMLAnchorAttributes } from "svelte/elements";

    let {
        ref = $bindable(null),
        class: className,
        href,
        active = false,
        onNavigate,
        children,
        ...restProps
    }: WithElementRef<HTMLAnchorAttributes> & {
        href: string;
        active?: boolean;
        onNavigate?: () => void;
    } = $props();
</script>

<a
    bind:this={ref}
    data-slot="sidebar-menu-button"
    data-active={active ? "true" : "false"}
    data-sveltekit-noscroll
    href={href}
	class={cn(
		"group relative flex min-h-10 w-full items-center gap-2.5 rounded-[var(--radius-control)] border border-transparent px-3 py-2 text-[13px] font-medium text-text-subtle transition-[background-color,color,border-color,box-shadow] [transition-duration:var(--motion-fast)] [transition-timing-function:var(--ease-standard)] hover:bg-surface-2/90 hover:text-text-strong data-[active=true]:border-border data-[active=true]:bg-surface-0 data-[active=true]:text-text-strong data-[active=true]:font-semibold data-[active=true]:shadow-hairline after:absolute after:start-1.5 after:top-2 after:bottom-2 after:w-0.5 after:rounded-full after:bg-primary after:opacity-0 after:transition-opacity after:[transition-duration:var(--motion-fast)] data-[active=true]:after:opacity-100",
		className,
	)}
    onclick={() => onNavigate?.()}
    {...restProps}
>
    {@render children?.()}
</a>
