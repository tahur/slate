<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import {
        Card,
        CardContent,
        CardHeader,
        CardTitle,
    } from "$lib/components/ui/card";
    import {
        Plus,
        AlertTriangle,
        Calendar,
        Clock,
        TrendingUp,
        TrendingDown,
        Wallet,
        Landmark,
        Receipt,
        Banknote,
        ArrowRight,
    } from "lucide-svelte";
    import StatCard from "$lib/components/dashboard/StatCard.svelte";
    import type { PageData } from "./$types";

    let { data }: { data: PageData } = $props();

    function formatCurrency(amount: number) {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(amount);
    }

    function formatRelativeTime(dateStr: string) {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
        });
    }

    function getDaysOverdueColor(days: number) {
        if (days > 30) return "text-red-600 bg-red-100";
        if (days > 7) return "text-orange-600 bg-orange-100";
        return "text-yellow-600 bg-yellow-100";
    }
</script>

<div class="flex flex-col gap-6">
    <!-- Header -->
    <div
        class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
    >
        <div>
            <h2 class="text-2xl font-bold tracking-tight text-text-strong">
                Dashboard
            </h2>
            <p class="text-sm text-text-muted">
                Financial Overview for <span
                    class="font-medium text-text-strong">{data.org?.name}</span
                >
            </p>
        </div>
        <div class="flex items-center gap-2">
            <Button
                href="/invoices/new"
                size="sm"
                class="gap-2 shadow-md hover:shadow-lg transition-all"
            >
                <Plus class="size-4" />
                New Invoice
            </Button>
        </div>
    </div>

    <!-- Metrics Bento Grid -->
    <div class="grid gap-4 md:grid-cols-4">
        <!-- Row 1: Liquidity (Cash & Bank) -->
        <div
            class="rounded-xl border border-emerald-100 bg-emerald-50/50 p-5 md:col-span-1"
        >
            <div class="flex items-center justify-between mb-4">
                <span class="text-sm font-medium text-emerald-800"
                    >Cash in Hand</span
                >
                <div class="p-2 bg-emerald-100 rounded-lg">
                    <Wallet class="size-4 text-emerald-600" />
                </div>
            </div>
            <div class="text-2xl font-bold text-emerald-950">
                {formatCurrency(data.money.cash)}
            </div>
        </div>

        <div
            class="rounded-xl border border-blue-100 bg-blue-50/50 p-5 md:col-span-1"
        >
            <div class="flex items-center justify-between mb-4">
                <span class="text-sm font-medium text-blue-800"
                    >Bank Balance</span
                >
                <div class="p-2 bg-blue-100 rounded-lg">
                    <Landmark class="size-4 text-blue-600" />
                </div>
            </div>
            <div class="text-2xl font-bold text-blue-950">
                {formatCurrency(data.money.bank)}
            </div>
        </div>

        <!-- Profit (Spans 2 cols) -->
        <div
            class="rounded-xl border border-violet-100 bg-violet-50/50 p-5 md:col-span-2"
        >
            <div class="flex items-center justify-between mb-4">
                <span class="text-sm font-medium text-violet-800"
                    >Net Profit (This Month)</span
                >
                <div
                    class="flex items-center gap-2 text-xs font-medium text-violet-600 bg-violet-100 px-2 py-1 rounded-full"
                >
                    {data.monthly.profit >= 0 ? "+" : "-"}
                    {formatCurrency(Math.abs(data.monthly.profit))}
                </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <span
                        class="text-xs text-violet-600/80 uppercase tracking-wider"
                        >Sales</span
                    >
                    <div class="text-xl font-bold text-violet-950">
                        {formatCurrency(data.monthly.sales)}
                    </div>
                </div>
                <div>
                    <span
                        class="text-xs text-rose-600/80 uppercase tracking-wider"
                        >Expenses</span
                    >
                    <div class="text-xl font-bold text-rose-950">
                        {formatCurrency(data.monthly.expenses)}
                    </div>
                </div>
            </div>
        </div>

        <!-- Row 2: Outstanding -->
        <div
            class="rounded-xl border border-amber-100 bg-amber-50/50 p-5 md:col-span-1"
        >
            <div class="flex items-center justify-between mb-4">
                <span class="text-sm font-medium text-amber-800"
                    >To Collect</span
                >
                <div class="p-2 bg-amber-100 rounded-lg">
                    <Receipt class="size-4 text-amber-600" />
                </div>
            </div>
            <div class="text-2xl font-bold text-amber-950">
                {formatCurrency(data.money.toCollect)}
            </div>
            {#if data.money.toCollect > 0}
                <div class="mt-2 text-xs font-medium text-amber-700">
                    From Unpaid Invoices
                </div>
            {/if}
        </div>

        <div
            class="rounded-xl border border-rose-100 bg-rose-50/50 p-5 md:col-span-1"
        >
            <div class="flex items-center justify-between mb-4">
                <span class="text-sm font-medium text-rose-800">To Pay</span>
                <div class="p-2 bg-rose-100 rounded-lg">
                    <Banknote class="size-4 text-rose-600" />
                </div>
            </div>
            <div class="text-2xl font-bold text-rose-950">
                {formatCurrency(data.money.payables || 0)}
                <!-- Assuming Payables exists or 0 -->
            </div>
            <div class="mt-2 text-xs font-medium text-rose-700">
                To Suppliers
            </div>
        </div>

        <!-- GST Position -->
        <div
            class="rounded-xl border border-indigo-100 bg-indigo-50/50 p-5 md:col-span-2"
        >
            <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-indigo-800"
                    >GST Position</span
                >
                <span
                    class={`text-xs font-bold px-2 py-1 rounded-full ${data.money.gstDue > 0 ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}
                >
                    {data.money.gstDue > 0 ? "Liability" : "Credit"}
                </span>
            </div>
            <div class="text-2xl font-bold text-indigo-950">
                {formatCurrency(Math.abs(data.money.gstDue))}
            </div>
            <p class="mt-1 text-xs text-indigo-600/80">
                {data.money.gstDue > 0
                    ? "Amount to be paid to government"
                    : "Amount available for input credit"}
            </p>
        </div>
    </div>

    <!-- Action Sections (Split View) -->
    <div class="grid gap-6 md:grid-cols-2">
        <!-- Due Invoices -->
        <Card class="bg-surface-0 shadow-sm border-border-subtle h-full">
            <CardHeader class="border-b border-border-subtle py-4">
                <div class="flex items-center justify-between">
                    <CardTitle
                        class="text-sm font-bold uppercase tracking-widest text-text-muted flex items-center gap-2"
                    >
                        <Clock class="size-4" />
                        Due Invoices
                    </CardTitle>
                    <a
                        href="/invoices?status=unpaid"
                        class="text-xs font-medium text-primary hover:underline flex items-center gap-1"
                    >
                        View All <ArrowRight class="size-3" />
                    </a>
                </div>
            </CardHeader>
            <CardContent class="p-0">
                {#if data.dueInvoices.length === 0}
                    <div
                        class="flex h-[200px] flex-col items-center justify-center text-center p-6 text-text-muted"
                    >
                        <div class="p-3 bg-surface-2 rounded-full mb-3">
                            <Receipt class="size-6 text-text-muted/50" />
                        </div>
                        <p class="text-sm font-medium text-text-strong">
                            All caught up!
                        </p>
                        <p class="text-xs">
                            No invoices strictly due for payment.
                        </p>
                    </div>
                {:else}
                    <div class="divide-y divide-border-subtle">
                        {#each data.dueInvoices as invoice}
                            <div
                                class="flex items-center justify-between p-4 hover:bg-surface-2/50 transition-colors group"
                            >
                                <div class="min-w-0 flex-1">
                                    <div class="flex items-center gap-2 mb-1">
                                        <span
                                            class="font-medium text-sm text-text-strong truncate"
                                        >
                                            {invoice.customerName}
                                        </span>
                                        {#if invoice.daysOverdue > 0}
                                            <span
                                                class={`text-[10px] font-bold px-1.5 py-0.5 rounded ${getDaysOverdueColor(invoice.daysOverdue)}`}
                                            >
                                                {invoice.daysOverdue}d late
                                            </span>
                                        {/if}
                                    </div>
                                    <div class="text-xs text-text-muted">
                                        Due {new Date(
                                            invoice.dueDate,
                                        ).toLocaleDateString("en-IN", {
                                            day: "numeric",
                                            month: "short",
                                        })} · #{invoice.invoiceNumber}
                                    </div>
                                </div>
                                <div class="text-right">
                                    <div
                                        class="font-mono text-sm font-semibold text-text-strong"
                                    >
                                        {formatCurrency(invoice.amount)}
                                    </div>
                                    <a
                                        href="/invoices/{invoice.id}"
                                        class="text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        View
                                    </a>
                                </div>
                            </div>
                        {/each}
                    </div>
                {/if}
            </CardContent>
        </Card>

        <!-- Recent Activity -->
        <Card class="bg-surface-0 shadow-sm border-border-subtle h-full">
            <CardHeader class="border-b border-border-subtle py-4">
                <div class="flex items-center justify-between">
                    <CardTitle
                        class="text-sm font-bold uppercase tracking-widest text-text-muted flex items-center gap-2"
                    >
                        <TrendingUp class="size-4" />
                        Recent Activity
                    </CardTitle>
                    <a
                        href="/activity-log"
                        class="text-xs font-medium text-primary hover:underline flex items-center gap-1"
                    >
                        Full Log <ArrowRight class="size-3" />
                    </a>
                </div>
            </CardHeader>
            <CardContent class="p-0">
                {#if data.recentActivity.length === 0}
                    <div
                        class="flex h-[200px] items-center justify-center text-sm text-text-muted"
                    >
                        No recent activity
                    </div>
                {:else}
                    <ul class="divide-y divide-border-subtle">
                        {#each data.recentActivity as activity}
                            <li
                                class="flex items-center justify-between px-4 py-3 hover:bg-surface-2 transition-colors"
                            >
                                <div class="flex items-start gap-3">
                                    <div
                                        class="mt-0.5 p-1.5 bg-surface-2 rounded-md"
                                    >
                                        <TrendingUp
                                            class="size-3.5 text-text-muted"
                                        />
                                    </div>
                                    <div>
                                        <p
                                            class="text-sm font-medium text-text-strong line-clamp-1"
                                        >
                                            {activity.description}
                                        </p>
                                        <p class="text-xs text-text-muted">
                                            {formatRelativeTime(
                                                activity.createdAt,
                                            )}
                                        </p>
                                    </div>
                                </div>
                                {#if activity.amount !== undefined}
                                    <span
                                        class="font-mono text-sm href-text-strong tabular-nums text-text-secondary"
                                    >
                                        {formatCurrency(activity.amount)}
                                    </span>
                                {/if}
                            </li>
                        {/each}
                    </ul>
                {/if}
            </CardContent>
        </Card>
    </div>
</div>
