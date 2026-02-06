<script lang="ts">
    import {
        Card,
        CardContent,
        CardHeader,
        CardTitle,
    } from "$lib/components/ui/card";
    import { Button } from "$lib/components/ui/button";
    import {
        Plus,
        Clock,
        Receipt,
        AlertTriangle,
        ArrowRight,
        Activity,
        IndianRupee,
        Banknote,
        Landmark,
        FileText,
    } from "lucide-svelte";
    import AlertCard from "$lib/components/dashboard/AlertCard.svelte";
    import type { PageData } from "./$types";
    import { formatINR } from "$lib/utils/currency";

    let { data }: { data: PageData } = $props();

    function getDaysOverdueColor(days: number) {
        if (days > 30) return "text-red-600 bg-red-100";
        if (days > 7) return "text-orange-600 bg-orange-100";
        return "text-yellow-600 bg-yellow-100";
    }

    const overdueCount = $derived(data.dueInvoices.length);
    const overdueTotal = $derived(
        data.dueInvoices.reduce((sum, inv) => sum + inv.amount, 0),
    );
    const displayedInvoices = $derived(data.dueInvoices.slice(0, 5));
</script>

<div class="flex flex-col gap-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
        <h2 class="text-2xl font-bold tracking-tight text-text-strong">
            Dashboard
        </h2>
        <Button
            href="/invoices/new"
            size="sm"
            class="gap-2 shadow-md hover:shadow-lg transition-all"
        >
            <Plus class="size-4" />
            New Invoice
        </Button>
    </div>

    <!-- Bento Grid -->
    <div class="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <!-- Sales This Month -->
        <div class="rounded-xl bg-blue-50 border border-blue-200 p-4 flex items-start gap-3">
            <div class="rounded-lg bg-blue-500 p-2 mt-0.5">
                <IndianRupee class="size-4 text-white" />
            </div>
            <div class="min-w-0 flex-1">
                <p class="text-[11px] font-bold uppercase tracking-widest text-blue-600">Sales This Month</p>
                <p class="text-xl font-extrabold text-blue-900 tracking-tight truncate">{formatINR(data.monthly.sales)}</p>
            </div>
        </div>

        <!-- Cash in Hand -->
        <div class="rounded-xl bg-emerald-50 border border-emerald-200 p-4 flex items-start gap-3">
            <div class="rounded-lg bg-emerald-500 p-2 mt-0.5">
                <Banknote class="size-4 text-white" />
            </div>
            <div class="min-w-0 flex-1">
                <p class="text-[11px] font-bold uppercase tracking-widest text-emerald-600">Cash in Hand</p>
                <p class="text-xl font-extrabold text-emerald-900 tracking-tight truncate">{formatINR(data.money.cash)}</p>
            </div>
        </div>

        <!-- Bank Balance -->
        <div class="rounded-xl bg-violet-50 border border-violet-200 p-4 flex items-start gap-3">
            <div class="rounded-lg bg-violet-500 p-2 mt-0.5">
                <Landmark class="size-4 text-white" />
            </div>
            <div class="min-w-0 flex-1">
                <p class="text-[11px] font-bold uppercase tracking-widest text-violet-600">Bank Balance</p>
                <p class="text-xl font-extrabold text-violet-900 tracking-tight truncate">{formatINR(data.money.bank || 0)}</p>
            </div>
        </div>

        <!-- To Collect -->
        <div class="rounded-xl bg-amber-50 border border-amber-200 p-4 flex items-start gap-3">
            <div class="rounded-lg bg-amber-500 p-2 mt-0.5">
                <FileText class="size-4 text-white" />
            </div>
            <div class="min-w-0 flex-1">
                <p class="text-[11px] font-bold uppercase tracking-widest text-amber-600">To Collect</p>
                <p class="text-xl font-extrabold text-amber-900 tracking-tight truncate">{formatINR(data.money.toCollect)}</p>
            </div>
        </div>

        <!-- GST Card — spans 2 columns -->
        <div class="col-span-2 rounded-xl {data.money.gstDue > 0 ? 'bg-orange-50 border-orange-200' : 'bg-teal-50 border-teal-200'} border p-5">
            <div class="flex items-center gap-2 mb-4">
                <div class="rounded-lg {data.money.gstDue > 0 ? 'bg-orange-500' : 'bg-teal-500'} p-2">
                    <Receipt class="size-4 text-white" />
                </div>
                <p class="text-xs font-bold uppercase tracking-widest {data.money.gstDue > 0 ? 'text-orange-600' : 'text-teal-600'}">
                    GST Position
                </p>
            </div>

            <div class="grid grid-cols-3 gap-4">
                <!-- Output GST -->
                <div class="rounded-lg bg-white/60 border {data.money.gstDue > 0 ? 'border-orange-200' : 'border-teal-200'} p-3 text-center">
                    <p class="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">Collected</p>
                    <p class="text-lg font-extrabold text-text-strong font-mono">{formatINR(data.money.gstOutput)}</p>
                    <p class="text-[10px] text-text-muted mt-0.5">Output GST</p>
                </div>

                <!-- Input GST -->
                <div class="rounded-lg bg-white/60 border {data.money.gstDue > 0 ? 'border-orange-200' : 'border-teal-200'} p-3 text-center">
                    <p class="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">Credit</p>
                    <p class="text-lg font-extrabold text-text-strong font-mono">{formatINR(data.money.gstInput)}</p>
                    <p class="text-[10px] text-text-muted mt-0.5">Input GST (ITC)</p>
                </div>

                <!-- Net GST -->
                <div class="rounded-lg {data.money.gstDue > 0 ? 'bg-orange-100 border-orange-300' : 'bg-teal-100 border-teal-300'} border p-3 text-center">
                    <p class="text-[10px] font-bold uppercase tracking-widest {data.money.gstDue > 0 ? 'text-orange-600' : 'text-teal-600'} mb-1">
                        {data.money.gstDue > 0 ? "To Pay" : "ITC Carry"}
                    </p>
                    <p class="text-lg font-extrabold {data.money.gstDue > 0 ? 'text-orange-800' : 'text-teal-800'} font-mono">
                        {formatINR(Math.abs(data.money.gstDue))}
                    </p>
                    <p class="text-[10px] {data.money.gstDue > 0 ? 'text-orange-500' : 'text-teal-500'} mt-0.5">
                        {data.money.gstDue > 0 ? "Net Payable" : "Credit Available"}
                    </p>
                </div>
            </div>
        </div>
    </div>

    <!-- Action Alerts -->
    {#if overdueCount > 0}
        <div class="flex flex-col gap-3">
            <AlertCard
                title="{overdueCount} overdue invoice{overdueCount > 1 ? 's' : ''}"
                amount={formatINR(overdueTotal)}
                href="/invoices?status=unpaid"
                variant="warning"
            >
                {#snippet icon()}
                    <AlertTriangle class="size-4" />
                {/snippet}
            </AlertCard>
        </div>
    {/if}

    <!-- Due Invoices + Recent Activity side by side -->
    <div class="grid gap-4 md:grid-cols-2">
        <!-- Due Invoices -->
        <Card class="bg-surface-0 shadow-sm border-border">
            <CardHeader class="border-b border-border py-4">
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
                        {#each displayedInvoices as invoice}
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
                                        {formatINR(invoice.amount)}
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
        <Card class="bg-surface-0 shadow-sm border-border">
            <CardHeader class="border-b border-border py-4">
                <div class="flex items-center justify-between">
                    <CardTitle
                        class="text-sm font-bold uppercase tracking-widest text-text-muted flex items-center gap-2"
                    >
                        <Activity class="size-4" />
                        Recent Activity
                    </CardTitle>
                    <a
                        href="/activity-log"
                        class="text-xs font-medium text-primary hover:underline flex items-center gap-1"
                    >
                        View All <ArrowRight class="size-3" />
                    </a>
                </div>
            </CardHeader>
            <CardContent class="p-0">
                {#if data.recentActivity.length === 0}
                    <div
                        class="flex h-[200px] flex-col items-center justify-center text-center p-6 text-text-muted"
                    >
                        <div class="p-3 bg-surface-2 rounded-full mb-3">
                            <Activity class="size-6 text-text-muted/50" />
                        </div>
                        <p class="text-sm font-medium text-text-strong">
                            No activity yet
                        </p>
                        <p class="text-xs">
                            Actions will appear here as you work.
                        </p>
                    </div>
                {:else}
                    <div class="divide-y divide-border-subtle">
                        {#each data.recentActivity as item}
                            <div class="flex items-center justify-between p-4 hover:bg-surface-2/50 transition-colors">
                                <div class="min-w-0 flex-1">
                                    <p class="text-sm text-text-strong truncate">
                                        {item.description}
                                    </p>
                                    <p class="text-[11px] text-text-muted mt-0.5">
                                        {new Date(item.createdAt).toLocaleDateString("en-IN", {
                                            day: "numeric",
                                            month: "short",
                                            hour: "numeric",
                                            minute: "2-digit",
                                        })}
                                    </p>
                                </div>
                                {#if item.amount}
                                    <span class="font-mono text-sm font-semibold text-text-strong">
                                        {formatINR(item.amount)}
                                    </span>
                                {/if}
                            </div>
                        {/each}
                    </div>
                {/if}
            </CardContent>
        </Card>
    </div>
</div>
