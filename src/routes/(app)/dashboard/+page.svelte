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
    import StatusBadge from "$lib/components/ui/badge/StatusBadge.svelte";
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
</script>

<div class="flex flex-col gap-6">
    <!-- Header / Quick Actions -->
    <div
        class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
    >
        <div>
            <h2 class="text-2xl font-semibold tracking-tight text-text-strong">
                Dashboard
            </h2>
            <p class="text-sm text-text-muted">
                Overview for {data.org?.name}
            </p>
        </div>
        <div class="flex items-center gap-2">
            <Button href="/invoices/new" size="sm" class="gap-2">
                <Plus class="size-4" />
                New Invoice
            </Button>
        </div>
    </div>

    <!-- Stats Grid -->
    <div class="kpi-band">
        <div class="kpi-card bg-positive/5 border-positive/20">
            <div class="flex items-center justify-between">
                <span
                    class="kpi-label text-positive-foreground/80 text-positive"
                    >Receivables</span
                >
                <IndianRupee class="size-3.5 text-positive" />
            </div>
            <div
                class="kpi-value text-3xl font-bold tracking-tight text-foreground"
            >
                {formatCurrency(data.stats.receivables)}
            </div>
            <div class="kpi-sub text-positive/80">
                {data.stats.receivablesCount} invoices outstanding
            </div>
        </div>

        <div class="kpi-card bg-negative/5 border-negative/20">
            <div class="flex items-center justify-between">
                <span class="kpi-label text-negative">Overdue</span>
                <AlertTriangle class="size-3.5 text-negative" />
            </div>
            <div
                class="kpi-value text-3xl font-bold tracking-tight text-foreground"
            >
                {formatCurrency(data.stats.overdue)}
            </div>
            <div class="kpi-sub text-negative/80">
                {data.stats.overdueCount} overdue invoices
            </div>
        </div>

        <div class="kpi-card bg-info/5 border-info/20">
            <div class="flex items-center justify-between">
                <span class="kpi-label text-info">DSO</span>
                <Clock class="size-3.5 text-info" />
            </div>
            <div
                class="kpi-value text-3xl font-bold tracking-tight text-foreground"
            >
                {formatDso(data.stats.dso)}
            </div>
            <div class="kpi-sub text-info/80">Based on last 30 days sales</div>
        </div>

        <div class="kpi-card bg-surface-2/50 border-border">
            <div class="flex items-center justify-between">
                <span class="kpi-label text-text-subtle">Recent</span>
                <FileText class="size-3.5 text-text-muted" />
            </div>
            <div
                class="kpi-value text-3xl font-bold tracking-tight text-foreground"
            >
                {data.recentInvoices.length}
            </div>
            <div class="kpi-sub text-text-muted">Last 5 invoices</div>
        </div>
    </div>

    <!-- Recent Activity -->
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card class="col-span-4">
            <CardHeader class="border-b border-border-subtle">
                <CardTitle
                    class="text-sm uppercase tracking-[0.14em] text-text-muted"
                    >Recent Invoices</CardTitle
                >
            </CardHeader>
            <CardContent>
                {#if data.recentInvoices.length === 0}
                    <div
                        class="flex h-[200px] items-center justify-center rounded-md border border-dashed text-sm text-text-muted"
                    >
                        No recent invoices
                    </div>
                {:else}
                    <div class="overflow-x-auto">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Invoice</th>
                                    <th>Customer</th>
                                    <th class="text-center">Status</th>
                                    <th class="text-right">Amount</th>
                                    <th class="text-right">Balance</th>
                                </tr>
                            </thead>
                            <tbody>
                                {#each data.recentInvoices as invoice}
                                    <tr>
                                        <td class="data-cell--primary">
                                            <a
                                                href="/invoices/{invoice.id}"
                                                class="font-mono text-link"
                                            >
                                                {invoice.invoice_number}
                                            </a>
                                            <div
                                                class="data-cell--muted text-[12px]"
                                            >
                                                {formatDate(
                                                    invoice.invoice_date,
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <div class="data-cell--primary">
                                                {invoice.customer_name ||
                                                    "Unknown"}
                                            </div>
                                        </td>
                                        <td class="text-center">
                                            <StatusBadge
                                                status={invoice.status}
                                            />
                                        </td>
                                        <td class="data-cell--number">
                                            {formatCurrency(invoice.total)}
                                        </td>
                                        <td class="data-cell--number">
                                            {formatCurrency(
                                                invoice.balance_due || 0,
                                            )}
                                        </td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    </div>
                {/if}
            </CardContent>
        </Card>
        <Card class="col-span-3">
            <CardHeader class="border-b border-border-subtle">
                <CardTitle
                    class="text-sm uppercase tracking-[0.14em] text-text-muted"
                    >Notes</CardTitle
                >
            </CardHeader>
            <CardContent>
                <div
                    class="flex h-[200px] items-center justify-center rounded-md border border-dashed text-sm text-text-muted"
                >
                    Add a reminder or note for today
                </div>
            </CardContent>
        </Card>
    </div>
</div>
