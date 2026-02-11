<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import * as Tooltip from "$lib/components/ui/tooltip";
    import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "$lib/components/ui/table";
    import StatusBadge from "$lib/components/ui/badge/StatusBadge.svelte";
    import { Plus, FileText } from "lucide-svelte";
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
                <Table>
                    <TableHeader>
                        <TableRow class="hover:bg-transparent">
                            <TableHead class="w-28">Date</TableHead>
                            <TableHead>Invoice #</TableHead>
                            <TableHead>Customer Name</TableHead>
                            <TableHead class="text-right w-28">Status</TableHead>
                            <TableHead class="text-right w-32">Amount</TableHead>
                            <TableHead class="text-right w-32">Balance Due</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {#each data.invoices as invoice}
                            <TableRow class="group cursor-pointer">
                                <TableCell class="text-text-muted font-medium">
                                    <a
                                        href="/invoices/{invoice.id}"
                                        class="flex items-center w-full h-full text-inherit no-underline"
                                    >
                                        {formatDate(invoice.invoice_date)}
                                    </a>
                                </TableCell>
                                <TableCell>
                                    <a
                                        href="/invoices/{invoice.id}"
                                        class="flex items-center w-full h-full text-inherit no-underline font-mono text-sm font-medium text-primary whitespace-nowrap"
                                    >
                                        {invoice.invoice_number}
                                    </a>
                                </TableCell>
                                <TableCell>
                                    <a
                                        href="/invoices/{invoice.id}"
                                        class="flex items-center w-full h-full text-inherit no-underline"
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
                                </TableCell>
                                <TableCell class="text-right">
                                    <a
                                        href="/invoices/{invoice.id}"
                                        class="flex items-center justify-end w-full h-full text-inherit no-underline"
                                    >
                                        <StatusBadge
                                            status={invoice.status.replace(
                                                "_",
                                                " ",
                                            )}
                                        />
                                    </a>
                                </TableCell>
                                <TableCell class="text-right font-mono tabular-nums text-[0.8125rem] text-text-strong">
                                    <a
                                        href="/invoices/{invoice.id}"
                                        class="flex items-center justify-end w-full h-full text-inherit no-underline"
                                    >
                                        {formatINR(invoice.total)}
                                    </a>
                                </TableCell>
                                <TableCell
                                    class="text-right font-mono tabular-nums text-[0.8125rem] font-bold {invoice.balance_due >
                                    0
                                        ? 'text-text-strong'
                                        : 'text-text-muted'}"
                                >
                                    <a
                                        href="/invoices/{invoice.id}"
                                        class="flex items-center justify-end w-full h-full text-inherit no-underline"
                                    >
                                        {formatINR(invoice.balance_due)}
                                    </a>
                                </TableCell>
                            </TableRow>
                        {/each}
                    </TableBody>
                </Table>
            </div>
        {/if}
    </div>
</div>
