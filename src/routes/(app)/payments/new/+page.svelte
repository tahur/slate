<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { Card } from "$lib/components/ui/card";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import { ArrowLeft, DollarSign, Check } from "lucide-svelte";
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
                // Also handle direct data response
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

<div class="max-w-4xl mx-auto space-y-4">
    <!-- Header -->
    <div class="flex items-center gap-4">
        <Button variant="ghost" href="/payments" class="p-2">
            <ArrowLeft class="size-4" />
        </Button>
        <div>
            <h1 class="text-xl font-semibold">Record Payment</h1>
            <p class="text-sm text-muted-foreground">
                Record customer payment and allocate to invoices
            </p>
        </div>
    </div>

    {#if form?.error}
        <div class="p-3 rounded-md bg-red-50 text-red-700 text-sm">
            {form.error}
        </div>
    {/if}

    <form
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
        class="grid gap-6 lg:grid-cols-3"
    >
        <!-- Main Form -->
        <Card class="p-6 lg:col-span-2 space-y-6">
            <!-- Customer Selection -->
            <div class="space-y-2">
                <Label for="customer_id">Customer *</Label>
                <select
                    id="customer_id"
                    name="customer_id"
                    bind:value={selectedCustomer}
                    onchange={(e) => loadInvoices(e.currentTarget.value)}
                    class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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

            <div class="grid gap-4 md:grid-cols-2">
                <!-- Amount -->
                <div class="space-y-2">
                    <Label for="amount">Amount *</Label>
                    <Input
                        type="number"
                        id="amount"
                        name="amount"
                        bind:value={amount}
                        step="0.01"
                        min="0.01"
                        required
                        class="font-mono"
                    />
                </div>

                <!-- Payment Date -->
                <div class="space-y-2">
                    <Label for="payment_date">Payment Date *</Label>
                    <Input
                        type="date"
                        id="payment_date"
                        name="payment_date"
                        value={data.defaults.payment_date}
                        required
                    />
                </div>
            </div>

            <div class="grid gap-4 md:grid-cols-2">
                <!-- Payment Mode -->
                <div class="space-y-2">
                    <Label for="payment_mode">Payment Mode *</Label>
                    <select
                        id="payment_mode"
                        name="payment_mode"
                        bind:value={paymentMode}
                        class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
                    <Label for="deposit_to">Deposit To *</Label>
                    <select
                        id="deposit_to"
                        name="deposit_to"
                        bind:value={depositTo}
                        class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
                <Label for="reference">Reference (UTR / Cheque No.)</Label>
                <Input
                    type="text"
                    id="reference"
                    name="reference"
                    placeholder="Transaction reference number"
                />
            </div>

            <!-- Notes -->
            <div class="space-y-2">
                <Label for="notes">Notes</Label>
                <textarea
                    id="notes"
                    name="notes"
                    rows="2"
                    class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
                    placeholder="Optional notes..."
                ></textarea>
            </div>
        </Card>

        <!-- Invoice Allocation -->
        <div class="space-y-4">
            <Card class="p-6">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="font-medium">Allocate to Invoices</h3>
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
                    <p class="text-sm text-muted-foreground">
                        Select a customer to see unpaid invoices
                    </p>
                {:else if unpaidInvoices.length === 0}
                    <p class="text-sm text-muted-foreground">
                        No unpaid invoices for this customer
                    </p>
                {:else}
                    <div class="space-y-3">
                        {#each unpaidInvoices as invoice, idx}
                            <div class="p-3 rounded border bg-muted/30">
                                <div
                                    class="flex items-center justify-between mb-2"
                                >
                                    <div>
                                        <span class="font-mono text-sm">
                                            {invoice.invoice_number}
                                        </span>
                                        <span
                                            class="text-xs text-muted-foreground ml-2"
                                        >
                                            {formatDate(invoice.invoice_date)}
                                        </span>
                                    </div>
                                    <span
                                        class="text-sm font-mono text-red-600"
                                    >
                                        {formatCurrency(invoice.balance_due)} due
                                    </span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <input
                                        type="hidden"
                                        name="allocations[{idx}].invoice_id"
                                        value={invoice.id}
                                    />
                                    <Input
                                        type="number"
                                        name="allocations[{idx}].amount"
                                        bind:value={allocations[invoice.id]}
                                        step="0.01"
                                        min="0"
                                        max={invoice.balance_due}
                                        class="font-mono text-sm"
                                        placeholder="0.00"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
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
            </Card>

            <!-- Summary Card -->
            <Card class="p-6">
                <h3 class="font-medium mb-4">Summary</h3>
                <div class="space-y-2 text-sm">
                    <div class="flex justify-between">
                        <span class="text-muted-foreground">Payment Amount</span
                        >
                        <span class="font-mono">{formatCurrency(amount)}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-muted-foreground">Allocated</span>
                        <span class="font-mono"
                            >{formatCurrency(totalAllocated)}</span
                        >
                    </div>
                    {#if hasExcess}
                        <div class="flex justify-between text-amber-600">
                            <span>Excess (Advance)</span>
                            <span class="font-mono"
                                >{formatCurrency(remainingAmount)}</span
                            >
                        </div>
                        <p class="text-xs text-muted-foreground mt-2">
                            Excess amount will be recorded as customer advance
                        </p>
                    {/if}
                </div>
            </Card>

            <Button
                type="submit"
                class="w-full"
                disabled={isSubmitting || !selectedCustomer || amount <= 0}
            >
                <Check class="mr-2 size-4" />
                {isSubmitting ? "Recording..." : "Record Payment"}
            </Button>
        </div>
    </form>
</div>
