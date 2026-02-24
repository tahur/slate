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
        if (days > 30) return "border border-red-200 bg-red-50 text-red-700";
        if (days > 7)
            return "border border-amber-200 bg-amber-50 text-amber-700";
        return "border border-yellow-200 bg-yellow-50 text-yellow-700";
    }

    const overdueCount = $derived(data.dueInvoices.length);
    const overdueTotal = $derived(
        data.dueInvoices.reduce((sum, inv) => sum + inv.amount, 0),
    );
    const displayedInvoices = $derived(data.dueInvoices.slice(0, 5));
</script>

<div class="flex flex-col gap-4 md:gap-6">
    <div class="flex items-center justify-between">
        <div>
            <h1
                class="text-lg md:text-xl font-bold tracking-tight text-text-strong"
            >
                Dashboard
            </h1>
            <p class="text-xs md:text-sm text-text-muted">
                Sales, cash flow, dues, and activity.
            </p>
        </div>
        <Button href="/invoices/new" size="sm" class="gap-2">
            <Plus class="size-4" />
            <span class="hidden sm:inline">New Invoice</span>
            <span class="sm:hidden">New</span>
        </Button>
    </div>

    <div class="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
        <Card>
            <CardContent class="p-4">
                <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0">
                        <p
                            class="text-xs font-semibold uppercase tracking-wider text-text-muted"
                        >
                            Sales This Month
                        </p>
                        <p
                            class="mt-2 truncate text-2xl font-bold tracking-tight text-text-strong"
                        >
                            {formatINR(data.monthly.sales)}
                        </p>
                    </div>
                    <span class="rounded-md bg-primary/10 p-2 text-primary">
                        <IndianRupee class="size-4" />
                    </span>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardContent class="p-4">
                <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0">
                        <p
                            class="text-xs font-semibold uppercase tracking-wider text-text-muted"
                        >
                            Cash in Hand
                        </p>
                        <p
                            class="mt-2 truncate text-2xl font-bold tracking-tight text-text-strong"
                        >
                            {formatINR(data.money.cash)}
                        </p>
                    </div>
                    <span class="rounded-md bg-green-50 p-2 text-green-700">
                        <Banknote class="size-4" />
                    </span>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardContent class="p-4">
                <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0">
                        <p
                            class="text-xs font-semibold uppercase tracking-wider text-text-muted"
                        >
                            Bank Balance
                        </p>
                        <p
                            class="mt-2 truncate text-2xl font-bold tracking-tight text-text-strong"
                        >
                            {formatINR(data.money.bank || 0)}
                        </p>
                    </div>
                    <span class="rounded-md bg-blue-50 p-2 text-blue-700">
                        <Landmark class="size-4" />
                    </span>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardContent class="p-4">
                <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0">
                        <p
                            class="text-xs font-semibold uppercase tracking-wider text-text-muted"
                        >
                            To Collect
                        </p>
                        <p
                            class="mt-2 truncate text-2xl font-bold tracking-tight text-amber-700"
                        >
                            {formatINR(data.money.toCollect)}
                        </p>
                    </div>
                    <span class="rounded-md bg-amber-50 p-2 text-amber-700">
                        <FileText class="size-4" />
                    </span>
                </div>
            </CardContent>
        </Card>
    </div>

    <Card>
        <CardHeader class="border-b border-border py-4">
            <CardTitle
                class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-muted"
            >
                <Receipt class="size-4 text-primary" />
                GST Position
            </CardTitle>
        </CardHeader>
        <CardContent class="pt-4">
            <div class="grid gap-3 sm:grid-cols-3">
                <div
                    class="rounded-md border border-border bg-surface-1 p-3 text-center"
                >
                    <p class="text-xs font-medium text-text-muted">
                        Output GST
                    </p>
                    <p
                        class="mt-1 font-mono text-lg font-semibold text-text-strong"
                    >
                        {formatINR(data.money.gstOutput)}
                    </p>
                </div>

                <div
                    class="rounded-md border border-border bg-surface-1 p-3 text-center"
                >
                    <p class="text-xs font-medium text-text-muted">
                        Input GST (ITC)
                    </p>
                    <p
                        class="mt-1 font-mono text-lg font-semibold text-text-strong"
                    >
                        {formatINR(data.money.gstInput)}
                    </p>
                </div>

                <div
                    class="rounded-md border p-3 text-center {data.money
                        .gstDue > 0
                        ? 'border-amber-200 bg-amber-50'
                        : 'border-green-200 bg-green-50'}"
                >
                    <p
                        class="text-xs font-medium {data.money.gstDue > 0
                            ? 'text-amber-700'
                            : 'text-green-700'}"
                    >
                        {data.money.gstDue > 0
                            ? "Net GST Payable"
                            : "ITC Carry Forward"}
                    </p>
                    <p
                        class="mt-1 font-mono text-lg font-semibold {data.money
                            .gstDue > 0
                            ? 'text-amber-700'
                            : 'text-green-700'}"
                    >
                        {formatINR(Math.abs(data.money.gstDue))}
                    </p>
                </div>
            </div>
        </CardContent>
    </Card>

    <!-- Action Alerts -->
    {#if overdueCount > 0}
        <div class="flex flex-col gap-3">
            <AlertCard
                title="{overdueCount} overdue invoice{overdueCount > 1
                    ? 's'
                    : ''}"
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

    <div class="grid grid-cols-1 gap-3 md:gap-4 md:grid-cols-2">
        <Card>
            <CardHeader class="border-b border-border py-4">
                <div class="flex items-center justify-between">
                    <CardTitle
                        class="text-xs font-semibold uppercase tracking-wider text-text-muted flex items-center gap-2"
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
                    <div class="divide-y divide-border">
                        {#each displayedInvoices as invoice}
                            <div
                                class="group flex items-center justify-between p-4 transition-colors hover:bg-surface-2/40"
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
                                                class={`rounded px-1.5 py-0.5 text-xs font-medium ${getDaysOverdueColor(invoice.daysOverdue)}`}
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
                                        class="text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100"
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

        <Card>
            <CardHeader class="border-b border-border py-4">
                <div class="flex items-center justify-between">
                    <CardTitle
                        class="text-xs font-semibold uppercase tracking-wider text-text-muted flex items-center gap-2"
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
                    <div class="divide-y divide-border">
                        {#each data.recentActivity as item}
                            <div
                                class="flex items-center justify-between p-4 transition-colors hover:bg-surface-2/40"
                            >
                                <div class="min-w-0 flex-1">
                                    <p
                                        class="text-sm text-text-strong truncate"
                                    >
                                        {item.description}
                                    </p>
                                    <p class="mt-0.5 text-xs text-text-muted">
                                        {new Date(
                                            item.createdAt,
                                        ).toLocaleDateString("en-IN", {
                                            day: "numeric",
                                            month: "short",
                                            hour: "numeric",
                                            minute: "2-digit",
                                        })}
                                    </p>
                                </div>
                                {#if item.amount}
                                    <span
                                        class="font-mono text-sm font-semibold text-text-strong"
                                    >
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
