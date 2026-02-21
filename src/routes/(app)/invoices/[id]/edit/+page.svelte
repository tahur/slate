<script lang="ts">
    import { enhance } from "$app/forms";
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";

    import * as Select from "$lib/components/ui/select";
    import {
        GST_RATES,
        calculateInvoiceTotals,
        type LineItem,
    } from "../../new/schema";
    import { toast } from "svelte-sonner";
    import { ArrowLeft, Save, Plus, Trash2, GripVertical } from "lucide-svelte";
    import * as Tooltip from "$lib/components/ui/tooltip";
    import { formatINR } from "$lib/utils/currency";
    import ItemCombobox from "$lib/components/ItemCombobox.svelte";

    type CatalogItem = (typeof data.catalogItems)[number];

    let { data } = $props();
    const { invoice, lineItems } = data;

    // Pre-populate form from existing invoice data
    let formData = $state({
        customer_id: invoice.customer_id,
        invoice_date: invoice.invoice_date,
        due_date: invoice.due_date,
        order_number: invoice.order_number || "",
        notes: invoice.notes || "",
        terms: invoice.terms || "",
        items: lineItems.map((item) => ({
            description: item.description,
            hsn_code: item.hsn_code || "",
            quantity: item.quantity,
            unit: item.unit || "nos",
            rate: item.rate,
            gst_rate: item.gst_rate,
            item_id: item.item_id || "",
        })) as (LineItem & { item_id?: string })[],
    });

    let pricesIncludeGst = $state(invoice.prices_include_gst ?? false);
    let submitting = $state(false);
    let error = $state<string | null>(null);

    let customerSearch = $state("");

    // Handler for item selection from combobox
    function handleItemSelect(
        index: number,
        item: {
            description: string;
            hsn_code: string;
            rate: number;
            unit: string;
            gst_rate: number;
            item_id?: string;
        },
    ) {
        formData.items[index] = {
            ...formData.items[index],
            ...item,
        };
    }

    // Drag and Drop State
    let dragItemIndex = $state<number | null>(null);

    // Track selected customer for inter-state calculation
    let selectedCustomer = $derived(
        data.customers.find((c) => c.id === formData.customer_id),
    );

    let filteredCustomers = $derived.by(() => {
        const query = customerSearch.trim().toLowerCase();
        if (!query) return data.customers;
        return data.customers.filter((customer) => {
            const haystack = [
                customer.name,
                customer.company_name,
                customer.email,
                customer.phone,
                customer.gstin,
                customer.city,
                customer.state_code,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();
            return haystack.includes(query);
        });
    });

    function formatCustomerAddress(customer: (typeof data.customers)[number]) {
        const line1 = customer.billing_address?.trim();
        const line2 = [customer.city, customer.state_code]
            .filter(Boolean)
            .join(", ");
        const parts = [line1, line2, customer.pincode].filter(Boolean);
        return parts.join(", ");
    }

    let selectedCustomerAddress = $derived.by(() =>
        selectedCustomer ? formatCustomerAddress(selectedCustomer) : "",
    );

    let isInterState = $derived(
        selectedCustomer?.state_code !== data.orgStateCode &&
            selectedCustomer?.state_code !== undefined &&
            data.orgStateCode !== "",
    );

    // Calculate totals reactively
    let totals = $derived(
        calculateInvoiceTotals(formData.items, isInterState, pricesIncludeGst),
    );

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
                item_id: "",
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

    function handleDragStart(index: number) {
        dragItemIndex = index;
    }

    function handleDragOver(e: DragEvent) {
        e.preventDefault();
        e.dataTransfer!.dropEffect = "move";
    }

    function handleDrop(index: number) {
        if (dragItemIndex === null) return;
        const items = [...formData.items];
        const [reorderedItem] = items.splice(dragItemIndex, 1);
        items.splice(index, 0, reorderedItem);
        formData.items = items;
        dragItemIndex = null;
    }
</script>

<div class="page-full-bleed">
    <!-- Header -->
    <header
        class="flex items-center gap-4 px-6 py-4 border-b border-border bg-surface-0 z-20"
    >
        <Button
            variant="ghost"
            href="/invoices/{data.invoice.id}"
            size="icon"
            class="h-8 w-8"
        >
            <ArrowLeft class="size-4" />
        </Button>
        <div>
            <h1 class="text-xl font-bold tracking-tight text-text-strong">
                Edit Invoice
            </h1>
            <p class="text-sm text-text-subtle font-mono">
                {data.invoice.invoice_number}
            </p>
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

    <!-- Main Content -->
    <main class="flex-1 overflow-y-auto bg-surface-1">
        <form
            id="invoice-form"
            method="POST"
            action="/invoices/{data.invoice.id}?/update"
            class="h-full"
            use:enhance={() => {
                submitting = true;
                error = null;
                return async ({ result, update }) => {
                    submitting = false;
                    if (result.type === "failure" && result.data?.error) {
                        error = result.data.error as string;
                        toast.error(error);
                    } else {
                        await update();
                    }
                };
            }}
        >
            <input
                type="hidden"
                name="prices_include_gst"
                value={pricesIncludeGst ? "true" : "false"}
            />

            <div class="p-6 md:p-8">
                <div class="max-w-5xl mx-auto space-y-8">
                    <!-- Section: Customer & Invoice Details -->
                    <section class="space-y-6">
                        <h3
                            class="text-xs font-bold uppercase tracking-wide text-text-subtle"
                        >
                            Customer & Invoice Details
                        </h3>

                        <div class="grid gap-6 md:grid-cols-2">
                            <!-- Customer Selector -->
                            <div class="space-y-2 md:col-span-2">
                                <Label for="customer_id" variant="form">
                                    Customer <span class="text-destructive"
                                        >*</span
                                    >
                                </Label>
                                {#if selectedCustomer}
                                    <!-- Selected customer card -->
                                    <input type="hidden" name="customer_id" value={formData.customer_id} />
                                    <div class="flex items-start gap-4 rounded-lg border border-border bg-surface-0 p-3">
                                        <div class="flex-1 min-w-0">
                                            <div class="flex items-center gap-2">
                                                <span class="text-sm font-semibold text-text-strong truncate">{selectedCustomer.name}</span>
                                                {#if selectedCustomer.company_name}
                                                    <span class="text-xs text-text-muted truncate">{selectedCustomer.company_name}</span>
                                                {/if}
                                            </div>
                                            <div class="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-text-muted">
                                                {#if selectedCustomer.gstin}
                                                    <span class="font-mono">{selectedCustomer.gstin}</span>
                                                {:else}
                                                    <span>No GSTIN</span>
                                                {/if}
                                                {#if selectedCustomerAddress}
                                                    <span class="truncate max-w-[250px]">{selectedCustomerAddress}</span>
                                                {/if}
                                            </div>
                                            {#if selectedCustomer.gst_treatment || isInterState}
                                                <div class="flex items-center gap-2 mt-1.5">
                                                    {#if selectedCustomer.gst_treatment}
                                                        <span class="rounded-sm bg-surface-2 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-text-muted">{selectedCustomer.gst_treatment}</span>
                                                    {/if}
                                                    {#if isInterState}
                                                        <span class="rounded-sm bg-info/10 text-info px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide">IGST</span>
                                                    {/if}
                                                </div>
                                            {/if}
                                        </div>
                                        <button
                                            type="button"
                                            class="text-xs text-primary font-medium hover:underline shrink-0"
                                            onclick={() => { formData.customer_id = ""; }}
                                        >
                                            Change
                                        </button>
                                    </div>
                                {:else}
                                    <!-- Customer picker -->
                                    <Select.Root
                                        type="single"
                                        name="customer_id"
                                        bind:value={formData.customer_id}
                                    >
                                        <Select.Trigger
                                            id="customer_id"
                                            class="w-full border-border-strong bg-surface-0 focus:ring-1 focus:ring-primary/20"
                                        >
                                            <span class="text-sm text-text-muted">Select a customer</span>
                                        </Select.Trigger>
                                        <Select.Content
                                            class="bg-surface-1 border-border shadow-lg min-w-[22rem]"
                                        >
                                            <div
                                                class="sticky top-0 z-10 -mx-1 px-2 pt-2 pb-2 bg-surface-1 border-b border-border space-y-2"
                                            >
                                                <Input
                                                    bind:value={customerSearch}
                                                    placeholder="Search customers"
                                                    class="h-8 border-border-strong text-sm"
                                                />
                                                <div
                                                    class="flex items-center justify-between"
                                                >
                                                    <span
                                                        class="text-[10px] uppercase tracking-wide text-text-subtle font-semibold"
                                                    >
                                                        Customers
                                                    </span>
                                                    <Button
                                                        href="/customers/new"
                                                        variant="outline"
                                                        size="sm"
                                                    >
                                                        New Customer
                                                    </Button>
                                                </div>
                                            </div>

                                            {#if filteredCustomers.length === 0}
                                                <div
                                                    class="px-3 py-4 text-xs text-text-muted"
                                                >
                                                    No customers match "{customerSearch}"
                                                </div>
                                            {:else}
                                                {#each filteredCustomers as customer}
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
                                                            {#if customer.gstin}
                                                                <span
                                                                    class="text-[10px] font-mono text-text-muted"
                                                                    >GSTIN {customer.gstin}</span
                                                                >
                                                            {/if}
                                                            {#if customer.city || customer.state_code}
                                                                <span
                                                                    class="text-[10px] text-text-muted"
                                                                >
                                                                    {customer.city ||
                                                                        "—"}{customer.state_code
                                                                        ? `, ${customer.state_code}`
                                                                        : ""}
                                                                </span>
                                                            {/if}
                                                        </div>
                                                    </Select.Item>
                                                {/each}
                                            {/if}
                                        </Select.Content>
                                    </Select.Root>
                                {/if}
                            </div>

                            <!-- Invoice Number (read-only for edits) -->
                            <div class="space-y-2">
                                <Label for="invoice_number" variant="form"
                                    >Invoice #</Label
                                >
                                <Input
                                    id="invoice_number"
                                    value={data.invoice.invoice_number}
                                    readonly
                                    class="bg-surface-2/50 text-text-subtle border-border font-mono text-sm"
                                />
                            </div>

                            <!-- Order Number -->
                            <div class="space-y-2">
                                <Label for="order_number" variant="form"
                                    >Order / PO Number</Label
                                >
                                <Input
                                    id="order_number"
                                    name="order_number"
                                    bind:value={formData.order_number}
                                    placeholder="Reference"
                                    class="border-border-strong text-text-strong bg-surface-0 focus:border-primary"
                                />
                            </div>
                        </div>
                    </section>

                    <!-- Section: Dates -->
                    <section class="space-y-6">
                        <h3
                            class="text-xs font-bold uppercase tracking-wide text-text-subtle"
                        >
                            Dates
                        </h3>

                        <div class="grid gap-6 md:grid-cols-3">
                            <div class="space-y-2">
                                <Label for="invoice_date" variant="form">
                                    Invoice Date <span class="text-destructive"
                                        >*</span
                                    >
                                </Label>
                                <Input
                                    id="invoice_date"
                                    name="invoice_date"
                                    type="date"
                                    bind:value={formData.invoice_date}
                                    class="border-border-strong bg-surface-0"
                                />
                            </div>
                            <div class="space-y-2">
                                <Label for="terms" variant="form">Terms</Label>
                                <Select.Root
                                    type="single"
                                    bind:value={formData.terms}
                                >
                                    <Select.Trigger
                                        class="h-9 border-border-strong text-sm bg-surface-0"
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
                                <input
                                    type="hidden"
                                    name="terms"
                                    value={formData.terms}
                                />
                            </div>
                            <div class="space-y-2">
                                <Label for="due_date" variant="form">
                                    Due Date <span class="text-destructive"
                                        >*</span
                                    >
                                </Label>
                                <Input
                                    id="due_date"
                                    name="due_date"
                                    type="date"
                                    bind:value={formData.due_date}
                                    class="border-border-strong bg-surface-0"
                                />
                            </div>
                        </div>
                    </section>

                    <!-- Section: Line Items -->
                    <section class="space-y-4">
                        <div class="flex justify-between items-center">
                            <h3
                                class="text-xs font-bold uppercase tracking-wide text-text-subtle"
                            >
                                Line Items
                            </h3>
                            <label
                                class="flex items-center gap-2 cursor-pointer"
                            >
                                <span
                                    class="text-xs font-medium text-text-subtle"
                                >
                                    Prices include GST
                                </span>
                                <input
                                    type="checkbox"
                                    bind:checked={pricesIncludeGst}
                                    class="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                                />
                            </label>
                        </div>

                        <div
                            class="rounded-lg border border-border overflow-hidden bg-surface-0"
                        >
                            <div class="overflow-x-auto">
                                <table class="w-full text-sm">
                                    <thead>
                                        <tr
                                            class="border-b border-border text-[10px] uppercase tracking-wide font-semibold text-text-subtle bg-surface-2/50"
                                        >
                                            <th
                                                class="px-2 py-3 w-8 text-center"
                                            ></th>
                                            <th class="px-4 py-3 text-left"
                                                >Item Details</th
                                            >
                                            <th class="px-3 py-3 text-left w-28"
                                                >HSN/SAC</th
                                            >
                                            <th
                                                class="px-3 py-3 text-right w-24"
                                                >Qty</th
                                            >
                                            <th
                                                class="px-3 py-3 text-right w-28"
                                                >Rate</th
                                            >
                                            <th
                                                class="px-3 py-3 text-right w-24"
                                                >Tax</th
                                            >
                                            <th
                                                class="px-4 py-3 text-right w-28"
                                                >Amount</th
                                            >
                                            <th class="px-2 py-3 w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody
                                        class="divide-y divide-border-subtle"
                                    >
                                        {#each formData.items as item, index}
                                            <tr
                                                class="group hover:bg-surface-2/30 transition-colors {dragItemIndex ===
                                                index
                                                    ? 'opacity-50 border-2 border-dashed border-primary/50'
                                                    : ''}"
                                                draggable={true}
                                                ondragstart={() =>
                                                    handleDragStart(index)}
                                                ondragover={handleDragOver}
                                                ondrop={() => handleDrop(index)}
                                            >
                                                <td class="px-2 py-3 align-top">
                                                    <div
                                                        class="h-9 flex items-center justify-center cursor-move text-text-muted/50 hover:text-text-strong touch-none"
                                                    >
                                                        <GripVertical
                                                            class="size-4"
                                                        />
                                                    </div>
                                                </td>
                                                <td class="px-2 py-2 align-top">
                                                    <div
                                                        class="relative flex items-center gap-1 w-full"
                                                    >
                                                        <ItemCombobox
                                                            catalogItems={data.catalogItems}
                                                            bind:value={
                                                                formData.items[
                                                                    index
                                                                ]
                                                            }
                                                            onSelect={(item) =>
                                                                handleItemSelect(
                                                                    index,
                                                                    item,
                                                                )}
                                                            name="items[{index}].description"
                                                            placeholder="Search or enter item..."
                                                        />
                                                        <input
                                                            type="hidden"
                                                            name="items[{index}].item_id"
                                                            value={item.item_id ||
                                                                ""}
                                                        />
                                                        <input
                                                            type="hidden"
                                                            name="items[{index}].unit"
                                                            value={item.unit ||
                                                                "nos"}
                                                        />
                                                    </div>
                                                </td>
                                                <td class="px-2 py-2 align-top">
                                                    <Input
                                                        name="items[{index}].hsn_code"
                                                        bind:value={
                                                            item.hsn_code
                                                        }
                                                        placeholder="HSN"
                                                        class="h-9 border-border text-center bg-surface-1 focus:border-primary font-mono"
                                                    />
                                                </td>
                                                <td class="px-2 py-2 align-top">
                                                    <Input
                                                        name="items[{index}].quantity"
                                                        type="number"
                                                        bind:value={
                                                            item.quantity
                                                        }
                                                        min="0.01"
                                                        step="0.01"
                                                        class="h-9 border-border text-right bg-surface-1 focus:border-primary font-mono"
                                                    />
                                                </td>
                                                <td class="px-2 py-2 align-top">
                                                    <Input
                                                        name="items[{index}].rate"
                                                        type="number"
                                                        bind:value={item.rate}
                                                        min="0"
                                                        step="0.01"
                                                        class="h-9 border-border text-right bg-surface-1 focus:border-primary font-mono"
                                                    />
                                                </td>
                                                <td class="px-2 py-2 align-top">
                                                    <select
                                                        name="items[{index}].gst_rate"
                                                        bind:value={
                                                            item.gst_rate
                                                        }
                                                        class="h-9 w-full border border-border rounded-md bg-surface-1 text-right text-xs font-mono focus:border-primary focus:outline-none px-2"
                                                    >
                                                        {#each GST_RATES as rate}
                                                            <option value={rate}
                                                                >{rate}%</option
                                                            >
                                                        {/each}
                                                    </select>
                                                </td>
                                                <td class="px-2 py-2 align-top">
                                                    <div
                                                        class="h-9 flex items-center justify-end font-mono font-medium text-text-strong"
                                                    >
                                                        {formatINR(
                                                            getLineAmount(item),
                                                        )}
                                                    </div>
                                                </td>
                                                <td class="px-2 py-3 align-top">
                                                    <div
                                                        class="h-9 flex items-center justify-center"
                                                    >
                                                        <button
                                                            type="button"
                                                            class="text-text-muted hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                                                            onclick={() =>
                                                                removeItem(
                                                                    index,
                                                                )}
                                                            disabled={formData
                                                                .items
                                                                .length === 1}
                                                        >
                                                            <Trash2
                                                                class="size-4"
                                                            />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        {/each}
                                    </tbody>
                                </table>
                            </div>

                            <div class="border-t border-border p-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onclick={addItem}
                                >
                                    <Plus class="mr-1 size-4" />
                                    Add Row
                                </Button>
                            </div>
                        </div>
                    </section>

                    <!-- Section: Notes -->
                    <section class="space-y-4">
                        <h3
                            class="text-xs font-bold uppercase tracking-wide text-text-subtle"
                        >
                            Notes
                        </h3>
                        <textarea
                            id="notes"
                            name="notes"
                            bind:value={formData.notes}
                            rows="3"
                            placeholder="Customer-visible notes (will appear on invoice)"
                            class="w-full p-3 text-sm border border-border-strong rounded-lg resize-none bg-surface-0 text-text-strong placeholder:text-text-placeholder focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring/50"
                        ></textarea>
                    </section>
                </div>
            </div>
        </form>
    </main>

    <!-- Bottom Action Bar -->
    <div class="action-bar">
        <div class="flex items-center gap-4 text-sm mr-4 pr-4 border-r border-border">
            <Tooltip.Root delayDuration={100}>
                <Tooltip.Trigger>
                    <span class="inline-flex items-center gap-1.5 text-text-muted cursor-help">
                        <span>GST</span>
                        <span class="font-mono font-medium text-text-strong border-b border-dashed border-text-muted/50">{formatINR(isInterState ? totals.igst : totals.cgst + totals.sgst)}</span>
                    </span>
                </Tooltip.Trigger>
                <Tooltip.Content side="top" sideOffset={8}>
                    <div class="space-y-1 text-xs">
                        {#if pricesIncludeGst}
                            <div class="flex justify-between gap-4"><span>Taxable</span><span class="font-mono">{formatINR(totals.taxableAmount)}</span></div>
                        {:else}
                            <div class="flex justify-between gap-4"><span>Subtotal</span><span class="font-mono">{formatINR(totals.subtotal)}</span></div>
                        {/if}
                        {#if isInterState}
                            <div class="flex justify-between gap-4"><span>IGST</span><span class="font-mono">{formatINR(totals.igst)}</span></div>
                        {:else}
                            <div class="flex justify-between gap-4"><span>CGST</span><span class="font-mono">{formatINR(totals.cgst)}</span></div>
                            <div class="flex justify-between gap-4"><span>SGST</span><span class="font-mono">{formatINR(totals.sgst)}</span></div>
                        {/if}
                    </div>
                </Tooltip.Content>
            </Tooltip.Root>
            <div class="flex items-center gap-1.5 border-l border-border pl-4">
                <span class="font-semibold text-text-strong">Total</span>
                <span class="font-mono text-lg font-bold text-primary">{formatINR(totals.total)}</span>
            </div>
        </div>
        <div class="action-bar-group">
            <Button type="submit" form="invoice-form" disabled={submitting}>
                <Save class="mr-2 size-4" />
                {submitting ? "Saving..." : "Save Changes"}
            </Button>
            <Button variant="ghost" href="/invoices/{data.invoice.id}"
                >Cancel</Button
            >
        </div>
    </div>
</div>
