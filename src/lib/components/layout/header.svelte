<script lang="ts">
    import { page } from "$app/stores";
    import { Button } from "$lib/components/ui/button";
    import { Menu, ChevronRight } from "lucide-svelte";
    import {
        Sheet,
        SheetContent,
        SheetTrigger,
    } from "$lib/components/ui/sheet";
    import Sidebar from "./sidebar.svelte";

    // Helper to get page title from pathname
    function getPageTitle(pathname: string) {
        if (pathname === "/dashboard")
            return { section: "CRM", page: "Dashboard" };
        if (pathname.startsWith("/invoices"))
            return { section: "Clients", page: "Invoices" };
        if (pathname.startsWith("/payments"))
            return { section: "Finance", page: "Payments" };
        if (pathname.startsWith("/expenses"))
            return { section: "Finance", page: "Expenses" };
        if (pathname.startsWith("/customers"))
            return { section: "Clients", page: "Customers" };
        if (pathname.startsWith("/settings"))
            return { section: "System", page: "Settings" };
        return { section: "App", page: "OpenBill" };
    }
</script>

<header
    class="flex h-14 items-center gap-4 border-b border-border-subtle bg-surface-1 px-5"
>
    <!-- Mobile Menu -->
    <div class="md:hidden">
        <Sheet>
            <SheetTrigger>
                <Button variant="ghost" size="icon" class="md:hidden">
                    <Menu class="size-5" />
                    <span class="sr-only">Toggle navigation menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" class="w-[200px] p-0 border-none">
                <Sidebar class="flex h-full w-full flex-col bg-sidebar-bg" />
            </SheetContent>
        </Sheet>
    </div>

    <!-- Breadcrumbs / Title -->
    <div class="flex items-center gap-2">
        <span
            class="text-[11px] font-semibold uppercase tracking-[0.2em] text-text-muted"
            >{getPageTitle($page.url.pathname).section}</span
        >
        <ChevronRight class="size-3 text-text-muted/60" />
        <span class="text-base font-semibold text-text-strong"
            >{getPageTitle($page.url.pathname).page}</span
        >
    </div>

    <div class="ml-auto flex items-center gap-2">
        <!-- Placeholder for Page Actions -->
        <Button variant="outline" size="sm" class="hidden md:flex"
            >Action</Button
        >
    </div>
</header>
