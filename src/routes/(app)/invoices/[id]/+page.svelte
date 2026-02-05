<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import { Badge } from "$lib/components/ui/badge";
    import { ArrowLeft, Printer, Send, Download, XCircle } from "lucide-svelte";
    import { enhance } from "$app/forms";
    import { addToast } from "$lib/stores/toast";

    let { data, form } = $props();
    let isSubmitting = $state(false);
    let isDownloading = $state(false);
    let showSettleModal = $state(false);

    // Settlement State
    let selectedCredits = $state<any[]>([]);

    // Computed totals
    let selectedCreditsTotal = $derived(
        selectedCredits.reduce((sum, c) => sum + c.amount, 0),
    );

    let netPayable = $derived(
        Math.max(0, data.invoice.balance_due - selectedCreditsTotal),
    );

    // Payment Form State
    let paymentAmount = $state(0);
    let paymentMode = $state("bank");
    let paymentDate = $state(new Date().toISOString().split("T")[0]);
    let paymentReference = $state("");

    // Auto-update payment amount when credits change
    $effect(() => {
        paymentAmount = netPayable;
    });

    function openSettleModal() {
        if (data.invoice.balance_due <= 0.01) {
            addToast({
                type: "info",
                message: "invoice is already fully paid",
            });
            return;
        }
        selectedCredits = [];
        paymentAmount = data.invoice.balance_due;
        paymentDate = new Date().toISOString().split("T")[0];
        paymentReference = "";
        showSettleModal = true;
    }

    async function downloadPdf() {
        isDownloading = true;
        try {
            const res = await fetch(`/api/invoices/${data.invoice.id}/pdf`);
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || "Failed to generate PDF");
            }
            const blob = new Blob([await res.arrayBuffer()], {
                type: "application/pdf",
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${data.invoice.invoice_number}.pdf`;
            a.style.display = "none";
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 5000);
        } catch (e) {
            console.error("PDF download failed:", e);
            addToast({ type: "error", message: "Failed to generate PDF" });
        } finally {
            isDownloading = false;
        }
    }

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

<div class="flex flex-col h-[calc(100vh-3.5rem)] -mx-4 md:-mx-5 -my-4 md:-my-5">
    <!-- Header -->
    <header
        class="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-0 z-20"
    >
        <div class="flex items-center gap-4">
            <Button
                variant="ghost"
                href="/invoices"
                size="icon"
                class="h-8 w-8"
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
                <form method="POST" action="?/issue" use:enhance>
                    <Button type="submit" size="sm">
                        <Send class="mr-2 size-3" /> Issue Invoice
                    </Button>
                </form>
            {/if}
            <Button
                variant="outline"
                size="sm"
                onclick={downloadPdf}
                disabled={isDownloading}
            >
                <Download class="mr-2 size-3" />
                {isDownloading ? "Generating..." : "PDF"}
            </Button>
            <Button variant="outline" size="sm" onclick={() => window.print()}>
                <Printer class="mr-2 size-3" /> Print
            </Button>
        </div>
    </header>

    <!-- Alerts -->
    {#if form?.error}
        <div
            class="mx-6 mt-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20 flex items-center gap-2"
        >
            <XCircle class="size-4 flex-shrink-0" />
            {form.error}
        </div>
    {/if}

    {#if form?.success}
        <div
            class="mx-6 mt-4 p-3 rounded-lg bg-green-50 text-green-700 text-sm border border-green-200"
        >
            {#if form.invoiceNumber}
                Invoice issued successfully as <span
                    class="font-mono font-medium">{form.invoiceNumber}</span
                >
            {:else}
                Action completed successfully
            {/if}
        </div>
    {/if}

    {#if data.justRecordedPayment}
        <div
            class="mx-6 mt-4 p-3 rounded-lg bg-primary/5 text-text-strong text-sm border border-primary/20"
        >
            Payment recorded: <span class="font-mono font-medium"
                >{formatCurrency(data.invoice.amount_paid || 0)}</span
            >
            · Balance due
            <span class="font-mono font-medium"
                >{formatCurrency(data.invoice.balance_due)}</span
            >
        </div>
    {/if}

    <!-- Content: Paper View -->
    <main class="flex-1 overflow-y-auto px-6 py-8 bg-surface-2/30">
        <div class="mx-auto max-w-4xl">
            <!-- Main Paper Sheet -->
            <div
                class="bg-surface-0 border border-border rounded-xl shadow-sm p-8 space-y-8"
            >
                <!-- Top Meta Band -->
                <div class="flex flex-col gap-6">
                    {#if data.org && data.org.logo_url}
                        <img
                            src={data.org.logo_url}
                            alt={data.org.name}
                            class="h-16 w-auto object-contain self-start"
                        />
                    {/if}
                    <div class="flex justify-between items-start">
                        <div class="space-y-1">
                            <p
                                class="text-xs font-semibold uppercase tracking-wide text-text-secondary"
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

                        <div
                            class="grid grid-cols-2 gap-x-8 gap-y-4 text-right"
                        >
                            <div>
                                <p
                                    class="text-[10px] font-semibold uppercase tracking-wide text-text-secondary"
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
                                    class="text-[10px] font-semibold uppercase tracking-wide text-text-secondary"
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
                                        class="text-[10px] font-semibold uppercase tracking-wide text-text-secondary"
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
                </div>

                <!-- Items Table -->
                <div class="border rounded-md overflow-hidden">
                    <table class="w-full text-sm">
                        <thead>
                            <tr
                                class="bg-surface-2/50 border-b border-border text-[10px] uppercase tracking-wide font-semibold text-text-secondary"
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
                                class="text-[10px] font-semibold uppercase tracking-wide text-text-secondary"
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
                        <!-- Available Credits Widget Removed (Moved to Bottom Bar) -->

                        <div class="flex justify-between text-text-secondary">
                            <span>Sub Total</span>
                            <span class="font-mono font-medium text-text-strong"
                                >{formatCurrency(data.invoice.subtotal)}</span
                            >
                        </div>

                        {#if data.invoice.is_inter_state}
                            <div
                                class="flex justify-between text-text-secondary"
                            >
                                <span>IGST</span>
                                <span
                                    class="font-mono font-medium text-text-strong"
                                    >{formatCurrency(data.invoice.igst)}</span
                                >
                            </div>
                        {:else}
                            <div
                                class="flex justify-between text-text-secondary"
                            >
                                <span>CGST</span>
                                <span
                                    class="font-mono font-medium text-text-strong"
                                    >{formatCurrency(data.invoice.cgst)}</span
                                >
                            </div>
                            <div
                                class="flex justify-between text-text-secondary"
                            >
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

                        {#if data.paymentHistory && data.paymentHistory.length > 0}
                            <!-- Show each adjustment as a line item -->
                            <div
                                class="mt-2 space-y-1.5 border-t border-border-dashed pt-3"
                            >
                                {#each data.paymentHistory as txn}
                                    <div class="flex justify-between text-sm">
                                        <span class="text-text-subtle">
                                            {#if txn.type === "credit_note"}
                                                <span class="text-blue-600"
                                                    >Adjusted</span
                                                >
                                                <span class="font-mono text-xs"
                                                    >({txn.reference})</span
                                                >
                                            {:else if txn.type === "advance"}
                                                <span class="text-purple-600"
                                                    >Advance</span
                                                >
                                                <span class="font-mono text-xs"
                                                    >({txn.reference})</span
                                                >
                                            {:else}
                                                <span class="text-green-600"
                                                    >Payment</span
                                                >
                                                <span class="font-mono text-xs"
                                                    >({txn.reference})</span
                                                >
                                            {/if}
                                        </span>
                                        <span class="font-mono text-green-600">
                                            (-) {formatCurrency(txn.amount)}
                                        </span>
                                    </div>
                                {/each}
                            </div>
                        {/if}

                        {#if data.invoice.balance_due > 0.01 || (data.invoice.amount_paid && data.invoice.amount_paid > 0)}
                            <div
                                class="flex justify-between font-bold text-lg mt-3 pt-3 border-t border-border-strong"
                            >
                                <span
                                    >{data.invoice.balance_due <= 0.01
                                        ? "Paid"
                                        : "Balance Due"}</span
                                >
                                <span
                                    class="font-mono {data.invoice
                                        .balance_due <= 0.01
                                        ? 'text-green-600'
                                        : 'text-primary'}"
                                >
                                    {formatCurrency(data.invoice.balance_due)}
                                </span>
                            </div>
                        {/if}
                    </div>
                </div>
            </div>
        </div>
    </main>

    <!-- Bottom Action Bar -->
    {#if data.invoice.status !== "draft" && data.invoice.status !== "cancelled" && data.invoice.balance_due > 0.01}
        <div class="action-bar">
            <div class="action-bar-group">
                <Button
                    onclick={openSettleModal}
                    class="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                >
                    Settle & Close
                </Button>
            </div>
            <div class="flex items-center gap-4 text-sm">
                <div class="flex flex-col items-end">
                    <span
                        class="text-[10px] uppercase tracking-wider text-text-secondary font-semibold"
                        >Balance Due</span
                    >
                    <span class="font-mono text-xl font-bold text-primary"
                        >{formatCurrency(data.invoice.balance_due)}</span
                    >
                </div>
            </div>
        </div>
    {/if}
</div>

<!-- Settle Invoice Modal (Unified) -->
{#if showSettleModal}
    <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    >
        <div
            class="bg-surface-1 rounded-xl shadow-2xl w-full max-w-lg border border-border overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        >
            <div
                class="p-4 border-b border-border flex justify-between items-center bg-surface-2"
            >
                <div>
                    <h3 class="font-bold text-lg text-text-strong">
                        Settle Invoice
                    </h3>
                    <p class="text-xs text-text-muted">
                        Apply credits or record payment to close this invoice.
                    </p>
                </div>
                <button
                    onclick={() => (showSettleModal = false)}
                    class="text-text-muted hover:text-text-strong"
                >
                    <XCircle class="size-5" />
                </button>
            </div>

            <form
                method="POST"
                action="?/settle"
                use:enhance={() => {
                    isSubmitting = true;
                    return async ({ result, update }) => {
                        isSubmitting = false;
                        if (result.type === "success") {
                            showSettleModal = false;
                            addToast({
                                type: "success",
                                message: "Invoice settled successfully",
                            });
                            await update();
                        } else if (result.type === "failure") {
                            const errorMsg =
                                (result.data as { error?: string })?.error ||
                                "Settlement failed";
                            addToast({ type: "error", message: errorMsg });
                        }
                    };
                }}
            >
                <div class="p-5 space-y-6 max-h-[70vh] overflow-y-auto">
                    <!-- Top Summary -->
                    <div
                        class="bg-surface-2/50 p-4 rounded-lg flex justify-between items-center border border-border-subtle"
                    >
                        <span class="text-sm font-medium text-text-secondary"
                            >Amount Due</span
                        >
                        <span
                            class="text-2xl font-bold font-mono text-text-strong"
                        >
                            {formatCurrency(data.invoice.balance_due)}
                        </span>
                    </div>

                    <!-- 1. Available Credits -->
                    {#if data.availableCredits && data.availableCredits.length > 0}
                        <div class="space-y-3">
                            <div class="flex items-center justify-between">
                                <Label
                                    class="text-xs font-bold uppercase tracking-wide text-text-secondary"
                                >
                                    Apply Credits
                                </Label>
                                {#if selectedCreditsTotal > 0}
                                    <span
                                        class="text-xs font-mono font-medium text-info"
                                    >
                                        -{formatCurrency(selectedCreditsTotal)} applied
                                    </span>
                                {/if}
                            </div>

                            <div class="space-y-2">
                                {#each data.availableCredits as credit}
                                    <label
                                        class="block relative group cursor-pointer"
                                    >
                                        <input
                                            type="checkbox"
                                            bind:group={selectedCredits}
                                            value={credit}
                                            class="peer sr-only"
                                        />
                                        <div
                                            class="flex items-center justify-between p-3 rounded-lg border border-border bg-surface-0 hover:bg-surface-2 transition-all peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:shadow-sm"
                                        >
                                            <div>
                                                <div
                                                    class="font-medium text-sm text-text-strong"
                                                >
                                                    {credit.type ===
                                                    "credit_note"
                                                        ? "Credit Note"
                                                        : "Advance"}
                                                    <span
                                                        class="text-text-muted"
                                                        >#{credit.number}</span
                                                    >
                                                </div>
                                                <div
                                                    class="text-[10px] text-text-muted"
                                                >
                                                    {formatDate(credit.date)}
                                                </div>
                                            </div>
                                            <div
                                                class="font-mono font-bold text-sm text-text-strong"
                                            >
                                                {formatCurrency(credit.amount)}
                                            </div>
                                        </div>
                                    </label>
                                {/each}
                            </div>
                        </div>
                    {/if}

                    <!-- 2. Payment Details -->
                    <div class="space-y-4 pt-4 border-t border-border-dashed">
                        <div class="flex items-center justify-between">
                            <Label
                                class="text-xs font-bold uppercase tracking-wide text-text-secondary"
                            >
                                Remaining Payment
                            </Label>
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <div class="space-y-1.5">
                                <Label for="payment_amount" class="form-label"
                                    >Amount</Label
                                >
                                <Input
                                    id="payment_amount"
                                    name="payment_amount"
                                    type="number"
                                    step="0.01"
                                    bind:value={paymentAmount}
                                    class="text-right font-mono font-bold bg-surface-0"
                                />
                            </div>
                            <div class="space-y-1.5">
                                <Label for="payment_date" class="form-label"
                                    >Date</Label
                                >
                                <Input
                                    id="payment_date"
                                    name="payment_date"
                                    type="date"
                                    bind:value={paymentDate}
                                    class="bg-surface-0"
                                />
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <div class="space-y-1.5">
                                <Label for="payment_mode" class="form-label"
                                    >Mode</Label
                                >
                                <select
                                    id="payment_mode"
                                    name="payment_mode"
                                    bind:value={paymentMode}
                                    class="h-9 w-full border border-border-strong rounded-md bg-surface-0 text-sm text-text-strong px-2"
                                >
                                    <option value="bank">Bank Transfer</option>
                                    <option value="cash">Cash</option>
                                    <option value="upi">UPI / QR</option>
                                </select>
                            </div>
                            <div class="space-y-1.5">
                                <Label
                                    for="payment_reference"
                                    class="form-label">Ref (Opt)</Label
                                >
                                <Input
                                    id="payment_reference"
                                    name="payment_reference"
                                    bind:value={paymentReference}
                                    placeholder="UTR / Txn ID"
                                    class="bg-surface-0"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Footer Summary & Action -->
                <div
                    class="p-4 bg-surface-2 border-t border-border flex justify-between items-center"
                >
                    <div class="text-xs text-text-muted">
                        {#if netPayable <= 0.01}
                            <span class="text-green-600 font-medium"
                                >Fully Settled</span
                            >
                        {:else}
                            Remaining Due: <span class="font-mono"
                                >{formatCurrency(
                                    Math.max(0, netPayable - paymentAmount),
                                )}</span
                            >
                        {/if}
                    </div>
                    <div class="flex gap-3">
                        <input
                            type="hidden"
                            name="credits"
                            value={JSON.stringify(selectedCredits)}
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            onclick={() => (showSettleModal = false)}
                            >Cancel</Button
                        >
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Processing..." : "Settle Invoice"}
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    </div>
{/if}
