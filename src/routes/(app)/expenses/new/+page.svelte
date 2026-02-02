<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { Card } from "$lib/components/ui/card";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import { ArrowLeft, Check } from "lucide-svelte";
    import { enhance } from "$app/forms";

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

<div class="max-w-2xl mx-auto space-y-4">
    <!-- Header -->
    <div class="flex items-center gap-4">
        <Button variant="ghost" href="/expenses" class="p-2">
            <ArrowLeft class="size-4" />
        </Button>
        <div>
            <h1 class="text-xl font-semibold">Add Expense</h1>
            <p class="text-sm text-muted-foreground">
                Record a business expense
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
        use:enhance={() => {
            isSubmitting = true;
            return async ({ update }) => {
                await update();
                isSubmitting = false;
            };
        }}
        class="grid gap-6 lg:grid-cols-3"
    >
        <!-- Main Form -->
        <Card class="p-6 lg:col-span-2 space-y-6">
            <div class="grid gap-4 md:grid-cols-2">
                <!-- Date -->
                <div class="space-y-2">
                    <Label for="expense_date">Date *</Label>
                    <Input
                        type="date"
                        id="expense_date"
                        name="expense_date"
                        value={data.defaults.expense_date}
                        required
                    />
                </div>

                <!-- Category -->
                <div class="space-y-2">
                    <Label for="category">Category *</Label>
                    <select
                        id="category"
                        name="category"
                        class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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

            <div class="grid gap-4 md:grid-cols-2">
                <!-- Amount -->
                <div class="space-y-2">
                    <Label for="amount">Amount (excl. GST) *</Label>
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

                <!-- GST Rate -->
                <div class="space-y-2">
                    <Label for="gst_rate">GST Rate (%)</Label>
                    <select
                        id="gst_rate"
                        name="gst_rate"
                        bind:value={gstRate}
                        class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                        <option value={0}>0% (No GST)</option>
                        <option value={5}>5%</option>
                        <option value={12}>12%</option>
                        <option value={18}>18%</option>
                        <option value={28}>28%</option>
                    </select>
                </div>
            </div>

            {#if gstRate > 0}
                <div class="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="is_inter_state"
                        name="is_inter_state"
                        bind:checked={isInterState}
                        class="rounded border-gray-300"
                    />
                    <Label for="is_inter_state" class="font-normal"
                        >Inter-state purchase (IGST)</Label
                    >
                </div>
            {/if}

            <!-- Vendor -->
            <div class="space-y-2">
                <Label for="vendor">Vendor</Label>
                <Input
                    type="text"
                    id="vendor"
                    name="vendor"
                    placeholder="Vendor or supplier name"
                />
            </div>

            <!-- Description -->
            <div class="space-y-2">
                <Label for="description">Description</Label>
                <textarea
                    id="description"
                    name="description"
                    rows="2"
                    class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
                    placeholder="What was this expense for?"
                ></textarea>
            </div>

            <div class="grid gap-4 md:grid-cols-2">
                <!-- Paid Through -->
                <div class="space-y-2">
                    <Label for="paid_through">Paid Through *</Label>
                    <select
                        id="paid_through"
                        name="paid_through"
                        class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        required
                    >
                        {#each data.paymentAccounts as account}
                            <option value={account.id}>{account.name}</option>
                        {/each}
                    </select>
                </div>

                <!-- Reference -->
                <div class="space-y-2">
                    <Label for="reference">Reference</Label>
                    <Input
                        type="text"
                        id="reference"
                        name="reference"
                        placeholder="Bill/Invoice number"
                    />
                </div>
            </div>
        </Card>

        <!-- Summary -->
        <div class="space-y-4">
            <Card class="p-6">
                <h3 class="font-medium mb-4">Summary</h3>
                <div class="space-y-2 text-sm">
                    <div class="flex justify-between">
                        <span class="text-muted-foreground">Amount</span>
                        <span class="font-mono">{formatCurrency(amount)}</span>
                    </div>

                    {#if gstRate > 0}
                        {#if isInterState}
                            <div class="flex justify-between">
                                <span class="text-muted-foreground"
                                    >IGST ({gstRate}%)</span
                                >
                                <span class="font-mono"
                                    >{formatCurrency(igst)}</span
                                >
                            </div>
                        {:else}
                            <div class="flex justify-between">
                                <span class="text-muted-foreground"
                                    >CGST ({gstRate / 2}%)</span
                                >
                                <span class="font-mono"
                                    >{formatCurrency(cgst)}</span
                                >
                            </div>
                            <div class="flex justify-between">
                                <span class="text-muted-foreground"
                                    >SGST ({gstRate / 2}%)</span
                                >
                                <span class="font-mono"
                                    >{formatCurrency(sgst)}</span
                                >
                            </div>
                        {/if}
                    {/if}

                    <div
                        class="border-t pt-3 flex justify-between font-semibold"
                    >
                        <span>Total</span>
                        <span class="font-mono text-red-600"
                            >{formatCurrency(total)}</span
                        >
                    </div>
                </div>
            </Card>

            <Button
                type="submit"
                class="w-full"
                disabled={isSubmitting || amount <= 0}
            >
                <Check class="mr-2 size-4" />
                {isSubmitting ? "Saving..." : "Save Expense"}
            </Button>
        </div>
    </form>
</div>
