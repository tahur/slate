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

<header class="flex h-[60px] items-center gap-4 bg-background px-6">
    <!-- Mobile Menu -->
    <div class="md:hidden">
        <Sheet>
            <SheetTrigger>
                <Button variant="ghost" size="icon" class="md:hidden">
                    <Menu class="size-5" />
                    <span class="sr-only">Toggle navigation menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" class="w-[220px] p-0 border-none">
                <Sidebar class="flex h-full w-full flex-col bg-[#1e1e1e]" />
            </SheetContent>
        </Sheet>
    </div>

    <!-- Breadcrumbs / Title -->
    <div class="flex items-center gap-2 text-sm text-muted-foreground">
        <span class="font-medium text-muted-foreground/60"
            >{getPageTitle($page.url.pathname).section}</span
        >
        <ChevronRight class="size-4 text-muted-foreground/40" />
        <span class="font-bold text-foreground text-lg"
            >{getPageTitle($page.url.pathname).page}</span
        >
    </div>

    <div class="ml-auto flex items-center gap-2">
        <!-- Placeholder for Page Actions -->
        <Button variant="outline" class="hidden h-9 md:flex">Action</Button>
    </div>
</header>
