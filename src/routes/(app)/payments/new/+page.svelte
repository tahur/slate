<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { Card } from "$lib/components/ui/card";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import { ArrowLeft, Check, Search } from "lucide-svelte";
    import { enhance, deserialize } from "$app/forms";
    import { toast } from "svelte-sonner";
    import { formatINR } from "$lib/utils/currency";
    import { formatDate } from "$lib/utils/date";

    let { data, form } = $props();
    const { selectedCustomer: initCustomer, depositAccounts, unpaidInvoices: initUnpaid } = data;
    let isSubmitting = $state(false);

    // Form state
    let selectedCustomer = $state(initCustomer);
    let amount = $state(0);
    let paymentMode = $state("bank");
    let depositTo = $state(
        depositAccounts.find((a) => a.code === "1100")?.id || "",
    );

    // Invoice allocations
    let unpaidInvoices = $state(initUnpaid || []);
    let allocations = $state<Record<string, number>>({});

    // Initialize allocations from data
    $effect(() => {
        if (data.unpaidInvoices) {
            unpaidInvoices = data.unpaidInvoices;
            // Removed reset allocations = {}, we should keep it if user revisits?
            // Better to only reset if customer changes, strictly handled by loadInvoices?
            // Actually, data.unpaidInvoices changes on load.
            // If preSelectedInvoiceId exists, allocate to it.
            if (data.preSelectedInvoiceId) {
                // Use data.unpaidInvoices to avoid reading state inside effect that writes to it
                const targetInv = data.unpaidInvoices.find(
                    (inv: any) => inv.id === data.preSelectedInvoiceId,
                );
                if (targetInv) {
                    allocations = { [targetInv.id]: targetInv.balance_due };
                    amount = targetInv.balance_due; // also set payment amount
                } else {
                    allocations = {};
                }
            } else {
                allocations = {};
            }
        }
    });

    // Computed values
    let totalAllocated = $derived(
        Object.values(allocations).reduce((sum, val) => sum + (val || 0), 0),
    );

    let remainingAmount = $derived(amount - totalAllocated);

    let hasExcess = $derived(remainingAmount > 0.01 && totalAllocated > 0);
    let isPureAdvance = $derived(amount > 0.01 && totalAllocated < 0.01);

    // Load invoices when customer changes
    async function loadInvoices(customerId: string) {
        if (!customerId) {
            unpaidInvoices = [];
            allocations = {};
            return;
        }

        try {
            const formData = new FormData();
            formData.append("customer_id", customerId);

            const res = await fetch("/payments/new?/getInvoices", {
                method: "POST",
                body: formData,
            });
            const text = await res.text();
            const result = deserialize(text);

            if (result.type === "success" && result.data?.invoices) {
                unpaidInvoices = result.data.invoices as typeof unpaidInvoices;
                allocations = {};
            }
        } catch (e) {
            console.error("Failed to load invoices:", e);
        }
    }

    function autoAllocate() {
        let remaining = amount;
        const newAllocations: Record<string, number> = {};

        for (const invoice of unpaidInvoices) {
            if (remaining <= 0) break;
            const allocAmount = Math.min(remaining, invoice.balance_due);
            newAllocations[invoice.id] = allocAmount;
            remaining -= allocAmount;
        }

        allocations = newAllocations;
    }
</script>

<div class="page-full-bleed">
    <!-- Header -->
    <header
        class="flex items-center justify-between gap-4 px-6 py-4 border-b border-border bg-surface-0 z-20"
    >
        <div class="flex items-center gap-4">
            <Button
                variant="ghost"
                href="/payments"
                size="icon"
                class="h-8 w-8"
            >
                <ArrowLeft class="size-4" />
            </Button>
            <div>
                <h1 class="text-xl font-bold tracking-tight text-text-strong">
                    Record Payment
                </h1>
            </div>
        </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 overflow-hidden">
        <form
            id="payment-form"
            method="POST"
            action="?/recordPayment"
            use:enhance={() => {
                isSubmitting = true;
                return async ({ result, update }) => {
                    await update();
                    isSubmitting = false;
                    if (result.type === "failure" && result.data?.error) {
                        toast.error(result.data.error as string);
                    }
                };
            }}
            class="h-full flex flex-col md:flex-row"
        >
            <!-- LEFT COLUMN: Payment Details -->
            <div
                class="flex-1 overflow-y-auto p-6 md:p-8 border-b md:border-b-0 md:border-r border-border bg-surface-1"
            >
                <div class="max-w-2xl ml-auto mr-0 md:mr-8 space-y-6">
                    <!-- Customer Selection -->
                    <div class="space-y-2">
                        <Label for="customer_id" variant="form"
                            >Customer <span class="text-destructive">*</span></Label
                        >
                        <select
                            id="customer_id"
                            name="customer_id"
                            bind:value={selectedCustomer}
                            onchange={(e) =>
                                loadInvoices(e.currentTarget.value)}
                            class="w-full h-9 rounded-md border border-border-strong bg-surface-0 px-3 py-1.5 text-sm text-text-strong focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring/50"
                            required
                        >
                            <option value="">Select customer...</option>
                            {#each data.customers as customer}
                                <option value={customer.id}>
                                    {customer.name}
                                    {#if customer.company_name}
                                        ({customer.company_name})
                                    {/if}
                                    {#if customer.balance && customer.balance > 0}
                                        — Outstanding: {formatINR(
                                            customer.balance,
                                        )}
                                    {/if}
                                </option>
                            {/each}
                        </select>
                    </div>

                    <div class="grid gap-6 grid-cols-2">
                        <!-- Amount -->
                        <div class="space-y-2">
                            <Label for="amount" variant="form"
                                >Amount <span class="text-destructive">*</span></Label
                            >
                            <Input
                                type="number"
                                id="amount"
                                name="amount"
                                bind:value={amount}
                                step="0.01"
                                min="0.01"
                                required
                                class="h-12 border-border-strong text-text-strong bg-surface-1 font-mono text-xl font-bold text-right"
                            />
                        </div>

                        <!-- Date -->
                        <div class="space-y-2">
                            <Label for="payment_date" variant="form"
                                >Date <span class="text-destructive">*</span></Label
                            >
                            <Input
                                type="date"
                                id="payment_date"
                                name="payment_date"
                                value={data.defaults.payment_date}
                                required
                                class="border-border-strong bg-surface-0"
                            />
                        </div>
                    </div>

                    <div class="grid gap-6 grid-cols-2">
                        <!-- Mode -->
                        <div class="space-y-2">
                            <Label for="payment_mode" variant="form"
                                >Mode <span class="text-destructive">*</span></Label
                            >
                            <select
                                id="payment_mode"
                                name="payment_mode"
                                bind:value={paymentMode}
                                class="w-full h-9 rounded-md border border-border-strong bg-surface-0 px-3 py-1.5 text-sm text-text-strong focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring/50"
                                required
                            >
                                <option value="bank">Bank Transfer</option>
                                <option value="upi">UPI</option>
                                <option value="cash">Cash</option>
                                <option value="cheque">Cheque</option>
                            </select>
                        </div>

                        <!-- Deposit To -->
                        <div class="space-y-2">
                            <Label for="deposit_to" variant="form"
                                >Deposit To <span class="text-destructive">*</span></Label
                            >
                            <select
                                id="deposit_to"
                                name="deposit_to"
                                bind:value={depositTo}
                                class="w-full h-9 rounded-md border border-border-strong bg-surface-0 px-3 py-1.5 text-sm text-text-strong focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring/50"
                                required
                            >
                                {#each data.depositAccounts as account}
                                    <option value={account.id}>
                                        {account.name}
                                    </option>
                                {/each}
                            </select>
                        </div>
                    </div>

                    <!-- Reference -->
                    <div class="space-y-2">
                        <Label for="reference" variant="form"
                            >Reference</Label
                        >
                        <Input
                            type="text"
                            id="reference"
                            name="reference"
                            placeholder="UTR / Cheque No."
                            class="border-border-strong bg-surface-0"
                        />
                    </div>

                    <!-- Notes -->
                    <div class="space-y-2">
                        <Label for="notes" variant="form"
                            >Notes</Label
                        >
                        <textarea
                            id="notes"
                            name="notes"
                            rows="3"
                            class="w-full rounded-md border border-border-strong bg-surface-0 px-3 py-2 text-sm text-text-strong resize-none placeholder:text-text-placeholder focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring/50"
                            placeholder="Internal notes..."
                        ></textarea>
                    </div>
                </div>
            </div>

            <!-- RIGHT COLUMN: Invoice Allocation -->
            <div class="w-full md:w-96 bg-surface-0 p-6 md:p-8 overflow-y-auto">
                <div class="space-y-6">
                    <div class="flex items-center justify-between">
                        <h3
                            class="text-sm font-bold uppercase tracking-wide text-text-subtle"
                        >
                            Unpaid Invoices
                        </h3>
                        {#if unpaidInvoices.length > 0 && amount > 0}
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onclick={autoAllocate}
                            >
                                Auto-Allocate
                            </Button>
                        {/if}
                    </div>

                    {#if !selectedCustomer}
                        <div
                            class="flex flex-col items-center justify-center h-40 border-2 border-dashed border-border rounded-lg text-text-muted text-sm text-center p-4"
                        >
                            <Search class="size-8 mb-2 opacity-50" />
                            Select a customer to view invoices
                        </div>
                    {:else if unpaidInvoices.length === 0}
                        <div
                            class="flex flex-col items-center justify-center h-40 border-2 border-dashed border-border rounded-lg text-text-muted text-sm text-center p-4"
                        >
                            <Check
                                class="size-8 mb-2 opacity-50 text-green-500"
                            />
                            All caught up! No unpaid invoices.
                        </div>
                    {:else}
                        <div class="space-y-3">
                            {#each unpaidInvoices as invoice, idx}
                                <div
                                    class="group relative flex items-start gap-3 p-4 rounded-lg border border-border bg-surface-0 shadow-sm transition-all hover:shadow-md hover:border-primary/50"
                                >
                                    <div class="flex-1 min-w-0">
                                        <div
                                            class="flex items-center justify-between mb-1"
                                        >
                                            <span
                                                class="font-bold text-text-strong font-mono"
                                                >{invoice.invoice_number}</span
                                            >
                                            <span
                                                class="text-xs text-text-muted"
                                                >{formatDate(
                                                    invoice.invoice_date,
                                                )}</span
                                            >
                                        </div>
                                        <div class="flex items-baseline gap-2">
                                            <span
                                                class="text-xs text-text-muted"
                                                >Due:</span
                                            >
                                            <span
                                                class="text-sm font-medium text-destructive"
                                                >{formatINR(
                                                    invoice.balance_due,
                                                )}</span
                                            >
                                        </div>
                                    </div>

                                    <div class="flex items-center gap-2">
                                        <input
                                            type="hidden"
                                            name="allocations[{idx}].invoice_id"
                                            value={invoice.id}
                                        />

                                        <div class="w-32">
                                            <Input
                                                type="number"
                                                name="allocations[{idx}].amount"
                                                bind:value={
                                                    allocations[invoice.id]
                                                }
                                                step="0.01"
                                                min="0"
                                                max={invoice.balance_due}
                                                class="h-9 text-right font-mono bg-surface-1 border-transparent focus:bg-surface-0 transition-colors"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        class="absolute -right-2 -top-2 bg-surface-0 border border-border shadow-sm rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Pay Full"
                                        onclick={() => {
                                            allocations[invoice.id] =
                                                invoice.balance_due;
                                        }}
                                    >
                                        <Check class="size-3 text-primary" />
                                    </button>
                                </div>
                            {/each}
                        </div>
                    {/if}
                </div>
            </div>
        </form>
    </main>

    <!-- Bottom Action Bar -->
    <div
        class="flex-none bg-surface-1 border-t border-border shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] px-6 py-4 flex items-center justify-between z-20"
    >
        <div class="flex items-center gap-3">
            <Button
                type="submit"
                form="payment-form"
                disabled={isSubmitting || !selectedCustomer || amount <= 0}
            >
                <Check class="mr-2 size-4" />
                {isSubmitting ? "Recording..." : "Record Payment"}
            </Button>
            <Button
                href="/payments"
                variant="destructive"
                type="button"
            >
                Cancel
            </Button>
        </div>

        <div class="flex items-center gap-8 text-sm">
            <div class="flex flex-col items-end">
                <span
                    class="text-[10px] uppercase tracking-wide text-text-muted font-semibold"
                    >Received</span
                >
                <span class="font-mono text-xl font-bold text-text-strong"
                    >{formatINR(amount)}</span
                >
            </div>

            <div class="flex flex-col items-end">
                <span
                    class="text-[10px] uppercase tracking-wide text-text-muted font-semibold"
                    >Allocated</span
                >
                <span
                    class="font-mono font-medium text-text-strong {totalAllocated >
                    amount
                        ? 'text-destructive'
                        : ''}">{formatINR(totalAllocated)}</span
                >
            </div>

            {#if isPureAdvance}
                <div class="flex flex-col items-end text-blue-600">
                    <span
                        class="text-[10px] uppercase tracking-wide font-semibold"
                        >Full Advance</span
                    >
                    <span class="font-mono font-bold">{formatINR(amount)}</span>
                    <span class="text-[10px] text-text-muted">
                        No invoice allocated - saved as advance
                    </span>
                </div>
            {:else if hasExcess}
                <div class="flex flex-col items-end text-amber-600">
                    <span
                        class="text-[10px] uppercase tracking-wide font-semibold"
                        >Customer Advance</span
                    >
                    <span class="font-mono font-bold"
                        >{formatINR(remainingAmount)}</span
                    >
                    <span class="text-[10px] text-text-muted">
                        Excess saved for future invoices
                    </span>
                </div>
            {/if}
        </div>
    </div>
</div>
