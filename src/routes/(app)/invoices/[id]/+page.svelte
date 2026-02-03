<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { Badge } from "$lib/components/ui/badge";
    import { Card } from "$lib/components/ui/card";
    import { ArrowLeft, Printer, Send, Download, XCircle } from "lucide-svelte";
    import { enhance } from "$app/forms";
    import { addToast } from "$lib/stores/toast";

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

<div class="flex flex-col h-[calc(100vh-3.5rem)] -mx-4 md:-mx-5 -my-4 md:-my-5">
    <!-- Header control bar -->
    <header
        class="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-0 z-10"
    >
        <div class="flex items-center gap-4">
            <Button
                variant="ghost"
                href="/invoices"
                size="icon"
                class="h-8 w-8 text-text-muted hover:text-text-strong"
            >
                <ArrowLeft class="size-4" />
            </Button>
            <div class="flex items-center gap-3">
                <h1
                    class="text-xl font-bold tracking-tight text-text-strong font-mono"
                >
                    {data.invoice.invoice_number}
                </h1>
                <span class="status-pill {getStatusClass(data.invoice.status)}">
                    {data.invoice.status}
                </span>
            </div>
        </div>

        <div class="flex items-center gap-2">
            {#if data.invoice.status === "draft"}
                <!-- Issue Form -->
                <form method="POST" action="?/issue" use:enhance>
                    <Button
                        type="submit"
                        size="sm"
                        class="bg-primary text-primary-foreground font-semibold"
                    >
                        <Send class="mr-2 size-3" /> Issue
                    </Button>
                </form>
            {/if}
            <Button
                variant="outline"
                size="sm"
                class="text-text-muted"
                onclick={() => window.print()}
            >
                <Printer class="mr-2 size-3" /> Print
            </Button>
        </div>
    </header>

    <!-- Content: Paper View -->
    <div class="flex-1 overflow-y-auto px-6 py-8 bg-surface-2/30">
        <div class="mx-auto max-w-5xl space-y-8">
            <!-- Main Paper Sheet -->
            <div
                class="bg-surface-0 border border-border rounded-lg shadow-sm p-8 space-y-8"
            >
                <!-- Top Meta Band -->
                <div class="flex justify-between items-start">
                    <div class="space-y-1">
                        <p
                            class="text-xs font-bold uppercase tracking-wider text-text-muted"
                        >
                            Bill To
                        </p>
                        <h3 class="text-lg font-bold text-text-strong">
                            {data.customer?.name}
                        </h3>
                        {#if data.customer?.billing_address}
                            <p
                                class="text-sm text-text-subtle whitespace-pre-line max-w-xs"
                            >
                                {data.customer.billing_address}
                            </p>
                        {/if}
                    </div>

                    <div class="grid grid-cols-2 gap-x-8 gap-y-4 text-right">
                        <div>
                            <p
                                class="text-[10px] font-bold uppercase tracking-wider text-text-muted"
                            >
                                Invoice Date
                            </p>
                            <p
                                class="text-sm font-mono font-medium text-text-strong"
                            >
                                {formatDate(data.invoice.invoice_date)}
                            </p>
                        </div>
                        <div>
                            <p
                                class="text-[10px] font-bold uppercase tracking-wider text-text-muted"
                            >
                                Due Date
                            </p>
                            <p
                                class="text-sm font-mono font-medium text-text-strong"
                            >
                                {formatDate(data.invoice.due_date)}
                            </p>
                        </div>
                        {#if data.invoice.order_number}
                            <div>
                                <p
                                    class="text-[10px] font-bold uppercase tracking-wider text-text-muted"
                                >
                                    Reference #
                                </p>
                                <p
                                    class="text-sm font-mono font-medium text-text-strong"
                                >
                                    {data.invoice.order_number}
                                </p>
                            </div>
                        {/if}
                    </div>
                </div>

                <!-- Items Table -->
                <div class="border rounded-md overflow-hidden">
                    <table class="w-full text-sm">
                        <thead>
                            <tr
                                class="bg-surface-2/50 border-b border-border text-[10px] uppercase tracking-wider font-semibold text-text-muted"
                            >
                                <th class="px-4 py-3 text-left">Item</th>
                                <th class="px-4 py-3 text-right">Qty</th>
                                <th class="px-4 py-3 text-right">Rate</th>
                                <th class="px-4 py-3 text-right">Tax</th>
                                <th class="px-4 py-3 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-border-subtle">
                            {#each data.items as item}
                                <tr>
                                    <td class="px-4 py-3">
                                        <div
                                            class="font-medium text-text-strong"
                                        >
                                            {item.description}
                                        </div>
                                        {#if item.hsn_code}
                                            <div
                                                class="text-[10px] font-mono text-text-muted"
                                            >
                                                HSN: {item.hsn_code}
                                            </div>
                                        {/if}
                                    </td>
                                    <td
                                        class="px-4 py-3 text-right font-mono text-text-subtle"
                                        >{item.quantity} {item.unit}</td
                                    >
                                    <td
                                        class="px-4 py-3 text-right font-mono text-text-subtle"
                                        >{formatCurrency(item.rate)}</td
                                    >
                                    <td
                                        class="px-4 py-3 text-right font-mono text-text-subtle"
                                        >{item.gst_rate}%</td
                                    >
                                    <td
                                        class="px-4 py-3 text-right font-mono font-medium text-text-strong"
                                        >{formatCurrency(item.amount)}</td
                                    >
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>

                <!-- Notes -->
                {#if data.invoice.notes}
                    <div class="border-t border-border-subtle pt-6">
                        <p
                            class="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2"
                        >
                            Notes
                        </p>
                        <p class="text-sm text-text-subtle whitespace-pre-wrap">
                            {data.invoice.notes}
                        </p>
                    </div>
                {/if}

                <!-- Bottom Section: Terms & Summary -->
                <div
                    class="border-t border-border-subtle pt-6 flex flex-col md:flex-row gap-8"
                >
                    <!-- Left: Terms -->
                    <div class="flex-1 space-y-2">
                        {#if data.invoice.terms}
                            <p
                                class="text-[10px] font-bold uppercase tracking-wider text-text-muted"
                            >
                                Terms & Conditions
                            </p>
                            <p
                                class="text-xs text-text-muted whitespace-pre-wrap leading-relaxed"
                            >
                                {data.invoice.terms}
                            </p>
                        {/if}
                    </div>

                    <!-- Right: Summary -->
                    <div class="w-full md:w-80 space-y-3 text-sm">
                        <div class="flex justify-between text-text-subtle">
                            <span>Sub Total</span>
                            <span class="font-mono font-medium text-text-strong"
                                >{formatCurrency(data.invoice.subtotal)}</span
                            >
                        </div>

                        {#if data.invoice.is_inter_state}
                            <div class="flex justify-between text-text-subtle">
                                <span>IGST</span>
                                <span
                                    class="font-mono font-medium text-text-strong"
                                    >{formatCurrency(data.invoice.igst)}</span
                                >
                            </div>
                        {:else}
                            <div class="flex justify-between text-text-subtle">
                                <span>CGST</span>
                                <span
                                    class="font-mono font-medium text-text-strong"
                                    >{formatCurrency(data.invoice.cgst)}</span
                                >
                            </div>
                            <div class="flex justify-between text-text-subtle">
                                <span>SGST</span>
                                <span
                                    class="font-mono font-medium text-text-strong"
                                    >{formatCurrency(data.invoice.sgst)}</span
                                >
                            </div>
                        {/if}

                        <div
                            class="border-t border-border pt-3 flex justify-between items-center"
                        >
                            <span class="font-bold text-base text-text-strong"
                                >Total</span
                            >
                            <span
                                class="font-mono text-xl font-bold text-text-strong"
                                >{formatCurrency(data.invoice.total)}</span
                            >
                        </div>

                        {#if data.invoice.amount_paid && data.invoice.amount_paid > 0}
                            <div
                                class="flex justify-between text-green-600 mt-2"
                            >
                                <span>Paid</span>
                                <span class="font-mono"
                                    >(-) {formatCurrency(
                                        data.invoice.amount_paid,
                                    )}</span
                                >
                            </div>
                            <div
                                class="flex justify-between font-bold text-lg mt-2 pt-2 border-t border-border-strong"
                            >
                                <span>Balance Due</span>
                                <span class="font-mono text-primary"
                                    >{formatCurrency(
                                        data.invoice.balance_due,
                                    )}</span
                                >
                            </div>
                        {/if}
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
