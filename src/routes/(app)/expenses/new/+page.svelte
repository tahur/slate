<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import { ArrowLeft, Check, Plus } from "lucide-svelte";
    import { enhance } from "$app/forms";
    import { addToast } from "$lib/stores/toast";

    let { data, form } = $props();
    let isSubmitting = $state(false);

    // Form state
    let amount = $state(0);
    let gstRate = $state(0);
    let isInterState = $state(false);
    let selectedVendorId = $state(data.selectedVendorId || "");
    let vendorName = $state("");

    // When vendor is selected, update the display name
    const selectedVendor = $derived(
        data.vendors.find(v => v.id === selectedVendorId)
    );

    // Auto-set inter-state based on vendor's state vs org state
    $effect(() => {
        if (selectedVendor) {
            vendorName = selectedVendor.display_name || selectedVendor.name;
        }
    });

    // Computed GST
    let gstAmount = $derived((amount * gstRate) / 100);
    let cgst = $derived(isInterState ? 0 : gstAmount / 2);
    let sgst = $derived(isInterState ? 0 : gstAmount / 2);
    let igst = $derived(isInterState ? gstAmount : 0);
    let total = $derived(amount + gstAmount);

    function formatCurrency(amt: number): string {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 2,
        }).format(amt);
    }
</script>

<div class="page-full-bleed">
    <!-- Header -->
    <header class="flex items-center gap-4 px-6 py-4 border-b border-border bg-surface-0 z-20">
        <Button
            variant="ghost"
            href="/expenses"
            size="icon"
            class="h-8 w-8"
        >
            <ArrowLeft class="size-4" />
        </Button>
        <div>
            <h1 class="text-xl font-bold tracking-tight text-text-strong">Add Expense</h1>
            <p class="text-sm text-text-secondary">Record a business expense</p>
        </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 overflow-hidden">
        <form
            id="expense-form"
            method="POST"
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
            class="h-full flex flex-col md:flex-row"
        >
            <!-- Idempotency key to prevent duplicate submissions -->
            <input type="hidden" name="idempotency_key" value={data.idempotencyKey} />

            <!-- LEFT COLUMN: Main Details -->
            <div class="flex-1 overflow-y-auto p-6 md:p-8 border-b md:border-b-0 md:border-r border-border bg-surface-1">
                <div class="max-w-xl ml-auto mr-0 md:mr-8 space-y-6">
                    <!-- Date & Category Row -->
                    <div class="grid gap-4 grid-cols-2">
                        <div class="space-y-2">
                            <Label for="expense_date" class="form-label">Date <span class="text-destructive">*</span></Label>
                            <Input
                                type="date"
                                id="expense_date"
                                name="expense_date"
                                value={data.defaults.expense_date}
                                required
                            />
                        </div>

                        <div class="space-y-2">
                            <Label for="category" class="form-label">Category <span class="text-destructive">*</span></Label>
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

                    <!-- Vendor -->
                    <div class="space-y-2">
                        <div class="flex items-center justify-between">
                            <Label for="vendor_id" class="form-label">Vendor</Label>
                            <a href="/vendors/new" class="text-xs text-primary hover:underline flex items-center gap-1">
                                <Plus class="size-3" />
                                New Vendor
                            </a>
                        </div>
                        <select
                            id="vendor_id"
                            name="vendor_id"
                            bind:value={selectedVendorId}
                            class="w-full h-9 rounded-md border border-border-strong bg-surface-0 px-3 py-1.5 text-sm text-text-strong focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring/50"
                        >
                            <option value="">Select vendor or type below...</option>
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
                                placeholder="Or type vendor name for quick entry"
                            />
                        {:else}
                            <input type="hidden" name="vendor_name" value={vendorName} />
                        {/if}
                    </div>

                    <!-- Description -->
                    <div class="space-y-2">
                        <Label for="description" class="form-label">Description</Label>
                        <textarea
                            id="description"
                            name="description"
                            rows="3"
                            class="w-full rounded-md border border-border-strong bg-surface-0 px-3 py-2 text-sm text-text-strong resize-none placeholder:text-text-placeholder focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring/50"
                            placeholder="What was this expense for?"
                        ></textarea>
                    </div>

                    <div class="grid gap-4 grid-cols-2">
                        <!-- Paid Through -->
                        <div class="space-y-2">
                            <Label for="paid_through" class="form-label">Paid Through <span class="text-destructive">*</span></Label>
                            <select
                                id="paid_through"
                                name="paid_through"
                                class="w-full h-9 rounded-md border border-border-strong bg-surface-0 px-3 py-1.5 text-sm text-text-strong focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring/50"
                                required
                            >
                                {#each data.paymentAccounts as account}
                                    <option value={account.id}>{account.name}</option>
                                {/each}
                            </select>
                        </div>

                        <!-- Reference -->
                        <div class="space-y-2">
                            <Label for="reference" class="form-label">Reference</Label>
                            <Input
                                type="text"
                                id="reference"
                                name="reference"
                                placeholder="Ref Number"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <!-- RIGHT COLUMN: Financials -->
            <div class="w-full md:w-[380px] bg-surface-0 p-6 md:p-8 overflow-y-auto">
                <div class="space-y-6">
                    <h3 class="text-sm font-bold uppercase tracking-wide text-text-secondary">
                        Financials
                    </h3>

                    <!-- Amount -->
                    <div class="space-y-2">
                        <Label for="amount" class="form-label">Amount (excl. Tax) <span class="text-destructive">*</span></Label>
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
                    <div class="p-4 rounded-lg bg-surface-1 border border-border space-y-4">
                        <div class="space-y-2">
                            <Label for="gst_rate" class="form-label">Tax Rate</Label>
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
                                <Label for="is_inter_state" class="font-normal text-sm text-text-strong cursor-pointer">
                                    Inter-state (IGST)
                                </Label>
                            </div>
                        {/if}
                    </div>

                    <!-- Summary Table -->
                    <div class="space-y-3 pt-4 border-t border-dashed border-border">
                        <div class="flex justify-between text-sm">
                            <span class="text-text-secondary">Subtotal</span>
                            <span class="font-mono text-text-strong">{formatCurrency(amount)}</span>
                        </div>
                        {#if gstRate > 0}
                            <div class="flex justify-between text-sm">
                                <span class="text-text-secondary">Tax Amount ({gstRate}%)</span>
                                <span class="font-mono text-text-strong">{formatCurrency(gstAmount)}</span>
                            </div>
                        {/if}
                        <div class="flex justify-between items-baseline pt-3 border-t border-border">
                            <span class="font-semibold text-text-strong">Total Payable</span>
                            <span class="font-mono text-2xl font-bold text-primary">{formatCurrency(total)}</span>
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
                {isSubmitting ? "Saving..." : "Save Expense"}
            </Button>
            <Button variant="ghost" href="/expenses">
                Cancel
            </Button>
        </div>
    </div>
</div>
