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

    const reportSections = [
        {
            title: "Financial Reports",
            items: [
                {
                    title: "Profit & Loss",
                    description: "Income, expenses, and net profit summary",
                    href: "/reports/pnl",
                    icon: TrendingUp,
                    color: "text-orange-600",
                    bg: "bg-orange-500",
                },
                {
                    title: "GST Summary",
                    description:
                        "Tax collected (Output) vs matched credits (Input)",
                    href: "/reports/gst",
                    icon: FileText,
                    color: "text-purple-600",
                    bg: "bg-purple-500",
                },
                {
                    title: "Accounts Receivable",
                    description: "Aging analysis of unpaid customer invoices",
                    href: "/reports/aging",
                    icon: BarChart3,
                    color: "text-blue-600",
                    bg: "bg-blue-500",
                },
                {
                    title: "Customer Ledger",
                    description: "Detailed transaction history by customer",
                    href: "/reports/ledger",
                    icon: Users,
                    color: "text-emerald-600",
                    bg: "bg-emerald-500",
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
                    color: "text-teal-600",
                    bg: "bg-teal-500",
                },
                {
                    title: "GSTR-3B Purchase Data",
                    description:
                        "Input Tax Credit data from purchases by vendor",
                    href: "/reports/gstr3b",
                    icon: Receipt,
                    color: "text-cyan-600",
                    bg: "bg-cyan-500",
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
                    color: "text-rose-600",
                    bg: "bg-rose-500",
                },
                {
                    title: "Journal Entries",
                    description:
                        "Record manual adjustments and double-entry transactions",
                    href: "/journals",
                    icon: Briefcase,
                    color: "text-indigo-600",
                    bg: "bg-indigo-500",
                },
            ],
        },
    ];
</script>

<div class="flex flex-col gap-8">
    <!-- Header -->
    <div>
        <h2 class="text-2xl font-bold tracking-tight text-text-strong">
            Reports
        </h2>
        <p class="text-sm text-text-muted mt-1">
            Business insights, GST filing data, and accounting tools
        </p>
    </div>

    {#each reportSections as section}
        <div class="space-y-3">
            <h3
                class="text-[11px] font-bold uppercase tracking-widest text-text-muted"
            >
                {section.title}
            </h3>

            <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {#each section.items as item}
                    <a
                        href={item.href}
                        class="group relative rounded-xl border border-border bg-surface-0 p-5 transition-all hover:shadow-md hover:border-border-strong hover:-translate-y-0.5"
                    >
                        <div class="flex items-start gap-4">
                            <div class="rounded-lg {item.bg} p-2.5 shrink-0">
                                <svelte:component
                                    this={item.icon}
                                    class="size-5 text-white"
                                />
                            </div>
                            <div class="min-w-0 flex-1">
                                <h3
                                    class="text-sm font-bold text-text-strong group-hover:text-primary transition-colors"
                                >
                                    {item.title}
                                </h3>
                                <p
                                    class="text-xs text-text-muted mt-1 leading-relaxed line-clamp-2"
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
