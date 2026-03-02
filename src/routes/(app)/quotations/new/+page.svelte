<script lang="ts">
    import { enhance } from "$app/forms";
    import { onMount } from "svelte";
    import { Button } from "$lib/components/ui/button";
    import { Checkbox } from "$lib/components/ui/checkbox";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import { Textarea } from "$lib/components/ui/textarea";

    import * as Select from "$lib/components/ui/select";
    import { GST_RATES, calculateInvoiceTotals, type LineItem } from "./schema";
    import { toast } from "svelte-sonner";
    import { ArrowLeft, Save, Plus, Trash2, GripVertical } from "lucide-svelte";
    import * as Tooltip from "$lib/components/ui/tooltip";
    import { formatINR } from "$lib/utils/currency";
    import ItemCombobox from "$lib/components/ItemCombobox.svelte";

    type CatalogItem = (typeof data.catalogItems)[number];

    let { data } = $props();
    const { defaults } = data;

    // Form state
    let formData = $state({
        customer_id: "",
        quotation_date: defaults.quotation_date,
        valid_until: defaults.valid_until,
        subject: "",
        reference_number: "",
        notes: "",
        terms: defaults.terms || "",
        items: [
            {
                description: "",
                hsn_code: "",
                quantity: 1,
                unit: "nos",
                rate: 0,
                gst_rate: 18,
                item_id: "",
            },
        ] as (LineItem & { item_id?: string })[],
    });

    let pricesIncludeGst = $state(data.orgPricesIncludeGst ?? false);
    let submitting = $state(false);
    let error = $state<string | null>(null);
    let autoQuotationNumber = data.autoQuotationNumber as string;

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
        <div class="flex items-center gap-4">
            <Button
                variant="ghost"
                href="/quotations"
                size="icon"
                class="h-8 w-8"
            >
                <ArrowLeft class="size-4" />
            </Button>
            <div>
                <h1 class="text-xl font-bold tracking-tight text-text-strong">
                    New Quotation
                </h1>
                <p class="text-sm text-text-subtle">
                    Create a quotation for your customer
                </p>
            </div>
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
            id="quotation-form"
            method="POST"
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

            <div class="content-width-standard space-y-5">
                <!-- Top form fields: horizontal label-input rows -->
                <section class="space-y-3">
                    <!-- Customer Row -->
                    <div
                        class="flex flex-col sm:flex-row sm:items-start gap-1.5 sm:gap-4"
                    >
                        <Label
                            for="customer_id"
                            variant="form"
                            class="sm:w-32 shrink-0 sm:pt-2.5 text-xs font-bold uppercase tracking-wide text-text-subtle"
                        >
                            Customer <span class="text-destructive">*</span>
                        </Label>
                        <div class="flex-1 min-w-0">
                            {#if selectedCustomer}
                                <input
                                    type="hidden"
                                    name="customer_id"
                                    value={formData.customer_id}
                                />
                                <div
                                    class="flex items-start gap-4 rounded-lg border border-border bg-surface-0 p-3"
                                >
                                    <div class="flex-1 min-w-0">
                                        <div class="flex items-center gap-2">
                                            <span
                                                class="text-sm font-semibold text-text-strong truncate"
                                                >{selectedCustomer.name}</span
                                            >
                                            {#if selectedCustomer.company_name}
                                                <span
                                                    class="text-xs text-text-muted truncate"
                                                    >{selectedCustomer.company_name}</span
                                                >
                                            {/if}
                                        </div>
                                        <div
                                            class="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-text-muted"
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
                                        {#if isInterState}
                                            <span
                                                class="mt-1.5 inline-block rounded-sm bg-info/10 text-info px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                                                >IGST</span
                                            >
                                        {/if}
                                    </div>
                                    <button
                                        type="button"
                                        class="text-xs text-primary font-medium hover:underline shrink-0"
                                        onclick={() => {
                                            formData.customer_id = "";
                                        }}>Change</button
                                    >
                                </div>
                            {:else}
                                <Select.Root
                                    type="single"
                                    name="customer_id"
                                    bind:value={formData.customer_id}
                                >
                                    <Select.Trigger
                                        id="customer_id"
                                        class="w-full border-border-strong bg-surface-0 focus:ring-1 focus:ring-primary/20"
                                    >
                                        <span class="text-sm text-text-muted"
                                            >Select a customer</span
                                        >
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
                                                    </div>
                                                </Select.Item>
                                            {/each}
                                        {/if}
                                    </Select.Content>
                                </Select.Root>
                            {/if}
                        </div>
                    </div>

                    <!-- Quotation Number Row -->
                    <div
                        class="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4"
                    >
                        <Label
                            for="quotation_number"
                            variant="form"
                            class="sm:w-32 shrink-0 text-xs font-bold uppercase tracking-wide text-text-subtle"
                        >
                            Quotation #
                        </Label>
                        <div class="flex-1">
                            <Input
                                id="quotation_number"
                                value={autoQuotationNumber}
                                readonly
                                class="bg-surface-2/50 text-text-subtle border-border font-mono text-sm max-w-xs"
                            />
                        </div>
                    </div>

                    <!-- Reference Number Row -->
                    <div
                        class="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4"
                    >
                        <Label
                            for="reference_number"
                            variant="form"
                            class="sm:w-32 shrink-0 text-xs font-bold uppercase tracking-wide text-text-subtle"
                        >
                            Reference #
                        </Label>
                        <div class="flex-1">
                            <Input
                                id="reference_number"
                                name="reference_number"
                                bind:value={formData.reference_number}
                                placeholder="Customer enquiry ref"
                                class="border-border-strong text-text-strong bg-surface-0 focus:border-primary max-w-xs"
                            />
                        </div>
                    </div>

                    <!-- Subject Row -->
                    <div
                        class="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4"
                    >
                        <Label
                            for="subject"
                            variant="form"
                            class="sm:w-32 shrink-0 text-xs font-bold uppercase tracking-wide text-text-subtle"
                        >
                            Subject
                        </Label>
                        <div class="flex-1">
                            <Input
                                id="subject"
                                name="subject"
                                bind:value={formData.subject}
                                placeholder="e.g. Supply of 500 iPhone cases"
                                class="border-border-strong text-text-strong bg-surface-0 focus:border-primary"
                            />
                        </div>
                    </div>

                    <!-- Dates Row: Quotation Date + Validity + Valid Until in one line -->
                    <div
                        class="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4"
                    >
                        <Label
                            for="quotation_date"
                            variant="form"
                            class="sm:w-32 shrink-0 text-xs font-bold uppercase tracking-wide text-text-subtle"
                        >
                            Quote Date <span class="text-destructive">*</span>
                        </Label>
                        <div
                            class="flex flex-1 flex-wrap items-center gap-x-4 gap-y-2"
                        >
                            <Input
                                id="quotation_date"
                                name="quotation_date"
                                type="date"
                                bind:value={formData.quotation_date}
                                class="border-border-strong bg-surface-0 w-40"
                            />
                            <div class="flex items-center gap-2">
                                <span
                                    class="text-xs font-bold uppercase tracking-wide text-text-subtle"
                                    >Validity</span
                                >
                                <Select.Root
                                    type="single"
                                    value="30"
                                    onValueChange={(val) => {
                                        const days = parseInt(val);
                                        const d = new Date(
                                            formData.quotation_date ||
                                                Date.now(),
                                        );
                                        d.setDate(d.getDate() + days);
                                        formData.valid_until = d
                                            .toISOString()
                                            .slice(0, 10);
                                    }}
                                >
                                    <Select.Trigger
                                        class="h-9 w-32 border-border-strong text-sm bg-surface-0"
                                        >30 days</Select.Trigger
                                    >
                                    <Select.Content>
                                        <Select.Item value="15"
                                            >15 days</Select.Item
                                        >
                                        <Select.Item value="30"
                                            >30 days</Select.Item
                                        >
                                        <Select.Item value="45"
                                            >45 days</Select.Item
                                        >
                                        <Select.Item value="60"
                                            >60 days</Select.Item
                                        >
                                    </Select.Content>
                                </Select.Root>
                            </div>
                            <div class="flex items-center gap-2">
                                <span
                                    class="text-xs font-bold uppercase tracking-wide text-text-subtle"
                                    >Valid Until <span class="text-destructive"
                                        >*</span
                                    ></span
                                >
                                <Input
                                    id="valid_until"
                                    name="valid_until"
                                    type="date"
                                    bind:value={formData.valid_until}
                                    class="border-border-strong bg-surface-0 w-40"
                                />
                            </div>
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
                        <label class="flex items-center gap-2 cursor-pointer">
                            <span class="text-xs font-medium text-text-subtle">
                                Prices include GST
                            </span>
                            <Checkbox
                                bind:checked={pricesIncludeGst}
                                aria-label="Prices include GST"
                                class="border-border-strong data-[state=checked]:border-primary"
                            />
                        </label>
                    </div>

                    {#if isMobileLineItemEditor}
                        <div class="space-y-3">
                            {#each formData.items as item, index}
                                <article
                                    class="rounded-lg border border-border bg-surface-0 p-3 space-y-3"
                                >
                                    <div
                                        class="flex items-center justify-between"
                                    >
                                        <span
                                            class="text-[10px] font-semibold uppercase tracking-wide text-text-subtle"
                                        >
                                            Item {index + 1}
                                        </span>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon-touch"
                                            class="shrink-0"
                                            onclick={() => removeItem(index)}
                                            disabled={formData.items.length ===
                                                1}
                                            aria-label={`Remove item ${index + 1}`}
                                        >
                                            <Trash2 class="size-4" />
                                        </Button>
                                    </div>

                                    <div class="space-y-1.5">
                                        <Label variant="form">Description</Label
                                        >
                                        <ItemCombobox
                                            catalogItems={data.catalogItems}
                                            bind:value={formData.items[index]}
                                            onSelect={(item) =>
                                                handleItemSelect(index, item)}
                                            name="items[{index}].description"
                                            placeholder="Search or enter item..."
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
                                    </div>

                                    <div class="grid grid-cols-2 gap-3">
                                        <div class="space-y-1.5">
                                            <Label variant="form">HSN/SAC</Label
                                            >
                                            <Input
                                                name="items[{index}].hsn_code"
                                                bind:value={item.hsn_code}
                                                placeholder="HSN"
                                                class="h-9 border-border-strong text-center bg-surface-1 focus:border-primary font-mono"
                                            />
                                        </div>
                                        <div class="space-y-1.5">
                                            <Label variant="form">Qty</Label>
                                            <Input
                                                name="items[{index}].quantity"
                                                type="number"
                                                bind:value={item.quantity}
                                                min="0.01"
                                                step="0.01"
                                                class="h-9 border-border-strong text-right bg-surface-1 focus:border-primary font-mono"
                                            />
                                        </div>
                                    </div>

                                    <div class="grid grid-cols-2 gap-3">
                                        <div class="space-y-1.5">
                                            <Label variant="form">Rate</Label>
                                            <Input
                                                name="items[{index}].rate"
                                                type="number"
                                                bind:value={item.rate}
                                                min="0"
                                                step="0.01"
                                                class="h-9 border-border-strong text-right bg-surface-1 focus:border-primary font-mono"
                                            />
                                        </div>
                                        <div class="space-y-1.5">
                                            <Label variant="form">GST</Label>
                                            <Select.Root
                                                type="single"
                                                value={`${item.gst_rate}`}
                                                onValueChange={(value) =>
                                                    (item.gst_rate =
                                                        Number(value))}
                                            >
                                                <Select.Trigger
                                                    class="h-9 w-full border-border-strong bg-surface-1 text-right text-xs font-mono"
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
                                        class="flex items-center justify-between rounded-md border border-border-subtle bg-surface-2 px-3 py-2"
                                    >
                                        <span
                                            class="text-[10px] font-semibold uppercase tracking-wide text-text-subtle"
                                        >
                                            Amount
                                        </span>
                                        <span
                                            class="font-mono font-semibold text-text-strong"
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
                                            <th class="px-2 py-3 w-12"></th>
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
                                                        class="h-9 border-border-strong text-center bg-surface-1 focus:border-primary font-mono"
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
                                                        class="h-9 border-border-strong text-right bg-surface-1 focus:border-primary font-mono"
                                                    />
                                                </td>
                                                <td class="px-2 py-2 align-top">
                                                    <Input
                                                        name="items[{index}].rate"
                                                        type="number"
                                                        bind:value={item.rate}
                                                        min="0"
                                                        step="0.01"
                                                        class="h-9 border-border-strong text-right bg-surface-1 focus:border-primary font-mono"
                                                    />
                                                </td>
                                                <td class="px-2 py-2 align-top">
                                                    <Select.Root
                                                        type="single"
                                                        value={`${item.gst_rate}`}
                                                        onValueChange={(
                                                            value,
                                                        ) =>
                                                            (item.gst_rate =
                                                                Number(value))}
                                                    >
                                                        <Select.Trigger
                                                            class="h-9 w-full border-border-strong bg-surface-1 text-right text-xs font-mono"
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
                                                        class="h-11 flex items-center justify-center"
                                                    >
                                                        <button
                                                            type="button"
                                                            class="inline-flex h-11 w-11 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
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
                    {/if}
                </section>

                <!-- Notes + Totals: side-by-side -->
                <section
                    class="grid gap-5 md:grid-cols-[1fr_minmax(0,22rem)] items-start"
                >
                    <!-- Left: Customer Notes -->
                    <div class="space-y-2 order-2 md:order-1">
                        <h3
                            class="text-xs font-bold uppercase tracking-wide text-text-subtle"
                        >
                            Customer Notes
                        </h3>
                        <Textarea
                            id="notes"
                            name="notes"
                            bind:value={formData.notes}
                            rows={4}
                            placeholder="Will be displayed on the quotation"
                            class="resize-none border-border-strong bg-surface-0"
                        />
                        <p class="text-[11px] text-text-muted">
                            Visible to the customer on the quotation PDF
                        </p>
                    </div>

                    <!-- Right: Totals Panel -->
                    <div
                        class="order-1 md:order-2 rounded-lg border border-border bg-surface-0 overflow-hidden"
                    >
                        <div class="divide-y divide-border-subtle text-sm">
                            <div
                                class="flex items-center justify-between px-4 py-2.5"
                            >
                                <span class="text-text-subtle">Sub Total</span>
                                <span class="font-mono text-text-strong"
                                    >{formatINR(totals.subtotal)}</span
                                >
                            </div>

                            {#if isInterState}
                                <div
                                    class="flex items-center justify-between px-4 py-2"
                                >
                                    <span class="text-text-muted text-xs"
                                        >IGST</span
                                    >
                                    <span
                                        class="font-mono text-text-subtle text-xs"
                                        >{formatINR(totals.igst)}</span
                                    >
                                </div>
                            {:else}
                                <div
                                    class="flex items-center justify-between px-4 py-2"
                                >
                                    <span class="text-text-muted text-xs"
                                        >CGST</span
                                    >
                                    <span
                                        class="font-mono text-text-subtle text-xs"
                                        >{formatINR(totals.cgst)}</span
                                    >
                                </div>
                                <div
                                    class="flex items-center justify-between px-4 py-2"
                                >
                                    <span class="text-text-muted text-xs"
                                        >SGST</span
                                    >
                                    <span
                                        class="font-mono text-text-subtle text-xs"
                                        >{formatINR(totals.sgst)}</span
                                    >
                                </div>
                            {/if}
                        </div>

                        <!-- Total (highlighted) -->
                        <div
                            class="flex items-center justify-between px-4 py-3 bg-surface-2/50 border-t border-border"
                        >
                            <span class="font-semibold text-text-strong"
                                >Total (₹)</span
                            >
                            <span
                                class="font-mono font-bold text-base text-text-strong"
                                >{formatINR(totals.total)}</span
                            >
                        </div>
                    </div>
                </section>
            </div>
        </form>
    </main>

    <!-- Bottom Action Bar -->
    <div class="action-bar sticky bottom-0">
        <div
            class="flex items-center gap-2 w-full md:w-auto md:mr-4 md:pr-4 md:border-r md:border-border"
        >
            <span
                class="hidden md:inline-flex items-center gap-1.5 text-text-muted text-sm"
            >
                <Tooltip.Root delayDuration={100}>
                    <Tooltip.Trigger>
                        <span
                            class="inline-flex items-center gap-1.5 cursor-help"
                        >
                            <span>GST</span>
                            <span
                                class="font-mono font-medium text-text-strong border-b border-dashed border-text-muted/50"
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
            </span>
            <div
                class="flex items-center gap-1.5 md:border-l md:border-border md:pl-4"
            >
                <span class="font-semibold text-text-strong text-sm">Total</span
                >
                <span
                    class="font-mono text-base md:text-lg font-bold text-primary"
                    >{formatINR(totals.total)}</span
                >
            </div>
        </div>
        <div class="action-bar-group ml-auto">
            <Button
                type="submit"
                form="quotation-form"
                name="intent"
                value="send"
                disabled={submitting}
                size="sm"
            >
                <Save class="mr-1.5 size-3.5" />
                <span class="hidden sm:inline"
                    >{submitting ? "Saving..." : "Save & Send"}</span
                >
                <span class="sm:hidden">{submitting ? "..." : "Send"}</span>
            </Button>
            <Button
                type="submit"
                form="quotation-form"
                name="intent"
                value="draft"
                disabled={submitting}
                variant="outline"
                size="sm"
            >
                <span class="hidden sm:inline">Save Draft</span>
                <span class="sm:hidden">Draft</span>
            </Button>
            <Button variant="ghost" size="sm" href="/quotations">Cancel</Button>
        </div>
    </div>
</div>
