<script lang="ts">
    import { page } from "$app/stores";
    import {
        LayoutDashboard,
        FileText,
        FileCheck,
        Banknote,
        Wallet,
        Users,
        Settings,
        LogOut,
        Briefcase,
        Package,
        BarChart3,
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
                    exact: true,
                },
            ],
        },
        {
            title: "SALES",
            items: [
                { href: "/invoices", label: "Invoices", icon: FileText },
                { href: "/quotations", label: "Quotations", icon: FileCheck },
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
                { href: "/reports", label: "Reports", icon: BarChart3, exact: true },
                {
                    href: "/reports/cashbook",
                    label: "Cashbook",
                    icon: Landmark,
                },
                { href: "/reports/ledger", label: "Ledger", icon: BookOpen },
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

<UiSidebar class={className ? className : "hidden w-[236px] md:flex"}>
    <SidebarHeader>
        <div class="flex items-center gap-2.5">
            <img
                src="/logo.svg"
                alt="Logo"
                class="h-7 w-7 rounded-[calc(var(--radius-control)-0.15rem)] ring-1 ring-border/70 shadow-hairline"
            />
            <span class="font-display text-[15px] font-semibold tracking-tight text-text-strong">Slate</span>
        </div>
    </SidebarHeader>

    <SidebarContent class="space-y-4">
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
                                {onNavigate}
                            >
                                <item.icon
                                    class="size-4 transition-colors [transition-duration:var(--motion-fast)] {itemActive
                                        ? 'text-text-strong'
                                        : 'text-text-placeholder group-hover:text-text-subtle'}"
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
        <SidebarMenu class="mb-1.5">
            {@const settingsActive = isActive("/settings")}
            <SidebarMenuItem>
                <SidebarMenuButton
                    href="/settings"
                    active={settingsActive}
                    {onNavigate}
                >
                    <Settings
                        class="size-4 transition-colors [transition-duration:var(--motion-fast)] {settingsActive
                            ? 'text-text-strong'
                            : 'text-text-placeholder group-hover:text-text-subtle'}"
                    />
                    <span class="flex-1">Settings</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>

        <form action="/logout" method="POST">
            <button
                type="submit"
                class="group flex min-h-10 w-full items-center gap-2.5 rounded-[var(--radius-control)] border border-transparent px-3 py-2 text-[13px] font-medium text-text-subtle transition-[background-color,color,border-color] [transition-duration:var(--motion-fast)] [transition-timing-function:var(--ease-standard)] hover:bg-surface-2 hover:text-text-strong"
            >
                <LogOut
                    class="size-4 text-text-placeholder transition-colors [transition-duration:var(--motion-fast)] group-hover:text-text-strong"
                />
                Logout
            </button>
        </form>
    </SidebarFooter>
</UiSidebar>
