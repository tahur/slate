<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { Badge } from "$lib/components/ui/badge";
    import { Card } from "$lib/components/ui/card";
    import { ArrowLeft, Printer, Send, Download, XCircle } from "lucide-svelte";
    import { enhance } from "$app/forms";

    let { data, form } = $props();
    let isSubmitting = $state(false);

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
            default:
                return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
        }
    }
</script>

{#if form?.error}
    <div class="mb-4 p-3 rounded-md bg-red-50 text-red-700 text-sm">
        {form.error}
    </div>
{/if}

{#if form?.success}
    <div class="mb-4 p-3 rounded-md bg-green-50 text-green-700 text-sm">
        {#if form.invoiceNumber}
            Invoice issued successfully as <span class="font-mono font-medium"
                >{form.invoiceNumber}</span
            >
        {:else}
            Action completed successfully
        {/if}
    </div>
{/if}

<div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
            <Button variant="ghost" href="/invoices" class="p-2">
                <ArrowLeft class="size-4" />
            </Button>
            <div>
                <div class="flex items-center gap-3">
                    <h1 class="text-xl font-semibold font-mono">
                        {data.invoice.invoice_number}
                    </h1>
                    <span
                        class="inline-flex px-2 py-0.5 rounded text-xs font-medium uppercase {getStatusColor(
                            data.invoice.status,
                        )}"
                    >
                        {data.invoice.status}
                    </span>
                </div>
                <p class="text-sm text-muted-foreground">
                    {data.customer?.name || "Unknown Customer"}
                    {#if data.customer?.company_name}
                        · {data.customer.company_name}
                    {/if}
                </p>
            </div>
        </div>
        <div class="flex items-center gap-2">
            {#if data.invoice.status === "draft"}
                <form
                    method="POST"
                    action="?/issue"
                    use:enhance={() => {
                        isSubmitting = true;
                        return async ({ update }) => {
                            await update();
                            isSubmitting = false;
                        };
                    }}
                >
                    <Button type="submit" disabled={isSubmitting}>
                        <Send class="mr-2 size-4" />
                        {isSubmitting ? "Issuing..." : "Issue Invoice"}
                    </Button>
                </form>
            {/if}
            {#if data.invoice.status !== "cancelled" && data.invoice.status !== "paid"}
                <form
                    method="POST"
                    action="?/cancel"
                    use:enhance={({ cancel }) => {
                        if (
                            !confirm(
                                "Are you sure you want to cancel this invoice?",
                            )
                        ) {
                            cancel();
                            return;
                        }
                        isSubmitting = true;
                        return async ({ update }) => {
                            await update();
                            isSubmitting = false;
                        };
                    }}
                >
                    <Button
                        type="submit"
                        variant="destructive"
                        disabled={isSubmitting}
                    >
                        <XCircle class="mr-2 size-4" />
                        Cancel
                    </Button>
                </form>
            {/if}
            <Button variant="outline">
                <Printer class="mr-2 size-4" />
                Print
            </Button>
        </div>
    </div>

    <div class="grid gap-4 lg:grid-cols-3">
        <!-- Main Content -->
        <Card class="p-6 lg:col-span-2 space-y-6">
            <!-- Invoice Details -->
            <div class="grid gap-4 md:grid-cols-3 text-sm">
                <div>
                    <p class="text-muted-foreground">Invoice Date</p>
                    <p class="font-medium">
                        {formatDate(data.invoice.invoice_date)}
                    </p>
                </div>
                <div>
                    <p class="text-muted-foreground">Due Date</p>
                    <p class="font-medium">
                        {formatDate(data.invoice.due_date)}
                    </p>
                </div>
                {#if data.invoice.order_number}
                    <div>
                        <p class="text-muted-foreground">Order Number</p>
                        <p class="font-medium">{data.invoice.order_number}</p>
                    </div>
                {/if}
            </div>

            <!-- Customer Details -->
            <div class="border-t pt-4">
                <h3 class="text-sm font-medium text-muted-foreground mb-2">
                    Bill To
                </h3>
                <div class="text-sm">
                    <p class="font-medium">{data.customer?.name}</p>
                    {#if data.customer?.company_name}
                        <p>{data.customer.company_name}</p>
                    {/if}
                    {#if data.customer?.billing_address}
                        <p class="text-muted-foreground">
                            {data.customer.billing_address}
                        </p>
                    {/if}
                    {#if data.customer?.gstin}
                        <p class="text-muted-foreground font-mono mt-1">
                            GSTIN: {data.customer.gstin}
                        </p>
                    {/if}
                </div>
            </div>

            <!-- Line Items -->
            <div class="border-t pt-4">
                <h3 class="text-sm font-medium text-muted-foreground mb-3">
                    Items
                </h3>
                <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead>
                            <tr class="border-b bg-muted/50">
                                <th
                                    class="px-3 py-2 text-left font-medium text-muted-foreground"
                                    >Description</th
                                >
                                <th
                                    class="px-3 py-2 text-left font-medium text-muted-foreground"
                                    >HSN</th
                                >
                                <th
                                    class="px-3 py-2 text-right font-medium text-muted-foreground"
                                    >Qty</th
                                >
                                <th
                                    class="px-3 py-2 text-right font-medium text-muted-foreground"
                                    >Rate</th
                                >
                                <th
                                    class="px-3 py-2 text-center font-medium text-muted-foreground"
                                    >GST</th
                                >
                                <th
                                    class="px-3 py-2 text-right font-medium text-muted-foreground"
                                    >Amount</th
                                >
                            </tr>
                        </thead>
                        <tbody>
                            {#each data.items as item}
                                <tr class="border-b">
                                    <td class="px-3 py-2">{item.description}</td
                                    >
                                    <td
                                        class="px-3 py-2 font-mono text-muted-foreground"
                                        >{item.hsn_code || "—"}</td
                                    >
                                    <td class="px-3 py-2 text-right"
                                        >{item.quantity} {item.unit}</td
                                    >
                                    <td class="px-3 py-2 text-right font-mono"
                                        >{formatCurrency(item.rate)}</td
                                    >
                                    <td class="px-3 py-2 text-center"
                                        >{item.gst_rate}%</td
                                    >
                                    <td class="px-3 py-2 text-right font-mono"
                                        >{formatCurrency(item.amount)}</td
                                    >
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Notes -->
            {#if data.invoice.notes}
                <div class="border-t pt-4">
                    <h3 class="text-sm font-medium text-muted-foreground mb-2">
                        Notes
                    </h3>
                    <p class="text-sm whitespace-pre-wrap">
                        {data.invoice.notes}
                    </p>
                </div>
            {/if}
        </Card>

        <!-- Summary Sidebar -->
        <div class="space-y-4">
            <Card class="p-6">
                <h3 class="font-medium mb-4">Summary</h3>
                <div class="space-y-3 text-sm">
                    <div class="flex justify-between">
                        <span class="text-muted-foreground">Subtotal</span>
                        <span class="font-mono"
                            >{formatCurrency(data.invoice.subtotal)}</span
                        >
                    </div>

                    {#if data.invoice.is_inter_state}
                        <div class="flex justify-between">
                            <span class="text-muted-foreground">IGST</span>
                            <span class="font-mono"
                                >{formatCurrency(data.invoice.igst)}</span
                            >
                        </div>
                    {:else}
                        <div class="flex justify-between">
                            <span class="text-muted-foreground">CGST</span>
                            <span class="font-mono"
                                >{formatCurrency(data.invoice.cgst)}</span
                            >
                        </div>
                        <div class="flex justify-between">
                            <span class="text-muted-foreground">SGST</span>
                            <span class="font-mono"
                                >{formatCurrency(data.invoice.sgst)}</span
                            >
                        </div>
                    {/if}

                    <div class="border-t pt-3 flex justify-between font-medium">
                        <span>Total</span>
                        <span class="font-mono text-lg"
                            >{formatCurrency(data.invoice.total)}</span
                        >
                    </div>

                    {#if data.invoice.amount_paid && data.invoice.amount_paid > 0}
                        <div class="flex justify-between text-green-600">
                            <span>Amount Paid</span>
                            <span class="font-mono"
                                >{formatCurrency(
                                    data.invoice.amount_paid,
                                )}</span
                            >
                        </div>
                    {/if}

                    <div
                        class="border-t pt-3 flex justify-between font-semibold text-lg"
                    >
                        <span>Balance Due</span>
                        <span class="font-mono"
                            >{formatCurrency(data.invoice.balance_due)}</span
                        >
                    </div>
                </div>
            </Card>

            {#if data.invoice.status !== "paid" && data.invoice.status !== "cancelled" && data.invoice.status !== "draft"}
                <Button
                    class="w-full"
                    variant="default"
                    href="/payments/new?customer={data.invoice.customer_id}"
                >
                    Record Payment
                </Button>
            {/if}
        </div>
    </div>
</div>
