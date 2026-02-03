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
    let amount = $state(0);
    let gstRate = $state(0);
    let isInterState = $state(false);

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
    <main class="flex-1 overflow-y-auto px-6 py-8">
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
            class="mx-auto max-w-5xl space-y-8"
        >
            <div
                class="bg-surface-1 rounded-lg border border-border p-8 shadow-sm space-y-8"
            >
                <div class="grid gap-6 md:grid-cols-2">
                    <!-- Date -->
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

                    <!-- Category -->
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

                <div class="grid gap-6 md:grid-cols-3">
                    <!-- Amount -->
                    <div class="space-y-2">
                        <Label
                            for="amount"
                            class="text-xs uppercase tracking-wider text-text-muted font-bold"
                            >Amount (excl. GST) *</Label
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

                    <!-- GST Rate -->
                    <div class="space-y-2">
                        <Label
                            for="gst_rate"
                            class="text-xs uppercase tracking-wider text-text-muted font-bold"
                            >GST Rate (%)</Label
                        >
                        <select
                            id="gst_rate"
                            name="gst_rate"
                            bind:value={gstRate}
                            class="w-full h-11 rounded-md border border-border-strong bg-surface-0 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                        >
                            <option value={0}>0% (No GST)</option>
                            <option value={5}>5%</option>
                            <option value={12}>12%</option>
                            <option value={18}>18%</option>
                            <option value={28}>28%</option>
                        </select>
                    </div>

                    <!-- Inter-state Checkbox (only visible if GST > 0) -->
                    <div class="space-y-2 flex flex-col justify-end pb-2">
                        {#if gstRate > 0}
                            <div class="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="is_inter_state"
                                    name="is_inter_state"
                                    bind:checked={isInterState}
                                    class="h-4 w-4 rounded border-border-strong text-primary focus:ring-primary/25"
                                />
                                <Label
                                    for="is_inter_state"
                                    class="font-normal text-sm cursor-pointer"
                                    >Inter-state purchase (IGST)</Label
                                >
                            </div>
                        {/if}
                    </div>
                </div>

                <!-- Vendor -->
                <div class="space-y-2">
                    <Label
                        for="vendor"
                        class="text-xs uppercase tracking-wider text-text-muted font-bold"
                        >Vendor</Label
                    >
                    <Input
                        type="text"
                        id="vendor"
                        name="vendor"
                        placeholder="Vendor or supplier name"
                        class="h-11 border-border-strong bg-surface-0"
                    />
                </div>

                <div class="grid gap-6 md:grid-cols-2">
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
                            placeholder="Bill/Invoice number"
                            class="h-11 border-border-strong bg-surface-0"
                        />
                    </div>
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
                        rows="2"
                        class="w-full rounded-md border border-border-strong bg-surface-0 px-3 py-2 text-sm resize-none focus:border-primary focus:outline-none"
                        placeholder="What was this expense for?"
                    ></textarea>
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

        <div class="flex items-center gap-6 text-sm">
            <div class="flex flex-col items-end">
                <span
                    class="text-[10px] uppercase tracking-wider text-text-muted font-semibold"
                    >Amount</span
                >
                <span class="font-mono font-medium text-text-strong"
                    >{formatCurrency(amount)}</span
                >
            </div>

            {#if gstRate > 0}
                <div class="h-8 w-px bg-border-subtle"></div>
                <div class="flex flex-col items-end">
                    <span
                        class="text-[10px] uppercase tracking-wider text-text-muted font-semibold"
                        >Tax ({gstRate}%)</span
                    >
                    <span class="font-mono font-medium text-text-strong"
                        >{formatCurrency(gstAmount)}</span
                    >
                </div>
            {/if}

            <div class="h-8 w-px bg-border-subtle"></div>
            <div class="flex flex-col items-end">
                <span
                    class="text-[10px] uppercase tracking-wider text-text-muted font-semibold"
                    >Total</span
                >
                <span class="font-mono text-lg font-bold text-destructive"
                    >{formatCurrency(total)}</span
                >
            </div>
        </div>
    </div>
</div>
