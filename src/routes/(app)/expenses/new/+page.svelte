<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { Card } from "$lib/components/ui/card";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import { ArrowLeft, Check, Save, Plus } from "lucide-svelte";
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

<div class="flex flex-col h-[calc(100vh-3.5rem)] -mx-4 md:-mx-5 -my-4 md:-my-5">
    <!-- Header -->
    <header
        class="flex items-center justify-between gap-4 px-6 py-4 border-b border-border bg-surface-0 z-20"
    >
        <div class="flex items-center gap-4">
            <Button
                variant="ghost"
                href="/expenses"
                size="icon"
                class="h-8 w-8 text-text-muted hover:text-text-strong"
            >
                <ArrowLeft class="size-4" />
            </Button>
            <div>
                <h1 class="text-xl font-bold tracking-tight text-text-strong">
                    Add Expense
                </h1>
            </div>
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
            <!-- LEFT COLUMN: Main Details -->
            <div
                class="flex-1 overflow-y-auto p-6 md:p-8 border-b md:border-b-0 md:border-r border-border bg-surface-1"
            >
                <div class="max-w-xl ml-auto mr-0 md:mr-8 space-y-8">
                    <!-- Date & Category Row -->
                    <div class="grid gap-6 grid-cols-2">
                        <div class="space-y-2">
                            <Label
                                for="expense_date"
                                class="text-xs uppercase tracking-wider text-text-muted font-bold"
                                >Date *</Label
                            >
                            <Input
                                type="date"
                                id="expense_date"
                                name="expense_date"
                                value={data.defaults.expense_date}
                                required
                                class="h-11 border-border-strong bg-surface-0"
                            />
                        </div>

                        <div class="space-y-2">
                            <Label
                                for="category"
                                class="text-xs uppercase tracking-wider text-text-muted font-bold"
                                >Category *</Label
                            >
                            <select
                                id="category"
                                name="category"
                                class="w-full h-11 rounded-md border border-border-strong bg-surface-0 px-3 py-2 text-sm focus:border-primary focus:outline-none"
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
                            <Label
                                for="vendor_id"
                                class="text-xs uppercase tracking-wider text-text-muted font-bold"
                                >Vendor</Label
                            >
                            <a href="/vendors/new" class="text-xs text-primary hover:underline flex items-center gap-1">
                                <Plus class="size-3" />
                                New Vendor
                            </a>
                        </div>
                        <select
                            id="vendor_id"
                            name="vendor_id"
                            bind:value={selectedVendorId}
                            class="w-full h-11 rounded-md border border-border-strong bg-surface-0 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                        >
                            <option value="">Select vendor or type below...</option>
                            {#each data.vendors as vendor}
                                <option value={vendor.id}>
                                    {vendor.display_name || vendor.name}
                                    {#if vendor.gstin}
                                        <span class="text-text-muted"> (GST)</span>
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
                                class="h-10 border-border bg-surface-0 text-sm"
                            />
                        {:else}
                            <input type="hidden" name="vendor_name" value={vendorName} />
                        {/if}
                    </div>

                    <!-- Description -->
                    <div class="space-y-2">
                        <Label
                            for="description"
                            class="text-xs uppercase tracking-wider text-text-muted font-bold"
                            >Description</Label
                        >
                        <textarea
                            id="description"
                            name="description"
                            rows="4"
                            class="w-full rounded-md border border-border-strong bg-surface-0 px-3 py-2 text-sm resize-none focus:border-primary focus:outline-none"
                            placeholder="What was this expense for?"
                        ></textarea>
                    </div>

                    <div class="grid gap-6 grid-cols-2">
                        <!-- Paid Through -->
                        <div class="space-y-2">
                            <Label
                                for="paid_through"
                                class="text-xs uppercase tracking-wider text-text-muted font-bold"
                                >Paid Through *</Label
                            >
                            <select
                                id="paid_through"
                                name="paid_through"
                                class="w-full h-11 rounded-md border border-border-strong bg-surface-0 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                                required
                            >
                                {#each data.paymentAccounts as account}
                                    <option value={account.id}
                                        >{account.name}</option
                                    >
                                {/each}
                            </select>
                        </div>

                        <!-- Reference -->
                        <div class="space-y-2">
                            <Label
                                for="reference"
                                class="text-xs uppercase tracking-wider text-text-muted font-bold"
                                >Reference</Label
                            >
                            <Input
                                type="text"
                                id="reference"
                                name="reference"
                                placeholder="Ref Number"
                                class="h-11 border-border-strong bg-surface-0"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <!-- RIGHT COLUMN: Financials -->
            <div
                class="w-full md:w-[400px] bg-surface-0 p-6 md:p-8 overflow-y-auto"
            >
                <div class="space-y-8">
                    <h3
                        class="text-sm font-bold uppercase tracking-wider text-text-muted"
                    >
                        Financials
                    </h3>

                    <!-- Amount -->
                    <div class="space-y-2">
                        <Label
                            for="amount"
                            class="text-xs uppercase tracking-wider text-text-muted font-bold"
                            >Amount (excl. Tax) *</Label
                        >
                        <Input
                            type="number"
                            id="amount"
                            name="amount"
                            bind:value={amount}
                            step="0.01"
                            min="0.01"
                            required
                            class="h-12 border-border-strong text-text-strong bg-surface-1 text-xl font-bold font-mono text-right"
                        />
                    </div>

                    <!-- GST Settings -->
                    <div
                        class="p-4 rounded-lg bg-surface-1 border border-border space-y-4"
                    >
                        <div class="space-y-2">
                            <Label
                                for="gst_rate"
                                class="text-xs uppercase tracking-wider text-text-muted font-bold"
                                >Tax Rate</Label
                            >
                            <select
                                id="gst_rate"
                                name="gst_rate"
                                bind:value={gstRate}
                                class="w-full h-9 rounded-md border border-border text-sm"
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
                                    class="font-normal text-sm cursor-pointer"
                                    >Inter-state (IGST)</Label
                                >
                            </div>
                        {/if}
                    </div>

                    <!-- Summary Table -->
                    <div class="space-y-3 pt-4 border-t border-border-dashed">
                        <div class="flex justify-between text-sm">
                            <span class="text-text-muted">Subtotal</span>
                            <span class="font-mono text-text-strong"
                                >{formatCurrency(amount)}</span
                            >
                        </div>
                        {#if gstRate > 0}
                            <div class="flex justify-between text-sm">
                                <span class="text-text-muted"
                                    >Tax Amount ({gstRate}%)</span
                                >
                                <span class="font-mono text-text-strong"
                                    >{formatCurrency(gstAmount)}</span
                                >
                            </div>
                        {/if}
                        <div
                            class="flex justify-between items-baseline pt-2 border-t border-border"
                        >
                            <span class="font-bold text-text-strong"
                                >Total Payable</span
                            >
                            <span
                                class="font-mono text-2xl font-bold text-primary"
                                >{formatCurrency(total)}</span
                            >
                        </div>
                    </div>
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
                form="expense-form"
                disabled={isSubmitting || amount <= 0}
                class="bg-primary text-primary-foreground font-semibold tracking-wide shadow-sm hover:bg-primary/90"
            >
                <Check class="mr-2 size-4" />
                {isSubmitting ? "Saving..." : "Save Expense"}
            </Button>
            <Button
                href="/expenses"
                variant="ghost"
                type="button"
                class="text-text-muted hover:text-destructive"
            >
                Cancel
            </Button>
        </div>
    </div>
</div>
