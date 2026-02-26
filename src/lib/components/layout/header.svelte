<script lang="ts">
    import { buttonVariants } from "$lib/components/ui/button";
    import { Menu } from "lucide-svelte";
    import {
        Sheet,
        SheetContent,
        SheetTrigger,
    } from "$lib/components/ui/sheet";
    import Sidebar from "./sidebar.svelte";
    import * as Avatar from "$lib/components/ui/avatar";

    let { data }: { data: any } = $props();
    let mobileSidebarOpen = $state(false);

    function getInitials(name: string) {
        return name
            ?.split(" ")
            .map((n) => n[0])
            .join("")
            .substring(0, 2)
            .toUpperCase();
    }
</script>

<header
    class="header-atmosphere sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-border px-4 sm:px-5"
>
    <!-- Mobile Menu -->
    <div class="md:hidden">
        <Sheet bind:open={mobileSidebarOpen}>
            <SheetTrigger
                    class={buttonVariants({
                        variant: "ghost",
                        size: "icon",
                        className:
                        "border border-border bg-surface-0 text-text-subtle hover:bg-surface-2 hover:text-text-strong md:hidden",
                })}
            >
                <Menu class="size-5" />
                <span class="sr-only">Toggle navigation menu</span>
            </SheetTrigger>
            <SheetContent
                side="left"
                class="w-[86vw] max-w-[320px] p-0 border-r border-sidebar-border bg-sidebar-bg"
            >
                <Sidebar
                    class="flex h-full w-full bg-sidebar-bg"
                    onNavigate={() => (mobileSidebarOpen = false)}
                />
            </SheetContent>
        </Sheet>
    </div>

    <div class="ml-auto flex items-center gap-3">
        {#if data.org}
            <span
                class="hidden rounded-[var(--radius-chip)] border border-border bg-surface-2 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-text-muted lg:inline-flex"
            >
                Active
            </span>
            <div class="flex flex-col items-end hidden md:flex">
                <span
                    class="text-sm font-semibold leading-none text-text-strong"
                    >{data.org.name}</span
                >
                <span class="text-[11px] text-text-muted">Workspace</span>
            </div>
            <Avatar.Root
                class="h-8 w-8 rounded-md border border-border-strong bg-surface-0 shadow-hairline"
            >
                <Avatar.Image src={data.org.logo_url} alt={data.org.name} />
                <Avatar.Fallback
                    class="rounded-md bg-primary/10 text-xs font-bold text-primary"
                >
                    {getInitials(data.org.name)}
                </Avatar.Fallback>
            </Avatar.Root>
        {/if}
    </div>
</header>
