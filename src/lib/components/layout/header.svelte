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
    class="flex h-14 items-center gap-4 border-b border-border bg-surface-1 px-5"
>
    <!-- Mobile Menu -->
    <div class="md:hidden">
        <Sheet>
            <SheetTrigger
                class={buttonVariants({
                    variant: "ghost",
                    size: "icon",
                    className: "md:hidden",
                })}
            >
                <Menu class="size-5" />
                <span class="sr-only">Toggle navigation menu</span>
            </SheetTrigger>
            <SheetContent side="left" class="w-[200px] p-0 border-none">
                <Sidebar class="flex h-full w-full flex-col bg-sidebar-bg" />
            </SheetContent>
        </Sheet>
    </div>

    <div class="ml-auto flex items-center gap-3">
        {#if data.org}
            <div class="flex flex-col items-end hidden md:flex">
                <span
                    class="text-sm font-semibold text-text-strong leading-none"
                    >{data.org.name}</span
                >
                <span class="text-[10px] text-text-muted">Organization</span>
            </div>
            <Avatar.Root class="h-8 w-8 rounded-md border border-border">
                <Avatar.Image src={data.org.logo_url} alt={data.org.name} />
                <Avatar.Fallback
                    class="rounded-md bg-primary/10 text-primary font-bold text-xs"
                >
                    {getInitials(data.org.name)}
                </Avatar.Fallback>
            </Avatar.Root>
        {/if}
    </div>
</header>
