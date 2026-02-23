<script lang="ts">
    import {
        BarChart3,
        Users,
        FileText,
        TrendingUp,
        BookOpen,
        Briefcase,
        ArrowRight,
        FileSpreadsheet,
        Receipt,
        Info,
        Landmark,
    } from "lucide-svelte";
    import * as Tooltip from "$lib/components/ui/tooltip";

    type ReportItem = {
        title: string;
        description: string;
        href: string;
        icon: any;
        iconClass: string;
        simpleDescription?: string;
        accountingTerm?: string;
    };

    type ReportSection = {
        title: string;
        items: ReportItem[];
    };

    const reportSections: ReportSection[] = [
        {
            title: "Business Reports",
            items: [
                {
                    title: "Profit & Loss",
                    accountingTerm: "P&L Statement",
                    description: "Income, expenses, and net profit summary",
                    simpleDescription:
                        "See if you are making money or losing it",
                    href: "/reports/pnl",
                    icon: TrendingUp,
                    iconClass: "bg-blue-50 text-blue-700",
                },
                {
                    title: "GST Summary",
                    accountingTerm: "Output vs Input GST",
                    description:
                        "Tax collected (Output) vs matched credits (Input)",
                    href: "/reports/gst",
                    icon: FileText,
                    iconClass: "bg-green-50 text-green-700",
                },
                {
                    title: "Customer Pending",
                    accountingTerm: "A/R Ageing",
                    description: "Pending customer payments by bill age",
                    href: "/reports/aging",
                    icon: BarChart3,
                    iconClass: "bg-amber-50 text-amber-700",
                },
                {
                    title: "Party Ledger",
                    accountingTerm: "A/R + Supplier Statement",
                    description: "Customer and supplier statement with reasons",
                    href: "/reports/ledger",
                    icon: Users,
                    iconClass: "bg-surface-2 text-text-subtle",
                },
                {
                    title: "Cashbook (Cash & Bank)",
                    accountingTerm: "Cash & Bank Book",
                    description: "Money in and money out, account-wise",
                    simpleDescription:
                        "Daily cash and bank movement in one place",
                    href: "/reports/cashbook",
                    icon: Landmark,
                    iconClass: "bg-red-50 text-red-700",
                },
            ],
        },
        {
            title: "GST Filing Reports",
            items: [
                {
                    title: "GSTR-1 Sales Register",
                    accountingTerm: "Outward Supplies Register",
                    description:
                        "Outward supplies data (B2B, B2C, credit notes, HSN)",
                    href: "/reports/gstr1",
                    icon: FileSpreadsheet,
                    iconClass: "bg-blue-50 text-blue-700",
                },
                {
                    title: "GSTR-3B Purchase Data",
                    accountingTerm: "Input ITC Register",
                    description:
                        "Input tax credit data from purchases by supplier",
                    href: "/reports/gstr3b",
                    icon: Receipt,
                    iconClass: "bg-green-50 text-green-700",
                },
            ],
        },
        {
            title: "Advanced Accounting",
            items: [
                {
                    title: "Chart of Accounts",
                    description:
                        "Advanced setup: ledgers, groups, and default accounts",
                    href: "/accounts",
                    icon: BookOpen,
                    iconClass: "bg-surface-2 text-text-subtle",
                },
                {
                    title: "Journal Entries",
                    description: "Manual adjustment entries (advanced)",
                    href: "/journals",
                    icon: Briefcase,
                    iconClass: "bg-surface-2 text-text-subtle",
                },
            ],
        },
    ];
</script>

<div class="page-full-bleed">
    <header class="px-6 py-4 border-b border-border bg-surface-0 z-20">
        <h1 class="text-xl font-bold tracking-tight text-text-strong">Reports</h1>
        <p class="text-sm text-text-muted mt-1">
            Simple business reports, GST filing data, and advanced tools
        </p>
    </header>

    <div class="flex-1 overflow-auto bg-surface-1 p-6">
        <div class="max-w-7xl mx-auto space-y-6">
            {#each reportSections as section}
                <div class="space-y-3">
                    <h2
                        class="text-xs font-semibold uppercase tracking-wider text-text-muted"
                    >
                        {section.title}
                    </h2>

                    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {#each section.items as item}
                            <a
                                href={item.href}
                                class="group relative rounded-xl border border-border bg-surface-0 p-5 transition-all hover:shadow-sm hover:border-border-strong"
                            >
                                <div class="flex items-start gap-4">
                                    <div class="rounded-lg p-2.5 shrink-0 {item.iconClass}">
                                        <svelte:component
                                            this={item.icon}
                                            class="size-5"
                                        />
                                    </div>
                                    <div class="min-w-0 flex-1">
                                        <div class="flex items-center gap-1.5 flex-wrap">
                                            <h3
                                                class="text-sm font-bold text-text-strong group-hover:text-primary transition-colors"
                                            >
                                                {item.title}
                                            </h3>
                                            {#if item.accountingTerm}
                                                <span class="text-xs text-text-muted">
                                                    ({item.accountingTerm})
                                                </span>
                                            {/if}
                                            {#if item.simpleDescription}
                                                <Tooltip.Root>
                                                    <Tooltip.Trigger>
                                                        <Info
                                                            class="size-3.5 text-text-muted cursor-help"
                                                        />
                                                    </Tooltip.Trigger>
                                                    <Tooltip.Content>
                                                        <p
                                                            class="max-w-[250px] text-xs"
                                                        >
                                                            {item.simpleDescription}
                                                        </p>
                                                    </Tooltip.Content>
                                                </Tooltip.Root>
                                            {/if}
                                        </div>
                                        <p
                                            class="text-xs text-text-muted mt-1 leading-relaxed"
                                        >
                                            {item.description}
                                        </p>
                                    </div>
                                </div>
                                <div
                                    class="absolute top-5 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <ArrowRight class="size-4 text-primary" />
                                </div>
                            </a>
                        {/each}
                    </div>
                </div>
            {/each}
        </div>
    </div>
</div>
