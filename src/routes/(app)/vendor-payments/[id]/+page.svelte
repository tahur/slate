<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { ArrowLeft, Printer } from "lucide-svelte";
    import { formatINR } from "$lib/utils/currency";
    import { formatDate } from "$lib/utils/date";

    let { data } = $props();
</script>

<div class="page-full-bleed">
    <header class="print-hide page-header items-center">
        <div class="flex items-center gap-4">
            <Button variant="ghost" href="/vendor-payments" size="icon" class="h-8 w-8">
                <ArrowLeft class="size-4" />
            </Button>
            <div>
                <h1 class="text-xl font-bold tracking-tight text-text-strong font-mono">
                    {data.payment.supplier_payment_number}
                </h1>
                <p class="text-sm text-text-muted mt-0.5">
                    Paid to {data.payment.vendor_display_name || data.payment.vendor_name}
                </p>
            </div>
        </div>
        <Button variant="outline" size="sm" onclick={() => window.print()}>
            <Printer class="size-4 mr-2" />
            Print
        </Button>
    </header>

    <div class="page-body pb-32 print-bg-white">
        <div class="content-width-standard">
        <div class="mx-auto max-w-4xl">
            <div class="bg-surface-0 border border-border rounded-xl shadow-sm p-8 space-y-8 print-sheet">
                <div class="flex justify-between items-start">
                    <div>
                        <h2 class="text-2xl font-bold text-text-strong">Supplier Payment</h2>
                        <p class="text-sm text-text-subtle font-mono">
                            # {data.payment.supplier_payment_number}
                        </p>
                    </div>
                    <div class="text-right space-y-1">
                        <h3 class="font-semibold text-text-strong">{data.org?.name}</h3>
                        <p class="text-sm text-text-subtle">
                            {formatDate(data.payment.payment_date)}
                        </p>
                    </div>
                </div>

                <hr class="border-border" />

                <div class="grid gap-4 md:grid-cols-2">
                    <div class="space-y-1">
                        <p class="text-xs uppercase tracking-wide text-text-muted font-semibold">
                            Supplier
                        </p>
                        <p class="text-text-strong">
                            {data.payment.vendor_display_name || data.payment.vendor_name}
                        </p>
                    </div>
                    <div class="space-y-1 text-right">
                        <p class="text-xs uppercase tracking-wide text-text-muted font-semibold">
                            Paid From
                        </p>
                        <p class="text-text-strong">
                            {data.payment.account_label || "—"}
                        </p>
                    </div>
                    <div class="space-y-1">
                        <p class="text-xs uppercase tracking-wide text-text-muted font-semibold">
                            Method
                        </p>
                        <p class="text-text-strong">
                            {data.payment.method_label || data.payment.payment_mode}
                        </p>
                    </div>
                    <div class="space-y-1 text-right">
                        <p class="text-xs uppercase tracking-wide text-text-muted font-semibold">
                            Reference
                        </p>
                        <p class="text-text-strong">
                            {data.payment.reference || "—"}
                        </p>
                    </div>
                </div>

                <div class="border rounded-md overflow-hidden">
                    <table class="w-full text-sm">
                        <thead class="bg-surface-2/50 border-b border-border">
                            <tr>
                                <th class="px-4 py-3 text-left font-medium text-text-subtle text-[10px] uppercase tracking-wide">
                                    Bill
                                </th>
                                <th class="px-4 py-3 text-left font-medium text-text-subtle text-[10px] uppercase tracking-wide">
                                    Date
                                </th>
                                <th class="px-4 py-3 text-right font-medium text-text-subtle text-[10px] uppercase tracking-wide">
                                    Adjusted
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {#if data.allocations.length === 0}
                                <tr>
                                    <td colspan="3" class="px-4 py-4 text-center text-text-muted">
                                        No bill-level adjustments. Amount kept as supplier credit.
                                    </td>
                                </tr>
                            {:else}
                                {#each data.allocations as allocation}
                                    <tr>
                                        <td class="px-4 py-3 font-mono text-primary">
                                            {allocation.expense_number || "—"}
                                        </td>
                                        <td class="px-4 py-3 text-text-subtle">
                                            {allocation.expense_date
                                                ? formatDate(allocation.expense_date)
                                                : "—"}
                                        </td>
                                        <td class="px-4 py-3 text-right font-mono text-red-600">
                                            {formatINR(allocation.amount)}
                                        </td>
                                    </tr>
                                {/each}
                            {/if}
                        </tbody>
                    </table>
                </div>

                <div class="flex justify-end pt-4">
                    <div class="w-64 space-y-3">
                        <div class="flex justify-between items-center pt-3 border-t border-dashed border-border">
                            <span class="font-bold text-text-strong">Total Paid</span>
                            <span class="font-bold font-mono text-xl text-negative">
                                {formatINR(data.payment.amount)}
                            </span>
                        </div>
                    </div>
                </div>

                {#if data.payment.notes}
                    <div class="border-t border-border pt-4">
                        <p class="text-xs uppercase tracking-wide text-text-muted font-semibold">
                            Notes
                        </p>
                        <p class="text-sm text-text-subtle mt-1">{data.payment.notes}</p>
                    </div>
                {/if}
            </div>
        </div>
        </div>
    </div>
</div>
