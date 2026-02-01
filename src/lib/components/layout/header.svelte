<script lang="ts">
    import { page } from "$app/stores";
    import { Button } from "$lib/components/ui/button";
    import { Menu } from "lucide-svelte";
    import {
        Sheet,
        SheetContent,
        SheetTrigger,
    } from "$lib/components/ui/sheet";
    import Sidebar from "./sidebar.svelte";

    // Helper to get page title from pathname
    function getPageTitle(pathname: string) {
        if (pathname === "/dashboard") return "Dashboard";
        if (pathname.startsWith("/invoices")) return "Invoices";
        if (pathname.startsWith("/payments")) return "Payments";
        if (pathname.startsWith("/expenses")) return "Expenses";
        if (pathname.startsWith("/customers")) return "Customers";
        if (pathname.startsWith("/settings")) return "Settings";
        return "OpenBill";
    }
</script>

<header
    class="flex h-[48px] items-center gap-4 border-b border-border bg-background px-4 md:px-6"
>
    <div class="md:hidden">
        <Sheet>
            <SheetTrigger>
                <Button variant="ghost" size="icon" class="md:hidden">
                    <Menu class="size-5" />
                    <span class="sr-only">Toggle navigation menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" class="w-[200px] p-0">
                <Sidebar class="flex h-full w-full flex-col bg-card" />
            </SheetContent>
        </Sheet>
    </div>

    <h1 class="text-lg font-semibold md:text-xl">
        {getPageTitle($page.url.pathname)}
    </h1>

    <div class="ml-auto flex items-center gap-2">
        <!-- Header Actions (Profile, Search, etc. can go here) -->
    </div>
</header>
