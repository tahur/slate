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
    } from "lucide-svelte";
    import StatCard from "$lib/components/dashboard/StatCard.svelte";
    import AlertCard from "$lib/components/dashboard/AlertCard.svelte";
    import type { PageData } from "./$types";

    let { data }: { data: PageData } = $props();

    function formatCurrency(amount: number) {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(amount);
    }

    function getDaysOverdueColor(days: number) {
        if (days > 30) return "text-red-600 bg-red-100";
        if (days > 7) return "text-orange-600 bg-orange-100";
        return "text-yellow-600 bg-yellow-100";
    }

    const overdueCount = $derived(data.dueInvoices.length);
    const overdueTotal = $derived(
        data.dueInvoices.reduce((sum, inv) => sum + inv.amount, 0),
    );
    const payables = $derived(data.money.payables || 0);
    const displayedInvoices = $derived(data.dueInvoices.slice(0, 5));
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

    <!-- 4 Key Metric Cards -->
    <div class="grid gap-4 grid-cols-2 md:grid-cols-4">
        <StatCard
            label="Total Sales"
            value={formatCurrency(data.monthly.sales)}
            variant="positive"
            tooltip="Sales this month"
        />
        <StatCard
            label="Total Expenses"
            value={formatCurrency(data.monthly.expenses)}
            variant="negative"
            tooltip="Expenses this month"
        />
        <StatCard
            label="Cash in Hand"
            value={formatCurrency(data.money.cash + (data.money.bank || 0))}
            tooltip="Cash + Bank balance"
        />
        <StatCard
            label="GST to Pay"
            value={formatCurrency(Math.abs(data.money.gstDue))}
            variant={data.money.gstDue > 0 ? "warning" : "positive"}
            tooltip={data.money.gstDue > 0
                ? "GST liability to government"
                : "Input tax credit available"}
        />
    </div>

    <!-- Action Alerts -->
    {#if overdueCount > 0 || payables > 0}
        <div class="flex flex-col gap-3">
            {#if overdueCount > 0}
                <AlertCard
                    title="{overdueCount} overdue invoice{overdueCount > 1 ? 's' : ''}"
                    amount={formatCurrency(overdueTotal)}
                    href="/invoices?status=unpaid"
                    variant="warning"
                >
                    {#snippet icon()}
                        <AlertTriangle class="size-4" />
                    {/snippet}
                </AlertCard>
            {/if}
            {#if payables > 0}
                <AlertCard
                    title="Due to suppliers"
                    amount={formatCurrency(payables)}
                    href="/vendors"
                    variant="info"
                >
                    {#snippet icon()}
                        <Receipt class="size-4" />
                    {/snippet}
                </AlertCard>
            {/if}
        </div>
    {/if}

    <!-- Due Invoices Table -->
    <Card class="bg-surface-0 shadow-sm border-border-subtle">
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
</div>
