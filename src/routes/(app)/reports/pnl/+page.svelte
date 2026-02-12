<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { Card } from "$lib/components/ui/card";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import {
        ArrowLeft,
        RefreshCw,
        TrendingUp,
        TrendingDown,
    } from "lucide-svelte";
    import { goto } from "$app/navigation";
    import { formatINR } from "$lib/utils/currency";
    import { formatDate } from "$lib/utils/date";

    let { data } = $props();
    const { startDate: initStart, endDate: initEnd } = data;

    let startDate = $state(initStart);
    let endDate = $state(initEnd);

    function applyFilter() {
        goto(`/reports/pnl?from=${startDate}&to=${endDate}`);
    }
</script>

<div class="space-y-4">
    <div class="flex items-center gap-4">
        <Button variant="ghost" href="/reports" class="p-2">
            <ArrowLeft class="size-4" />
        </Button>
        <div>
            <h1 class="text-xl font-semibold">Profit & Loss</h1>
            <p class="text-sm text-muted-foreground">
                Income and expense summary
            </p>
        </div>
    </div>

    <!-- Date Filter -->
    <Card class="p-4">
        <div class="flex items-end gap-4 flex-wrap">
            <div class="space-y-2">
                <Label for="from">From</Label>
                <Input type="date" id="from" bind:value={startDate} />
            </div>
            <div class="space-y-2">
                <Label for="to">To</Label>
                <Input type="date" id="to" bind:value={endDate} />
            </div>
            <Button onclick={applyFilter}>
                <RefreshCw class="mr-2 size-4" />
                Apply
            </Button>
        </div>
        <p class="text-xs text-muted-foreground mt-2">
            Showing: {formatDate(data.startDate)} to {formatDate(data.endDate)}
        </p>
    </Card>

    <!-- Summary Cards -->
    <div class="grid gap-4 md:grid-cols-3">
        <Card class="p-6">
            <div class="flex items-center gap-2 mb-2">
                <TrendingUp class="size-4 text-green-600" />
                <h3 class="text-sm text-muted-foreground">Revenue</h3>
            </div>
            <p class="text-2xl font-bold font-mono text-green-600">
                {formatINR(data.revenue.total)}
            </p>
            <p class="text-xs text-muted-foreground mt-1">
                From {data.revenue.invoiceCount} invoice(s)
            </p>
        </Card>

        <Card class="p-6">
            <div class="flex items-center gap-2 mb-2">
                <TrendingDown class="size-4 text-red-600" />
                <h3 class="text-sm text-muted-foreground">Expenses</h3>
            </div>
            <p class="text-2xl font-bold font-mono text-red-600">
                {formatINR(data.totalExpenses)}
            </p>
            <p class="text-xs text-muted-foreground mt-1">
                Across {data.expensesByCategory.length} categories
            </p>
        </Card>

        <Card class="p-6">
            <div class="flex items-center gap-2 mb-2">
                {#if data.netProfit >= 0}
                    <TrendingUp class="size-4 text-green-600" />
                {:else}
                    <TrendingDown class="size-4 text-red-600" />
                {/if}
                <h3 class="text-sm text-muted-foreground">Net Profit</h3>
            </div>
            <p
                class="text-2xl font-bold font-mono {data.netProfit >= 0
                    ? 'text-green-600'
                    : 'text-red-600'}"
            >
                {formatINR(data.netProfit)}
            </p>
            <p class="text-xs text-muted-foreground mt-1">
                {data.netProfit >= 0 ? "Profit" : "Loss"}
            </p>
        </Card>
    </div>

    <div class="grid gap-4 md:grid-cols-2">
        <!-- Revenue Details -->
        <Card class="p-6">
            <h3 class="font-medium mb-4">Income</h3>
            <div class="space-y-3 text-sm">
                <div class="flex justify-between p-3 rounded bg-green-50">
                    <span>Sales Revenue</span>
                    <span class="font-mono font-medium text-green-700">
                        {formatINR(data.revenue.total)}
                    </span>
                </div>
                <div class="border-t pt-3 flex justify-between font-semibold">
                    <span>Total Income</span>
                    <span class="font-mono text-green-600">
                        {formatINR(data.revenue.total)}
                    </span>
                </div>
            </div>
        </Card>

        <!-- Expense Details -->
        <Card class="p-6">
            <h3 class="font-medium mb-4">Expenses</h3>
            {#if data.expensesByCategory.length === 0}
                <p class="text-sm text-muted-foreground">
                    No expenses in this period
                </p>
            {:else}
                <div class="space-y-3 text-sm">
                    {#each data.expensesByCategory as expense}
                        <div class="flex justify-between">
                            <span class="text-muted-foreground">
                                {expense.category || "Uncategorized"}
                            </span>
                            <span class="font-mono"
                                >{formatINR(expense.amount)}</span
                            >
                        </div>
                    {/each}
                    <div
                        class="border-t pt-3 flex justify-between font-semibold"
                    >
                        <span>Total Expenses</span>
                        <span class="font-mono text-red-600">
                            {formatINR(data.totalExpenses)}
                        </span>
                    </div>
                </div>
            {/if}
        </Card>
    </div>
</div>
