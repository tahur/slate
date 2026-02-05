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
    let showCreditsModal = $state(false);
    let showPaymentModal = $state(false);

    // Payment form state
    let paymentAmount = $state(data.invoice.balance_due);
    let paymentMode = $state("bank");
    let paymentDate = $state(new Date().toISOString().split("T")[0]);
    let paymentReference = $state("");

    function openPaymentModal() {
        // Check if there's actually a balance to pay
        if (data.invoice.balance_due <= 0.01) {
            addToast({
                type: "info",
                message: "This invoice is already fully paid",
            });
            return;
        }
        paymentAmount = data.invoice.balance_due;
        paymentDate = new Date().toISOString().split("T")[0];
        paymentReference = "";
        showPaymentModal = true;
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
    <header class="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-0 z-20">
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
                <h1 class="text-xl font-bold tracking-tight text-text-strong font-mono">
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
            <Button
                variant="outline"
                size="sm"
                onclick={() => window.print()}
            >
                <Printer class="mr-2 size-3" /> Print
            </Button>
        </div>
    </header>

    <!-- Alerts -->
    {#if form?.error}
        <div class="mx-6 mt-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20 flex items-center gap-2">
            <XCircle class="size-4 flex-shrink-0" />
            {form.error}
        </div>
    {/if}

    {#if form?.success}
        <div class="mx-6 mt-4 p-3 rounded-lg bg-green-50 text-green-700 text-sm border border-green-200">
            {#if form.invoiceNumber}
                Invoice issued successfully as <span class="font-mono font-medium">{form.invoiceNumber}</span>
            {:else}
                Action completed successfully
            {/if}
        </div>
    {/if}

    {#if data.justRecordedPayment}
        <div class="mx-6 mt-4 p-3 rounded-lg bg-primary/5 text-text-strong text-sm border border-primary/20">
            Payment recorded: <span class="font-mono font-medium">{formatCurrency(data.invoice.amount_paid || 0)}</span>
            · Balance due <span class="font-mono font-medium">{formatCurrency(data.invoice.balance_due)}</span>
        </div>
    {/if}

    <!-- Content: Paper View -->
    <main class="flex-1 overflow-y-auto px-6 py-8 bg-surface-2/30">
        <div class="mx-auto max-w-4xl">
            <!-- Main Paper Sheet -->
            <div class="bg-surface-0 border border-border rounded-xl shadow-sm p-8 space-y-8">
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
                            <div class="flex justify-between text-text-secondary">
                                <span>IGST</span>
                                <span
                                    class="font-mono font-medium text-text-strong"
                                    >{formatCurrency(data.invoice.igst)}</span
                                >
                            </div>
                        {:else}
                            <div class="flex justify-between text-text-secondary">
                                <span>CGST</span>
                                <span
                                    class="font-mono font-medium text-text-strong"
                                    >{formatCurrency(data.invoice.cgst)}</span
                                >
                            </div>
                            <div class="flex justify-between text-text-secondary">
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
                <Button onclick={openPaymentModal}>Record Payment</Button>
                {#if data.availableCredits && data.availableCredits.length > 0}
                    <Button
                        variant="outline"
                        onclick={() => (showCreditsModal = true)}
                    >
                        Apply Credits ({data.availableCredits.length})
                    </Button>
                {/if}
            </div>
            <div class="flex items-center gap-4 text-sm">
                <div class="flex flex-col items-end">
                    <span class="text-[10px] uppercase tracking-wider text-text-secondary font-semibold">Balance Due</span>
                    <span class="font-mono text-xl font-bold text-primary">{formatCurrency(data.invoice.balance_due)}</span>
                </div>
            </div>
        </div>
    {/if}
</div>

<!-- Apply Credits Modal -->
{#if showCreditsModal}
    <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    >
        <div
            class="bg-surface-1 rounded-xl shadow-2xl w-full max-w-lg border border-border overflow-hidden transform transition-all scale-100"
        >
            <div
                class="p-4 border-b border-border flex justify-between items-center bg-surface-2"
            >
                <div>
                    <h3 class="font-bold text-lg">Apply Credits</h3>
                    <p class="text-xs text-text-muted">
                        Select credits to offset this invoice.
                    </p>
                </div>
                <button
                    onclick={() => (showCreditsModal = false)}
                    class="text-text-muted hover:text-text-strong"
                >
                    <svg
                        class="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                </button>
            </div>

            <div class="p-4 max-h-[60vh] overflow-y-auto">
                <form
                    method="POST"
                    action="?/applyCredits"
                    use:enhance={() => {
                        isSubmitting = true;
                        return async ({ result, update }) => {
                            isSubmitting = false;
                            if (result.type === "success") {
                                showCreditsModal = false;
                                addToast({
                                    type: "success",
                                    message: "Credits applied successfully",
                                });
                                await update(); // Refresh page data
                            } else if (result.type === "failure") {
                                const errorMsg =
                                    (result.data as { error?: string })
                                        ?.error || "Failed to apply credits";
                                addToast({ type: "error", message: errorMsg });
                            }
                        };
                    }}
                >
                    <div class="space-y-3">
                        {#each data.availableCredits as credit}
                            <label
                                class="block relative group/item cursor-pointer"
                            >
                                <input
                                    type="checkbox"
                                    name="credits_select"
                                    value={JSON.stringify({
                                        id: credit.id,
                                        amount: credit.amount,
                                        type: credit.type,
                                    })}
                                    class="peer sr-only"
                                />
                                <div
                                    class="flex items-center justify-between p-3 rounded-lg border border-border bg-surface-2/30 hover:bg-surface-2 transition-all peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:shadow-sm"
                                >
                                    <div class="flex items-center gap-3">
                                        <div
                                            class="w-5 h-5 rounded-full border border-border peer-checked:border-primary peer-checked:bg-primary flex items-center justify-center text-white transition-all"
                                        >
                                            <svg
                                                class="w-3 h-3 opacity-0 peer-checked:opacity-100"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                    stroke-width="3"
                                                    d="M5 13l4 4L19 7"
                                                />
                                            </svg>
                                        </div>
                                        <div>
                                            <div class="font-medium text-sm">
                                                {credit.type === "credit_note"
                                                    ? "Credit Note"
                                                    : "Advance"} #{credit.number ||
                                                    "—"}
                                            </div>
                                            <div
                                                class="text-[11px] text-text-muted"
                                            >
                                                {formatDate(credit.date)}
                                            </div>
                                        </div>
                                    </div>
                                    <div class="font-mono font-bold text-sm">
                                        {formatCurrency(credit.amount)}
                                    </div>
                                </div>
                            </label>
                        {/each}
                    </div>

                    <input
                        type="hidden"
                        name="credits"
                        id="credits_json_input_modal"
                    />

                    <div
                        class="mt-6 flex justify-end gap-3 pt-4 border-t border-border"
                    >
                        <Button
                            type="button"
                            variant="ghost"
                            onclick={() => (showCreditsModal = false)}
                            >Cancel</Button
                        >
                        <Button
                            type="submit"
                            onclick={(e) => {
                                const btn =
                                    e.currentTarget as HTMLButtonElement;
                                const form = btn.form;
                                if (!form) return;
                                const checkboxes = form.querySelectorAll(
                                    'input[name="credits_select"]:checked',
                                );
                                if (checkboxes.length === 0) {
                                    e.preventDefault();
                                    alert(
                                        "Please select at least one credit to apply.",
                                    );
                                    return;
                                }
                                const selected = Array.from(checkboxes).map(
                                    (cb) =>
                                        JSON.parse(
                                            (cb as HTMLInputElement).value,
                                        ),
                                );
                                const hiddenInput = form.querySelector(
                                    "#credits_json_input_modal",
                                ) as HTMLInputElement;
                                if (hiddenInput) {
                                    hiddenInput.value =
                                        JSON.stringify(selected);
                                }
                            }}
                        >
                            Apply Selected
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    </div>
{/if}

<!-- Record Payment Modal -->
{#if showPaymentModal}
    <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    >
        <div
            class="bg-surface-1 rounded-xl shadow-2xl w-full max-w-md border border-border overflow-hidden"
        >
            <div
                class="p-4 border-b border-border flex justify-between items-center bg-surface-2"
            >
                <div>
                    <h3 class="font-bold text-lg">Record Payment</h3>
                    <p class="text-xs text-text-muted">
                        Against {data.invoice.invoice_number}
                    </p>
                </div>
                <button
                    onclick={() => (showPaymentModal = false)}
                    class="text-text-muted hover:text-text-strong"
                    aria-label="Close"
                >
                    <svg
                        class="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                </button>
            </div>

            <form
                method="POST"
                action="?/recordPayment"
                use:enhance={() => {
                    isSubmitting = true;
                    return async ({ result, update }) => {
                        isSubmitting = false;
                        if (result.type === "success") {
                            showPaymentModal = false;
                            addToast({
                                type: "success",
                                message: "Payment recorded successfully",
                            });
                            await update();
                        } else if (result.type === "failure") {
                            const errorMsg =
                                (result.data as { error?: string })?.error ||
                                "Failed to record payment";
                            addToast({ type: "error", message: errorMsg });
                        }
                    };
                }}
                class="p-4 space-y-4"
            >
                <!-- Amount -->
                <div class="space-y-2">
                    <Label for="payment_amount" class="form-label">
                        Amount <span class="text-destructive">*</span>
                    </Label>
                    <Input
                        type="number"
                        id="payment_amount"
                        name="amount"
                        bind:value={paymentAmount}
                        min="0.01"
                        max={data.invoice.balance_due}
                        step="0.01"
                        required
                        class="h-12 text-xl font-bold font-mono text-right"
                    />
                    <p class="text-xs text-text-muted">
                        Balance due: {formatCurrency(data.invoice.balance_due)}
                    </p>
                </div>

                <!-- Date -->
                <div class="space-y-2">
                    <Label for="payment_date" class="form-label">
                        Date <span class="text-destructive">*</span>
                    </Label>
                    <Input
                        type="date"
                        id="payment_date"
                        name="payment_date"
                        bind:value={paymentDate}
                        required
                        class="h-10"
                    />
                </div>

                <!-- Payment Mode -->
                <div class="space-y-2">
                    <Label class="form-label">Payment Mode</Label>
                    <div class="flex gap-2">
                        <label class="flex-1">
                            <input
                                type="radio"
                                name="payment_mode"
                                value="bank"
                                bind:group={paymentMode}
                                class="peer sr-only"
                            />
                            <div
                                class="p-3 rounded-lg border border-border text-center cursor-pointer peer-checked:border-primary peer-checked:bg-primary/5 hover:bg-surface-2"
                            >
                                <span class="text-sm font-medium">Bank</span>
                            </div>
                        </label>
                        <label class="flex-1">
                            <input
                                type="radio"
                                name="payment_mode"
                                value="cash"
                                bind:group={paymentMode}
                                class="peer sr-only"
                            />
                            <div
                                class="p-3 rounded-lg border border-border text-center cursor-pointer peer-checked:border-primary peer-checked:bg-primary/5 hover:bg-surface-2"
                            >
                                <span class="text-sm font-medium">Cash</span>
                            </div>
                        </label>
                        <label class="flex-1">
                            <input
                                type="radio"
                                name="payment_mode"
                                value="upi"
                                bind:group={paymentMode}
                                class="peer sr-only"
                            />
                            <div
                                class="p-3 rounded-lg border border-border text-center cursor-pointer peer-checked:border-primary peer-checked:bg-primary/5 hover:bg-surface-2"
                            >
                                <span class="text-sm font-medium">UPI</span>
                            </div>
                        </label>
                    </div>
                </div>

                <!-- Reference -->
                <div class="space-y-2">
                    <Label for="payment_reference" class="form-label">Reference</Label>
                    <Input
                        type="text"
                        id="payment_reference"
                        name="reference"
                        bind:value={paymentReference}
                        placeholder="UTR / Cheque No / Transaction ID"
                        class="h-10"
                    />
                </div>

                <div class="flex justify-end gap-3 pt-4 border-t border-border">
                    <Button
                        type="button"
                        variant="ghost"
                        onclick={() => (showPaymentModal = false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={isSubmitting || paymentAmount <= 0}
                    >
                        {isSubmitting ? "Recording..." : "Record Payment"}
                    </Button>
                </div>
            </form>
        </div>
    </div>
{/if}
