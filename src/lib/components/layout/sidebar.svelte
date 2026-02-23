<script lang="ts">
    import { page } from "$app/stores";
    import {
        LayoutDashboard,
        FileText,
        Banknote,
        Wallet,
        Users,
        BarChart3,
        Settings,
        LogOut,
        Briefcase,
        Package,
        Landmark,
        BookOpen,
    } from "lucide-svelte";
    import {
        Sidebar as UiSidebar,
        SidebarHeader,
        SidebarContent,
        SidebarFooter,
        SidebarGroup,
        SidebarGroupLabel,
        SidebarMenu,
        SidebarMenuItem,
        SidebarMenuButton,
    } from "$lib/components/ui/sidebar";

    type NavItem = {
        href: string;
        label: string;
        icon: any;
        exact?: boolean;
    };

    const navSections = [
        {
            title: "",
            items: <NavItem[]>[
                {
                    href: "/dashboard",
                    label: "Dashboard",
                    icon: LayoutDashboard,
                },
            ],
        },
        {
            title: "SALES",
            items: [
                { href: "/invoices", label: "Invoices", icon: FileText },
                { href: "/payments", label: "Receipts", icon: Banknote },
                { href: "/customers", label: "Customers", icon: Users },
                { href: "/items", label: "Items", icon: Package },
            ],
        },
        {
            title: "PURCHASE",
            items: [
                { href: "/expenses", label: "Expenses", icon: Wallet },
                { href: "/vendors", label: "Suppliers", icon: Briefcase },
            ],
        },
        {
            title: "REPORTS",
            items: [
                { href: "/reports", label: "Overview", icon: BarChart3, exact: true },
                { href: "/reports/cashbook", label: "Cashbook", icon: Landmark },
                { href: "/reports/ledger", label: "Ledger", icon: BookOpen },
            ],
        },
        {
            title: "SETUP",
            items: [
                { href: "/settings", label: "Settings", icon: Settings },
            ],
        },
    ];

    let {
        class: className,
        onNavigate,
    }: { class?: string; onNavigate?: () => void } = $props();

    function isActive(href: string, exact = false) {
        return exact
            ? $page.url.pathname === href
            : $page.url.pathname.startsWith(href);
    }
</script>

<UiSidebar
    class={className
        ? className
        : "hidden w-[200px] md:flex"}
>
    <SidebarHeader>
        <div
            class="hidden lg:flex items-center gap-3 font-bold tracking-tight text-sm uppercase text-sidebar-primary"
        >
            <img src="/logo.svg" alt="Logo" class="h-9 w-auto" />
            <span
                class="font-display text-xl text-text-strong normal-case tracking-normal mt-1"
                >Slate</span
            >
        </div>
    </SidebarHeader>

    <SidebarContent class="space-y-5">
        {#each navSections as section}
            <SidebarGroup>
                {#if section.title}
                    <SidebarGroupLabel>
                        {section.title}
                    </SidebarGroupLabel>
                {/if}
                <SidebarMenu>
                    {#each section.items as item}
                        {@const itemActive = isActive(item.href, item.exact)}
                        <SidebarMenuItem>
                            <SidebarMenuButton
                                href={item.href}
                                active={itemActive}
                                onNavigate={onNavigate}
                            >
                                <span
                                    class="absolute left-0 top-1/2 h-5 w-0.5 rounded-r-full -translate-y-1/2 bg-sidebar-primary transition-opacity duration-150
                                    {itemActive ? 'opacity-100' : 'opacity-0'}"
                                ></span>
                                <item.icon
                                    class="size-4 transition-colors duration-150 {itemActive
                                        ? 'text-sidebar-primary'
                                        : 'text-sidebar-fg group-hover:text-text-strong'}"
                                />
                                <span class="flex-1">{item.label}</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    {/each}
                </SidebarMenu>
            </SidebarGroup>
        {/each}
    </SidebarContent>

    <SidebarFooter>
        <form action="/logout" method="POST">
            <button
                type="submit"
                class="group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-sidebar-fg transition-colors hover:bg-red-50 hover:text-red-600"
            >
                <LogOut
                    class="size-4 transition-colors group-hover:text-red-500"
                />
                Logout
            </button>
        </form>
    </SidebarFooter>
</UiSidebar>
