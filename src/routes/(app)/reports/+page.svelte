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
    } from "lucide-svelte";
    import { Button } from "$lib/components/ui/button";

    const reportSections = [
        {
            title: "Financial Reports",
            items: [
                {
                    title: "Profit & Loss",
                    description: "Income, expenses, and net profit summary",
                    href: "/reports/pnl",
                    icon: TrendingUp,
                    color: "text-orange-500",
                    bg: "bg-orange-500/10",
                },
                {
                    title: "GST Summary",
                    description:
                        "Tax collected (Output) vs matched credits (Input)",
                    href: "/reports/gst",
                    icon: FileText,
                    color: "text-purple-500",
                    bg: "bg-purple-500/10",
                },
                {
                    title: "Accounts Receivable",
                    description: "Aging analysis of unpaid customer invoices",
                    href: "/reports/aging",
                    icon: BarChart3,
                    color: "text-blue-500",
                    bg: "bg-blue-500/10",
                },
                {
                    title: "Customer Ledger",
                    description: "Detailed transaction history by customer",
                    href: "/reports/ledger",
                    icon: Users,
                    color: "text-green-500",
                    bg: "bg-green-500/10",
                },
            ],
        },
        {
            title: "GST Filing Data",
            items: [
                {
                    title: "GSTR-1 Sales Register",
                    description:
                        "Outward supplies data (B2B, B2C, credit notes, HSN)",
                    href: "/reports/gstr1",
                    icon: FileSpreadsheet,
                    color: "text-emerald-500",
                    bg: "bg-emerald-500/10",
                },
                {
                    title: "GSTR-3B Purchase Data",
                    description:
                        "Input Tax Credit data from purchases by vendor",
                    href: "/reports/gstr3b",
                    icon: Receipt,
                    color: "text-cyan-500",
                    bg: "bg-cyan-500/10",
                },
            ],
        },
        {
            title: "Accounting Tools",
            items: [
                {
                    title: "Chart of Accounts",
                    description: "Manage ledgers, groups, and account defaults",
                    href: "/accounts",
                    icon: BookOpen,
                    color: "text-rose-500",
                    bg: "bg-rose-500/10",
                },
                {
                    title: "Journal Entries",
                    description:
                        "Record manual adjustments and double-entry transactions",
                    href: "/journals",
                    icon: Briefcase,
                    color: "text-indigo-500",
                    bg: "bg-indigo-500/10",
                },
            ],
        },
    ];
</script>

<div class="max-w-6xl mx-auto space-y-8 py-8 px-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
        <div>
            <h1 class="text-2xl font-bold tracking-tight text-text-strong">
                Analytics & Reporting
            </h1>
            <p class="text-sm text-text-muted mt-1">
                Gain insights into your business performance and manage
                accounting
            </p>
        </div>
    </div>

    {#each reportSections as section}
        <div class="space-y-3">
            <h3
                class="text-[11px] font-bold uppercase tracking-wider text-text-muted border-b border-border-subtle pb-1.5"
            >
                {section.title}
            </h3>

            <div
                class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            >
                {#each section.items as item}
                    <a href={item.href} class="group block h-full">
                        <div
                            class="h-full bg-surface-1 border border-border shadow-sm rounded-lg p-4 transition-all duration-200 hover:shadow-md hover:border-border-strong hover:bg-surface-0 flex flex-col justify-between"
                        >
                            <div class="space-y-3">
                                <div class="flex items-center justify-between">
                                    <div class="p-2 rounded-md {item.bg} w-fit">
                                        <svelte:component
                                            this={item.icon}
                                            class="size-4 {item.color}"
                                        />
                                    </div>
                                    <ArrowRight
                                        class="size-3.5 text-border-strong group-hover:text-primary transition-colors -translate-x-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-0"
                                    />
                                </div>

                                <div>
                                    <h3
                                        class="text-sm font-semibold text-text-strong group-hover:text-primary transition-colors"
                                    >
                                        {item.title}
                                    </h3>
                                    <p
                                        class="text-xs text-text-muted mt-0.5 leading-relaxed line-clamp-2"
                                    >
                                        {item.description}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </a>
                {/each}
            </div>
        </div>
    {/each}
</div>
