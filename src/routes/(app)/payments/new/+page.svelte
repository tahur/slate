<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { Card } from "$lib/components/ui/card";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import { ArrowLeft, Check, Save } from "lucide-svelte";
    import { enhance } from "$app/forms";
    import { addToast } from "$lib/stores/toast";

    let { data, form } = $props();
    let isSubmitting = $state(false);

    // Form state
    let selectedCustomer = $state(data.selectedCustomer);
    let amount = $state(0);
    let paymentMode = $state("bank");
    let depositTo = $state(
        data.depositAccounts.find((a) => a.code === "1100")?.id || "",
    );

    // Invoice allocations
    let unpaidInvoices = $state(data.unpaidInvoices || []);
    let allocations = $state<Record<string, number>>({});

    // Initialize allocations from data
    $effect(() => {
        if (data.unpaidInvoices) {
            unpaidInvoices = data.unpaidInvoices;
            allocations = {};
        }
    });

    // Computed values
    let totalAllocated = $derived(
        Object.values(allocations).reduce((sum, val) => sum + (val || 0), 0),
    );

    let remainingAmount = $derived(amount - totalAllocated);

    let hasExcess = $derived(remainingAmount > 0.01 && totalAllocated > 0);

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
                headers: {
                    Accept: "application/json",
                },
            });
            const result = await res.json();
            if (result.type === "success" && result.data?.invoices) {
                unpaidInvoices = result.data.invoices;
                allocations = {};
            } else if (result.data?.invoices) {
                unpaidInvoices = result.data.invoices;
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

    function formatCurrency(amt: number | null): string {
        if (amt === null || amt === undefined) return "₹0.00";
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 2,
        }).format(amt);
    }

    function formatDate(dateStr: string | null): string {
        if (!dateStr) return "—";
        return new Date(dateStr).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    }
</script>

<div class="flex flex-col h-[calc(100vh-3.5rem)] -mx-4 md:-mx-5 -my-4 md:-my-5">
    <!-- Header -->
    <header
        class="flex items-center justify-between gap-4 px-6 py-4 border-b border-border bg-surface-0 z-20"
    >
        <div class="flex items-center gap-4">
            <Button
                variant="ghost"
                href="/payments"
                size="icon"
                class="h-8 w-8 text-text-muted hover:text-text-strong"
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
    <main class="flex-1 overflow-y-auto px-6 py-8">
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
                        addToast({
                            type: "error",
                            message: result.data.error as string,
                        });
                    }
                };
            }}
            class="mx-auto max-w-5xl space-y-8"
        >
            <div
                class="bg-surface-1 rounded-lg border border-border p-8 shadow-sm space-y-8"
            >
                <!-- Customer Selection -->
                <div class="grid gap-6 md:grid-cols-2">
                    <div class="space-y-2">
                        <Label
                            for="customer_id"
                            class="text-xs uppercase tracking-wider text-text-muted font-bold"
                            >Customer *</Label
                        >
                        <select
                            id="customer_id"
                            name="customer_id"
                            bind:value={selectedCustomer}
                            onchange={(e) =>
                                loadInvoices(e.currentTarget.value)}
                            class="w-full h-11 rounded-md border border-border-strong bg-surface-0 px-3 py-2 text-sm focus:border-primary focus:outline-none"
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
                                        — Outstanding: {formatCurrency(
                                            customer.balance,
                                        )}
                                    {/if}
                                </option>
                            {/each}
                        </select>
                    </div>
                </div>

                <div class="grid gap-6 md:grid-cols-3">
                    <!-- Amount -->
                    <div class="space-y-2">
                        <Label
                            for="amount"
                            class="text-xs uppercase tracking-wider text-text-muted font-bold"
                            >Amount Received *</Label
                        >
                        <Input
                            type="number"
                            id="amount"
                            name="amount"
                            bind:value={amount}
                            step="0.01"
                            min="0.01"
                            required
                            class="h-11 border-border-strong text-text-strong bg-surface-0 font-mono text-base"
                        />
                    </div>

                    <!-- Payment Date -->
                    <div class="space-y-2">
                        <Label
                            for="payment_date"
                            class="text-xs uppercase tracking-wider text-text-muted font-bold"
                            >Payment Date *</Label
                        >
                        <Input
                            type="date"
                            id="payment_date"
                            name="payment_date"
                            value={data.defaults.payment_date}
                            required
                            class="h-11 border-border-strong bg-surface-0"
                        />
                    </div>

                    <!-- Payment Mode -->
                    <div class="space-y-2">
                        <Label
                            for="payment_mode"
                            class="text-xs uppercase tracking-wider text-text-muted font-bold"
                            >Payment Mode *</Label
                        >
                        <select
                            id="payment_mode"
                            name="payment_mode"
                            bind:value={paymentMode}
                            class="w-full h-11 rounded-md border border-border-strong bg-surface-0 px-3 py-2 text-sm"
                            required
                        >
                            <option value="bank">Bank Transfer</option>
                            <option value="upi">UPI</option>
                            <option value="cash">Cash</option>
                            <option value="cheque">Cheque</option>
                        </select>
                    </div>
                </div>

                <div class="grid gap-6 md:grid-cols-2">
                    <!-- Deposit To -->
                    <div class="space-y-2">
                        <Label
                            for="deposit_to"
                            class="text-xs uppercase tracking-wider text-text-muted font-bold"
                            >Deposit To *</Label
                        >
                        <select
                            id="deposit_to"
                            name="deposit_to"
                            bind:value={depositTo}
                            class="w-full h-11 rounded-md border border-border-strong bg-surface-0 px-3 py-2 text-sm"
                            required
                        >
                            {#each data.depositAccounts as account}
                                <option value={account.id}>
                                    {account.name}
                                </option>
                            {/each}
                        </select>
                    </div>

                    <!-- Reference -->
                    <div class="space-y-2">
                        <Label
                            for="reference"
                            class="text-xs uppercase tracking-wider text-text-muted font-bold"
                            >Reference (UTR / Cheque No.)</Label
                        >
                        <Input
                            type="text"
                            id="reference"
                            name="reference"
                            placeholder="Transaction reference number"
                            class="h-11 border-border-strong bg-surface-0"
                        />
                    </div>
                </div>

                <!-- Notes -->
                <div class="space-y-2">
                    <Label
                        for="notes"
                        class="text-xs uppercase tracking-wider text-text-muted font-bold"
                        >Notes</Label
                    >
                    <textarea
                        id="notes"
                        name="notes"
                        rows="2"
                        class="w-full rounded-md border border-border-strong bg-surface-0 px-3 py-2 text-sm resize-none focus:border-primary focus:outline-none"
                        placeholder="Internal notes..."
                    ></textarea>
                </div>
            </div>

            <!-- Invoice Allocation -->
            <div
                class="bg-surface-1 rounded-lg border border-border shadow-sm overflow-hidden"
            >
                <div
                    class="px-6 py-4 border-b border-border bg-surface-2/30 flex justify-between items-center"
                >
                    <h3
                        class="text-xs font-bold uppercase tracking-widest text-text-muted"
                    >
                        Allocate to Invoices
                    </h3>
                    {#if unpaidInvoices.length > 0 && amount > 0}
                        <Button
                            type="button"
                            variant="outline"
                            size="xs"
                            onclick={autoAllocate}
                            class="h-7 text-xs"
                        >
                            Auto-Allocate
                        </Button>
                    {/if}
                </div>

                <div class="p-6">
                    {#if !selectedCustomer}
                        <div class="text-center py-8 text-text-muted text-sm">
                            Select a customer to view outstanding invoices.
                        </div>
                    {:else if unpaidInvoices.length === 0}
                        <div class="text-center py-8 text-text-muted text-sm">
                            No unpaid invoices found for this customer.
                        </div>
                    {:else}
                        <div class="space-y-3">
                            {#each unpaidInvoices as invoice, idx}
                                <div
                                    class="flex items-center gap-4 p-4 rounded-md border border-border bg-surface-0"
                                >
                                    <div class="flex-1 min-w-0">
                                        <div class="flex items-center gap-2">
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
                                        <div
                                            class="text-xs text-destructive mt-1 font-medium"
                                        >
                                            {formatCurrency(
                                                invoice.balance_due,
                                            )} Due
                                        </div>
                                    </div>
                                    <div class="flex items-center gap-3">
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
                                                class="h-9 text-right font-mono bg-surface-1"
                                                placeholder="0.00"
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="xs"
                                            class="text-xs h-7 text-primary hover:text-primary/80"
                                            onclick={() => {
                                                allocations[invoice.id] =
                                                    invoice.balance_due;
                                            }}
                                        >
                                            Full
                                        </Button>
                                    </div>
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
                class="bg-primary text-primary-foreground font-semibold tracking-wide shadow-sm hover:bg-primary/90"
            >
                <Check class="mr-2 size-4" />
                {isSubmitting ? "Recording..." : "Record Payment"}
            </Button>
            <Button
                href="/payments"
                variant="ghost"
                type="button"
                class="text-text-muted hover:text-destructive"
            >
                Cancel
            </Button>
        </div>

        <div class="flex items-center gap-6 text-sm">
            <div class="flex flex-col items-end">
                <span
                    class="text-[10px] uppercase tracking-wider text-text-muted font-semibold"
                    >Payment Amount</span
                >
                <span class="font-mono text-lg font-bold text-text-strong"
                    >{formatCurrency(amount)}</span
                >
            </div>
            <div class="h-8 w-px bg-border-subtle"></div>
            <div class="flex flex-col items-end">
                <span
                    class="text-[10px] uppercase tracking-wider text-text-muted font-semibold"
                    >Allocated</span
                >
                <span class="font-mono font-medium text-text-strong"
                    >{formatCurrency(totalAllocated)}</span
                >
            </div>
            {#if hasExcess}
                <div class="h-8 w-px bg-border-subtle"></div>
                <div class="flex flex-col items-end text-amber-600">
                    <span
                        class="text-[10px] uppercase tracking-wider font-semibold"
                        >Excess (Advance)</span
                    >
                    <span class="font-mono font-bold"
                        >{formatCurrency(remainingAmount)}</span
                    >
                </div>
            {/if}
        </div>
    </div>
</div>
