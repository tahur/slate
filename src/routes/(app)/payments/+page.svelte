<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { Plus, FileText } from "lucide-svelte";
    import * as Tooltip from "$lib/components/ui/tooltip";
    import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "$lib/components/ui/table";
    import Badge from "$lib/components/ui/badge/badge.svelte";
    import { formatINR } from "$lib/utils/currency";
    import { formatDate } from "$lib/utils/date";

    let { data } = $props();

    function getModeLabel(mode: string): string {
        const labels: Record<string, string> = {
            cash: "Cash",
            bank: "Bank Transfer",
            upi: "UPI",
            cheque: "Cheque",
        };
        return labels[mode] || mode;
    }
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
                        Payments Received
                    </Tooltip.Trigger>
                    <Tooltip.Content>
                        <p class="max-w-[250px] text-xs">
                            A payment is money you receive from a customer
                            against an invoice.
                        </p>
                    </Tooltip.Content>
                </Tooltip.Root>
            </div>
            <p class="text-sm text-text-muted">
                Record and manage payments you receive from customers
            </p>
        </div>
        <Button href="/payments/new">
            <Plus class="mr-2 size-4" />
            Record Payment
        </Button>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-auto bg-surface-1 p-6">
        <!-- Payment Table or Empty State -->
        {#if data.payments.length === 0}
            <div
                class="flex flex-col items-center justify-center py-20 border border-dashed border-border-strong rounded-lg bg-surface-0"
            >
                <FileText class="size-12 text-text-muted/30 mb-4" />
                <h3 class="text-lg font-bold text-text-strong">
                    No payments yet
                </h3>
                <p class="text-sm text-text-muted mb-6">
                    Record your first customer payment to get started
                </p>
                <Button href="/payments/new">
                    <Plus class="mr-2 size-4" />
                    Record Payment
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
                            <TableHead>Payment #</TableHead>
                            <TableHead>Customer Name</TableHead>
                            <TableHead class="w-32">Mode</TableHead>
                            <TableHead class="text-right w-32">Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {#each data.payments as payment}
                            <TableRow class="group cursor-pointer">
                                <TableCell class="text-text-muted font-medium">
                                    <a
                                        href="/payments/{payment.id}"
                                        class="flex items-center w-full h-full text-inherit no-underline"
                                    >
                                        {formatDate(payment.payment_date)}
                                    </a>
                                </TableCell>
                                <TableCell>
                                    <a
                                        href="/payments/{payment.id}"
                                        class="flex items-center w-full h-full text-inherit no-underline font-mono text-sm font-medium text-primary whitespace-nowrap"
                                    >
                                        {payment.payment_number}
                                    </a>
                                </TableCell>
                                <TableCell>
                                    <a
                                        href="/payments/{payment.id}"
                                        class="flex items-center w-full h-full text-inherit no-underline"
                                    >
                                        <div class="flex flex-col">
                                            <span
                                                class="font-medium text-text-strong text-sm"
                                            >
                                                {payment.customer_name ||
                                                    payment.customer_company ||
                                                    "—"}
                                            </span>
                                            {#if payment.reference}
                                                <span
                                                    class="text-[10px] text-text-muted truncate max-w-[12rem]"
                                                >
                                                    Ref: {payment.reference}
                                                </span>
                                            {/if}
                                        </div>
                                    </a>
                                </TableCell>
                                <TableCell>
                                    <a
                                        href="/payments/{payment.id}"
                                        class="flex items-center w-full h-full text-inherit no-underline"
                                    >
                                        <Badge
                                            variant="outline"
                                            class="capitalize bg-surface-1"
                                        >
                                            {getModeLabel(payment.payment_mode)}
                                        </Badge>
                                    </a>
                                </TableCell>
                                <TableCell class="text-right font-mono tabular-nums text-[0.8125rem] text-text-strong">
                                    <a
                                        href="/payments/{payment.id}"
                                        class="flex items-center justify-end w-full h-full text-inherit no-underline"
                                    >
                                        {formatINR(payment.amount)}
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
