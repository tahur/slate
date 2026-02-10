<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import * as Select from "$lib/components/ui/select";
    import { superForm } from "sveltekit-superforms";
    import { toast } from "svelte-sonner";
    import { UNITS, GST_RATES } from "../new/schema";
    import { formatINR } from "$lib/utils/currency";
    import {
        ArrowLeft,
        Save,
        Pencil,
        X,
        Trash2,
        Package,
        Briefcase,
    } from "lucide-svelte";

    let { data } = $props();

    let isEditing = $state(false);
    let gstRateStr = $state(String(data.item.gst_rate));

    const { form, errors, enhance, submitting } = superForm(data.form, {
        onResult: ({ result }) => {
            if (result.type === "success") {
                isEditing = false;
                toast.success("Item updated successfully.");
            }
            if (result.type === "failure" && result.data?.error) {
                toast.error(result.data.error as string);
            }
        },
    });
</script>

<div class="page-full-bleed">
    <!-- Header -->
    <header
        class="flex items-center justify-between gap-4 px-6 py-4 border-b border-border bg-surface-0 z-20"
    >
        <div class="flex items-center gap-4">
            <Button variant="ghost" href="/items" size="icon" class="h-8 w-8">
                <ArrowLeft class="size-4" />
            </Button>
            <div>
                <h1 class="text-xl font-bold tracking-tight text-text-strong">
                    {data.item.name}
                </h1>
                <p class="text-sm text-text-subtle capitalize">
                    {data.item.type}
                    {#if !data.item.is_active}
                        <span class="text-gray-500"> (Inactive)</span>
                    {/if}
                </p>
            </div>
        </div>
        <div class="flex items-center gap-2">
            {#if !isEditing}
                <Button
                    variant="outline"
                    size="sm"
                    onclick={() => (isEditing = true)}
                >
                    <Pencil class="mr-2 size-3" />
                    Edit
                </Button>
            {/if}
        </div>
    </header>

    <!-- Main Content -->
    <div class="flex-1 overflow-y-auto bg-surface-1">
        <div class="p-6 space-y-6">
            <!-- Item Info Cards -->
            <div class="grid md:grid-cols-3 gap-4">
                <!-- Details Card -->
                <div
                    class="bg-surface-0 rounded-lg border border-border p-4 space-y-3"
                >
                    <h3
                        class="text-xs font-semibold uppercase tracking-wide text-text-subtle"
                    >
                        Details
                    </h3>
                    <div class="flex items-center gap-2 text-sm">
                        {#if data.item.type === "product"}
                            <Package class="size-4 text-blue-600" />
                        {:else}
                            <Briefcase class="size-4 text-green-600" />
                        {/if}
                        <span class="capitalize font-medium"
                            >{data.item.type}</span
                        >
                    </div>
                    {#if data.item.sku}
                        <div class="text-sm">
                            <span class="text-text-muted">SKU:</span>
                            <span class="font-mono ml-2">{data.item.sku}</span>
                        </div>
                    {/if}
                    {#if data.item.description}
                        <p class="text-sm text-text-muted">
                            {data.item.description}
                        </p>
                    {/if}
                    {#if data.item.hsn_code}
                        <div class="text-sm">
                            <span class="text-text-muted">HSN/SAC:</span>
                            <span class="font-mono ml-2"
                                >{data.item.hsn_code}</span
                            >
                        </div>
                    {/if}
                </div>

                <!-- Pricing Card -->
                <div
                    class="bg-surface-0 rounded-lg border border-border p-4 space-y-3"
                >
                    <h3
                        class="text-xs font-semibold uppercase tracking-wide text-text-subtle"
                    >
                        Pricing
                    </h3>
                    <div class="text-sm">
                        <span class="text-text-muted">Rate:</span>
                        <span class="font-mono font-semibold ml-2"
                            >{formatINR(data.item.rate)}</span
                        >
                        <span class="text-text-muted"> / {data.item.unit}</span>
                    </div>
                    <div class="text-sm">
                        <span class="text-text-muted">GST Rate:</span>
                        <span class="ml-2 font-medium"
                            >{data.item.gst_rate}%</span
                        >
                    </div>
                </div>

                <!-- Actions Card -->
                <div
                    class="bg-surface-0 rounded-lg border border-border p-4 space-y-3"
                >
                    <h3
                        class="text-xs font-semibold uppercase tracking-wide text-text-subtle"
                    >
                        Actions
                    </h3>
                    <div class="grid grid-cols-1 gap-2">
                        <form method="POST" action="?/toggleActive">
                            <input
                                type="hidden"
                                name="is_active"
                                value={String(!data.item.is_active)}
                            />
                            <Button
                                type="submit"
                                variant="outline"
                                size="sm"
                                class="w-full justify-start"
                            >
                                {data.item.is_active
                                    ? "Deactivate"
                                    : "Activate"}
                            </Button>
                        </form>
                        {#if !data.isUsedInInvoices}
                            <form
                                method="POST"
                                action="?/delete"
                                onsubmit={(e) => {
                                    if (
                                        !confirm(
                                            "Are you sure you want to delete this item?",
                                        )
                                    ) {
                                        e.preventDefault();
                                    }
                                }}
                            >
                                <Button
                                    type="submit"
                                    variant="destructive"
                                    size="sm"
                                    class="w-full justify-start"
                                >
                                    <Trash2 class="mr-2 size-3" />
                                    Delete Item
                                </Button>
                            </form>
                        {:else}
                            <p class="text-xs text-text-muted">
                                Used in invoices — deactivate instead of
                                deleting.
                            </p>
                        {/if}
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Edit Item Modal -->
{#if isEditing}
    <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    >
        <div
            class="bg-surface-0 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-border"
        >
            <div
                class="p-4 border-b border-border flex justify-between items-center bg-surface-2"
            >
                <h3 class="font-bold text-lg">Edit Item</h3>
                <button
                    onclick={() => (isEditing = false)}
                    class="text-text-muted hover:text-text-strong"
                    aria-label="Close"
                >
                    <X class="size-5" />
                </button>
            </div>

            <form
                method="POST"
                action="?/update"
                use:enhance
                class="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]"
            >
                <div class="space-y-6">
                    <!-- Type -->
                    <div class="space-y-2">
                        <Label>Type</Label>
                        <div class="flex gap-3">
                            <button
                                type="button"
                                class="flex-1 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all {$form.type ===
                                'product'
                                    ? 'border-primary bg-primary/5 text-primary'
                                    : 'border-border bg-surface-0 text-text-muted hover:border-border-strong'}"
                                onclick={() => ($form.type = "product")}
                            >
                                Product
                            </button>
                            <button
                                type="button"
                                class="flex-1 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all {$form.type ===
                                'service'
                                    ? 'border-primary bg-primary/5 text-primary'
                                    : 'border-border bg-surface-0 text-text-muted hover:border-border-strong'}"
                                onclick={() => ($form.type = "service")}
                            >
                                Service
                            </button>
                        </div>
                        <input type="hidden" name="type" value={$form.type} />
                    </div>

                    <!-- Basic Info -->
                    <div class="grid gap-4 md:grid-cols-2">
                        <div class="space-y-2">
                            <Label for="name">Name *</Label>
                            <Input
                                id="name"
                                name="name"
                                bind:value={$form.name}
                                class={$errors.name ? "border-destructive" : ""}
                            />
                            {#if $errors.name}
                                <p class="text-xs text-destructive">
                                    {$errors.name}
                                </p>
                            {/if}
                        </div>
                        <div class="space-y-2">
                            <Label for="sku">SKU / Barcode</Label>
                            <Input
                                id="sku"
                                name="sku"
                                bind:value={$form.sku}
                                placeholder="e.g. PRD-001"
                                class="font-mono"
                            />
                        </div>
                        <div class="space-y-2 md:col-span-2">
                            <Label for="description">Description</Label>
                            <Input
                                id="description"
                                name="description"
                                bind:value={$form.description}
                            />
                        </div>
                    </div>

                    <!-- Tax & Pricing -->
                    <div class="grid gap-4 md:grid-cols-2">
                        <div class="space-y-2">
                            <Label for="hsn_code">HSN/SAC Code</Label>
                            <Input
                                id="hsn_code"
                                name="hsn_code"
                                bind:value={$form.hsn_code}
                                class="font-mono"
                            />
                        </div>
                        <div class="space-y-2">
                            <Label for="gst_rate">GST Rate</Label>
                            <Select.Root
                                type="single"
                                name="gst_rate"
                                bind:value={gstRateStr}
                                onValueChange={(v) => {
                                    gstRateStr = v;
                                    $form.gst_rate = Number(v);
                                }}
                            >
                                <Select.Trigger id="gst_rate">
                                    {$form.gst_rate}%
                                </Select.Trigger>
                                <Select.Content>
                                    {#each GST_RATES as rate}
                                        <Select.Item value={String(rate)}
                                            >{rate}%</Select.Item
                                        >
                                    {/each}
                                </Select.Content>
                            </Select.Root>
                        </div>
                        <div class="space-y-2">
                            <Label for="rate">Rate</Label>
                            <Input
                                id="rate"
                                name="rate"
                                type="number"
                                bind:value={$form.rate}
                                min="0"
                                step="0.01"
                                class="font-mono"
                            />
                        </div>
                        <div class="space-y-2">
                            <Label for="unit">Unit</Label>
                            <Select.Root
                                type="single"
                                name="unit"
                                bind:value={$form.unit}
                            >
                                <Select.Trigger id="unit">
                                    {$form.unit || "nos"}
                                </Select.Trigger>
                                <Select.Content>
                                    {#each UNITS as unit}
                                        <Select.Item value={unit}
                                            >{unit}</Select.Item
                                        >
                                    {/each}
                                </Select.Content>
                            </Select.Root>
                        </div>
                    </div>
                </div>

                <div
                    class="flex justify-end gap-3 mt-6 pt-4 border-t border-border"
                >
                    <Button
                        variant="ghost"
                        type="button"
                        onclick={() => (isEditing = false)}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" disabled={$submitting}>
                        <Save class="mr-2 size-4" />
                        {$submitting ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </form>
        </div>
    </div>
{/if}
