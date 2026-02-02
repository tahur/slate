<script lang="ts">
    import { Card } from "$lib/components/ui/card";
    import {
        BarChart3,
        Users,
        FileText,
        TrendingUp,
        Calendar,
        PieChart,
    } from "lucide-svelte";

    const reports = [
        {
            title: "Accounts Receivable Aging",
            description: "Outstanding invoices by age bucket",
            href: "/reports/aging",
            icon: BarChart3,
            color: "text-blue-600",
        },
        {
            title: "Customer Ledger",
            description: "Transaction history by customer",
            href: "/reports/ledger",
            icon: Users,
            color: "text-green-600",
        },
        {
            title: "GST Summary",
            description: "GST collected and input credits",
            href: "/reports/gst",
            icon: FileText,
            color: "text-purple-600",
        },
        {
            title: "Profit & Loss",
            description: "Income and expenses summary",
            href: "/reports/pnl",
            icon: TrendingUp,
            color: "text-orange-600",
        },
    ];
</script>

<div class="space-y-4">
    <div>
        <h1 class="text-xl font-semibold">Reports</h1>
        <p class="text-sm text-muted-foreground">
            Financial reports and analytics
        </p>
    </div>

    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {#each reports as report}
            <a href={report.href} class="block">
                <Card
                    class="p-6 hover:bg-muted/50 transition-colors cursor-pointer h-full"
                >
                    <div class="flex items-start gap-4">
                        <div class="p-2 rounded-lg bg-muted">
                            <report.icon class="size-5 {report.color}" />
                        </div>
                        <div>
                            <h3 class="font-medium">{report.title}</h3>
                            <p class="text-sm text-muted-foreground mt-1">
                                {report.description}
                            </p>
                        </div>
                    </div>
                </Card>
            </a>
        {/each}
    </div>
</div>
