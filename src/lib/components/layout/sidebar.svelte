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
        : "hidden w-[220px] flex-col border-r border-[#2d2d2d] bg-[#1e1e1e] text-[#9ca3af] md:flex"}
>
    <!-- Header -->
    <div class="flex h-[60px] items-center px-6">
        <div
            class="flex items-center gap-3 font-bold text-white tracking-wide text-lg"
        >
            <Building2 class="size-6 text-primary" />
            <span>OpenBill</span>
        </div>
    </div>

    <!-- Navigation -->
    <div class="flex-1 overflow-auto py-4 px-3 space-y-6">
        {#each navSections as section}
            <div class="space-y-1">
                <h3
                    class="px-3 text-xs font-semibold uppercase tracking-wider text-[#6b7280] mb-2"
                >
                    {section.title}
                </h3>
                {#each section.items as item}
                    {@const isActive = $page.url.pathname.startsWith(item.href)}
                    <a
                        href={item.href}
                        class="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all hover:bg-[#2d2d2d] hover:text-white
                        {isActive ? 'bg-[#2d2d2d] text-white' : ''}"
                    >
                        <item.icon
                            class="size-5 transition-colors {isActive
                                ? 'text-primary'
                                : 'text-[#9ca3af] group-hover:text-white'}"
                        />
                        {item.label}
                        {#if isActive}
                            <div
                                class="ml-auto h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(251,191,36,0.5)]"
                            ></div>
                        {/if}
                    </a>
                {/each}
            </div>
        {/each}
    </div>

    <!-- Footer -->
    <div class="border-t border-[#2d2d2d] p-4">
        <form action="/logout" method="POST">
            <button
                type="submit"
                class="group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[#9ca3af] transition-all hover:text-white"
            >
                <LogOut
                    class="size-5 transition-colors group-hover:text-red-400"
                />
                Logout
            </button>
        </form>
    </div>
</aside>
