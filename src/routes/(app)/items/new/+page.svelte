<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import * as Select from "$lib/components/ui/select";
    import { superForm } from "sveltekit-superforms";
    import { toast } from "svelte-sonner";
    import { UNIT_SUGGESTIONS, GST_RATES } from "./schema";
    import { ArrowLeft, Save, Hash, PenLine } from "lucide-svelte";

    let { data } = $props();
    const { form: initialForm, nextSku } = data;

    let gstRateStr = $state("18");
    let unitStr = $state("nos");
    let skuMode = $state<"auto" | "manual">("auto");

    const { form, errors, enhance, submitting } = superForm(initialForm, {
        onResult: ({ result }) => {
            if (result.type === "failure" && result.data?.error) {
                toast.error(result.data.error as string);
            }
        },
    });

    // Set auto SKU initially
    $effect(() => {
        if (skuMode === "auto") {
            $form.sku = nextSku;
        }
    });
</script>

<div class="page-full-bleed">
    <!-- Header -->
    <header
        class="flex items-center gap-4 px-6 py-4 border-b border-border bg-surface-0 z-20"
    >
        <Button variant="ghost" href="/items" size="icon" class="h-8 w-8">
            <ArrowLeft class="size-4" />
        </Button>
        <div>
            <h1 class="text-xl font-bold tracking-tight text-text-strong">
                New Item
            </h1>
            <p class="text-sm text-text-muted">
                Add a product or service to your catalog
            </p>
        </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 overflow-y-auto bg-surface-1">
        <form
            id="item-form"
            method="POST"
            class="flex flex-col md:flex-row md:min-h-full"
            use:enhance
        >
            <!-- LEFT COLUMN: Main Details -->
            <div
                class="flex-1 p-6 md:p-8 border-b md:border-b-0 md:border-r border-border"
            >
                <div class="max-w-3xl space-y-6">
                    <!-- Section: Type (compact segmented control) -->
                    <section class="space-y-4">
                        <h3
                            class="text-sm font-bold uppercase tracking-wide text-text-subtle"
                        >
                            Item Type
                        </h3>

                        <div
                            class="inline-flex rounded-lg border border-border bg-surface-0 p-0.5"
                        >
                            <button
                                type="button"
                                class="px-4 py-1.5 rounded-md text-sm font-medium transition-all {$form.type ===
                                'product'
                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                    : 'text-text-muted hover:text-text-strong'}"
                                onclick={() => ($form.type = "product")}
                            >
                                Product
                            </button>
                            <button
                                type="button"
                                class="px-4 py-1.5 rounded-md text-sm font-medium transition-all {$form.type ===
                                'service'
                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                    : 'text-text-muted hover:text-text-strong'}"
                                onclick={() => ($form.type = "service")}
                            >
                                Service
                            </button>
                        </div>
                        <input type="hidden" name="type" value={$form.type} />
                    </section>

                    <!-- Section: Basic Information -->
                    <section class="space-y-6">
                        <h3
                            class="text-sm font-bold uppercase tracking-wide text-text-subtle"
                        >
                            Details
                        </h3>

                        <div class="grid gap-6 md:grid-cols-2">
                            <div class="space-y-2">
                                <Label for="name" variant="form">
                                    Name <span class="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    name="name"
                                    bind:value={$form.name}
                                    placeholder="e.g. Web Development Service"
                                    class="border-border-strong bg-surface-0 {$errors.name
                                        ? 'border-destructive'
                                        : ''}"
                                />
                                {#if $errors.name}
                                    <p class="text-xs text-destructive">
                                        {$errors.name}
                                    </p>
                                {/if}
                            </div>

                            <div class="space-y-2">
                                <div class="flex items-center justify-between">
                                    <Label for="sku" variant="form"
                                        >SKU / Barcode</Label
                                    >
                                    <button
                                        type="button"
                                        class="inline-flex items-center gap-1 text-xs text-text-muted hover:text-text-strong transition-colors"
                                        onclick={() => {
                                            skuMode =
                                                skuMode === "auto"
                                                    ? "manual"
                                                    : "auto";
                                            if (skuMode === "auto") {
                                                $form.sku = nextSku;
                                            } else {
                                                $form.sku = "";
                                            }
                                        }}
                                    >
                                        {#if skuMode === "auto"}
                                            <PenLine class="size-3" />
                                            Manual
                                        {:else}
                                            <Hash class="size-3" />
                                            Auto
                                        {/if}
                                    </button>
                                </div>
                                <Input
                                    id="sku"
                                    name="sku"
                                    bind:value={$form.sku}
                                    placeholder={skuMode === "auto"
                                        ? nextSku
                                        : "e.g. PRD-001"}
                                    disabled={skuMode === "auto"}
                                    class="border-border-strong bg-surface-0 font-mono {skuMode === 'auto' ? 'text-text-muted' : ''}"
                                />
                            </div>

                            <div class="space-y-2 md:col-span-2">
                                <Label for="description" variant="form"
                                    >Description</Label
                                >
                                <Input
                                    id="description"
                                    name="description"
                                    bind:value={$form.description}
                                    placeholder="Optional description"
                                    class="border-border-strong bg-surface-0"
                                />
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            <!-- RIGHT COLUMN: Pricing & Tax -->
            <div class="w-full md:w-96 bg-surface-0 p-6 md:p-8 overflow-y-auto">
                <div class="space-y-6">
                    <!-- Section: Tax -->
                    <section class="space-y-4">
                        <h3
                            class="text-sm font-bold uppercase tracking-wide text-text-subtle"
                        >
                            Tax
                        </h3>

                        <div class="space-y-4">
                            <div class="space-y-2">
                                <Label for="hsn_code" variant="form"
                                    >HSN/SAC Code</Label
                                >
                                <Input
                                    id="hsn_code"
                                    name="hsn_code"
                                    bind:value={$form.hsn_code}
                                    placeholder="e.g. 8471 or 9983"
                                    class="border-border-strong bg-surface-0 font-mono"
                                />
                            </div>

                            <div class="space-y-2">
                                <Label for="gst_rate" variant="form"
                                    >GST Rate</Label
                                >
                                <Select.Root
                                    type="single"
                                    name="gst_rate"
                                    bind:value={gstRateStr}
                                    onValueChange={(v) => {
                                        gstRateStr = v;
                                        $form.gst_rate = Number(v);
                                    }}
                                >
                                    <Select.Trigger
                                        id="gst_rate"
                                        class="border-border-strong bg-surface-0"
                                    >
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
                        </div>
                    </section>

                    <!-- Section: Pricing -->
                    <section class="space-y-4">
                        <h3
                            class="text-sm font-bold uppercase tracking-wide text-text-subtle"
                        >
                            Pricing
                        </h3>

                        <div class="space-y-4">
                            <div class="space-y-2">
                                <Label for="rate" variant="form"
                                    >Default Rate</Label
                                >
                                <Input
                                    id="rate"
                                    name="rate"
                                    type="number"
                                    bind:value={$form.rate}
                                    min="0"
                                    step="0.01"
                                    placeholder="0.00"
                                    class="border-border-strong bg-surface-0 font-mono"
                                />
                            </div>

                            <div class="space-y-2">
                                <Label for="unit" variant="form">Unit</Label>
                                <Input
                                    id="unit"
                                    name="unit"
                                    bind:value={$form.unit}
                                    list="unit-suggestions"
                                    placeholder="e.g. nos, kg, hrs"
                                    class="border-border-strong bg-surface-0"
                                />
                                <datalist id="unit-suggestions">
                                    {#each UNIT_SUGGESTIONS as u}
                                        <option value={u} />
                                    {/each}
                                </datalist>
                            </div>

                            <div class="space-y-2">
                                <Label for="min_quantity" variant="form">Min Quantity</Label>
                                <Input
                                    id="min_quantity"
                                    name="min_quantity"
                                    type="number"
                                    bind:value={$form.min_quantity}
                                    min="0"
                                    step="0.01"
                                    placeholder="1"
                                    class="border-border-strong bg-surface-0 font-mono"
                                />
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </form>
    </main>

    <!-- Bottom Action Bar -->
    <div class="action-bar">
        <div class="action-bar-group">
            <Button type="submit" form="item-form" disabled={$submitting}>
                <Save class="mr-2 size-4" />
                {$submitting ? "Saving..." : "Save Item"}
            </Button>
            <Button variant="ghost" href="/items">Cancel</Button>
        </div>
    </div>
</div>
