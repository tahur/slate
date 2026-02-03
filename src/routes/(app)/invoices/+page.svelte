<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { Card } from "$lib/components/ui/card";
    import { Plus, FileText } from "lucide-svelte";

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

<div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
        <div>
            <h1 class="text-xl font-semibold">Invoices</h1>
            <p class="text-sm text-muted-foreground">
                Create and manage your invoices
            </p>
        </div>
        <Button href="/invoices/new">
            <Plus class="mr-2 size-4" />
            New Invoice
        </Button>
    </div>

    <!-- Invoice Table or Empty State -->
    {#if data.invoices.length === 0}
        <Card class="flex flex-col items-center justify-center py-12">
            <FileText class="size-12 text-muted-foreground/50 mb-4" />
            <h3 class="text-lg font-medium">No invoices yet</h3>
            <p class="text-sm text-muted-foreground mb-4">
                Create your first invoice to get started
            </p>
            <Button href="/invoices/new">
                <Plus class="mr-2 size-4" />
                Create Invoice
            </Button>
        </Card>
    {:else}
        <Card class="overflow-hidden">
            <div class="overflow-x-auto">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Number</th>
                            <th>Customer</th>
                            <th class="text-right">Amount</th>
                            <th class="text-right">Balance</th>
                            <th class="text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each data.invoices as invoice}
                            <tr>
                                <td class="data-cell--muted">
                                    {formatDate(invoice.invoice_date)}
                                </td>
                                <td class="data-cell--primary">
                                    <a
                                        href="/invoices/{invoice.id}"
                                        class="font-mono hover:underline"
                                    >
                                        {invoice.invoice_number}
                                    </a>
                                </td>
                                <td>
                                    <div class="flex flex-col">
                                        <span class="data-cell--primary"
                                            >{invoice.customer_name ||
                                                "—"}</span
                                        >
                                        {#if invoice.customer_company}
                                            <span
                                                class="data-cell--muted text-[12px]"
                                            >
                                                {invoice.customer_company}
                                            </span>
                                        {/if}
                                    </div>
                                </td>
                                <td class="data-cell--number">
                                    {formatCurrency(invoice.total)}
                                </td>
                                <td class="data-cell--number">
                                    {formatCurrency(invoice.balance_due)}
                                </td>
                                <td class="text-center">
                                    <span
                                        class="status-pill {getStatusClass(
                                            invoice.status,
                                        )}"
                                    >
                                        {invoice.status}
                                    </span>
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        </Card>
    {/if}
</div>
