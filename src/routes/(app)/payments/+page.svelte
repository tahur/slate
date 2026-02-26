<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { Plus, FileText } from "lucide-svelte";
    import * as Tooltip from "$lib/components/ui/tooltip";
    import {
        Table,
        TableContainer,
        TableHeader,
        TableBody,
        TableRow,
        TableHead,
        TableCell,
    } from "$lib/components/ui/table";
    import Badge from "$lib/components/ui/badge/badge.svelte";
    import { formatINR } from "$lib/utils/currency";
    import { formatDate } from "$lib/utils/date";

    let { data } = $props();

    // Build mode label lookup from server data with fallback
    const FALLBACK_LABELS: Record<string, string> = {
        cash: "Cash",
        bank: "Bank Transfer",
        upi: "UPI",
        cheque: "Cheque",
    };

    function getModeLabel(mode: string): string {
        const found = data.paymentModes.find((m: any) => m.mode_key === mode);
        return found?.label || FALLBACK_LABELS[mode] || mode;
    }
</script>

<div class="page-full-bleed">
    <!-- Header / Filter Bar -->
    <div class="page-header items-center">
        <div>
            <div class="flex items-center gap-2">
                <Tooltip.Root>
                    <Tooltip.Trigger
                        class="cursor-help text-xl font-semibold tracking-tight text-text-strong"
                    >
                        Receipts
                    </Tooltip.Trigger>
                    <Tooltip.Content>
                        <p class="max-w-[250px] text-xs">
                            A receipt is money you receive from a customer
                            against an invoice.
                        </p>
                    </Tooltip.Content>
                </Tooltip.Root>
            </div>
            <p class="text-sm text-text-muted">
                Record and manage money received from customers
            </p>
        </div>
        <Button href="/payments/new">
            <Plus class="mr-2 size-4" />
            Receive Payment
        </Button>
    </div>

    <!-- Content -->
    <div class="page-body">
        <div class="content-width-standard">
            <!-- Payment Table or Empty State -->
            {#if data.payments.length === 0}
                <div
                    class="flex flex-col items-center justify-center rounded-xl border border-dashed border-border-strong bg-surface-0 py-20"
                >
                    <FileText class="size-12 text-text-muted/30 mb-4" />
                    <h3 class="text-lg font-bold text-text-strong">
                        No receipts yet
                    </h3>
                    <p class="text-sm text-text-muted mb-6">
                        Save your first customer receipt to get started
                    </p>
                    <Button href="/payments/new">
                        <Plus class="mr-2 size-4" />
                        Receive Payment
                    </Button>
                </div>
            {:else}
                <div class="space-y-3 sm:hidden">
                    {#each data.payments as payment}
                        <a
                            href="/payments/{payment.id}"
                            class="block rounded-xl border border-border bg-surface-0 p-4 shadow-sm transition-colors active:bg-surface-2"
                        >
                            <div class="flex items-center justify-between gap-3">
                                <span
                                    class="font-mono text-sm font-semibold text-text-strong truncate"
                                >
                                    {payment.payment_number}
                                </span>
                                <span class="font-mono text-sm font-semibold text-text-strong">
                                    {formatINR(payment.amount)}
                                </span>
                            </div>
                            <p class="mt-1 text-sm font-medium text-text-strong truncate">
                                {payment.customer_name ||
                                    payment.customer_company ||
                                    "—"}
                            </p>
                            <div class="mt-2 flex items-center justify-between gap-2">
                                <p class="text-xs text-text-muted">
                                    {formatDate(payment.payment_date)}
                                </p>
                                <Badge
                                    variant="outline"
                                    class="capitalize bg-surface-1"
                                >
                                    {getModeLabel(payment.payment_mode)}
                                </Badge>
                            </div>
                        </a>
                    {/each}
                </div>

                <div
                    class="hidden sm:block border border-border rounded-xl overflow-hidden shadow-sm bg-surface-0"
                >
                    <TableContainer>
                        <Table class="min-w-[44rem]">
                            <TableHeader>
                                <TableRow class="hover:bg-transparent">
                                    <TableHead class="w-28">Date</TableHead>
                                    <TableHead>Receipt #</TableHead>
                                    <TableHead>Customer Name</TableHead>
                                    <TableHead class="w-32">Method</TableHead>
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
                                                class="flex items-center w-full h-full text-inherit no-underline font-mono text-sm font-medium text-text-strong whitespace-nowrap"
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
                    </TableContainer>
                </div>
            {/if}
        </div>
    </div>
</div>
