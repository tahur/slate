<script lang="ts">
    import { superForm } from "sveltekit-superforms";
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import * as Select from "$lib/components/ui/select";
    import { Checkbox } from "$lib/components/ui/checkbox";
    import { addToast } from "$lib/stores/toast";
    import { INDIAN_STATES } from "../../customers/new/schema";
    import { VENDOR_GST_TREATMENTS, TDS_SECTIONS } from "./schema";
    import { ArrowLeft, Save } from "lucide-svelte";

    let { data } = $props();

    const { form, errors, enhance, submitting } = superForm(data.form, {
        onResult: ({ result }) => {
            if (result.type === "failure" && result.data?.error) {
                addToast({
                    type: "error",
                    message: result.data.error as string,
                });
            }
        },
    });
</script>

<div class="page-full-bleed">
    <!-- Header -->
    <header
        class="flex items-center gap-4 px-6 py-4 border-b border-border bg-surface-0 z-20"
    >
        <Button variant="ghost" href="/vendors" size="icon" class="h-8 w-8">
            <ArrowLeft class="size-4" />
        </Button>
        <div>
            <h1 class="text-xl font-bold tracking-tight text-text-strong">
                New Vendor
            </h1>
            <p class="text-sm text-text-muted">
                Add a supplier or service provider
            </p>
        </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 overflow-y-auto bg-surface-1">
        <form
            id="vendor-form"
            method="POST"
            class="flex flex-col md:flex-row md:min-h-full"
            use:enhance
        >
            <!-- LEFT COLUMN: Main Details -->
            <div
                class="flex-1 p-6 md:p-8 border-b md:border-b-0 md:border-r border-border"
            >
                <div class="max-w-3xl space-y-8">
                    <!-- Section: Basic Information -->
                    <section class="space-y-6">
                        <h3
                            class="text-xs font-bold uppercase tracking-wide text-text-muted"
                        >
                            Basic Information
                        </h3>

                        <div class="grid gap-6 md:grid-cols-2">
                            <div class="space-y-2">
                                <Label for="name" class="form-label">
                                    Vendor Name <span class="text-destructive"
                                        >*</span
                                    >
                                </Label>
                                <Input
                                    id="name"
                                    name="name"
                                    bind:value={$form.name}
                                    placeholder="Enter vendor name"
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
                                <Label for="company_name" class="form-label"
                                    >Company Name</Label
                                >
                                <Input
                                    id="company_name"
                                    name="company_name"
                                    bind:value={$form.company_name}
                                    placeholder="Legal company name"
                                    class="border-border-strong bg-surface-0"
                                />
                            </div>

                            <div class="space-y-2">
                                <Label for="display_name" class="form-label"
                                    >Display Name</Label
                                >
                                <Input
                                    id="display_name"
                                    name="display_name"
                                    bind:value={$form.display_name}
                                    placeholder="Optional"
                                    class="border-border-strong bg-surface-0"
                                />
                                <p class="text-[10px] text-text-muted">
                                    Overridden by vendor name if blank
                                </p>
                            </div>

                            <div class="space-y-2">
                                <Label for="email" class="form-label"
                                    >Email</Label
                                >
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    bind:value={$form.email}
                                    placeholder="vendor@example.com"
                                    class="border-border-strong bg-surface-0"
                                />
                            </div>

                            <div class="space-y-2">
                                <Label for="phone" class="form-label"
                                    >Phone</Label
                                >
                                <Input
                                    id="phone"
                                    name="phone"
                                    bind:value={$form.phone}
                                    placeholder="+91 98765 43210"
                                    class="border-border-strong bg-surface-0"
                                />
                            </div>

                            <div class="space-y-2">
                                <Label for="website" class="form-label"
                                    >Website</Label
                                >
                                <Input
                                    id="website"
                                    name="website"
                                    bind:value={$form.website}
                                    placeholder="https://vendor.com"
                                    class="border-border-strong bg-surface-0"
                                />
                            </div>
                        </div>
                    </section>

                    <!-- Section: Address -->
                    <section class="space-y-6">
                        <h3
                            class="text-xs font-bold uppercase tracking-wide text-text-muted"
                        >
                            Address
                        </h3>

                        <div class="grid gap-6 md:grid-cols-2">
                            <div class="space-y-2 md:col-span-2">
                                <Label for="billing_address" class="form-label"
                                    >Address Line</Label
                                >
                                <Input
                                    id="billing_address"
                                    name="billing_address"
                                    bind:value={$form.billing_address}
                                    placeholder="Street address"
                                    class="border-border-strong bg-surface-0"
                                />
                            </div>

                            <div class="space-y-2">
                                <Label for="city" class="form-label">City</Label
                                >
                                <Input
                                    id="city"
                                    name="city"
                                    bind:value={$form.city}
                                    placeholder="City"
                                    class="border-border-strong bg-surface-0"
                                />
                            </div>

                            <div class="space-y-2">
                                <Label for="state_code" class="form-label"
                                    >State</Label
                                >
                                <Select.Root
                                    type="single"
                                    name="state_code"
                                    bind:value={$form.state_code}
                                >
                                    <Select.Trigger
                                        id="state_code"
                                        class="border-border-strong bg-surface-0"
                                    >
                                        {INDIAN_STATES.find(
                                            (s) => s.code === $form.state_code,
                                        )?.name || "Select state"}
                                    </Select.Trigger>
                                    <Select.Content class="max-h-[200px]">
                                        {#each INDIAN_STATES as state}
                                            <Select.Item value={state.code}
                                                >{state.name}</Select.Item
                                            >
                                        {/each}
                                    </Select.Content>
                                </Select.Root>
                            </div>

                            <div class="space-y-2">
                                <Label for="pincode" class="form-label"
                                    >Pincode</Label
                                >
                                <Input
                                    id="pincode"
                                    name="pincode"
                                    bind:value={$form.pincode}
                                    placeholder="560001"
                                    maxlength={6}
                                    class="border-border-strong bg-surface-0"
                                />
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            <!-- RIGHT COLUMN: Tax & TDS -->
            <div class="w-full md:w-96 bg-surface-0 p-6 md:p-8">
                <div class="space-y-8">
                    <!-- Section: GST Details -->
                    <section class="space-y-6">
                        <h3
                            class="text-xs font-bold uppercase tracking-wide text-text-muted"
                        >
                            GST Details
                        </h3>

                        <div class="space-y-4">
                            <div class="space-y-2">
                                <Label for="gst_treatment" class="form-label"
                                    >GST Treatment</Label
                                >
                                <Select.Root
                                    type="single"
                                    name="gst_treatment"
                                    bind:value={$form.gst_treatment}
                                >
                                    <Select.Trigger
                                        id="gst_treatment"
                                        class="border-border-strong bg-surface-0"
                                    >
                                        {VENDOR_GST_TREATMENTS.find(
                                            (t) =>
                                                t.value === $form.gst_treatment,
                                        )?.label || "Select"}
                                    </Select.Trigger>
                                    <Select.Content>
                                        {#each VENDOR_GST_TREATMENTS as treatment}
                                            <Select.Item value={treatment.value}
                                                >{treatment.label}</Select.Item
                                            >
                                        {/each}
                                    </Select.Content>
                                </Select.Root>
                            </div>

                            <div class="space-y-2">
                                <Label for="gstin" class="form-label"
                                    >GSTIN</Label
                                >
                                <Input
                                    id="gstin"
                                    name="gstin"
                                    bind:value={$form.gstin}
                                    placeholder="29ABCDE1234F1Z5"
                                    class="border-border-strong bg-surface-0 uppercase font-mono tracking-wide {$errors.gstin
                                        ? 'border-destructive'
                                        : ''}"
                                />
                                {#if $errors.gstin}
                                    <p class="text-xs text-destructive">
                                        {$errors.gstin}
                                    </p>
                                {/if}
                            </div>

                            <div class="space-y-2">
                                <Label for="pan" class="form-label">PAN</Label>
                                <Input
                                    id="pan"
                                    name="pan"
                                    bind:value={$form.pan}
                                    placeholder="ABCDE1234F"
                                    class="border-border-strong bg-surface-0 uppercase font-mono"
                                />
                            </div>

                            <div class="space-y-2">
                                <Label for="payment_terms" class="form-label"
                                    >Payment Terms (days)</Label
                                >
                                <Input
                                    id="payment_terms"
                                    name="payment_terms"
                                    type="number"
                                    bind:value={$form.payment_terms}
                                    min="0"
                                    max="365"
                                    class="border-border-strong bg-surface-0"
                                />
                            </div>
                        </div>
                    </section>

                    <div class="h-px bg-border w-full"></div>

                    <!-- Section: TDS Details -->
                    <section class="space-y-6">
                        <h3
                            class="text-xs font-bold uppercase tracking-wide text-text-muted"
                        >
                            TDS Details
                        </h3>

                        <div class="space-y-4">
                            <div class="flex items-center gap-3">
                                <Checkbox
                                    id="tds_applicable"
                                    bind:checked={$form.tds_applicable}
                                    class="border-border-strong data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                                />
                                <input
                                    type="hidden"
                                    name="tds_applicable"
                                    value={$form.tds_applicable
                                        ? "true"
                                        : "false"}
                                />
                                <Label
                                    for="tds_applicable"
                                    class="cursor-pointer text-sm text-text-strong"
                                    >TDS Applicable</Label
                                >
                            </div>
                            {#if $form.tds_applicable}
                                <div
                                    class="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200"
                                >
                                    <Label for="tds_section" class="form-label"
                                        >TDS Section</Label
                                    >
                                    <Select.Root
                                        type="single"
                                        name="tds_section"
                                        bind:value={$form.tds_section}
                                    >
                                        <Select.Trigger
                                            id="tds_section"
                                            class="border-border-strong bg-surface-0"
                                        >
                                            {TDS_SECTIONS.find(
                                                (s) =>
                                                    s.value ===
                                                    $form.tds_section,
                                            )?.label || "Select section"}
                                        </Select.Trigger>
                                        <Select.Content>
                                            {#each TDS_SECTIONS as section}
                                                <Select.Item
                                                    value={section.value}
                                                    >{section.label}</Select.Item
                                                >
                                            {/each}
                                        </Select.Content>
                                    </Select.Root>
                                </div>
                            {/if}
                        </div>
                    </section>

                    <div class="h-px bg-border w-full"></div>

                    <!-- Section: Notes -->
                    <section class="space-y-6">
                        <h3
                            class="text-xs font-bold uppercase tracking-wide text-text-muted"
                        >
                            Notes
                        </h3>
                        <textarea
                            id="notes"
                            name="notes"
                            bind:value={$form.notes}
                            rows="3"
                            class="flex w-full rounded-md border border-border-strong bg-surface-0 px-3 py-2 text-sm text-text-strong shadow-sm placeholder:text-text-placeholder focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary resize-none"
                            placeholder="Internal notes..."
                        ></textarea>
                    </section>
                </div>
            </div>
        </form>
    </main>

    <!-- Bottom Action Bar -->
    <div class="action-bar">
        <div class="action-bar-group">
            <Button type="submit" form="vendor-form" disabled={$submitting}>
                <Save class="mr-2 size-4" />
                {$submitting ? "Saving..." : "Save Vendor"}
            </Button>
            <Button variant="ghost" href="/vendors">Cancel</Button>
        </div>
    </div>
</div>
