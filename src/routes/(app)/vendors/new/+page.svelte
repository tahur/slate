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
            class="h-8 w-8 text-text-muted hover:text-text-strong"
        >
            <ArrowLeft class="size-4" />
        </Button>
        <div>
            <h1 class="text-xl font-bold tracking-tight text-text-strong">New Vendor</h1>
            <p class="text-sm text-text-muted">Add a supplier or service provider</p>
        </div>
    </header>

    <!-- Form -->
    <div class="flex-1 overflow-y-auto bg-surface-1">
        <form method="POST" use:enhance class="max-w-4xl mx-auto p-6 space-y-6">
            <!-- Basic Info -->
            <div class="bg-surface-0 rounded-xl border border-border p-6 space-y-6">
                <div class="flex items-center gap-3 pb-4 border-b border-border">
                    <div class="p-2 bg-primary/10 rounded-lg">
                        <Building2 class="size-5 text-primary" />
                    </div>
                    <div>
                        <h2 class="font-semibold text-text-strong">Basic Information</h2>
                        <p class="text-sm text-text-muted">Vendor identity and contact details</p>
                    </div>
                </div>

                <div class="grid gap-4 md:grid-cols-2">
                    <div class="space-y-2">
                        <Label for="name">Vendor Name <span class="text-destructive">*</span></Label>
                        <Input
                            id="name"
                            name="name"
                            bind:value={$form.name}
                            placeholder="Enter vendor name"
                            class={$errors.name ? "border-destructive" : ""}
                        />
                        {#if $errors.name}
                            <p class="text-xs text-destructive">{$errors.name}</p>
                        {/if}
                    </div>
                    <div class="space-y-2">
                        <Label for="company_name">Company Name</Label>
                        <Input
                            id="company_name"
                            name="company_name"
                            bind:value={$form.company_name}
                            placeholder="Legal company name"
                        />
                    </div>
                    <div class="space-y-2">
                        <Label for="display_name">Display Name</Label>
                        <Input
                            id="display_name"
                            name="display_name"
                            bind:value={$form.display_name}
                            placeholder="How to show in lists (optional)"
                        />
                        <p class="text-xs text-text-muted">Leave blank to use vendor name</p>
                    </div>
                    <div class="space-y-2">
                        <Label for="email">Email</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            bind:value={$form.email}
                            placeholder="vendor@example.com"
                        />
                    </div>
                    <div class="space-y-2">
                        <Label for="phone">Phone</Label>
                        <Input
                            id="phone"
                            name="phone"
                            bind:value={$form.phone}
                            placeholder="+91 98765 43210"
                        />
                    </div>
                    <div class="space-y-2">
                        <Label for="website">Website</Label>
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
            <div class="bg-surface-0 rounded-xl border border-border p-6 space-y-6">
                <div class="flex items-center gap-3 pb-4 border-b border-border">
                    <div class="p-2 bg-blue-100 rounded-lg">
                        <MapPin class="size-5 text-blue-600" />
                    </div>
                    <div>
                        <h2 class="font-semibold text-text-strong">Address</h2>
                        <p class="text-sm text-text-muted">Vendor billing address</p>
                    </div>
                </div>

                <div class="grid gap-4 md:grid-cols-2">
                    <div class="space-y-2 md:col-span-2">
                        <Label for="billing_address">Address Line</Label>
                        <Input
                            id="billing_address"
                            name="billing_address"
                            bind:value={$form.billing_address}
                            placeholder="Street address"
                        />
                    </div>
                    <div class="space-y-2">
                        <Label for="city">City</Label>
                        <Input
                            id="city"
                            name="city"
                            bind:value={$form.city}
                            placeholder="City"
                        />
                    </div>
                    <div class="space-y-2">
                        <Label for="state_code">State</Label>
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
                        <Label for="pincode">Pincode</Label>
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
            <div class="bg-surface-0 rounded-xl border border-border p-6 space-y-6">
                <div class="flex items-center gap-3 pb-4 border-b border-border">
                    <div class="p-2 bg-green-100 rounded-lg">
                        <FileText class="size-5 text-green-600" />
                    </div>
                    <div>
                        <h2 class="font-semibold text-text-strong">GST Details</h2>
                        <p class="text-sm text-text-muted">Tax registration information</p>
                    </div>
                </div>

                <div class="grid gap-4 md:grid-cols-2">
                    <div class="space-y-2">
                        <Label for="gst_treatment">GST Treatment</Label>
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
                        <Label for="gstin">GSTIN</Label>
                        <Input
                            id="gstin"
                            name="gstin"
                            bind:value={$form.gstin}
                            placeholder="29ABCDE1234F1Z5"
                            class="uppercase font-mono {$errors.gstin ? 'border-destructive' : ''}"
                        />
                        {#if $errors.gstin}
                            <p class="text-xs text-destructive">{$errors.gstin}</p>
                        {/if}
                    </div>
                    <div class="space-y-2">
                        <Label for="pan">PAN</Label>
                        <Input
                            id="pan"
                            name="pan"
                            bind:value={$form.pan}
                            placeholder="ABCDE1234F"
                            class="uppercase font-mono"
                        />
                    </div>
                    <div class="space-y-2">
                        <Label for="payment_terms">Payment Terms (days)</Label>
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
            <div class="bg-surface-0 rounded-xl border border-border p-6 space-y-6">
                <div class="flex items-center gap-3 pb-4 border-b border-border">
                    <div class="p-2 bg-purple-100 rounded-lg">
                        <Receipt class="size-5 text-purple-600" />
                    </div>
                    <div>
                        <h2 class="font-semibold text-text-strong">TDS Details</h2>
                        <p class="text-sm text-text-muted">Tax deduction at source settings</p>
                    </div>
                </div>

                <div class="grid gap-4 md:grid-cols-2">
                    <div class="flex items-center gap-3">
                        <Checkbox
                            id="tds_applicable"
                            name="tds_applicable"
                            bind:checked={$form.tds_applicable}
                        />
                        <Label for="tds_applicable" class="cursor-pointer">TDS Applicable</Label>
                    </div>
                    {#if $form.tds_applicable}
                        <div class="space-y-2">
                            <Label for="tds_section">TDS Section</Label>
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
            <div class="bg-surface-0 rounded-xl border border-border p-6 space-y-4">
                <Label for="notes">Notes</Label>
                <textarea
                    id="notes"
                    name="notes"
                    bind:value={$form.notes}
                    rows="3"
                    class="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y"
                    placeholder="Internal notes about this vendor..."
                ></textarea>
            </div>

            <!-- Actions -->
            <div class="flex justify-end gap-3 pt-4">
                <Button variant="outline" href="/vendors">
                    Cancel
                </Button>
                <Button type="submit" disabled={$submitting}>
                    <Save class="mr-2 size-4" />
                    {$submitting ? "Saving..." : "Save Vendor"}
                </Button>
            </div>
        </form>
    </div>
</div>
