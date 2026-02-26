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
        ChevronsUpDown,
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
                { href: "/reports", label: "Overview", icon: BarChart3, exact: true },
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
        data,
    }: { class?: string; onNavigate?: () => void; data?: any } = $props();

    let menuOpen = $state(false);
    let menuRef: HTMLDivElement | null = $state(null);

    function isActive(href: string, exact = false) {
        return exact
            ? $page.url.pathname === href
            : $page.url.pathname.startsWith(href);
    }

    function getInitials(name: string) {
        return name
            ?.split(" ")
            .map((n: string) => n[0])
            .join("")
            .substring(0, 2)
            .toUpperCase();
    }

    function handleClickOutside(e: MouseEvent) {
        if (menuRef && !menuRef.contains(e.target as HTMLElement)) {
            menuOpen = false;
        }
    }

    $effect(() => {
        if (menuOpen) {
            document.addEventListener("click", handleClickOutside, true);
            return () => document.removeEventListener("click", handleClickOutside, true);
        }
    });
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
                                        ? 'text-blue-600'
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
        <div bind:this={menuRef} class="relative">
            {#if menuOpen}
                <div class="absolute bottom-full left-0 right-0 mb-1.5 rounded-lg border border-slate-200 bg-white shadow-lg overflow-hidden z-50">
                    <a
                        href="/settings"
                        onclick={() => { menuOpen = false; onNavigate?.(); }}
                        class="flex items-center gap-2.5 px-3 py-2.5 text-[13px] font-medium text-slate-600 transition-colors hover:bg-blue-50/50 hover:text-[#111]"
                    >
                        <Settings class="size-4 text-slate-400" />
                        Settings
                    </a>
                    <form action="/logout" method="POST">
                        <button
                            type="submit"
                            class="flex w-full items-center gap-2.5 px-3 py-2.5 text-[13px] font-medium text-slate-600 transition-colors hover:bg-blue-50/50 hover:text-red-600 border-t border-slate-100"
                        >
                            <LogOut class="size-4 text-slate-400" />
                            Logout
                        </button>
                    </form>
                </div>
            {/if}

            <button
                type="button"
                onclick={() => (menuOpen = !menuOpen)}
                class="flex w-full items-center gap-2.5 rounded-lg border border-blue-100 bg-blue-50/40 p-2.5 text-left transition-colors hover:bg-blue-50/70"
            >
                {#if data?.org?.logo_url}
                    <img
                        src={data.org.logo_url}
                        alt={data.org.name}
                        class="size-8 rounded-md object-cover ring-1 ring-slate-200 shrink-0"
                    />
                {:else}
                    <div class="flex size-8 items-center justify-center rounded-md bg-blue-50 text-blue-600 text-xs font-bold shrink-0">
                        {getInitials(data?.org?.name || "S")}
                    </div>
                {/if}
                <div class="flex-1 min-w-0">
                    <p class="text-[13px] font-semibold text-[#111] truncate">
                        {data?.org?.name || "Workspace"}
                    </p>
                    <p class="text-[11px] text-slate-400 truncate">
                        {data?.user?.email || ""}
                    </p>
                </div>
                <ChevronsUpDown class="size-3.5 text-slate-400 shrink-0" />
            </button>
        </div>
    </SidebarFooter>
</UiSidebar>
