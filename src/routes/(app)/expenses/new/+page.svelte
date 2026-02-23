<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import { ArrowLeft, Check, Plus } from "lucide-svelte";
    import PaymentOptionChips from "$lib/components/PaymentOptionChips.svelte";
    import { enhance, deserialize } from "$app/forms";
    import { toast } from "svelte-sonner";
    import { formatINR } from "$lib/utils/currency";
    import { formatDate } from "$lib/utils/date";

    let { data } = $props();
    const { selectedVendorId: initVendorId } = data;
    let isSubmitting = $state(false);

    // Form state
    let amount = $state(0);
    let gstRate = $state(0);
    let isInterState = $state(false);
    let paymentStatus = $state<"paid" | "unpaid">(
        data.defaultPaymentStatus === "unpaid" ? "unpaid" : "paid",
    );
    let selectedVendorId = $state(initVendorId || "");
    let vendorName = $state("");
    const defaultOption = data.paymentOptions.find((o: any) => o.isDefault) || data.paymentOptions[0];
    let selectedOptionKey = $state(
        defaultOption ? `${defaultOption.methodKey}::${defaultOption.accountId}` : "",
    );
    let paymentMode = $state(defaultOption?.methodKey || "");
    let paidThrough = $state(defaultOption?.accountId || "");
    let pendingBills = $state<any[]>([]);
    let pendingTotal = $state(0);
    let oldestPendingDate = $state<string | null>(null);

    function selectOption(option: any) {
        selectedOptionKey = `${option.methodKey}::${option.accountId}`;
        paymentMode = option.methodKey;
        paidThrough = option.accountId;
    }

    async function loadVendorPending(vendorId: string) {
        if (!vendorId) {
            pendingBills = [];
            pendingTotal = 0;
            oldestPendingDate = null;
            return;
        }

        try {
            const formData = new FormData();
            formData.append("vendor_id", vendorId);

            const res = await fetch("/expenses/new?/getVendorPending", {
                method: "POST",
                body: formData,
            });
            const text = await res.text();
            const result = deserialize(text);

            if (result.type === "success") {
                pendingBills = (result.data?.bills || []) as any[];
                pendingTotal = Number(result.data?.pendingTotal || 0);
                oldestPendingDate = (result.data?.oldestDate as string | null) || null;
                return;
            }

            if (result.type === "failure" && result.data?.error) {
                toast.error(result.data.error as string);
            }
        } catch {
            toast.error("Failed to load supplier pending bills");
        }
    }

    // When vendor is selected, update the display name
    const selectedVendor = $derived(
        data.vendors.find((v) => v.id === selectedVendorId),
    );

    // Auto-set inter-state based on vendor's state vs org state
    $effect(() => {
        if (selectedVendor) {
            vendorName = selectedVendor.display_name || selectedVendor.name;
        }
    });

    $effect(() => {
        if (selectedVendorId) {
            void loadVendorPending(selectedVendorId);
        } else {
            pendingBills = [];
            pendingTotal = 0;
            oldestPendingDate = null;
        }
    });

    // Computed GST
    let gstAmount = $derived((amount * gstRate) / 100);
    let cgst = $derived(isInterState ? 0 : gstAmount / 2);
    let sgst = $derived(isInterState ? 0 : gstAmount / 2);
    let igst = $derived(isInterState ? gstAmount : 0);
    let total = $derived(amount + gstAmount);
</script>

<div class="page-full-bleed">
    <!-- Header -->
    <header
        class="flex items-center gap-4 px-6 py-4 border-b border-border bg-surface-0 z-20"
    >
        <Button variant="ghost" href="/expenses" size="icon" class="h-8 w-8">
            <ArrowLeft class="size-4" />
        </Button>
        <div>
            <h1 class="text-xl font-bold tracking-tight text-text-strong">
                Record Expense
            </h1>
            <p class="text-sm text-text-subtle">Save a business expense</p>
        </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 overflow-hidden">
        <form
            id="expense-form"
            method="POST"
            action="?/save"
            use:enhance={() => {
                isSubmitting = true;
                return async ({ result, update }) => {
                    try {
                        if (result.type === "failure") {
                            if (result.data?.error) {
                                const message = result.data.error as string;
                                const traceId = (result.data as { traceId?: string }).traceId;
                                toast.error(
                                    traceId
                                        ? `${message} (Ref: ${traceId})`
                                        : message,
                                );
                            }
                            await update();
                            return;
                        }

                        if (result.type === "error") {
                            toast.error(result.error?.message || "Unable to save entry");
                            return;
                        }

                        await update();
                    } catch {
                        toast.error("Unable to save entry. Please try again.");
                    } finally {
                        isSubmitting = false;
                    }
                };
            }}
            class="h-full flex flex-col md:flex-row"
        >
            <!-- Idempotency key to prevent duplicate submissions -->
            <input
                type="hidden"
                name="idempotency_key"
                value={data.idempotencyKey}
            />

            <!-- LEFT COLUMN: Main Details -->
            <div
                class="flex-1 overflow-y-auto p-6 md:p-8 border-b md:border-b-0 md:border-r border-border bg-surface-1"
            >
                <div class="max-w-xl ml-auto mr-0 md:mr-8 space-y-6">
                    <!-- Date & Category Row -->
                    <div class="grid gap-4 grid-cols-2">
                        <div class="space-y-2">
                            <Label for="expense_date" variant="form"
                                >Date <span class="text-destructive">*</span
                                ></Label
                            >
                            <Input
                                type="date"
                                id="expense_date"
                                name="expense_date"
                                value={data.defaults.expense_date}
                                required
                            />
                        </div>

                        <div class="space-y-2">
                            <Label for="category" variant="form"
                                >Category <span class="text-destructive">*</span
                                ></Label
                            >
                            <select
                                id="category"
                                name="category"
                                class="w-full h-9 rounded-md border border-border-strong bg-surface-0 px-3 py-1.5 text-sm text-text-strong focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring/50"
                                required
                            >
                                <option value="">Select category...</option>
                                {#each data.expenseAccounts as account}
                                    <option value={account.id}>
                                        {account.code} - {account.name}
                                    </option>
                                {/each}
                            </select>
                        </div>
                    </div>

                    <!-- Supplier -->
                    <div class="space-y-2">
                        <div class="flex items-center justify-between">
                            <Label for="vendor_id" variant="form"
                                >Supplier</Label
                            >
                            <a
                                href="/vendors/new"
                                class="text-xs text-primary hover:underline flex items-center gap-1"
                            >
                                <Plus class="size-3" />
                                New Supplier
                            </a>
                        </div>
                        <select
                            id="vendor_id"
                            name="vendor_id"
                            bind:value={selectedVendorId}
                            class="w-full h-9 rounded-md border border-border-strong bg-surface-0 px-3 py-1.5 text-sm text-text-strong focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring/50"
                        >
                            <option value=""
                                >Select supplier or type below...</option
                            >
                            {#each data.vendors as vendor}
                                <option value={vendor.id}>
                                    {vendor.display_name || vendor.name}
                                    {#if vendor.gstin}
                                        (GST)
                                    {/if}
                                </option>
                            {/each}
                        </select>
                        {#if !selectedVendorId}
                            <Input
                                type="text"
                                id="vendor_name"
                                name="vendor_name"
                                bind:value={vendorName}
                                placeholder="Or type supplier name for quick entry"
                            />
                        {:else}
                            <input
                                type="hidden"
                                name="vendor_name"
                                value={vendorName}
                            />
                        {/if}
                    </div>

                    <!-- Description -->
                    <div class="space-y-2">
                        <Label for="description" variant="form"
                            >Description</Label
                        >
                        <textarea
                            id="description"
                            name="description"
                            rows="3"
                            class="w-full rounded-md border border-border-strong bg-surface-0 px-3 py-2 text-sm text-text-strong resize-none placeholder:text-text-placeholder focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring/50"
                            placeholder="What was this expense for?"
                        ></textarea>
                    </div>

                    <div class="space-y-2">
                        <Label for="payment_status" variant="form">Payment Timing</Label>
                        <select
                            id="payment_status"
                            bind:value={paymentStatus}
                            class="w-full h-9 rounded-md border border-border-strong bg-surface-0 px-3 py-1.5 text-sm text-text-strong focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring/50"
                        >
                            <option value="paid">Paid now</option>
                            <option value="unpaid">On Credit (pay supplier later)</option>
                        </select>
                        <input type="hidden" name="payment_status" value={paymentStatus} />
                    </div>

                    <div class="space-y-2">
                        <Label variant="form">
                            {paymentStatus === "paid" ? "Paid From" : "Credit Status"}
                            {#if paymentStatus === "paid"}
                                <span class="text-destructive">*</span>
                            {/if}
                        </Label>
                        <input
                            type="hidden"
                            name="payment_mode"
                            value={paymentStatus === "paid" ? paymentMode : ""}
                        />
                        <input
                            type="hidden"
                            name="paid_through"
                            value={paymentStatus === "paid" ? paidThrough : ""}
                        />
                        {#if paymentStatus === "paid"}
                            <PaymentOptionChips
                                options={data.paymentOptions}
                                selectedOptionKey={selectedOptionKey}
                                onSelect={selectOption}
                            />
                        {:else}
                            <div class="rounded-lg border border-border bg-surface-0 p-3 space-y-2">
                                <div>
                                    <p class="text-xs text-text-muted">Current Supplier Credit</p>
                                    <p class="font-mono text-sm font-semibold text-amber-600">
                                        {formatINR(pendingTotal)}
                                    </p>
                                    {#if oldestPendingDate}
                                        <p class="text-xs text-text-muted mt-0.5">
                                            Oldest bill: {formatDate(oldestPendingDate)}
                                        </p>
                                    {/if}
                                </div>

                                {#if pendingBills.length > 0}
                                    <div class="rounded border border-border bg-surface-1 p-2">
                                        <p class="text-xs text-text-muted mb-1">Recent credit bills</p>
                                        <div class="space-y-1.5">
                                            {#each pendingBills.slice(0, 3) as bill}
                                                <div class="flex items-center justify-between text-xs">
                                                    <span class="font-mono text-text-strong">
                                                        {bill.expense_number}
                                                    </span>
                                                    <span class="font-mono text-amber-600">
                                                        {formatINR(bill.balance_due)}
                                                    </span>
                                                </div>
                                            {/each}
                                        </div>
                                    </div>
                                {/if}
                            </div>
                        {/if}
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
                            placeholder="Ref Number"
                        />
                    </div>
                </div>
            </div>

            <!-- RIGHT COLUMN: Financials -->
            <div
                class="w-full md:w-96 bg-surface-0 p-6 md:p-8 overflow-y-auto"
            >
                <div class="space-y-6">
                    <h3
                        class="text-sm font-bold uppercase tracking-wide text-text-subtle"
                    >
                        Financials
                    </h3>

                    <!-- Amount -->
                    <div class="space-y-2">
                        <Label for="amount" variant="form"
                            >Amount (before GST) <span class="text-destructive"
                                >*</span
                            ></Label
                        >
                        <Input
                            type="number"
                            id="amount"
                            name="amount"
                            bind:value={amount}
                            step="0.01"
                            min="0.01"
                            required
                            class="h-12 text-text-strong bg-surface-1 text-xl font-bold font-mono text-right"
                        />
                    </div>

                    <!-- GST Settings -->
                    <div
                        class="p-4 rounded-lg bg-surface-1 border border-border space-y-4"
                    >
                        <div class="space-y-2">
                            <Label for="gst_rate" variant="form"
                                >GST Rate</Label
                            >
                            <select
                                id="gst_rate"
                                name="gst_rate"
                                bind:value={gstRate}
                                class="w-full h-9 rounded-md border border-border-strong bg-surface-0 px-3 py-1.5 text-sm text-text-strong focus:border-primary focus:outline-none"
                            >
                                <option value={0}>0% (No Tax)</option>
                                <option value={5}>5%</option>
                                <option value={12}>12%</option>
                                <option value={18}>18%</option>
                                <option value={28}>28%</option>
                            </select>
                        </div>

                        {#if gstRate > 0}
                            <div class="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="is_inter_state"
                                    name="is_inter_state"
                                    bind:checked={isInterState}
                                    class="h-4 w-4 rounded border-border-strong text-primary"
                                />
                                <Label
                                    for="is_inter_state"
                                    class="font-normal text-sm text-text-strong cursor-pointer"
                                >
                                    Inter-state (IGST)
                                </Label>
                            </div>
                        {/if}
                    </div>

                    <!-- Summary Table -->
                    <div
                        class="space-y-3 pt-4 border-t border-dashed border-border"
                    >
                        <div class="flex justify-between text-sm">
                            <span class="text-text-subtle">Subtotal</span>
                            <span class="font-mono text-text-strong"
                                >{formatINR(amount)}</span
                            >
                        </div>
                        {#if gstRate > 0}
                            <div class="flex justify-between text-sm">
                                <span class="text-text-subtle"
                                    >Tax Amount ({gstRate}%)</span
                                >
                                <span class="font-mono text-text-strong"
                                    >{formatINR(gstAmount)}</span
                                >
                            </div>
                        {/if}
                        <div
                            class="flex justify-between items-baseline pt-3 border-t border-border"
                        >
                            <span class="font-semibold text-text-strong"
                                >{paymentStatus === "paid"
                                    ? "Total Paid"
                                    : "Credit for this bill"}</span
                            >
                            <span
                                class="font-mono text-2xl font-bold text-primary"
                                >{formatINR(total)}</span
                            >
                        </div>
                    </div>
                </div>
            </div>
        </form>
    </main>

    <!-- Bottom Action Bar -->
    <div class="action-bar">
        <div class="action-bar-group">
            <Button
                type="submit"
                form="expense-form"
                disabled={isSubmitting || amount <= 0}
            >
                <Check class="mr-2 size-4" />
                {isSubmitting ? "Saving..." : "Save Entry"}
            </Button>
            <Button variant="ghost" href="/expenses">Cancel</Button>
        </div>
    </div>
</div>
