<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { ArrowLeft, Printer, Lock } from "lucide-svelte";
    import * as ButtonGroup from "$lib/components/ui/button-group";
    import { formatINR } from "$lib/utils/currency";
    import { formatDate } from "$lib/utils/date";

    let { data } = $props();
</script>

<div class="page-full-bleed">
    <!-- Header (hidden in print) -->
    <header
        class="print-hide flex items-center justify-between gap-4 px-6 py-4 border-b border-border bg-surface-0 z-20"
    >
        <div class="flex items-center gap-4">
            <Button
                variant="ghost"
                href="/expenses"
                size="icon"
                class="h-8 w-8"
            >
                <ArrowLeft class="size-4" />
            </Button>
            <div>
                <div class="flex items-center gap-3">
                    <h1
                        class="text-xl font-bold tracking-tight text-text-strong font-mono"
                    >
                        {data.expense.expense_number}
                    </h1>
                    <span
                        class="text-text-muted"
                        title="This expense is posted and cannot be modified"
                    >
                        <Lock class="size-4" />
                    </span>
                </div>
                <p class="text-xs text-text-muted mt-0.5">
                    {data.expense.category_name} · Posted {formatDate(data.expense.expense_date)}
                </p>
            </div>
        </div>
        <ButtonGroup.Root>
            <Button variant="outline" size="sm" onclick={() => window.print()}>
                <Printer class="size-4 mr-2" />
                Print
            </Button>
        </ButtonGroup.Root>
    </header>

    <!-- Content: Paper View -->
    <div class="flex-1 overflow-y-auto px-6 py-8 pb-32 bg-surface-1 print-bg-white">
        <div class="mx-auto max-w-4xl">
            <div
                class="bg-surface-0 border border-border rounded-xl shadow-sm p-8 space-y-8 print-sheet"
            >
                <!-- Top Header: Logo + Org Details -->
                <div class="flex justify-between items-start">
                    <div class="space-y-4">
                        {#if data.org && data.org.logo_url}
                            <img
                                src={data.org.logo_url}
                                alt={data.org.name}
                                class="h-12 w-auto object-contain"
                            />
                        {/if}
                        <div>
                            <h2 class="text-2xl font-bold text-text-strong">
                                Expense Voucher
                            </h2>
                            <p class="text-sm text-text-subtle font-mono">
                                # {data.expense.expense_number}
                            </p>
                        </div>
                    </div>
                    <div class="text-right space-y-1">
                        <h3 class="font-semibold text-text-strong">
                            {data.org?.name}
                        </h3>
                        {#if data.org?.address}
                            <div
                                class="text-sm text-text-subtle whitespace-pre-line max-w-xs ml-auto"
                            >
                                {data.org.address}{data.org.state_code ? `, ${data.org.state_code}` : ""}{data.org.pincode ? ` - ${data.org.pincode}` : ""}
                            </div>
                        {/if}
                        {#if data.org?.gstin}
                            <p class="text-xs text-text-muted font-mono">
                                GSTIN: {data.org.gstin}
                            </p>
                        {/if}
                    </div>
                </div>

                <hr class="border-border" />

                <!-- Vendor + Expense Meta -->
                <div class="flex justify-between items-start">
                    <div class="space-y-2">
                        {#if data.expense.vendor_name}
                            <p
                                class="text-xs font-bold uppercase tracking-wide text-text-muted"
                            >
                                Paid To
                            </p>
                            <h3 class="font-semibold text-text-strong">
                                {data.expense.vendor_name}
                            </h3>
                        {/if}
                    </div>
                    <div class="text-right space-y-4">
                        <div class="space-y-1">
                            <p
                                class="text-[10px] font-bold uppercase tracking-wide text-text-muted"
                            >
                                Expense Date
                            </p>
                            <p class="font-mono text-text-strong">
                                {formatDate(data.expense.expense_date)}
                            </p>
                        </div>
                        <div class="space-y-1">
                            <p
                                class="text-[10px] font-bold uppercase tracking-wide text-text-muted"
                            >
                                Category
                            </p>
                            <p class="text-text-strong">
                                {data.expense.category_name}
                            </p>
                        </div>
                        <div class="space-y-1">
                            <p
                                class="text-[10px] font-bold uppercase tracking-wide text-text-muted"
                            >
                                Paid Through
                            </p>
                            <p class="text-text-strong">
                                {data.paymentAccountName}
                            </p>
                        </div>
                        {#if data.expense.reference}
                            <div class="space-y-1">
                                <p
                                    class="text-[10px] font-bold uppercase tracking-wide text-text-muted"
                                >
                                    Reference
                                </p>
                                <p class="font-mono text-text-strong">
                                    {data.expense.reference}
                                </p>
                            </div>
                        {/if}
                    </div>
                </div>

                <!-- Details Table -->
                <div class="border rounded-md overflow-hidden">
                    <table class="w-full text-sm">
                        <thead class="bg-surface-2/50 border-b border-border">
                            <tr>
                                <th
                                    class="px-4 py-3 text-left font-medium text-text-subtle text-[10px] uppercase tracking-wide"
                                    >Description</th
                                >
                                <th
                                    class="px-4 py-3 text-right font-medium text-text-subtle text-[10px] uppercase tracking-wide"
                                    >Amount</th
                                >
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td class="px-4 py-4 text-text-strong">
                                    <p class="font-medium">
                                        {data.expense.category_name}
                                    </p>
                                    {#if data.expense.description}
                                        <p class="text-text-subtle mt-1">
                                            {data.expense.description}
                                        </p>
                                    {/if}
                                </td>
                                <td
                                    class="px-4 py-4 text-right font-mono text-text-strong"
                                >
                                    {formatINR(data.expense.amount)}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Totals -->
                <div class="flex justify-end pt-4">
                    <div class="w-64 space-y-3">
                        <div
                            class="flex justify-between items-center text-sm text-text-subtle"
                        >
                            <span>Base Amount</span>
                            <span class="font-mono font-medium text-text-strong">
                                {formatINR(data.expense.amount)}
                            </span>
                        </div>

                        {#if data.expense.gst_rate && data.expense.gst_rate > 0}
                            {#if data.expense.igst && data.expense.igst > 0}
                                <div
                                    class="flex justify-between items-center text-sm text-text-subtle"
                                >
                                    <span>IGST ({data.expense.gst_rate}%)</span>
                                    <span class="font-mono font-medium text-text-strong">
                                        {formatINR(data.expense.igst)}
                                    </span>
                                </div>
                            {:else}
                                <div
                                    class="flex justify-between items-center text-sm text-text-subtle"
                                >
                                    <span>CGST ({(data.expense.gst_rate || 0) / 2}%)</span>
                                    <span class="font-mono font-medium text-text-strong">
                                        {formatINR(data.expense.cgst)}
                                    </span>
                                </div>
                                <div
                                    class="flex justify-between items-center text-sm text-text-subtle"
                                >
                                    <span>SGST ({(data.expense.gst_rate || 0) / 2}%)</span>
                                    <span class="font-mono font-medium text-text-strong">
                                        {formatINR(data.expense.sgst)}
                                    </span>
                                </div>
                            {/if}
                        {/if}

                        <div
                            class="flex justify-between items-center pt-3 border-t border-dashed border-border"
                        >
                            <span class="font-bold text-text-strong">Total</span>
                            <span
                                class="font-bold font-mono text-xl text-negative"
                            >
                                {formatINR(data.expense.total)}
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Footer / Signature line -->
                <div
                    class="border-t border-border pt-8 mt-8 flex justify-between items-end"
                >
                    <div class="text-xs text-text-muted">
                        This is a computer-generated expense voucher.
                    </div>
                    <div class="text-center">
                        <div
                            class="w-48 border-b border-text-muted mb-1"
                        ></div>
                        <p class="text-xs text-text-muted">
                            Authorised Signatory
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
