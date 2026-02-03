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
        AlertTriangle,
        Clock,
        FileText,
    } from "lucide-svelte";
    import type { PageData } from "./$types";

    let { data }: { data: PageData } = $props();

    function formatCurrency(amount: number) {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
        }).format(amount);
    }

    function formatDate(dateStr: string) {
        return new Date(dateStr).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    }

    function formatDso(dso: number) {
        if (!dso || dso <= 0) return "—";
        return `${dso.toFixed(1)} days`;
    }

    function getStatusColor(status: string): string {
        switch (status) {
            case "paid":
                return "bg-green-100 text-green-800";
            case "issued":
                return "bg-blue-100 text-blue-800";
            case "partially_paid":
                return "bg-yellow-100 text-yellow-800";
            case "overdue":
            case "cancelled":
                return "bg-red-100 text-red-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
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
        <!-- Total Receivables -->
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

        <!-- Total Overdue -->
        <Card>
            <CardHeader
                class="flex flex-row items-center justify-between space-y-0 pb-2"
            >
                <CardTitle class="text-sm font-medium">Total Overdue</CardTitle>
                <AlertTriangle class="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div class="text-2xl font-bold">
                    {formatCurrency(data.stats.overdue)}
                </div>
                <p class="text-xs text-muted-foreground">
                    {data.stats.overdueCount} overdue invoices
                </p>
            </CardContent>
        </Card>

        <!-- DSO -->
        <Card>
            <CardHeader
                class="flex flex-row items-center justify-between space-y-0 pb-2"
            >
                <CardTitle class="text-sm font-medium">DSO</CardTitle>
                <Clock class="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div class="text-2xl font-bold">{formatDso(data.stats.dso)}</div>
                <p class="text-xs text-muted-foreground">
                    Based on last 30 days sales
                </p>
            </CardContent>
        </Card>

        <Card>
            <CardHeader
                class="flex flex-row items-center justify-between space-y-0 pb-2"
            >
                <CardTitle class="text-sm font-medium"
                    >Recent Invoices</CardTitle
                >
                <FileText class="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div class="text-2xl font-bold">
                    {data.recentInvoices.length}
                </div>
                <p class="text-xs text-muted-foreground">
                    Last 5 invoices
                </p>
            </CardContent>
        </Card>
    </div>

    <!-- Recent Activity -->
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card class="col-span-4">
            <CardHeader>
                <CardTitle>Recent Invoices</CardTitle>
            </CardHeader>
            <CardContent>
                {#if data.recentInvoices.length === 0}
                    <div
                        class="flex h-[200px] items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground"
                    >
                        No recent invoices
                    </div>
                {:else}
                    <div class="space-y-3">
                        {#each data.recentInvoices as invoice}
                            <div
                                class="flex items-center justify-between gap-4 rounded-md border px-3 py-2"
                            >
                                <div class="min-w-0">
                                    <a
                                        href="/invoices/{invoice.id}"
                                        class="font-mono text-sm font-medium text-primary hover:underline"
                                    >
                                        {invoice.invoice_number}
                                    </a>
                                    <div class="text-xs text-muted-foreground">
                                        {invoice.customer_name || "Unknown"} ·
                                        {formatDate(invoice.invoice_date)}
                                    </div>
                                </div>
                                <div class="flex items-center gap-3">
                                    <span
                                        class="hidden text-xs font-medium uppercase rounded px-2 py-0.5 md:inline-flex {getStatusColor(
                                            invoice.status,
                                        )}"
                                    >
                                        {invoice.status}
                                    </span>
                                    <div class="text-right">
                                        <div class="text-sm font-mono">
                                            {formatCurrency(invoice.total)}
                                        </div>
                                        <div class="text-xs text-muted-foreground">
                                            Balance{" "}
                                            {formatCurrency(
                                                invoice.balance_due || 0,
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        {/each}
                    </div>
                {/if}
            </CardContent>
        </Card>
        <Card class="col-span-3">
            <CardHeader>
                <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
                <div
                    class="flex h-[200px] items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground"
                >
                    Add a reminder or note for today
                </div>
            </CardContent>
        </Card>
    </div>
</div>
