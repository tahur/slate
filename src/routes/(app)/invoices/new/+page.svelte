<script lang="ts">
    import { enhance } from "$app/forms";
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import { Card } from "$lib/components/ui/card";
    import * as Select from "$lib/components/ui/select";
    import { GST_RATES, calculateInvoiceTotals, type LineItem } from "./schema";
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

<div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center gap-4">
        <Button variant="ghost" href="/invoices" class="p-2">
            <ArrowLeft class="size-4" />
        </Button>
        <div>
            <h1 class="text-xl font-semibold">New Invoice</h1>
            <p class="text-sm text-muted-foreground">
                Create a new sales invoice
            </p>
        </div>
    </div>

    {#if error}
        <div class="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
            {error}
        </div>
    {/if}

    <!-- Form -->
    <form
        method="POST"
        use:enhance={() => {
            submitting = true;
            error = null;
            return async ({ result, update }) => {
                submitting = false;
                if (result.type === "failure" && result.data?.error) {
                    error = result.data.error as string;
                } else {
                    await update();
                }
            };
        }}
    >
        <div class="grid gap-4 lg:grid-cols-3">
            <!-- Main Form -->
            <Card class="p-6 lg:col-span-2 space-y-6">
                <!-- Customer & Dates -->
                <div class="grid gap-4 md:grid-cols-3">
                    <div class="space-y-2">
                        <Label for="customer_id">Customer *</Label>
                        <Select.Root
                            type="single"
                            name="customer_id"
                            bind:value={formData.customer_id}
                        >
                            <Select.Trigger id="customer_id">
                                {selectedCustomer?.name || "Select customer"}
                            </Select.Trigger>
                            <Select.Content>
                                {#each data.customers as customer}
                                    <Select.Item value={customer.id}>
                                        {customer.name}
                                        {#if customer.company_name}
                                            <span
                                                class="text-muted-foreground text-xs ml-1"
                                                >({customer.company_name})</span
                                            >
                                        {/if}
                                    </Select.Item>
                                {/each}
                            </Select.Content>
                        </Select.Root>
                        {#if selectedCustomer && isInterState}
                            <p class="text-xs text-blue-600">
                                Inter-state supply (IGST applicable)
                            </p>
                        {/if}
                    </div>

                    <div class="space-y-2">
                        <Label for="invoice_date">Invoice Date *</Label>
                        <Input
                            id="invoice_date"
                            name="invoice_date"
                            type="date"
                            bind:value={formData.invoice_date}
                        />
                    </div>

                    <div class="space-y-2">
                        <Label for="due_date">Due Date *</Label>
                        <Input
                            id="due_date"
                            name="due_date"
                            type="date"
                            bind:value={formData.due_date}
                        />
                    </div>
                </div>

                <!-- Line Items -->
                <div class="space-y-3">
                    <div class="flex items-center justify-between">
                        <Label>Line Items</Label>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onclick={addItem}
                        >
                            <Plus class="mr-1 size-3" />
                            Add Item
                        </Button>
                    </div>

                    <div class="overflow-x-auto">
                        <table class="w-full text-sm">
                            <thead>
                                <tr class="border-b bg-muted/50">
                                    <th
                                        class="px-2 py-2 text-left font-medium text-muted-foreground w-1/3"
                                        >Description</th
                                    >
                                    <th
                                        class="px-2 py-2 text-left font-medium text-muted-foreground w-20"
                                        >HSN</th
                                    >
                                    <th
                                        class="px-2 py-2 text-right font-medium text-muted-foreground w-16"
                                        >Qty</th
                                    >
                                    <th
                                        class="px-2 py-2 text-right font-medium text-muted-foreground w-24"
                                        >Rate</th
                                    >
                                    <th
                                        class="px-2 py-2 text-center font-medium text-muted-foreground w-20"
                                        >GST %</th
                                    >
                                    <th
                                        class="px-2 py-2 text-right font-medium text-muted-foreground w-24"
                                        >Amount</th
                                    >
                                    <th class="px-2 py-2 w-10"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {#each formData.items as item, index}
                                    <tr class="border-b">
                                        <td class="px-1 py-2">
                                            <Input
                                                name="items[{index}].description"
                                                bind:value={item.description}
                                                placeholder="Item description"
                                                class="h-8 text-sm"
                                            />
                                        </td>
                                        <td class="px-1 py-2">
                                            <Input
                                                name="items[{index}].hsn_code"
                                                bind:value={item.hsn_code}
                                                placeholder="HSN"
                                                class="h-8 text-sm font-mono"
                                            />
                                        </td>
                                        <td class="px-1 py-2">
                                            <Input
                                                name="items[{index}].quantity"
                                                type="number"
                                                bind:value={item.quantity}
                                                min="0.01"
                                                step="0.01"
                                                class="h-8 text-sm text-right"
                                            />
                                        </td>
                                        <td class="px-1 py-2">
                                            <Input
                                                name="items[{index}].rate"
                                                type="number"
                                                bind:value={item.rate}
                                                min="0"
                                                step="0.01"
                                                class="h-8 text-sm text-right"
                                            />
                                        </td>
                                        <td class="px-1 py-2">
                                            <input
                                                type="hidden"
                                                name="items[{index}].unit"
                                                value={item.unit}
                                            />
                                            <select
                                                name="items[{index}].gst_rate"
                                                bind:value={item.gst_rate}
                                                class="h-8 text-sm w-full px-2 border rounded-md bg-background"
                                            >
                                                {#each GST_RATES as rate}
                                                    <option value={rate}
                                                        >{rate}%</option
                                                    >
                                                {/each}
                                            </select>
                                        </td>
                                        <td
                                            class="px-2 py-2 text-right font-mono"
                                        >
                                            {formatCurrency(
                                                getLineAmount(item),
                                            )}
                                        </td>
                                        <td class="px-1 py-2">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                class="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                                onclick={() =>
                                                    removeItem(index)}
                                                disabled={formData.items
                                                    .length === 1}
                                            >
                                                <Trash2 class="size-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Notes & Terms -->
                <div class="grid gap-4 md:grid-cols-2">
                    <div class="space-y-2">
                        <Label for="notes">Notes</Label>
                        <textarea
                            id="notes"
                            name="notes"
                            bind:value={formData.notes}
                            placeholder="Notes visible on invoice"
                            class="w-full h-20 px-3 py-2 text-sm border rounded-md resize-none bg-background"
                        ></textarea>
                    </div>
                    <div class="space-y-2">
                        <Label for="terms">Terms & Conditions</Label>
                        <textarea
                            id="terms"
                            name="terms"
                            bind:value={formData.terms}
                            placeholder="Payment terms"
                            class="w-full h-20 px-3 py-2 text-sm border rounded-md resize-none bg-background"
                        ></textarea>
                    </div>
                </div>
            </Card>

            <!-- Summary Sidebar -->
            <div class="space-y-4">
                <Card class="p-6">
                    <h3 class="font-medium mb-4">Invoice Summary</h3>
                    <div class="space-y-3 text-sm">
                        <div class="flex justify-between">
                            <span class="text-muted-foreground">Subtotal</span>
                            <span class="font-mono"
                                >{formatCurrency(totals.subtotal)}</span
                            >
                        </div>

                        {#if isInterState}
                            <div class="flex justify-between">
                                <span class="text-muted-foreground">IGST</span>
                                <span class="font-mono"
                                    >{formatCurrency(totals.igst)}</span
                                >
                            </div>
                        {:else}
                            <div class="flex justify-between">
                                <span class="text-muted-foreground">CGST</span>
                                <span class="font-mono"
                                    >{formatCurrency(totals.cgst)}</span
                                >
                            </div>
                            <div class="flex justify-between">
                                <span class="text-muted-foreground">SGST</span>
                                <span class="font-mono"
                                    >{formatCurrency(totals.sgst)}</span
                                >
                            </div>
                        {/if}

                        <div
                            class="border-t pt-3 flex justify-between font-medium"
                        >
                            <span>Total</span>
                            <span class="font-mono text-lg"
                                >{formatCurrency(totals.total)}</span
                            >
                        </div>
                    </div>
                </Card>

                <!-- Actions -->
                <div class="flex flex-col gap-2">
                    <Button type="submit" disabled={submitting} class="w-full">
                        <Save class="mr-2 size-4" />
                        {submitting ? "Saving..." : "Save as Draft"}
                    </Button>
                    <Button
                        variant="outline"
                        href="/invoices"
                        type="button"
                        class="w-full"
                    >
                        Cancel
                    </Button>
                </div>
            </div>
        </div>
    </form>
</div>
