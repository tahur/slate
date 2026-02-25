<script lang="ts">
    import { Button } from "$lib/components/ui/button";
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
    import StatusBadge from "$lib/components/ui/badge/StatusBadge.svelte";
    import { Plus, FileCheck } from "lucide-svelte";
    import { formatINR } from "$lib/utils/currency";
    import { formatDate } from "$lib/utils/date";

    let { data } = $props();

    function daysUntilExpiry(
        validUntil: string | null | undefined,
    ): number | null {
        if (!validUntil) return null;
        const valid = new Date(validUntil);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        valid.setHours(0, 0, 0, 0);
        return Math.ceil(
            (valid.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
        );
    }

    function validityLabel(q: any): string {
        if (
            q.status === "expired" ||
            q.status === "declined" ||
            q.status === "invoiced"
        )
            return "";
        const days = daysUntilExpiry(q.valid_until);
        if (days === null) return "";
        if (days < 0) return "Expired";
        if (days === 0) return "Expires today";
        if (days <= 7) return `${days}d left`;
        return formatDate(q.valid_until);
    }
</script>

<div class="page-full-bleed">
    <!-- Header -->
    <div
        class="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-0"
    >
        <div>
            <div class="flex items-center gap-2">
                <Tooltip.Root>
                    <Tooltip.Trigger
                        class="text-xl font-bold tracking-tight text-text-strong underline decoration-dotted decoration-text-muted/50 cursor-help underline-offset-4"
                    >
                        All Quotations
                    </Tooltip.Trigger>
                    <Tooltip.Content>
                        <p class="max-w-[250px] text-xs">
                            A quotation is a price estimate you send to a
                            customer before a sale is confirmed. Once accepted,
                            convert it to an invoice.
                        </p>
                    </Tooltip.Content>
                </Tooltip.Root>
            </div>
            <p class="text-sm text-text-muted">
                Create quotations and convert accepted ones to invoices
            </p>
        </div>
        <Button href="/quotations/new">
            <Plus class="mr-2 size-4" />
            New
        </Button>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-auto bg-surface-1 p-4 sm:p-6">
        {#if data.quotations.length === 0}
            <div
                class="flex flex-col items-center justify-center py-20 border border-dashed border-border-strong rounded-lg bg-surface-0"
            >
                <FileCheck class="size-12 text-text-muted/30 mb-4" />
                <h3 class="text-lg font-bold text-text-strong">
                    No quotations yet
                </h3>
                <p class="text-sm text-text-muted mb-6">
                    Create your first quotation to share with a customer
                </p>
                <Button href="/quotations/new">
                    <Plus class="mr-2 size-4" />
                    Create Quotation
                </Button>
            </div>
        {:else}
            <!-- Mobile cards -->
            <div class="space-y-3 sm:hidden">
                {#each data.quotations as q}
                    <a
                        href="/quotations/{q.id}"
                        class="block rounded-lg border border-border bg-surface-0 p-4 shadow-sm transition-colors active:bg-surface-2"
                    >
                        <div class="flex items-center justify-between gap-3">
                            <span
                                class="font-mono text-sm font-semibold text-primary truncate"
                            >
                                {q.quotation_number}
                            </span>
                            <span
                                class="font-mono text-sm font-semibold text-text-strong"
                            >
                                {formatINR(q.total)}
                            </span>
                        </div>
                        <p
                            class="mt-1 text-sm font-medium text-text-strong truncate"
                        >
                            {q.customer_name || "—"}
                        </p>
                        {#if q.subject}
                            <p class="mt-0.5 text-xs text-text-muted truncate">
                                {q.subject}
                            </p>
                        {/if}
                        <div
                            class="mt-2 flex items-center justify-between gap-2"
                        >
                            <p class="text-xs text-text-muted">
                                {validityLabel(q) || formatDate(q.valid_until)}
                            </p>
                            <StatusBadge status={q.status} />
                        </div>
                    </a>
                {/each}
            </div>

            <!-- Desktop table -->
            <div
                class="hidden sm:block border border-border rounded-lg overflow-hidden shadow-sm bg-surface-0"
            >
                <TableContainer>
                    <Table class="min-w-[52rem]">
                        <TableHeader>
                            <TableRow class="hover:bg-transparent">
                                <TableHead class="w-28">Date</TableHead>
                                <TableHead>Quotation #</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Subject</TableHead>
                                <TableHead class="text-right w-28"
                                    >Valid Until</TableHead
                                >
                                <TableHead class="text-right w-24"
                                    >Status</TableHead
                                >
                                <TableHead class="text-right w-32"
                                    >Amount</TableHead
                                >
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {#each data.quotations as q}
                                <TableRow class="group cursor-pointer">
                                    <TableCell
                                        class="text-text-muted font-medium"
                                    >
                                        <a
                                            href="/quotations/{q.id}"
                                            class="flex items-center w-full h-full text-inherit no-underline"
                                        >
                                            {formatDate(q.quotation_date)}
                                        </a>
                                    </TableCell>
                                    <TableCell>
                                        <a
                                            href="/quotations/{q.id}"
                                            class="flex items-center w-full h-full text-inherit no-underline font-mono text-sm font-medium text-primary whitespace-nowrap"
                                        >
                                            {q.quotation_number}
                                        </a>
                                    </TableCell>
                                    <TableCell>
                                        <a
                                            href="/quotations/{q.id}"
                                            class="flex items-center w-full h-full text-inherit no-underline"
                                        >
                                            <div class="flex flex-col">
                                                <span
                                                    class="text-sm font-semibold text-text-strong"
                                                    >{q.customer_name ||
                                                        "—"}</span
                                                >
                                                {#if q.customer_company}
                                                    <span
                                                        class="text-[11px] text-text-muted uppercase tracking-wide"
                                                        >{q.customer_company}</span
                                                    >
                                                {/if}
                                            </div>
                                        </a>
                                    </TableCell>
                                    <TableCell>
                                        <a
                                            href="/quotations/{q.id}"
                                            class="flex items-center w-full h-full text-inherit no-underline text-sm text-text-muted truncate max-w-[200px]"
                                        >
                                            {q.subject || "—"}
                                        </a>
                                    </TableCell>
                                    <TableCell class="text-right text-sm">
                                        <a
                                            href="/quotations/{q.id}"
                                            class="flex items-center justify-end w-full h-full text-inherit no-underline"
                                        >
                                            {#if validityLabel(q) === "Expired" || validityLabel(q) === "Expires today"}
                                                <span
                                                    class="text-red-600 font-medium"
                                                    >{validityLabel(q)}</span
                                                >
                                            {:else if validityLabel(q).includes("d left")}
                                                <span
                                                    class="text-amber-600 font-medium"
                                                    >{validityLabel(q)}</span
                                                >
                                            {:else}
                                                <span class="text-text-muted"
                                                    >{formatDate(
                                                        q.valid_until,
                                                    )}</span
                                                >
                                            {/if}
                                        </a>
                                    </TableCell>
                                    <TableCell class="text-right">
                                        <a
                                            href="/quotations/{q.id}"
                                            class="flex items-center justify-end w-full h-full text-inherit no-underline"
                                        >
                                            <StatusBadge status={q.status} />
                                        </a>
                                    </TableCell>
                                    <TableCell
                                        class="text-right font-mono tabular-nums text-[0.8125rem] text-text-strong"
                                    >
                                        <a
                                            href="/quotations/{q.id}"
                                            class="flex items-center justify-end w-full h-full text-inherit no-underline"
                                        >
                                            {formatINR(q.total)}
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
