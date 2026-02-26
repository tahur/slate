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
                <p class="text-sm text-slate-700 mt-0.5">
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
        <div class="mx-auto w-full max-w-[210mm]">
            <div class="invoice-a4-sheet bg-white border border-slate-300 shadow-sm p-8 space-y-8 print-sheet">
                <div class="flex justify-between items-start">
                    <div>
                        <h2 class="text-2xl font-bold text-[#111]">Supplier Payment</h2>
                        <p class="text-sm text-slate-700 font-mono">
                            # {data.payment.supplier_payment_number}
                        </p>
                    </div>
                    <div class="text-right space-y-1">
                        <h3 class="font-semibold text-[#111]">{data.org?.name}</h3>
                        <p class="text-sm text-slate-700">
                            {formatDate(data.payment.payment_date)}
                        </p>
                        <p class="text-xs text-slate-700 whitespace-pre-line max-w-xs ml-auto">
                            {[data.org?.address, data.org?.city, data.org?.pincode]
                                .filter(Boolean)
                                .join(", ") || "Address not set in Settings"}
                        </p>
                        <p class="text-xs text-slate-700 font-mono">
                            State: {data.org?.state_code || "-"} · GSTIN: {data
                                .org?.gstin || "UNREGISTERED"}
                        </p>
                    </div>
                </div>

                <hr class="border-slate-300" />

                <div class="grid gap-4 md:grid-cols-2">
                    <div class="space-y-1">
                        <p class="text-xs uppercase tracking-wide text-slate-700 font-semibold">
                            Supplier
                        </p>
                        <p class="text-[#111]">
                            {data.payment.vendor_display_name || data.payment.vendor_name}
                        </p>
                    </div>
                    <div class="space-y-1 text-right">
                        <p class="text-xs uppercase tracking-wide text-slate-700 font-semibold">
                            Paid From
                        </p>
                        <p class="text-[#111]">
                            {data.payment.account_label || "—"}
                        </p>
                    </div>
                    <div class="space-y-1">
                        <p class="text-xs uppercase tracking-wide text-slate-700 font-semibold">
                            Method
                        </p>
                        <p class="text-[#111]">
                            {data.payment.method_label || data.payment.payment_mode}
                        </p>
                    </div>
                    <div class="space-y-1 text-right">
                        <p class="text-xs uppercase tracking-wide text-slate-700 font-semibold">
                            Reference
                        </p>
                        <p class="text-[#111]">
                            {data.payment.reference || "—"}
                        </p>
                    </div>
                </div>

                <div class="border border-slate-300 overflow-hidden">
                    <table class="w-full text-sm">
                        <thead class="bg-slate-100/60 border-b border-slate-300">
                            <tr>
                                <th class="px-4 py-3 text-left font-medium text-slate-700 text-[10px] uppercase tracking-wide">
                                    Bill
                                </th>
                                <th class="px-4 py-3 text-left font-medium text-slate-700 text-[10px] uppercase tracking-wide">
                                    Date
                                </th>
                                <th class="px-4 py-3 text-right font-medium text-slate-700 text-[10px] uppercase tracking-wide">
                                    Adjusted
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {#if data.allocations.length === 0}
                                <tr>
                                    <td colspan="3" class="px-4 py-4 text-center text-slate-700">
                                        No bill-level adjustments. Amount kept as supplier credit.
                                    </td>
                                </tr>
                            {:else}
                                {#each data.allocations as allocation}
                                    <tr>
                                        <td class="px-4 py-3 font-mono text-[#111]">
                                            {allocation.expense_number || "—"}
                                        </td>
                                        <td class="px-4 py-3 text-slate-800">
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
                        <div class="flex justify-between items-center pt-3 border-t border-dashed border-slate-300">
                            <span class="font-bold text-[#111]">Total Paid</span>
                            <span class="font-bold font-mono text-xl text-negative">
                                {formatINR(data.payment.amount)}
                            </span>
                        </div>
                    </div>
                </div>

                {#if data.payment.notes}
                    <div class="border-t border-slate-300 pt-4">
                        <p class="text-xs uppercase tracking-wide text-slate-700 font-semibold">
                            Notes
                        </p>
                        <p class="text-sm text-slate-800 mt-1">{data.payment.notes}</p>
                    </div>
                {/if}
            </div>
        </div>
        </div>
    </div>
</div>
