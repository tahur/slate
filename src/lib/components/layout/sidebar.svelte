<script lang="ts">
    import { page } from "$app/stores";
    import { Button } from "$lib/components/ui/button";
    import {
        LayoutDashboard,
        FileText,
        Banknote,
        Wallet,
        Users,
        BarChart3,
        Settings,
        LogOut,
        Building2,
        Briefcase,
        CreditCard,
        BookOpen,
    } from "lucide-svelte";

    const navSections = [
        {
            title: "CRM",
            items: [
                {
                    href: "/dashboard",
                    label: "Dashboard",
                    icon: LayoutDashboard,
                },
                { href: "/reports", label: "Analytics", icon: BarChart3 },
            ],
        },
        {
            title: "CLIENTS",
            items: [
                { href: "/customers", label: "Customers", icon: Users },
                { href: "/invoices", label: "Invoices", icon: FileText },
                {
                    href: "/credit-notes",
                    label: "Credit Notes",
                    icon: CreditCard,
                },
            ],
        },
        {
            title: "FINANCE",
            items: [
                { href: "/payments", label: "Payments", icon: Banknote },
                { href: "/expenses", label: "Expenses", icon: Wallet },
            ],
        },

        {
            title: "SETTINGS",
            items: [{ href: "/settings", label: "Settings", icon: Settings }],
        },
    ];

    let { class: className }: { class?: string } = $props();
</script>

<aside
    class={className
        ? className
        : "hidden w-[200px] flex-col border-r border-sidebar-border bg-sidebar-bg text-sidebar-fg md:flex"}
>
    <!-- Header -->
    <div class="flex h-14 items-center px-4 border-b border-sidebar-border/40">
        <div
            class="flex items-center gap-2.5 font-bold tracking-tight text-sm uppercase text-sidebar-primary"
        >
            <Building2 class="size-5" />
            <span class="text-sidebar-fg">OpenBill</span>
        </div>
    </div>

    <!-- Navigation -->
    <div class="flex-1 overflow-auto py-3 px-2.5 space-y-5">
        {#each navSections as section}
            <div class="space-y-1">
                <h3
                    class="px-2.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-sidebar-fg/60 mb-2"
                >
                    {section.title}
                </h3>
                {#each section.items as item}
                    {@const isActive = $page.url.pathname.startsWith(item.href)}
                    <a
                        href={item.href}
                        class="group relative flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition-all
                        {isActive
                            ? 'bg-sidebar-accent text-sidebar-primary shadow-sm border border-sidebar-border/50'
                            : 'text-sidebar-fg hover:bg-sidebar-accent/50 hover:text-sidebar-fg'}"
                    >
                        <!-- Active Indicator (Left Bar) -->
                        {#if isActive}
                            <span
                                class="absolute left-0 top-1/2 h-5 w-0.5 rounded-r-full -translate-y-1/2 bg-sidebar-primary"
                            ></span>
                        {/if}

                        <item.icon
                            class="size-4 transition-colors {isActive
                                ? 'text-sidebar-primary'
                                : 'text-sidebar-fg/70 group-hover:text-sidebar-fg'}"
                        />
                        <span class="flex-1">{item.label}</span>
                    </a>
                {/each}
            </div>
        {/each}
    </div>

    <!-- Footer -->
    <div class="border-t border-sidebar-border p-3">
        <form action="/logout" method="POST">
            <button
                type="submit"
                class="group flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium text-sidebar-fg transition-colors hover:bg-sidebar-accent/50 hover:text-red-600"
            >
                <LogOut
                    class="size-4 transition-colors group-hover:text-red-500"
                />
                Logout
            </button>
        </form>
    </div>
</aside>
