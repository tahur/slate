<script lang="ts">
    import { Button } from "$lib/components/ui/button";
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

    let { data } = $props();
    const {
        selectedVendor: initVendor,
        paymentOptions,
        openBills: initOpenBills,
        availableCredit: initAvailableCredit,
    } = data;

    let isSubmitting = $state(false);

    let selectedVendor = $state(initVendor);
    const NO_SUPPLIER = "__no_supplier";
    let amount = $state(0);
    const defaultOption = paymentOptions.find((o: any) => o.isDefault) || paymentOptions[0];
    let selectedOptionKey = $state(
        defaultOption ? `${defaultOption.methodKey}::${defaultOption.accountId}` : "",
    );
    let paymentMode = $state(defaultOption?.methodKey || "");
    let paidFrom = $state(defaultOption?.accountId || "");

    function selectOption(option: {
        methodKey: string;
        accountId: string;
        displayLabel: string;
        isDefault?: boolean;
    }) {
        selectedOptionKey = `${option.methodKey}::${option.accountId}`;
        paymentMode = option.methodKey;
        paidFrom = option.accountId;
    }

    let openBills = $state(initOpenBills || []);
    let availableCredit = $state<number>(initAvailableCredit || 0);
    let allocations = $state<Record<string, number>>({});
    let lastLoadedVendor = $state("");

    const totalAdjusted = $derived(
        Object.values(allocations).reduce((sum, val) => sum + (val || 0), 0),
    );
    const remainingAmount = $derived(amount - totalAdjusted);
    const asSupplierCredit = $derived(remainingAmount > 0.01 ? remainingAmount : 0);
    const pendingTotal = $derived(
        openBills.reduce((sum: number, bill: any) => sum + (bill.balance_due || 0), 0),
    );

    $effect(() => {
        if (!selectedVendor) {
            openBills = [];
            allocations = {};
            availableCredit = 0;
            lastLoadedVendor = "";
            return;
        }

        if (selectedVendor === lastLoadedVendor) {
            return;
        }

        lastLoadedVendor = selectedVendor;
        void loadBills(selectedVendor);
    });

    async function loadBills(vendorId: string) {
        if (!vendorId) {
            openBills = [];
            allocations = {};
            availableCredit = 0;
            return;
        }

        try {
            const formData = new FormData();
            formData.append("vendor_id", vendorId);

            const res = await fetch("/vendor-payments/new?/getBills", {
                method: "POST",
                body: formData,
            });
            const text = await res.text();
            const result = deserialize(text);

            if (result.type === "success") {
                openBills = (result.data?.bills || []) as typeof openBills;
                availableCredit = Number(result.data?.availableCredit || 0);
                allocations = {};
            } else if (result.type === "failure" && result.data?.error) {
                toast.error(result.data.error as string);
            }
        } catch {
            toast.error("Failed to load supplier bills");
        }
    }

    function autoAdjust() {
        let remaining = amount;
        const next: Record<string, number> = {};

        for (const bill of openBills) {
            if (remaining <= 0) break;
            const alloc = Math.min(remaining, bill.balance_due);
            if (alloc > 0) {
                next[bill.id] = alloc;
                remaining -= alloc;
            }
        }

        allocations = next;
    }

    function getSupplierLabel(supplier: {
        display_name?: string | null;
        name: string;
        company_name?: string | null;
    }) {
        let label = supplier.display_name || supplier.name;
        if (supplier.company_name) label += ` (${supplier.company_name})`;
        return label;
    }

    function getSelectedSupplierLabel() {
        if (!selectedVendor) return "Select supplier...";
        const supplier = data.suppliers.find(
            (item) => item.id === selectedVendor,
        );
        return supplier ? getSupplierLabel(supplier) : "Select supplier...";
    }
</script>

<div class="page-full-bleed">
    <header class="page-header items-center">
        <div class="flex items-center gap-4">
            <Button variant="ghost" href="/vendor-payments" size="icon" class="h-8 w-8">
                <ArrowLeft class="size-4" />
            </Button>
            <div>
                <h1 class="text-xl font-bold tracking-tight text-text-strong">
                    Settle Supplier
                </h1>
                <p class="text-sm text-text-muted">
                    Settle pending bills and save any extra as supplier credit
                </p>
            </div>
        </div>
    </header>

    <form
        id="supplier-payment-form"
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
                    toast.error(traceId ? `${message} (Ref: ${traceId})` : message);
                }
            };
        }}
        class="flex-1 flex min-h-0 flex-col"
    >
        <input
            type="hidden"
            name="idempotency_key"
            value={data.idempotencyKey}
        />

        <main class="flex-1 overflow-hidden">
            <div class="content-width-standard h-full">
            <div class="h-full flex flex-col md:flex-row">
                <div
                    class="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 border-b md:border-b-0 md:border-r border-border bg-surface-1"
                >
                    <div class="max-w-2xl mx-auto space-y-6">
                        <div class="space-y-2">
                            <Label for="vendor_id" variant="form">
                                Supplier <span class="text-destructive">*</span>
                            </Label>
                            <Select.Root
                                type="single"
                                value={selectedVendor || NO_SUPPLIER}
                                onValueChange={(value) =>
                                    (selectedVendor =
                                        value === NO_SUPPLIER ? "" : value)}
                            >
                                <Select.Trigger id="vendor_id" class="w-full">
                                    {getSelectedSupplierLabel()}
                                </Select.Trigger>
                                <Select.Content>
                                    <Select.Item value={NO_SUPPLIER}>
                                        Select supplier...
                                    </Select.Item>
                                    {#each data.suppliers as supplier}
                                        <Select.Item value={supplier.id}>
                                            {getSupplierLabel(supplier)}
                                        </Select.Item>
                                    {/each}
                                </Select.Content>
                            </Select.Root>
                            <input
                                type="hidden"
                                name="vendor_id"
                                value={selectedVendor}
                            />
                        </div>

                        <div class="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2">
                            <div class="space-y-2">
                                <Label for="amount" variant="form">
                                    Amount <span class="text-destructive">*</span>
                                </Label>
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

                            <div class="space-y-2">
                                <Label for="payment_date" variant="form">
                                    Payment Date <span class="text-destructive">*</span>
                                </Label>
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

                        <div class="space-y-2">
                            <Label variant="form">
                                Paid From <span class="text-destructive">*</span>
                            </Label>
                            <input type="hidden" name="payment_mode" value={paymentMode} />
                            <input type="hidden" name="paid_from" value={paidFrom} />
                            <PaymentOptionChips
                                options={paymentOptions}
                                selectedOptionKey={selectedOptionKey}
                                onSelect={selectOption}
                            />
                        </div>

                        <div class="space-y-2">
                            <Label for="reference" variant="form">Reference</Label>
                            <Input
                                type="text"
                                id="reference"
                                name="reference"
                                placeholder="UTR / Cheque no."
                                class="border-border-strong bg-surface-0"
                            />
                        </div>

                        <div class="space-y-2">
                            <Label for="notes" variant="form">Notes</Label>
                            <Textarea
                                id="notes"
                                name="notes"
                                rows={3}
                                class="min-h-[84px] resize-none"
                                placeholder="Optional note..."
                            />
                        </div>
                    </div>
                </div>

                <div class="w-full md:w-96 bg-surface-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                    <div class="space-y-6">
                        <div class="flex items-center justify-between">
                            <h3 class="text-sm font-bold uppercase tracking-wide text-text-subtle">
                                Pending Bills
                            </h3>
                            {#if openBills.length > 0 && amount > 0}
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onclick={autoAdjust}
                                >
                                    Auto Adjust
                                </Button>
                            {/if}
                        </div>

                        {#if selectedVendor && availableCredit > 0}
                            <div class="rounded-lg border border-blue-200 bg-blue-50 p-3">
                                <p class="text-xs text-blue-700 font-medium">
                                    Available Supplier Credit
                                </p>
                                <p class="mt-1 text-lg font-bold font-mono text-blue-700">
                                    {formatINR(availableCredit)}
                                </p>
                            </div>
                        {/if}

                        {#if !selectedVendor}
                            <div
                                class="flex flex-col items-center justify-center h-40 border-2 border-dashed border-border rounded-lg text-text-muted text-sm text-center p-4"
                            >
                                <Search class="size-8 mb-2 opacity-50" />
                                Select a supplier to view pending bills
                            </div>
                        {:else if openBills.length === 0}
                            <div
                                class="flex flex-col items-center justify-center h-40 border-2 border-dashed border-border rounded-lg text-text-muted text-sm text-center p-4"
                            >
                                <Check class="size-8 mb-2 opacity-50 text-green-500" />
                                No pending bills. Extra payment will be saved as supplier credit.
                            </div>
                        {:else}
                            <div class="space-y-3">
                                {#each openBills as bill, idx}
                                    <div
                                        class="group relative flex items-start gap-3 p-4 rounded-lg border border-border bg-surface-0 shadow-sm transition-all hover:shadow-md hover:border-primary/50"
                                    >
                                        <div class="flex-1 min-w-0">
                                            <div class="flex items-center justify-between mb-1">
                                                <span class="font-bold text-text-strong font-mono">
                                                    {bill.expense_number}
                                                </span>
                                                <span class="text-xs text-text-muted">
                                                    {formatDate(bill.expense_date)}
                                                </span>
                                            </div>
                                            <div class="flex items-baseline gap-2">
                                                <span class="text-xs text-text-muted">Pending:</span>
                                                <span class="text-sm font-medium text-destructive">
                                                    {formatINR(bill.balance_due)}
                                                </span>
                                            </div>
                                        </div>

                                        <div class="flex items-center gap-2">
                                            <input
                                                type="hidden"
                                                name="allocations[{idx}].expense_id"
                                                value={bill.id}
                                            />
                                            <div class="w-32">
                                                <Input
                                                    type="number"
                                                    name="allocations[{idx}].amount"
                                                    bind:value={allocations[bill.id]}
                                                    step="0.01"
                                                    min="0"
                                                    max={bill.balance_due}
                                                    class="h-9 text-right font-mono bg-surface-1 border-transparent focus:bg-surface-0 transition-colors"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                {/each}
                            </div>
                        {/if}

                        <div class="space-y-2 pt-4 border-t border-border">
                            <div class="flex justify-between text-sm">
                                <span class="text-text-subtle">Pending Total</span>
                                <span class="font-mono text-text-strong">
                                    {formatINR(pendingTotal)}
                                </span>
                            </div>
                            <div class="flex justify-between text-sm">
                                <span class="text-text-subtle">Adjusted to Bills</span>
                                <span class="font-mono text-text-strong">
                                    {formatINR(totalAdjusted)}
                                </span>
                            </div>
                            <div class="flex justify-between text-sm">
                                <span class="text-text-subtle">As Supplier Credit</span>
                                <span class="font-mono text-blue-700">
                                    {formatINR(asSupplierCredit)}
                                </span>
                            </div>
                            <div
                                class="flex justify-between items-baseline pt-3 border-t border-border"
                            >
                                <span class="font-semibold text-text-strong">Payment Total</span>
                                <span class="font-mono text-2xl font-bold text-primary">
                                    {formatINR(amount)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            </div>
        </main>

        <div class="action-bar">
            <div class="action-bar-group">
                <Button type="button" variant="ghost" href="/vendor-payments">
                    Cancel
                </Button>
                <Button
                    type="submit"
                    disabled={isSubmitting || !selectedVendor || amount <= 0}
                >
                    {isSubmitting ? "Saving..." : "Settle"}
                </Button>
            </div>
        </div>
    </form>
</div>
