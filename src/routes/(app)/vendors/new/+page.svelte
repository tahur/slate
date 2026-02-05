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
    import { ArrowLeft, Save, Building2, MapPin, FileText, Receipt } from "lucide-svelte";

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

<div class="flex flex-col h-[calc(100vh-3.5rem)] -mx-4 md:-mx-5 -my-4 md:-my-5">
    <!-- Header -->
    <header class="flex items-center gap-4 px-6 py-4 border-b border-border bg-surface-0 z-20">
        <Button
            variant="ghost"
            href="/vendors"
            size="icon"
            class="h-8 w-8"
        >
            <ArrowLeft class="size-4" />
        </Button>
        <div>
            <h1 class="text-xl font-bold tracking-tight text-text-strong">New Vendor</h1>
            <p class="text-sm text-text-secondary">Add a supplier or service provider</p>
        </div>
    </header>

    <!-- Form -->
    <div class="flex-1 overflow-y-auto bg-surface-1">
        <form id="vendor-form" method="POST" use:enhance class="max-w-4xl mx-auto p-6 pb-8 space-y-6">
            <!-- Basic Info -->
            <div class="form-section">
                <div class="form-section-header">
                    <div class="form-section-icon bg-primary/10">
                        <Building2 class="size-5 text-primary" />
                    </div>
                    <div>
                        <h2 class="form-section-title">Basic Information</h2>
                        <p class="form-section-subtitle">Vendor identity and contact details</p>
                    </div>
                </div>

                <div class="grid gap-4 md:grid-cols-2">
                    <div class="space-y-2">
                        <Label for="name" class="form-label">Vendor Name <span class="text-destructive">*</span></Label>
                        <Input
                            id="name"
                            name="name"
                            bind:value={$form.name}
                            placeholder="Enter vendor name"
                            class={$errors.name ? "border-destructive" : ""}
                        />
                        {#if $errors.name}
                            <p class="form-error">{$errors.name}</p>
                        {/if}
                    </div>
                    <div class="space-y-2">
                        <Label for="company_name" class="form-label">Company Name</Label>
                        <Input
                            id="company_name"
                            name="company_name"
                            bind:value={$form.company_name}
                            placeholder="Legal company name"
                        />
                    </div>
                    <div class="space-y-2">
                        <Label for="display_name" class="form-label">Display Name</Label>
                        <Input
                            id="display_name"
                            name="display_name"
                            bind:value={$form.display_name}
                            placeholder="How to show in lists (optional)"
                        />
                        <p class="form-hint">Leave blank to use vendor name</p>
                    </div>
                    <div class="space-y-2">
                        <Label for="email" class="form-label">Email</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            bind:value={$form.email}
                            placeholder="vendor@example.com"
                        />
                    </div>
                    <div class="space-y-2">
                        <Label for="phone" class="form-label">Phone</Label>
                        <Input
                            id="phone"
                            name="phone"
                            bind:value={$form.phone}
                            placeholder="+91 98765 43210"
                        />
                    </div>
                    <div class="space-y-2">
                        <Label for="website" class="form-label">Website</Label>
                        <Input
                            id="website"
                            name="website"
                            bind:value={$form.website}
                            placeholder="https://vendor.com"
                        />
                    </div>
                </div>
            </div>

            <!-- Address -->
            <div class="form-section">
                <div class="form-section-header">
                    <div class="form-section-icon bg-blue-100">
                        <MapPin class="size-5 text-blue-600" />
                    </div>
                    <div>
                        <h2 class="form-section-title">Address</h2>
                        <p class="form-section-subtitle">Vendor billing address</p>
                    </div>
                </div>

                <div class="grid gap-4 md:grid-cols-2">
                    <div class="space-y-2 md:col-span-2">
                        <Label for="billing_address" class="form-label">Address Line</Label>
                        <Input
                            id="billing_address"
                            name="billing_address"
                            bind:value={$form.billing_address}
                            placeholder="Street address"
                        />
                    </div>
                    <div class="space-y-2">
                        <Label for="city" class="form-label">City</Label>
                        <Input
                            id="city"
                            name="city"
                            bind:value={$form.city}
                            placeholder="City"
                        />
                    </div>
                    <div class="space-y-2">
                        <Label for="state_code" class="form-label">State</Label>
                        <Select.Root type="single" name="state_code" bind:value={$form.state_code}>
                            <Select.Trigger id="state_code">
                                {INDIAN_STATES.find((s) => s.code === $form.state_code)?.name || "Select state"}
                            </Select.Trigger>
                            <Select.Content>
                                {#each INDIAN_STATES as state}
                                    <Select.Item value={state.code}>{state.name}</Select.Item>
                                {/each}
                            </Select.Content>
                        </Select.Root>
                    </div>
                    <div class="space-y-2">
                        <Label for="pincode" class="form-label">Pincode</Label>
                        <Input
                            id="pincode"
                            name="pincode"
                            bind:value={$form.pincode}
                            placeholder="560001"
                            maxlength={6}
                        />
                    </div>
                </div>
            </div>

            <!-- GST Details -->
            <div class="form-section">
                <div class="form-section-header">
                    <div class="form-section-icon bg-green-100">
                        <FileText class="size-5 text-green-600" />
                    </div>
                    <div>
                        <h2 class="form-section-title">GST Details</h2>
                        <p class="form-section-subtitle">Tax registration information</p>
                    </div>
                </div>

                <div class="grid gap-4 md:grid-cols-2">
                    <div class="space-y-2">
                        <Label for="gst_treatment" class="form-label">GST Treatment</Label>
                        <Select.Root type="single" name="gst_treatment" bind:value={$form.gst_treatment}>
                            <Select.Trigger id="gst_treatment">
                                {VENDOR_GST_TREATMENTS.find((t) => t.value === $form.gst_treatment)?.label || "Select"}
                            </Select.Trigger>
                            <Select.Content>
                                {#each VENDOR_GST_TREATMENTS as treatment}
                                    <Select.Item value={treatment.value}>{treatment.label}</Select.Item>
                                {/each}
                            </Select.Content>
                        </Select.Root>
                    </div>
                    <div class="space-y-2">
                        <Label for="gstin" class="form-label">GSTIN</Label>
                        <Input
                            id="gstin"
                            name="gstin"
                            bind:value={$form.gstin}
                            placeholder="29ABCDE1234F1Z5"
                            class="uppercase font-mono {$errors.gstin ? 'border-destructive' : ''}"
                        />
                        {#if $errors.gstin}
                            <p class="form-error">{$errors.gstin}</p>
                        {/if}
                    </div>
                    <div class="space-y-2">
                        <Label for="pan" class="form-label">PAN</Label>
                        <Input
                            id="pan"
                            name="pan"
                            bind:value={$form.pan}
                            placeholder="ABCDE1234F"
                            class="uppercase font-mono"
                        />
                    </div>
                    <div class="space-y-2">
                        <Label for="payment_terms" class="form-label">Payment Terms (days)</Label>
                        <Input
                            id="payment_terms"
                            name="payment_terms"
                            type="number"
                            bind:value={$form.payment_terms}
                            min="0"
                            max="365"
                        />
                    </div>
                </div>
            </div>

            <!-- TDS Details -->
            <div class="form-section">
                <div class="form-section-header">
                    <div class="form-section-icon bg-purple-100">
                        <Receipt class="size-5 text-purple-600" />
                    </div>
                    <div>
                        <h2 class="form-section-title">TDS Details</h2>
                        <p class="form-section-subtitle">Tax deduction at source settings</p>
                    </div>
                </div>

                <div class="grid gap-4 md:grid-cols-2">
                    <div class="flex items-center gap-3">
                        <Checkbox
                            id="tds_applicable"
                            bind:checked={$form.tds_applicable}
                        />
                        <input type="hidden" name="tds_applicable" value={$form.tds_applicable ? "true" : "false"} />
                        <Label for="tds_applicable" class="cursor-pointer text-sm text-text-strong">TDS Applicable</Label>
                    </div>
                    {#if $form.tds_applicable}
                        <div class="space-y-2">
                            <Label for="tds_section" class="form-label">TDS Section</Label>
                            <Select.Root type="single" name="tds_section" bind:value={$form.tds_section}>
                                <Select.Trigger id="tds_section">
                                    {TDS_SECTIONS.find((s) => s.value === $form.tds_section)?.label || "Select section"}
                                </Select.Trigger>
                                <Select.Content>
                                    {#each TDS_SECTIONS as section}
                                        <Select.Item value={section.value}>{section.label}</Select.Item>
                                    {/each}
                                </Select.Content>
                            </Select.Root>
                        </div>
                    {/if}
                </div>
            </div>

            <!-- Notes -->
            <div class="form-section">
                <Label for="notes" class="form-label">Notes</Label>
                <textarea
                    id="notes"
                    name="notes"
                    bind:value={$form.notes}
                    rows="3"
                    class="flex w-full rounded-md border border-border-strong bg-surface-0 px-3 py-2 text-sm text-text-strong shadow-hairline placeholder:text-text-placeholder focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y"
                    placeholder="Internal notes about this vendor..."
                ></textarea>
            </div>
        </form>
    </div>

    <!-- Bottom Action Bar -->
    <div class="action-bar">
        <div class="action-bar-group">
            <Button type="submit" form="vendor-form" disabled={$submitting}>
                <Save class="mr-2 size-4" />
                {$submitting ? "Saving..." : "Save Vendor"}
            </Button>
            <Button variant="ghost" href="/vendors">
                Cancel
            </Button>
        </div>
    </div>
</div>
