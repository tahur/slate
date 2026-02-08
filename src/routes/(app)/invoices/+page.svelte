<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { Card } from "$lib/components/ui/card";
    import { Plus, FileText, Info } from "lucide-svelte";
    import * as Tooltip from "$lib/components/ui/tooltip";
    import StatusBadge from "$lib/components/ui/badge/StatusBadge.svelte";
    import { formatINR } from "$lib/utils/currency";
    import { formatDate } from "$lib/utils/date";

    let { data } = $props();
</script>

<div class="page-full-bleed">
    <!-- Header / Filter Bar -->
    <div
        class="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-0"
    >
        <div>
            <div class="flex items-center gap-2">
                <Tooltip.Root>
                    <Tooltip.Trigger
                        class="text-xl font-bold tracking-tight text-text-strong underline decoration-dotted decoration-text-muted/50 cursor-help underline-offset-4"
                    >
                        All Invoices
                    </Tooltip.Trigger>
                    <Tooltip.Content>
                        <p class="max-w-[250px] text-xs">
                            An invoice is a bill you send to your customer to
                            request payment for products or services you sold.
                        </p>
                    </Tooltip.Content>
                </Tooltip.Root>
            </div>
            <p class="text-sm text-text-muted">
                Create and manage invoices you send to your customers
            </p>
        </div>
        <Button href="/invoices/new">
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
                <Button href="/invoices/new">
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
                                    <a
                                        href="/invoices/{invoice.id}"
                                        class="data-row-link"
                                    >
                                        {formatDate(invoice.invoice_date)}
                                    </a>
                                </td>
                                <td>
                                    <a
                                        href="/invoices/{invoice.id}"
                                        class="data-row-link font-mono text-sm font-medium text-primary whitespace-nowrap"
                                    >
                                        {invoice.invoice_number}
                                    </a>
                                </td>
                                <td>
                                    <a
                                        href="/invoices/{invoice.id}"
                                        class="data-row-link"
                                    >
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
                                    <a
                                        href="/invoices/{invoice.id}"
                                        class="data-row-link justify-end"
                                    >
                                        <StatusBadge
                                            status={invoice.status.replace(
                                                "_",
                                                " ",
                                            )}
                                        />
                                    </a>
                                </td>
                                <td class="data-cell--number text-text-strong">
                                    <a
                                        href="/invoices/{invoice.id}"
                                        class="data-row-link justify-end"
                                    >
                                        {formatINR(invoice.total)}
                                    </a>
                                </td>
                                <td
                                    class="data-cell--number font-bold {invoice.balance_due >
                                    0
                                        ? 'text-text-strong'
                                        : 'text-text-muted'}"
                                >
                                    <a
                                        href="/invoices/{invoice.id}"
                                        class="data-row-link justify-end"
                                    >
                                        {formatINR(invoice.balance_due)}
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
