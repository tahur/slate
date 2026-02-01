<script lang="ts">
    import { page } from "$app/stores";
    import { Button } from "$lib/components/ui/button";
    import {
        LayoutDashboard,
        FileText,
        Banknote,
        Wallet,
        Users,
        Settings,
        LogOut,
        Building2,
    } from "lucide-svelte";

    const navItems = [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/invoices", label: "Invoices", icon: FileText },
        { href: "/payments", label: "Payments", icon: Banknote },
        { href: "/expenses", label: "Expenses", icon: Wallet },
        { href: "/customers", label: "Customers", icon: Users },
        { href: "/settings", label: "Settings", icon: Settings },
    ];

    let { class: className }: { class?: string } = $props();
</script>

<aside
    class={className
        ? className
        : "hidden w-[200px] flex-col border-r border-border bg-card md:flex"}
>
    <div class="flex h-[48px] items-center border-b border-border px-4">
        <div class="flex items-center gap-2 font-semibold">
            <Building2 class="size-5" />
            <span>OpenBill</span>
        </div>
    </div>
    <nav class="flex-1 space-y-1 p-2">
        {#each navItems as item}
            {@const isActive = $page.url.pathname.startsWith(item.href)}
            <Button
                href={item.href}
                variant={isActive ? "secondary" : "ghost"}
                class="w-full justify-start gap-2 {isActive
                    ? 'font-medium'
                    : 'text-muted-foreground'}"
            >
                <item.icon class="size-4" />
                {item.label}
            </Button>
        {/each}
    </nav>
    <div class="border-t border-border p-2">
        <form action="/logout" method="POST">
            <Button
                variant="ghost"
                type="submit"
                class="w-full justify-start gap-2 text-muted-foreground hover:text-destructive"
            >
                <LogOut class="size-4" />
                Logout
            </Button>
        </form>
    </div>
</aside>
