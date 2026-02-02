<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { Badge } from "$lib/components/ui/badge";
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

    function getStatusVariant(
        status: string,
    ): "default" | "secondary" | "destructive" | "outline" {
        switch (status) {
            case "paid":
                return "default";
            case "issued":
                return "secondary";
            case "partially_paid":
                return "outline";
            case "overdue":
            case "cancelled":
                return "destructive";
            default: // draft
                return "outline";
        }
    }

    function getStatusColor(status: string): string {
        switch (status) {
            case "paid":
                return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
            case "issued":
                return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
            case "partially_paid":
                return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
            case "overdue":
            case "cancelled":
                return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
            default: // draft
                return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
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
                <table class="w-full">
                    <thead>
                        <tr class="border-b bg-muted/50">
                            <th
                                class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground"
                            >
                                Date
                            </th>
                            <th
                                class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground"
                            >
                                Number
                            </th>
                            <th
                                class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground"
                            >
                                Customer
                            </th>
                            <th
                                class="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground"
                            >
                                Amount
                            </th>
                            <th
                                class="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground"
                            >
                                Balance
                            </th>
                            <th
                                class="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground"
                            >
                                Status
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each data.invoices as invoice}
                            <tr
                                class="border-b hover:bg-muted/30 transition-colors"
                            >
                                <td class="px-4 py-3 text-sm">
                                    {formatDate(invoice.invoice_date)}
                                </td>
                                <td class="px-4 py-3">
                                    <a
                                        href="/invoices/{invoice.id}"
                                        class="font-medium font-mono hover:underline"
                                    >
                                        {invoice.invoice_number}
                                    </a>
                                </td>
                                <td class="px-4 py-3 text-sm">
                                    {invoice.customer_name || "—"}
                                    {#if invoice.customer_company}
                                        <span
                                            class="text-muted-foreground block text-xs"
                                        >
                                            {invoice.customer_company}
                                        </span>
                                    {/if}
                                </td>
                                <td
                                    class="px-4 py-3 text-right font-mono text-sm"
                                >
                                    {formatCurrency(invoice.total)}
                                </td>
                                <td
                                    class="px-4 py-3 text-right font-mono text-sm"
                                >
                                    {formatCurrency(invoice.balance_due)}
                                </td>
                                <td class="px-4 py-3 text-center">
                                    <span
                                        class="inline-flex px-2 py-0.5 rounded text-xs font-medium uppercase {getStatusColor(
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
