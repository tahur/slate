<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { Card } from "$lib/components/ui/card";
    import { Plus, FileText } from "lucide-svelte";
    import StatusBadge from "$lib/components/ui/badge/StatusBadge.svelte";

    let { data } = $props();

    function formatCurrency(amount: number | null): string {
        if (amount === null || amount === undefined) return "₹0.00";
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 2,
        }).format(amount);
    }

    function formatDate(dateStr: string | null): string {
        if (!dateStr) return "—";
        return new Date(dateStr).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    }

    function getStatusClass(status: string): string {
        switch (status) {
            case "paid":
                return "status-pill--positive";
            case "issued":
                return "status-pill--info";
            case "partially_paid":
                return "status-pill--warning";
            case "overdue":
            case "cancelled":
                return "status-pill--negative";
            default: // draft
                return "status-pill--warning";
        }
    }
</script>

<div class="flex flex-col h-full">
    <!-- Header / Filter Bar -->
    <div
        class="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-0"
    >
        <div class="flex items-center gap-4">
            <h1 class="text-xl font-bold tracking-tight text-text-strong">
                All Invoices
            </h1>
        </div>
        <Button
            href="/invoices/new"
            class="bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
        >
            <Plus class="mr-2 size-4" />
            New
        </Button>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-auto bg-surface-1 p-6">
        <!-- Invoice Table or Empty State -->
        {#if data.invoices.length === 0}
            <div
                class="flex flex-col items-center justify-center py-20 border border-dashed border-border-strong rounded-lg bg-surface-0"
            >
                <FileText class="size-12 text-text-muted/30 mb-4" />
                <h3 class="text-lg font-bold text-text-strong">
                    No invoices yet
                </h3>
                <p class="text-sm text-text-muted mb-6">
                    Create your first invoice to get started
                </p>
                <Button
                    href="/invoices/new"
                    class="bg-primary text-primary-foreground"
                >
                    <Plus class="mr-2 size-4" />
                    Create Invoice
                </Button>
            </div>
        {:else}
            <div
                class="border border-border rounded-lg overflow-hidden shadow-sm bg-surface-0"
            >
                <table class="data-table w-full">
                    <thead>
                        <tr>
                            <th class="w-28">Date</th>
                            <th>Invoice #</th>
                            <th>Customer Name</th>
                            <th class="text-right w-28">Status</th>
                            <th class="text-right w-32">Amount</th>
                            <th class="text-right w-32">Balance Due</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each data.invoices as invoice}
                            <tr class="group cursor-pointer">
                                <td class="data-cell--muted font-medium">
                                    <a href="/invoices/{invoice.id}" class="data-row-link">
                                        {formatDate(invoice.invoice_date)}
                                    </a>
                                </td>
                                <td>
                                    <a href="/invoices/{invoice.id}" class="data-row-link font-mono text-sm font-medium text-primary whitespace-nowrap">
                                        {invoice.invoice_number}
                                    </a>
                                </td>
                                <td>
                                    <a href="/invoices/{invoice.id}" class="data-row-link">
                                        <div class="flex flex-col">
                                            <span
                                                class="text-sm font-semibold text-text-strong"
                                                >{invoice.customer_name ||
                                                    "—"}</span
                                            >
                                            {#if invoice.customer_company}
                                                <span
                                                    class="text-[11px] text-text-muted uppercase tracking-wide"
                                                >
                                                    {invoice.customer_company}
                                                </span>
                                            {/if}
                                        </div>
                                    </a>
                                </td>
                                <td class="text-right">
                                    <a href="/invoices/{invoice.id}" class="data-row-link justify-end">
                                        <StatusBadge
                                            status={invoice.status.replace(
                                                "_",
                                                " ",
                                            )}
                                        />
                                    </a>
                                </td>
                                <td class="data-cell--number text-text-strong">
                                    <a href="/invoices/{invoice.id}" class="data-row-link justify-end">
                                        {formatCurrency(invoice.total)}
                                    </a>
                                </td>
                                <td
                                    class="data-cell--number font-bold {invoice.balance_due >
                                    0
                                        ? 'text-text-strong'
                                        : 'text-text-muted'}"
                                >
                                    <a href="/invoices/{invoice.id}" class="data-row-link justify-end">
                                        {formatCurrency(invoice.balance_due)}
                                    </a>
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        {/if}
    </div>
</div>
