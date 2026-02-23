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
        "group relative flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-sidebar-fg transition-all duration-150 hover:bg-surface-2 hover:text-text-strong data-[active=true]:bg-sidebar-accent data-[active=true]:font-semibold data-[active=true]:text-sidebar-primary",
        className,
    )}
    onclick={() => onNavigate?.()}
    {...restProps}
>
    {@render children?.()}
</a>

