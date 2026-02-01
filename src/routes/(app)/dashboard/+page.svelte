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
        IndianRupee,
        TrendingUp,
        TrendingDown,
        Users,
        FileText,
        Wallet,
        Banknote,
    } from "lucide-svelte";
    import type { PageData } from "./$types";

    let { data }: { data: PageData } = $props();

    function formatCurrency(amount: number) {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
        }).format(amount);
    }
</script>

<div class="flex flex-col gap-6">
    <!-- Header / Quick Actions -->
    <div
        class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
    >
        <div>
            <h2 class="text-3xl font-bold tracking-tight">Dashboard</h2>
            <p class="text-muted-foreground">
                Overview for {data.org?.name}
            </p>
        </div>
        <div class="flex items-center gap-2">
            <Button href="/invoices/new" class="gap-2">
                <Plus class="size-4" />
                New Invoice
            </Button>
        </div>
    </div>

    <!-- Stats Grid -->
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <!-- Revenue / Receivables -->
        <Card>
            <CardHeader
                class="flex flex-row items-center justify-between space-y-0 pb-2"
            >
                <CardTitle class="text-sm font-medium"
                    >Total Receivables</CardTitle
                >
                <IndianRupee class="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div class="text-2xl font-bold">
                    {formatCurrency(data.stats.receivables)}
                </div>
                <p class="text-xs text-muted-foreground">
                    {data.stats.receivablesCount} invoices outstanding
                </p>
            </CardContent>
        </Card>

        <!-- Expenses -->
        <Card>
            <CardHeader
                class="flex flex-row items-center justify-between space-y-0 pb-2"
            >
                <CardTitle class="text-sm font-medium">Expenses</CardTitle>
                <Wallet class="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div class="text-2xl font-bold">
                    {formatCurrency(data.stats.expenses)}
                </div>
                <p class="text-xs text-muted-foreground">current fiscal year</p>
            </CardContent>
        </Card>

        <!-- Placeholder Cards -->
        <Card>
            <CardHeader
                class="flex flex-row items-center justify-between space-y-0 pb-2"
            >
                <CardTitle class="text-sm font-medium">Cash on Hand</CardTitle>
                <Banknote class="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div class="text-2xl font-bold">
                    {formatCurrency(data.stats.cash)}
                </div>
                <p class="text-xs text-muted-foreground">Across all accounts</p>
            </CardContent>
        </Card>

        <Card>
            <CardHeader
                class="flex flex-row items-center justify-between space-y-0 pb-2"
            >
                <CardTitle class="text-sm font-medium">Net Profit</CardTitle>
                <TrendingUp class="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div class="text-2xl font-bold">
                    {formatCurrency(
                        data.stats.receivables - data.stats.expenses,
                    )}
                </div>
                <p class="text-xs text-muted-foreground">Estimated</p>
            </CardContent>
        </Card>
    </div>

    <!-- Empty State / Recent Activity Placeholder -->
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card class="col-span-4">
            <CardHeader>
                <CardTitle>Recent Revenue</CardTitle>
            </CardHeader>
            <CardContent>
                <div
                    class="flex h-[200px] items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground"
                >
                    No data available for chart
                </div>
            </CardContent>
        </Card>
        <Card class="col-span-3">
            <CardHeader>
                <CardTitle>Recent Invoices</CardTitle>
            </CardHeader>
            <CardContent>
                <div
                    class="flex h-[200px] items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground"
                >
                    No recent invoices
                </div>
            </CardContent>
        </Card>
    </div>
</div>
