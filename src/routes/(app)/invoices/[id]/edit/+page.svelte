<script lang="ts">
    import { enhance } from "$app/forms";
    import { onMount } from "svelte";
    import { Button } from "$lib/components/ui/button";
    import { Checkbox } from "$lib/components/ui/checkbox";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import { Textarea } from "$lib/components/ui/textarea";

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

    // Split existing descriptions into name + notes on load
    function splitDescription(desc: string): { name: string; notes: string } {
        const idx = desc.indexOf("\n");
        if (idx === -1) return { name: desc, notes: "" };
        return { name: desc.substring(0, idx), notes: desc.substring(idx + 1) };
    }

    const parsedItems = lineItems.map((item) => {
        const { name, notes } = splitDescription(item.description);
        return { name, notes, item };
    });

    // Pre-populate form from existing invoice data
    let formData = $state({
        customer_id: invoice.customer_id,
        invoice_date: invoice.invoice_date,
        due_date: invoice.due_date,
        order_number: invoice.order_number || "",
        notes: invoice.notes || "",
        terms: invoice.terms || "",
        items: parsedItems.map(({ name, item }) => ({
            description: name,
            hsn_code: item.hsn_code || "",
            quantity: item.quantity,
            unit: item.unit || "nos",
            rate: item.rate,
            gst_rate: item.gst_rate,
            item_id: item.item_id || "",
        })) as (LineItem & { item_id?: string })[],
    });

    // Per-item notes (description sub-lines)
    let lineNotes = $state<string[]>(parsedItems.map((p) => p.notes));
    let showNotes = $state<boolean[]>(parsedItems.map((p) => p.notes.length > 0));

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
    let isMobileLineItemEditor = $state(false);

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
        lineNotes = [...lineNotes, ""];
        showNotes = [...showNotes, false];
    }

    function removeItem(index: number) {
        if (formData.items.length > 1) {
            formData.items = formData.items.filter((_, i) => i !== index);
            lineNotes = lineNotes.filter((_, i) => i !== index);
            showNotes = showNotes.filter((_, i) => i !== index);
        }
    }

    function getCombinedDescription(index: number): string {
        const desc = formData.items[index].description;
        const notes = lineNotes[index]?.trim();
        return notes ? `${desc}\n${notes}` : desc;
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

        const notes = [...lineNotes];
        const [reorderedNote] = notes.splice(dragItemIndex, 1);
        notes.splice(index, 0, reorderedNote);
        lineNotes = notes;

        const show = [...showNotes];
        const [reorderedShow] = show.splice(dragItemIndex, 1);
        show.splice(index, 0, reorderedShow);
        showNotes = show;

        dragItemIndex = null;
    }

    onMount(() => {
        const mediaQuery = window.matchMedia("(max-width: 639px)");
        const syncViewport = () => {
            isMobileLineItemEditor = mediaQuery.matches;
        };
        syncViewport();
        mediaQuery.addEventListener("change", syncViewport);
        return () => mediaQuery.removeEventListener("change", syncViewport);
    });
</script>

<div class="page-full-bleed">
    <!-- Header -->
    <header class="page-header items-center">
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
            <p class="text-sm text-slate-500 font-mono">
                {data.invoice.invoice_number}
            </p>
        </div>
    </header>

    {#if error}
        <div class="content-width-standard mt-4">
            <div
                class="bg-destructive/10 text-active p-3 rounded-md text-sm border border-destructive/20 text-destructive flex items-center gap-2"
            >
                <span class="h-1.5 w-1.5 rounded-full bg-destructive"></span>
                {error}
            </div>
        </div>
    {/if}

    <!-- Main Content -->
    <main class="page-body">
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

            <div class="content-width-standard space-y-8">
                    <!-- Section: Customer & Invoice Details -->
                    <section class="space-y-6">
                        <h3
                            class="text-xs font-bold uppercase tracking-wide text-slate-500"
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
                                    <input
                                        type="hidden"
                                        name="customer_id"
                                        value={formData.customer_id}
                                    />
                                    <div
                                        class="flex items-start gap-4 rounded-lg border border-slate-200 bg-white p-3"
                                    >
                                        <div class="flex-1 min-w-0">
                                            <div
                                                class="flex items-center gap-2"
                                            >
                                                <span
                                                    class="text-sm font-semibold text-[#111] truncate"
                                                    >{selectedCustomer.name}</span
                                                >
                                                {#if selectedCustomer.company_name}
                                                    <span
                                                        class="text-xs text-slate-400 truncate"
                                                        >{selectedCustomer.company_name}</span
                                                    >
                                                {/if}
                                            </div>
                                            <div
                                                class="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-slate-400"
                                            >
                                                {#if selectedCustomer.gstin}
                                                    <span class="font-mono"
                                                        >{selectedCustomer.gstin}</span
                                                    >
                                                {:else}
                                                    <span>No GSTIN</span>
                                                {/if}
                                                {#if selectedCustomerAddress}
                                                    <span
                                                        class="truncate max-w-[250px]"
                                                        >{selectedCustomerAddress}</span
                                                    >
                                                {/if}
                                            </div>
                                            {#if selectedCustomer.gst_treatment || isInterState}
                                                <div
                                                    class="flex items-center gap-2 mt-1.5"
                                                >
                                                    {#if selectedCustomer.gst_treatment}
                                                        <span
                                                            class="rounded-sm bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400"
                                                            >{selectedCustomer.gst_treatment}</span
                                                        >
                                                    {/if}
                                                    {#if isInterState}
                                                        <span
                                                            class="rounded-sm bg-info/10 text-info px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                                                            >IGST</span
                                                        >
                                                    {/if}
                                                </div>
                                            {/if}
                                        </div>
                                        <button
                                            type="button"
                                            class="text-xs text-[#111] font-medium hover:underline shrink-0"
                                            onclick={() => {
                                                formData.customer_id = "";
                                            }}
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
                                            class="w-full border-slate-300 bg-white focus:ring-1 focus:ring-slate-200"
                                        >
                                            <span
                                                class="text-sm text-slate-400"
                                                >Select a customer</span
                                            >
                                        </Select.Trigger>
                                        <Select.Content
                                            class="bg-[#FAFAFA] border-slate-200 shadow-lg min-w-[22rem]"
                                        >
                                            <div
                                                class="sticky top-0 z-10 -mx-1 px-2 pt-2 pb-2 bg-[#FAFAFA] border-b border-slate-200 space-y-2"
                                            >
                                                <Input
                                                    bind:value={customerSearch}
                                                    placeholder="Search customers"
                                                    class="h-8 border-slate-300 text-sm"
                                                />
                                                <div
                                                    class="flex items-center justify-between"
                                                >
                                                    <span
                                                        class="text-[10px] uppercase tracking-wide text-slate-500 font-semibold"
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
                                                    class="px-3 py-4 text-xs text-slate-400"
                                                >
                                                    No customers match "{customerSearch}"
                                                </div>
                                            {:else}
                                                {#each filteredCustomers as customer}
                                                    <Select.Item
                                                        value={customer.id}
                                                        class="hover:bg-slate-100 focus:bg-slate-100 cursor-pointer"
                                                    >
                                                        <div
                                                            class="flex flex-col text-left"
                                                        >
                                                            <span
                                                                class="font-medium text-[#111]"
                                                                >{customer.name}</span
                                                            >
                                                            {#if customer.company_name}
                                                                <span
                                                                    class="text-[10px] text-slate-400 uppercase tracking-wide"
                                                                    >{customer.company_name}</span
                                                                >
                                                            {/if}
                                                            {#if customer.gstin}
                                                                <span
                                                                    class="text-[10px] font-mono text-slate-400"
                                                                    >GSTIN {customer.gstin}</span
                                                                >
                                                            {/if}
                                                            {#if customer.city || customer.state_code}
                                                                <span
                                                                    class="text-[10px] text-slate-400"
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
                                    class="bg-slate-100/50 text-slate-500 border-slate-200 font-mono text-sm"
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
                                    class="border-slate-300 text-[#111] bg-white focus:border-slate-400"
                                />
                            </div>
                        </div>
                    </section>

                    <!-- Section: Dates -->
                    <section class="space-y-6">
                        <h3
                            class="text-xs font-bold uppercase tracking-wide text-slate-500"
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
                                    class="border-slate-300 bg-white"
                                />
                            </div>
                            <div class="space-y-2">
                                <Label for="terms" variant="form">Terms</Label>
                                <Select.Root
                                    type="single"
                                    bind:value={formData.terms}
                                >
                                    <Select.Trigger
                                        class="h-9 border-slate-300 text-sm bg-white"
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
                                    class="border-slate-300 bg-white"
                                />
                            </div>
                        </div>
                    </section>

                    <!-- Section: Line Items -->
                    <section class="space-y-4">
                        <div class="flex justify-between items-center">
                            <h3
                                class="text-xs font-bold uppercase tracking-wide text-slate-500"
                            >
                                Line Items
                            </h3>
                            <label
                                class="flex items-center gap-2 cursor-pointer"
                            >
                                <span
                                    class="text-xs font-medium text-slate-500"
                                >
                                    Prices include GST
                                </span>
                                <Checkbox
                                    bind:checked={pricesIncludeGst}
                                    aria-label="Prices include GST"
                                    class="border-slate-300 data-[state=checked]:border-slate-400"
                                />
                            </label>
                        </div>

                        {#if isMobileLineItemEditor}
                            <div class="space-y-3">
                                {#each formData.items as item, index}
                                    <article
                                        class="rounded-lg border border-slate-200 bg-white p-3 space-y-3"
                                    >
                                        <div
                                            class="flex items-center justify-between"
                                        >
                                            <span
                                                class="text-[10px] font-semibold uppercase tracking-wide text-slate-500"
                                            >
                                                Item {index + 1}
                                            </span>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon-touch"
                                                class="shrink-0"
                                                onclick={() =>
                                                    removeItem(index)}
                                                disabled={formData.items
                                                    .length === 1}
                                                aria-label={`Remove item ${index + 1}`}
                                            >
                                                <Trash2 class="size-4" />
                                            </Button>
                                        </div>

                                        <div class="space-y-1.5">
                                            <Label variant="form"
                                                >Description</Label
                                            >
                                            <ItemCombobox
                                                catalogItems={data.catalogItems}
                                                bind:value={
                                                    formData.items[index]
                                                }
                                                onSelect={(item) =>
                                                    handleItemSelect(
                                                        index,
                                                        item,
                                                    )}
                                                name=""
                                                placeholder="Search or enter item..."
                                            />
                                            <input
                                                type="hidden"
                                                name="items[{index}].description"
                                                value={getCombinedDescription(index)}
                                            />
                                            <input
                                                type="hidden"
                                                name="items[{index}].item_id"
                                                value={item.item_id || ""}
                                            />
                                            <input
                                                type="hidden"
                                                name="items[{index}].unit"
                                                value={item.unit || "nos"}
                                            />
                                            {#if showNotes[index]}
                                                <textarea
                                                    bind:value={lineNotes[index]}
                                                    placeholder="Add details or description..."
                                                    rows="2"
                                                    class="w-full text-xs text-slate-500 bg-[#FAFAFA] border border-slate-200 rounded-md px-2 py-1.5 resize-none focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-200 placeholder:text-slate-400"
                                                ></textarea>
                                            {:else}
                                                <button
                                                    type="button"
                                                    class="text-[11px] text-slate-400 hover:text-[#111] hover:underline"
                                                    onclick={() => (showNotes[index] = true)}
                                                >
                                                    + Add description
                                                </button>
                                            {/if}
                                        </div>

                                        <div class="grid grid-cols-2 gap-3">
                                            <div class="space-y-1.5">
                                                <Label variant="form"
                                                    >HSN/SAC</Label
                                                >
                                                <Input
                                                    name="items[{index}].hsn_code"
                                                    bind:value={item.hsn_code}
                                                    placeholder="HSN"
                                                    class="h-9 border-slate-300 text-center bg-[#FAFAFA] focus:border-slate-400 font-mono"
                                                />
                                            </div>
                                            <div class="space-y-1.5">
                                                <Label variant="form">Qty</Label
                                                >
                                                <Input
                                                    name="items[{index}].quantity"
                                                    type="number"
                                                    bind:value={item.quantity}
                                                    min="0.01"
                                                    step="0.01"
                                                    class="h-9 border-slate-300 text-right bg-[#FAFAFA] focus:border-slate-400 font-mono"
                                                />
                                            </div>
                                        </div>

                                        <div class="grid grid-cols-2 gap-3">
                                            <div class="space-y-1.5">
                                                <Label variant="form"
                                                    >Rate</Label
                                                >
                                                <Input
                                                    name="items[{index}].rate"
                                                    type="number"
                                                    bind:value={item.rate}
                                                    min="0"
                                                    step="0.01"
                                                    class="h-9 border-slate-300 text-right bg-[#FAFAFA] focus:border-slate-400 font-mono"
                                                />
                                            </div>
                                            <div class="space-y-1.5">
                                                <Label variant="form">GST</Label
                                                >
                                                <Select.Root
                                                    type="single"
                                                    value={`${item.gst_rate}`}
                                                    onValueChange={(value) =>
                                                        (item.gst_rate =
                                                            Number(value))}
                                                >
                                                    <Select.Trigger
                                                        class="h-9 w-full border-slate-300 bg-[#FAFAFA] text-right text-xs font-mono"
                                                    >
                                                        {item.gst_rate}%
                                                    </Select.Trigger>
                                                    <Select.Content
                                                        class="min-w-[7rem]"
                                                    >
                                                        {#each GST_RATES as rate}
                                                            <Select.Item
                                                                value={`${rate}`}
                                                                >{rate}%</Select.Item
                                                            >
                                                        {/each}
                                                    </Select.Content>
                                                </Select.Root>
                                                <input
                                                    type="hidden"
                                                    name="items[{index}].gst_rate"
                                                    value={item.gst_rate}
                                                />
                                            </div>
                                        </div>

                                        <div
                                            class="flex items-center justify-between rounded-md border border-slate-100 bg-slate-100 px-3 py-2"
                                        >
                                            <span
                                                class="text-[10px] font-semibold uppercase tracking-wide text-slate-500"
                                            >
                                                Amount
                                            </span>
                                            <span
                                                class="font-mono font-semibold text-[#111]"
                                            >
                                                {formatINR(getLineAmount(item))}
                                            </span>
                                        </div>
                                    </article>
                                {/each}

                                <Button
                                    type="button"
                                    variant="outline"
                                    class="h-10 w-full"
                                    onclick={addItem}
                                >
                                    <Plus class="mr-1 size-4" />
                                    Add Row
                                </Button>
                            </div>
                        {:else}
                            <div
                                class="rounded-lg border border-slate-200 overflow-hidden bg-white"
                            >
                                <div class="overflow-x-auto">
                                    <table class="w-full text-sm">
                                        <thead>
                                            <tr
                                                class="border-b border-slate-200 text-[10px] uppercase tracking-wide font-semibold text-slate-500 bg-slate-100/50"
                                            >
                                                <th
                                                    class="px-2 py-3 w-8 text-center"
                                                ></th>
                                                <th class="px-4 py-3 text-left"
                                                    >Item Details</th
                                                >
                                                <th
                                                    class="px-3 py-3 text-left w-28"
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
                                                <th class="px-2 py-3 w-12"></th>
                                            </tr>
                                        </thead>
                                        <tbody
                                            class="divide-y divide-border-subtle"
                                        >
                                            {#each formData.items as item, index}
                                                <tr
                                                    class="group hover:bg-slate-100/30 transition-colors {dragItemIndex ===
                                                    index
                                                        ? 'opacity-50 border-2 border-dashed border-slate-400'
                                                        : ''}"
                                                    draggable={true}
                                                    ondragstart={() =>
                                                        handleDragStart(index)}
                                                    ondragover={handleDragOver}
                                                    ondrop={() =>
                                                        handleDrop(index)}
                                                >
                                                    <td
                                                        class="px-2 py-3 align-top"
                                                    >
                                                        <div
                                                            class="h-9 flex items-center justify-center cursor-move text-slate-400/50 hover:text-[#111] touch-none"
                                                        >
                                                            <GripVertical
                                                                class="size-4"
                                                            />
                                                        </div>
                                                    </td>
                                                    <td
                                                        class="px-2 py-2 align-top"
                                                    >
                                                        <div class="w-full space-y-1">
                                                            <div
                                                                class="relative flex items-center gap-1 w-full"
                                                            >
                                                                <ItemCombobox
                                                                    catalogItems={data.catalogItems}
                                                                    bind:value={
                                                                        formData
                                                                            .items[
                                                                            index
                                                                        ]
                                                                    }
                                                                    onSelect={(
                                                                        item,
                                                                    ) =>
                                                                        handleItemSelect(
                                                                            index,
                                                                            item,
                                                                        )}
                                                                    name=""
                                                                    placeholder="Search or enter item..."
                                                                />
                                                                <input
                                                                    type="hidden"
                                                                    name="items[{index}].description"
                                                                    value={getCombinedDescription(index)}
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
                                                            {#if showNotes[index]}
                                                                <textarea
                                                                    bind:value={lineNotes[index]}
                                                                    placeholder="Add details or description..."
                                                                    rows="2"
                                                                    class="w-full text-xs text-slate-500 bg-[#FAFAFA] border border-slate-200 rounded-md px-2 py-1.5 resize-none focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-200 placeholder:text-slate-400"
                                                                ></textarea>
                                                            {:else}
                                                                <button
                                                                    type="button"
                                                                    class="text-[11px] text-slate-400 hover:text-[#111] hover:underline"
                                                                    onclick={() => (showNotes[index] = true)}
                                                                >
                                                                    + Add description
                                                                </button>
                                                            {/if}
                                                        </div>
                                                    </td>
                                                    <td
                                                        class="px-2 py-2 align-top"
                                                    >
                                                        <Input
                                                            name="items[{index}].hsn_code"
                                                            bind:value={
                                                                item.hsn_code
                                                            }
                                                            placeholder="HSN"
                                                            class="h-9 border-slate-300 text-center bg-[#FAFAFA] focus:border-slate-400 font-mono"
                                                        />
                                                    </td>
                                                    <td
                                                        class="px-2 py-2 align-top"
                                                    >
                                                        <Input
                                                            name="items[{index}].quantity"
                                                            type="number"
                                                            bind:value={
                                                                item.quantity
                                                            }
                                                            min="0.01"
                                                            step="0.01"
                                                            class="h-9 border-slate-300 text-right bg-[#FAFAFA] focus:border-slate-400 font-mono"
                                                        />
                                                    </td>
                                                    <td
                                                        class="px-2 py-2 align-top"
                                                    >
                                                        <Input
                                                            name="items[{index}].rate"
                                                            type="number"
                                                            bind:value={
                                                                item.rate
                                                            }
                                                            min="0"
                                                            step="0.01"
                                                            class="h-9 border-slate-300 text-right bg-[#FAFAFA] focus:border-slate-400 font-mono"
                                                        />
                                                    </td>
                                                    <td
                                                        class="px-2 py-2 align-top"
                                                    >
                                                        <Select.Root
                                                            type="single"
                                                            value={`${item.gst_rate}`}
                                                            onValueChange={(
                                                                value,
                                                            ) =>
                                                                (item.gst_rate =
                                                                    Number(
                                                                        value,
                                                                    ))}
                                                        >
                                                            <Select.Trigger
                                                                class="h-9 w-full border-slate-300 bg-[#FAFAFA] text-right text-xs font-mono"
                                                            >
                                                                {item.gst_rate}%
                                                            </Select.Trigger>
                                                            <Select.Content
                                                                class="min-w-[7rem]"
                                                            >
                                                                {#each GST_RATES as rate}
                                                                    <Select.Item
                                                                        value={`${rate}`}
                                                                        >{rate}%</Select.Item
                                                                    >
                                                                {/each}
                                                            </Select.Content>
                                                        </Select.Root>
                                                        <input
                                                            type="hidden"
                                                            name="items[{index}].gst_rate"
                                                            value={item.gst_rate}
                                                        />
                                                    </td>
                                                    <td
                                                        class="px-2 py-2 align-top"
                                                    >
                                                        <div
                                                            class="h-9 flex items-center justify-end font-mono font-medium text-[#111]"
                                                        >
                                                            {formatINR(
                                                                getLineAmount(
                                                                    item,
                                                                ),
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td
                                                        class="px-2 py-3 align-top"
                                                    >
                                                        <div
                                                            class="h-11 flex items-center justify-center"
                                                        >
                                                            <button
                                                                type="button"
                                                                class="inline-flex h-11 w-11 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
                                                                onclick={() =>
                                                                    removeItem(
                                                                        index,
                                                                    )}
                                                                disabled={formData
                                                                    .items
                                                                    .length ===
                                                                    1}
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

                                <div class="border-t border-slate-200 p-3">
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
                        {/if}
                    </section>

                    <!-- Section: Notes -->
                    <section class="space-y-4">
                        <h3
                            class="text-xs font-bold uppercase tracking-wide text-slate-500"
                        >
                            Notes
                        </h3>
                        <Textarea
                            id="notes"
                            name="notes"
                            bind:value={formData.notes}
                            rows={3}
                            placeholder="Customer-visible notes (will appear on invoice)"
                            class="resize-none"
                        />
                    </section>
            </div>
        </form>
    </main>

    <!-- Bottom Action Bar -->
    <div class="action-bar">
        <div
            class="flex items-center gap-4 text-sm mr-4 pr-4 border-r border-slate-200"
        >
            <Tooltip.Root delayDuration={100}>
                <Tooltip.Trigger>
                    <span
                        class="inline-flex items-center gap-1.5 text-slate-400 cursor-help"
                    >
                        <span>GST</span>
                        <span
                            class="font-mono font-medium text-[#111] border-b border-dashed border-text-muted/50"
                            >{formatINR(
                                isInterState
                                    ? totals.igst
                                    : totals.cgst + totals.sgst,
                            )}</span
                        >
                    </span>
                </Tooltip.Trigger>
                <Tooltip.Content side="top" sideOffset={8}>
                    <div class="space-y-1 text-xs">
                        {#if pricesIncludeGst}
                            <div class="flex justify-between gap-4">
                                <span>Taxable</span><span class="font-mono"
                                    >{formatINR(totals.taxableAmount)}</span
                                >
                            </div>
                        {:else}
                            <div class="flex justify-between gap-4">
                                <span>Subtotal</span><span class="font-mono"
                                    >{formatINR(totals.subtotal)}</span
                                >
                            </div>
                        {/if}
                        {#if isInterState}
                            <div class="flex justify-between gap-4">
                                <span>IGST</span><span class="font-mono"
                                    >{formatINR(totals.igst)}</span
                                >
                            </div>
                        {:else}
                            <div class="flex justify-between gap-4">
                                <span>CGST</span><span class="font-mono"
                                    >{formatINR(totals.cgst)}</span
                                >
                            </div>
                            <div class="flex justify-between gap-4">
                                <span>SGST</span><span class="font-mono"
                                    >{formatINR(totals.sgst)}</span
                                >
                            </div>
                        {/if}
                    </div>
                </Tooltip.Content>
            </Tooltip.Root>
            <div class="flex items-center gap-1.5 border-l border-slate-200 pl-4">
                <span class="font-semibold text-[#111]">Total</span>
                <span class="font-mono text-lg font-bold text-[#111]"
                    >{formatINR(totals.total)}</span
                >
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
