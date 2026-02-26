<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { Card } from "$lib/components/ui/card";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import * as Select from "$lib/components/ui/select";
    import { Textarea } from "$lib/components/ui/textarea";
    import { ArrowLeft, Check, Search } from "lucide-svelte";
    import PaymentOptionChips from "$lib/components/PaymentOptionChips.svelte";
    import { enhance, deserialize } from "$app/forms";
    import { toast } from "svelte-sonner";
    import { formatINR } from "$lib/utils/currency";
    import { formatDate } from "$lib/utils/date";

    let { data, form } = $props();
    const { selectedCustomer: initCustomer, paymentOptions, unpaidInvoices: initUnpaid } = data;
    let isSubmitting = $state(false);

    // Form state
    let selectedCustomer = $state(initCustomer);
    const NO_CUSTOMER = "__no_customer";
    let amount = $state(0);
    const defaultOption = paymentOptions.find((o) => o.isDefault) || paymentOptions[0];
    let selectedOptionKey = $state(
        defaultOption ? `${defaultOption.methodKey}::${defaultOption.accountId}` : "",
    );
    let paymentMode = $state(defaultOption?.methodKey || "");
    let depositTo = $state(defaultOption?.accountId || "");

    function selectOption(option: { methodKey: string; accountId: string; displayLabel: string; isDefault?: boolean }) {
        selectedOptionKey = `${option.methodKey}::${option.accountId}`;
        paymentMode = option.methodKey;
        depositTo = option.accountId;
    }

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

    function getCustomerLabel(customer: {
        name: string;
        company_name?: string | null;
        balance?: number | null;
    }) {
        let label = customer.name;
        if (customer.company_name) label += ` (${customer.company_name})`;
        if (customer.balance && customer.balance > 0) {
            label += ` — Pending: ${formatINR(customer.balance)}`;
        }
        return label;
    }

    function getSelectedCustomerLabel() {
        if (!selectedCustomer) return "Select customer / party...";
        const customer = data.customers.find(
            (customer) => customer.id === selectedCustomer,
        );
        return customer ? getCustomerLabel(customer) : "Select customer / party...";
    }
</script>

<div class="page-full-bleed">
    <!-- Header -->
    <header class="page-header items-center">
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
                    Receive Payment
                </h1>
            </div>
        </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 overflow-hidden">
        <div class="content-width-standard h-full">
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
                        const message = result.data.error as string;
                        const traceId = (result.data as { traceId?: string }).traceId;
                        toast.error(
                            traceId
                                ? `${message} (Ref: ${traceId})`
                                : message,
                        );
                    }
                };
            }}
            class="h-full flex flex-col md:flex-row"
        >
            <!-- LEFT COLUMN: Payment Details -->
            <div
                class="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 border-b md:border-b-0 md:border-r border-border bg-surface-1"
            >
                <div class="max-w-2xl mx-auto space-y-6">
                    <!-- Customer Selection -->
                    <div class="space-y-2">
                        <Label for="customer_id" variant="form"
                            >Customer <span class="text-destructive">*</span></Label
                        >
                        <Select.Root
                            type="single"
                            value={selectedCustomer || NO_CUSTOMER}
                            onValueChange={(value) => {
                                selectedCustomer =
                                    value === NO_CUSTOMER ? "" : value;
                                void loadInvoices(selectedCustomer);
                            }}
                        >
                            <Select.Trigger id="customer_id" class="w-full">
                                {getSelectedCustomerLabel()}
                            </Select.Trigger>
                            <Select.Content>
                                <Select.Item value={NO_CUSTOMER}>
                                    Select customer / party...
                                </Select.Item>
                                {#each data.customers as customer}
                                    <Select.Item value={customer.id}>
                                        {getCustomerLabel(customer)}
                                    </Select.Item>
                                {/each}
                            </Select.Content>
                        </Select.Root>
                        <input
                            type="hidden"
                            name="customer_id"
                            value={selectedCustomer}
                        />
                    </div>

                    <div class="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2">
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
                                >Receipt Date <span class="text-destructive">*</span></Label
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

                    <!-- Payment Mode + Account Combined Chips -->
                    <div class="space-y-2">
                        <Label variant="form">Received In <span class="text-destructive">*</span></Label>
                        <input type="hidden" name="payment_mode" value={paymentMode} />
                        <input type="hidden" name="deposit_to" value={depositTo} />
                        <PaymentOptionChips
                            options={paymentOptions}
                            selectedOptionKey={selectedOptionKey}
                            onSelect={selectOption}
                        />
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
                        <Textarea
                            id="notes"
                            name="notes"
                            rows={3}
                            class="min-h-[84px] resize-none"
                            placeholder="Internal notes..."
                        />
                    </div>
                </div>
            </div>

            <!-- RIGHT COLUMN: Invoice Allocation -->
            <div class="w-full md:w-96 bg-surface-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                <div class="space-y-6">
                    <div class="flex items-center justify-between">
                        <h3
                            class="text-sm font-bold uppercase tracking-wide text-text-subtle"
                        >
                            Pending Bills
                        </h3>
                        {#if unpaidInvoices.length > 0 && amount > 0}
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onclick={autoAllocate}
                            >
                                Auto Adjust
                            </Button>
                        {/if}
                    </div>

                    {#if !selectedCustomer}
                        <div
                            class="flex flex-col items-center justify-center h-40 border-2 border-dashed border-border rounded-lg text-text-muted text-sm text-center p-4"
                        >
                            <Search class="size-8 mb-2 opacity-50" />
                            Select a customer to view pending bills
                        </div>
                    {:else if unpaidInvoices.length === 0}
                        <div
                            class="flex flex-col items-center justify-center h-40 border-2 border-dashed border-border rounded-lg text-text-muted text-sm text-center p-4"
                        >
                            <Check
                                class="size-8 mb-2 opacity-50 text-green-500"
                            />
                            All clear. No pending bills.
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
                                                >Pending:</span
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
                                        title="Use Full Amount"
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
        </div>
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
                {isSubmitting ? "Saving..." : "Save Receipt"}
            </Button>
            <Button
                href="/payments"
                variant="ghost"
                type="button"
            >
                Cancel
            </Button>
        </div>

        <div class="flex items-center gap-8 text-sm">
            <div class="flex flex-col items-end">
                <span
                    class="text-[10px] uppercase tracking-wide text-text-muted font-semibold"
                    >Amount Received</span
                >
                <span class="font-mono text-xl font-bold text-text-strong"
                    >{formatINR(amount)}</span
                >
            </div>

            <div class="flex flex-col items-end">
                <span
                    class="text-[10px] uppercase tracking-wide text-text-muted font-semibold"
                    >Adjusted to Bills</span
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
                        >Advance Received</span
                    >
                    <span class="font-mono font-bold">{formatINR(amount)}</span>
                    <span class="text-[10px] text-text-muted">
                        No bill selected. Saved as advance.
                    </span>
                </div>
            {:else if hasExcess}
                <div class="flex flex-col items-end text-amber-600">
                    <span
                        class="text-[10px] uppercase tracking-wide font-semibold"
                        >Advance Balance</span
                    >
                    <span class="font-mono font-bold"
                        >{formatINR(remainingAmount)}</span
                    >
                    <span class="text-[10px] text-text-muted">
                        This will be used in future bills
                    </span>
                </div>
            {/if}
        </div>
    </div>
</div>
