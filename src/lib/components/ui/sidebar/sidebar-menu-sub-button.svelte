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
    data-slot="sidebar-menu-sub-button"
    data-active={active ? "true" : "false"}
    data-sveltekit-noscroll
    href={href}
    class={cn(
        "flex w-full items-center gap-2 rounded-[calc(var(--radius-control)-0.125rem)] px-2 py-1.5 text-xs font-medium text-sidebar-fg transition-[background-color,color,border-color] [transition-duration:var(--motion-fast)] [transition-timing-function:var(--ease-standard)] hover:bg-surface-2 hover:text-text-strong data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-primary",
        className,
    )}
    onclick={() => onNavigate?.()}
    {...restProps}
>
    {@render children?.()}
</a>
