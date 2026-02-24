<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import { Textarea } from "$lib/components/ui/textarea";
    import { ArrowLeft, Printer, Lock, X } from "lucide-svelte";
    import PaymentOptionChips from "$lib/components/PaymentOptionChips.svelte";
    import { enhance } from "$app/forms";
    import { toast } from "svelte-sonner";
    import { page } from "$app/stores";
    import * as ButtonGroup from "$lib/components/ui/button-group";
    import { formatINR } from "$lib/utils/currency";
    import { formatDate } from "$lib/utils/date";

    let { data } = $props();
    let showSettleModal = $state(false);
    let isSubmitting = $state(false);

    const defaultOption =
        data.paymentOptions.find((option: any) => option.isDefault) || data.paymentOptions[0];
    let selectedOptionKey = $state(
        defaultOption ? `${defaultOption.methodKey}::${defaultOption.accountId}` : "",
    );
    let paymentMode = $state(defaultOption?.methodKey || "");
    let paidFrom = $state(defaultOption?.accountId || "");
    let settleAmount = $state(data.balanceDue || 0);
    let paymentDate = $state(data.defaults.payment_date);
    let reference = $state("");
    let notes = $state("");

    function selectOption(option: any) {
        selectedOptionKey = `${option.methodKey}::${option.accountId}`;
        paymentMode = option.methodKey;
        paidFrom = option.accountId;
    }

    function openSettleModal() {
        settleAmount = data.balanceDue || 0;
        paymentDate = data.defaults.payment_date;
        reference = "";
        notes = "";
        selectedOptionKey = defaultOption ? `${defaultOption.methodKey}::${defaultOption.accountId}` : "";
        paymentMode = defaultOption?.methodKey || "";
        paidFrom = defaultOption?.accountId || "";
        showSettleModal = true;
    }
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
                    <span
                        class="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium {data.canSettleCredit
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-green-50 text-green-700'}"
                    >
                        {data.canSettleCredit ? "Credit" : "Paid"}
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

    {#if $page.url.searchParams.get("settle") === "recorded"}
        <div
            class="mx-6 mt-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700"
        >
            Settlement recorded successfully.
        </div>
    {/if}

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
                        {#if data.expense.vendor_display_name || data.expense.vendor_actual_name || data.expense.vendor_name}
                            <p
                                class="text-xs font-bold uppercase tracking-wide text-text-muted"
                            >
                                Supplier
                            </p>
                            <h3 class="font-semibold text-text-strong">
                                {data.expense.vendor_display_name || data.expense.vendor_actual_name || data.expense.vendor_name}
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
                                {data.canSettleCredit ? "Credit Balance" : "Paid Through"}
                            </p>
                            <p class="text-text-strong">
                                {data.canSettleCredit
                                    ? formatINR(data.balanceDue)
                                    : data.paymentAccountName}
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

                {#if data.settlements.length > 0}
                    <div class="space-y-3 border-t border-border pt-6">
                        <h3
                            class="text-xs font-semibold uppercase tracking-wider text-text-muted"
                        >
                            Settlements
                        </h3>
                        <div class="space-y-2">
                            {#each data.settlements as settlement}
                                <div
                                    class="flex items-center justify-between rounded-lg border border-border bg-surface-1 px-3 py-2"
                                >
                                    <div class="space-y-0.5">
                                        <p class="text-sm font-mono text-text-strong">
                                            {settlement.payment_number}
                                        </p>
                                        <p class="text-xs text-text-muted">
                                            {formatDate(settlement.date)}
                                            {#if settlement.method_label}
                                                · {settlement.method_label}
                                            {/if}
                                            {#if settlement.account_label}
                                                · {settlement.account_label}
                                            {/if}
                                        </p>
                                    </div>
                                    <p class="font-mono text-sm font-semibold text-green-700">
                                        {formatINR(settlement.amount)}
                                    </p>
                                </div>
                            {/each}
                        </div>
                    </div>
                {/if}

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

    <div class="print-hide action-bar">
        <div class="action-bar-group">
            {#if data.canSettleCredit}
                <Button type="button" onclick={openSettleModal}>
                    Settle
                </Button>
            {/if}
            <Button variant="ghost" href="/expenses">Back</Button>
        </div>
    </div>

    {#if showSettleModal}
        <div
            class="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 md:items-center"
        >
            <div class="w-full max-w-lg rounded-lg border border-border bg-surface-0 shadow-xl">
                <div class="flex items-center justify-between border-b border-border px-5 py-4">
                    <div>
                        <h2 class="text-base font-semibold text-text-strong">
                            Settle Expense
                        </h2>
                        <p class="mt-0.5 text-xs text-text-muted">
                            Outstanding: {formatINR(data.balanceDue)}
                        </p>
                    </div>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        class="h-8 w-8"
                        onclick={() => (showSettleModal = false)}
                    >
                        <X class="size-4" />
                    </Button>
                </div>

                <form
                    method="POST"
                    action="?/settle"
                    use:enhance={() => {
                        isSubmitting = true;
                        return async ({ result, update }) => {
                            try {
                                if (result.type === "failure") {
                                    if (result.data?.error) {
                                        toast.error(result.data.error as string);
                                    }
                                    await update();
                                    return;
                                }

                                if (result.type === "error") {
                                    toast.error(result.error?.message || "Unable to save settlement");
                                    return;
                                }

                                if (result.type === "success" || result.type === "redirect") {
                                    showSettleModal = false;
                                }

                                await update();
                            } catch {
                                toast.error("Unable to save settlement. Please try again.");
                            } finally {
                                isSubmitting = false;
                            }
                        };
                    }}
                    class="space-y-4 px-5 py-4"
                >
                    <div class="grid grid-cols-2 gap-4">
                        <div class="space-y-2">
                            <Label for="amount" variant="form">
                                Amount
                            </Label>
                            <Input
                                id="amount"
                                name="amount"
                                type="number"
                                bind:value={settleAmount}
                                min="0.01"
                                max={data.balanceDue}
                                step="0.01"
                                class="font-mono text-right"
                                required
                            />
                        </div>
                        <div class="space-y-2">
                            <Label for="payment_date" variant="form">
                                Date
                            </Label>
                            <Input
                                id="payment_date"
                                name="payment_date"
                                type="date"
                                bind:value={paymentDate}
                                required
                            />
                        </div>
                    </div>

                    <div class="space-y-2">
                        <Label variant="form">Paid From</Label>
                        {#if data.paymentOptions.length === 0}
                            <div class="rounded border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
                                Configure payment methods and accounts in Settings before settlement.
                            </div>
                        {:else}
                            <input type="hidden" name="payment_mode" value={paymentMode} />
                            <input type="hidden" name="paid_from" value={paidFrom} />
                            <PaymentOptionChips
                                options={data.paymentOptions}
                                selectedOptionKey={selectedOptionKey}
                                onSelect={selectOption}
                            />
                        {/if}
                    </div>

                    <div class="space-y-2">
                        <Label for="reference" variant="form">Reference</Label>
                        <Input
                            id="reference"
                            name="reference"
                            type="text"
                            bind:value={reference}
                            placeholder="UTR / Cheque no."
                        />
                    </div>

                    <div class="space-y-2">
                        <Label for="notes" variant="form">Notes</Label>
                        <Textarea
                            id="notes"
                            name="notes"
                            bind:value={notes}
                            rows={3}
                            class="min-h-[84px] resize-none"
                            placeholder="Optional note..."
                        />
                    </div>

                    <div class="flex items-center justify-end gap-2 border-t border-border pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onclick={() => (showSettleModal = false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting || settleAmount <= 0 || data.paymentOptions.length === 0}
                        >
                            {isSubmitting ? "Saving..." : "Settle"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    {/if}
</div>
