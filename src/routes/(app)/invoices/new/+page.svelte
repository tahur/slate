<script lang="ts">
    import { enhance } from "$app/forms";
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import { Card } from "$lib/components/ui/card";
    import * as Select from "$lib/components/ui/select";
    import { GST_RATES, calculateInvoiceTotals, type LineItem } from "./schema";
    import { addToast } from "$lib/stores/toast";
    import { ArrowLeft, Save, Plus, Trash2 } from "lucide-svelte";

    let { data } = $props();

    // Form state (managed locally instead of superforms)
    let formData = $state({
        customer_id: "",
        invoice_date: data.defaults.invoice_date,
        due_date: data.defaults.due_date,
        order_number: "",
        notes: "",
        terms: "",
        items: [
            {
                description: "",
                hsn_code: "",
                quantity: 1,
                unit: "nos",
                rate: 0,
                gst_rate: 18,
            },
        ] as LineItem[],
    });

    let submitting = $state(false);
    let error = $state<string | null>(null);

    // Track selected customer for inter-state calculation
    let selectedCustomer = $derived(
        data.customers.find((c) => c.id === formData.customer_id),
    );

    let isInterState = $derived(
        selectedCustomer?.state_code !== data.orgStateCode &&
            selectedCustomer?.state_code !== undefined &&
            data.orgStateCode !== "",
    );

    // Calculate totals reactively
    let totals = $derived(calculateInvoiceTotals(formData.items, isInterState));

    function formatCurrency(amount: number): string {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 2,
        }).format(amount);
    }

    function addItem() {
        formData.items = [
            ...formData.items,
            {
                description: "",
                hsn_code: "",
                quantity: 1,
                unit: "nos",
                rate: 0,
                gst_rate: 18,
            },
        ];
    }

    function removeItem(index: number) {
        if (formData.items.length > 1) {
            formData.items = formData.items.filter((_, i) => i !== index);
        }
    }

    function getLineAmount(item: LineItem): number {
        return (item.quantity || 0) * (item.rate || 0);
    }
</script>

<div class="flex flex-col h-[calc(100vh-3.5rem)] -mx-4 md:-mx-5 -my-4 md:-my-5">
    <!-- Super Sticky Control Center Header -->
    <header
        class="flex items-center gap-4 px-6 py-4 border-b border-border bg-surface-0"
    >
        <Button
            variant="ghost"
            href="/invoices"
            size="icon"
            class="h-8 w-8 text-text-muted hover:text-text-strong"
        >
            <ArrowLeft class="size-4" />
        </Button>
        <div>
            <h1 class="text-xl font-bold tracking-tight text-text-strong">
                New Invoice
            </h1>
        </div>
    </header>

    {#if error}
        <div class="mx-auto mt-4 w-full max-w-5xl px-6">
            <div
                class="bg-destructive/10 text-active p-3 rounded-md text-sm border border-destructive/20 text-destructive flex items-center gap-2"
            >
                <span class="h-1.5 w-1.5 rounded-full bg-destructive"></span>
                {error}
            </div>
        </div>
    {/if}

    <!-- Main Content - Paper Sheet -->
    <main class="flex-1 overflow-y-auto px-6 py-8">
        <form
            id="invoice-form"
            method="POST"
            class="mx-auto max-w-5xl"
            use:enhance={() => {
                submitting = true;
                error = null;
                return async ({ result, update }) => {
                    submitting = false;
                    if (result.type === "failure" && result.data?.error) {
                        error = result.data.error as string;
                        addToast({
                            type: "error",
                            message: error,
                        });
                    } else {
                        await update();
                    }
                };
            }}
        >
            <div class="space-y-6">
                <!-- Customer Section (Top Band) -->
                <div
                    class="bg-surface-1 rounded-lg border border-border p-6 shadow-sm"
                >
                    <div class="grid gap-6 md:grid-cols-2">
                        <div class="space-y-4">
                            <Label
                                for="customer_id"
                                class="text-xs uppercase tracking-wider text-text-muted font-bold"
                                >Customer Name <span class="text-destructive"
                                    >*</span
                                ></Label
                            >
                            <Select.Root
                                type="single"
                                name="customer_id"
                                bind:value={formData.customer_id}
                            >
                                <Select.Trigger
                                    id="customer_id"
                                    class="h-10 border-border-strong bg-surface-0 focus:ring-1 focus:ring-primary/20"
                                >
                                    {selectedCustomer?.name ||
                                        "Select or add a customer"}
                                </Select.Trigger>
                                <Select.Content
                                    class="bg-surface-1 border-border shadow-lg"
                                >
                                    {#each data.customers as customer}
                                        <Select.Item
                                            value={customer.id}
                                            class="hover:bg-surface-2 focus:bg-surface-2 cursor-pointer"
                                        >
                                            <div
                                                class="flex flex-col text-left"
                                            >
                                                <span
                                                    class="font-medium text-text-strong"
                                                    >{customer.name}</span
                                                >
                                                {#if customer.company_name}
                                                    <span
                                                        class="text-[10px] text-text-muted uppercase tracking-wide"
                                                        >{customer.company_name}</span
                                                    >
                                                {/if}
                                            </div>
                                        </Select.Item>
                                    {/each}
                                </Select.Content>
                            </Select.Root>
                            {#if selectedCustomer && isInterState}
                                <span
                                    class="text-[10px] font-medium text-info bg-info/10 px-2 py-0.5 rounded-sm inline-block"
                                >
                                    Inter-state Supply (IGST)
                                </span>
                            {/if}
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <div class="space-y-2">
                                <Label
                                    for="invoice_number"
                                    class="text-xs uppercase tracking-wider text-text-muted font-bold"
                                    >Invoice #</Label
                                >
                                <div class="relative">
                                    <Input
                                        value="Auto-generated"
                                        disabled
                                        class="h-10 bg-surface-2/50 text-text-muted border-border font-mono text-sm"
                                    />
                                </div>
                            </div>

                            <div class="space-y-2">
                                <Label
                                    for="order_number"
                                    class="text-xs uppercase tracking-wider text-text-muted font-bold"
                                    >Order Number</Label
                                >
                                <Input
                                    id="order_number"
                                    name="order_number"
                                    bind:value={formData.order_number}
                                    class="h-10 border-border-strong text-text-strong bg-surface-0 focus:border-primary"
                                />
                            </div>
                        </div>
                    </div>

                    <!-- Dates Row -->
                    <div
                        class="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6 pt-6 border-t border-border-subtle"
                    >
                        <div class="space-y-2">
                            <Label
                                for="invoice_date"
                                class="text-xs uppercase tracking-wider text-text-muted font-bold"
                                >Invoice Date <span class="text-destructive"
                                    >*</span
                                ></Label
                            >
                            <Input
                                id="invoice_date"
                                name="invoice_date"
                                type="date"
                                bind:value={formData.invoice_date}
                                class="h-9 border-border text-sm"
                            />
                        </div>
                        <div class="space-y-2">
                            <Label
                                for="terms"
                                class="text-xs uppercase tracking-wider text-text-muted font-bold"
                                >Terms</Label
                            >
                            <Select.Root
                                type="single"
                                bind:value={formData.terms}
                            >
                                <Select.Trigger
                                    class="h-9 border-border text-sm bg-surface-0"
                                >
                                    {formData.terms || "Due on Receipt"}
                                </Select.Trigger>
                                <Select.Content>
                                    <Select.Item value="Due on Receipt"
                                        >Due on Receipt</Select.Item
                                    >
                                    <Select.Item value="Net 15"
                                        >Net 15</Select.Item
                                    >
                                    <Select.Item value="Net 30"
                                        >Net 30</Select.Item
                                    >
                                    <Select.Item value="Net 45"
                                        >Net 45</Select.Item
                                    >
                                </Select.Content>
                            </Select.Root>
                            <!-- Hidden input for form submission if needed, or bind terms properly -->
                            <input
                                type="hidden"
                                name="terms"
                                value={formData.terms}
                            />
                        </div>
                        <div class="space-y-2">
                            <Label
                                for="due_date"
                                class="text-xs uppercase tracking-wider text-text-muted font-bold"
                                >Due Date <span class="text-destructive">*</span
                                ></Label
                            >
                            <Input
                                id="due_date"
                                name="due_date"
                                type="date"
                                bind:value={formData.due_date}
                                class="h-9 border-border text-sm"
                            />
                        </div>
                    </div>
                </div>

                <!-- Item Table (The Ledger) -->
                <div
                    class="bg-surface-1 rounded-lg border border-border mt-8 shadow-sm overflow-hidden"
                >
                    <div
                        class="px-6 py-4 border-b border-border bg-surface-2/30 flex justify-between items-center"
                    >
                        <h3
                            class="text-xs font-bold uppercase tracking-widest text-text-muted"
                        >
                            Item Table
                        </h3>
                        <div
                            class="flex gap-2 text-[10px] font-medium uppercase tracking-wide text-primary cursor-pointer hover:underline"
                        >
                            <span>Bulk Actions</span>
                        </div>
                    </div>

                    <div class="overflow-x-auto">
                        <table class="w-full text-sm">
                            <thead>
                                <tr
                                    class="border-b border-border text-[10px] uppercase tracking-wider font-semibold text-text-muted bg-surface-0/50"
                                >
                                    <th class="px-4 py-3 text-left w-[40%]"
                                        >Item Details</th
                                    >
                                    <th class="px-4 py-3 text-right w-24"
                                        >Quantity</th
                                    >
                                    <th class="px-4 py-3 text-right w-32"
                                        >Rate</th
                                    >
                                    <th class="px-4 py-3 text-right w-28"
                                        >Tax</th
                                    >
                                    <th class="px-4 py-3 text-right w-32"
                                        >Amount</th
                                    >
                                    <th class="px-2 py-3 w-10"></th>
                                </tr>
                            </thead>
                            <tbody
                                class="divide-y divide-border-subtle bg-surface-0"
                            >
                                {#each formData.items as item, index}
                                    <tr
                                        class="group hover:bg-surface-2/50 transition-colors"
                                    >
                                        <td class="px-4 py-3 align-top">
                                            <div class="flex flex-col gap-1">
                                                <Input
                                                    name="items[{index}].description"
                                                    bind:value={
                                                        item.description
                                                    }
                                                    placeholder="Type or click to select an item"
                                                    class="h-9 border-transparent hover:border-border focus:border-primary bg-transparent p-0 text-sm font-medium placeholder:text-text-muted/50 rounded-sm px-2 -ml-2 transition-all"
                                                />
                                                <Input
                                                    name="items[{index}].hsn_code"
                                                    bind:value={item.hsn_code}
                                                    placeholder="HSN/SAC"
                                                    class="h-6 w-32 border-transparent hover:border-border bg-transparent p-0 text-[11px] font-mono text-text-muted px-2 -ml-2 rounded-sm"
                                                />
                                            </div>
                                        </td>
                                        <td class="px-4 py-3 align-top">
                                            <Input
                                                name="items[{index}].quantity"
                                                type="number"
                                                bind:value={item.quantity}
                                                min="0.01"
                                                step="0.01"
                                                class="h-9 border-border-subtle text-right bg-surface-1 focus:border-primary font-mono"
                                            />
                                        </td>
                                        <td class="px-4 py-3 align-top">
                                            <Input
                                                name="items[{index}].rate"
                                                type="number"
                                                bind:value={item.rate}
                                                min="0"
                                                step="0.01"
                                                class="h-9 border-border-subtle text-right bg-surface-1 focus:border-primary font-mono"
                                            />
                                        </td>
                                        <td class="px-4 py-3 align-top">
                                            <select
                                                name="items[{index}].gst_rate"
                                                bind:value={item.gst_rate}
                                                class="h-9 w-full border border-border-subtle rounded-md bg-surface-1 text-right text-xs font-mono focus:border-primary focus:outline-none px-2"
                                            >
                                                {#each GST_RATES as rate}
                                                    <option value={rate}
                                                        >{rate}% GST</option
                                                    >
                                                {/each}
                                            </select>
                                        </td>
                                        <td
                                            class="px-4 py-3 align-top text-right font-mono font-medium text-text-strong pt-4"
                                        >
                                            {formatCurrency(
                                                getLineAmount(item),
                                            )}
                                        </td>
                                        <td class="px-2 py-3 align-top pt-3">
                                            <button
                                                type="button"
                                                class="text-text-muted hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                                                onclick={() =>
                                                    removeItem(index)}
                                                disabled={formData.items
                                                    .length === 1}
                                            >
                                                <Trash2 class="size-4" />
                                            </button>
                                        </td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    </div>

                    <div class="border-t border-border bg-surface-0 p-4">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onclick={addItem}
                            class="text-primary hover:text-primary hover:bg-primary/5 pl-2"
                        >
                            <Plus class="mr-1 size-4" />
                            Add New Row
                        </Button>
                    </div>
                </div>

                <!-- Footer / Totals -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
                    <div class="space-y-4">
                        <div class="space-y-2">
                            <Label
                                for="notes"
                                class="text-xs uppercase tracking-wider text-text-muted font-bold"
                                >Customer Notes</Label
                            >
                            <textarea
                                id="notes"
                                name="notes"
                                bind:value={formData.notes}
                                placeholder="Will be displayed on the invoice"
                                class="w-full h-24 p-3 text-sm border border-border rounded-md resize-none bg-surface-1 focus:border-primary focus:outline-none"
                            ></textarea>
                        </div>
                    </div>

                    <div
                        class="bg-surface-1 rounded-lg border border-border p-6 shadow-sm"
                    >
                        <div class="space-y-3 text-sm">
                            <div class="flex justify-between text-text-subtle">
                                <span>Sub Total</span>
                                <span
                                    class="font-mono font-medium text-text-strong"
                                    >{formatCurrency(totals.subtotal)}</span
                                >
                            </div>
                            {#if isInterState}
                                <div
                                    class="flex justify-between text-text-subtle"
                                >
                                    <span>IGST</span>
                                    <span
                                        class="font-mono font-medium text-text-strong"
                                        >{formatCurrency(totals.igst)}</span
                                    >
                                </div>
                            {:else}
                                <div
                                    class="flex justify-between text-text-subtle"
                                >
                                    <span>CGST</span>
                                    <span
                                        class="font-mono font-medium text-text-strong"
                                        >{formatCurrency(totals.cgst)}</span
                                    >
                                </div>
                                <div
                                    class="flex justify-between text-text-subtle"
                                >
                                    <span>SGST</span>
                                    <span
                                        class="font-mono font-medium text-text-strong"
                                        >{formatCurrency(totals.sgst)}</span
                                    >
                                </div>
                            {/if}

                            <div
                                class="border-t border-border mt-4 pt-4 flex justify-between items-center"
                            >
                                <span
                                    class="font-bold text-base text-text-strong"
                                    >Total</span
                                >
                                <span
                                    class="font-mono text-xl font-bold text-text-strong"
                                    >{formatCurrency(totals.total)}</span
                                >
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </form>
    </main>

    <!-- Static Bottom Action Bar -->
    <div
        class="flex-none bg-surface-1 border-t border-border shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] px-6 py-4 flex items-center justify-between z-20"
    >
        <!-- Left: Actions -->
        <div class="flex items-center gap-3">
            <Button
                type="submit"
                form="invoice-form"
                disabled={submitting}
                class="bg-primary text-primary-foreground font-semibold tracking-wide shadow-sm hover:bg-primary/90"
            >
                <Save class="mr-2 size-4" />
                {submitting ? "Saving..." : "Save as Draft"}
            </Button>
            <Button
                type="button"
                disabled={submitting}
                class="bg-surface-0 border border-border-strong text-text-strong hover:bg-surface-2"
            >
                Save & Send
            </Button>
            <Button
                href="/invoices"
                variant="ghost"
                type="button"
                class="text-text-muted hover:text-destructive"
            >
                Cancel
            </Button>
        </div>

        <!-- Right: Quick Totals -->
        <div class="flex items-center gap-6 text-sm">
            <div class="flex flex-col items-end">
                <span
                    class="text-[10px] uppercase tracking-wider text-text-muted font-semibold"
                    >Sub Total</span
                >
                <span class="font-mono font-medium text-text-strong"
                    >{formatCurrency(totals.subtotal)}</span
                >
            </div>

            <!-- Separator -->
            <div class="h-8 w-px bg-border-subtle"></div>

            <div class="flex flex-col items-end">
                <span
                    class="text-[10px] uppercase tracking-wider text-text-muted font-semibold"
                    >Tax</span
                >
                {#if isInterState}
                    <span class="font-mono font-medium text-text-strong"
                        >{formatCurrency(totals.igst)}</span
                    >
                {:else}
                    <span class="font-mono font-medium text-text-strong"
                        >{formatCurrency(totals.cgst + totals.sgst)}</span
                    >
                {/if}
            </div>

            <!-- Separator -->
            <div class="h-8 w-px bg-border-subtle"></div>

            <div class="flex flex-col items-end">
                <span
                    class="text-[10px] uppercase tracking-wider text-text-muted font-semibold"
                    >Total</span
                >
                <span class="font-mono text-xl font-bold text-text-strong"
                    >{formatCurrency(totals.total)}</span
                >
            </div>
        </div>
    </div>
</div>
