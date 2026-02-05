<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import * as Select from "$lib/components/ui/select";
    import { superForm } from "sveltekit-superforms";
    import { addToast } from "$lib/stores/toast";
    import { INDIAN_STATES, GST_TREATMENTS } from "./schema";
    import { ArrowLeft, Save, Building2, MapPin, FileText } from "lucide-svelte";

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
            href="/customers"
            size="icon"
            class="h-8 w-8"
        >
            <ArrowLeft class="size-4" />
        </Button>
        <div>
            <h1 class="text-xl font-bold tracking-tight text-text-strong">New Customer</h1>
            <p class="text-sm text-text-secondary">Add a new customer to your business</p>
        </div>
    </header>

    <!-- Scrollable Content -->
    <main class="flex-1 overflow-y-auto bg-surface-1">
        <form id="customer-form" method="POST" use:enhance class="max-w-4xl mx-auto p-6 pb-8 space-y-6">
            <!-- Basic Information -->
            <div class="form-section">
                <div class="form-section-header">
                    <div class="form-section-icon bg-primary/10">
                        <Building2 class="size-5 text-primary" />
                    </div>
                    <div>
                        <h2 class="form-section-title">Basic Information</h2>
                        <p class="form-section-subtitle">Customer identity and contact details</p>
                    </div>
                </div>

                <div class="grid gap-4 md:grid-cols-2">
                    <div class="space-y-2">
                        <Label for="name" class="form-label">Customer Name <span class="text-destructive">*</span></Label>
                        <Input
                            id="name"
                            name="name"
                            bind:value={$form.name}
                            placeholder="e.g. Acme Corp"
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
                            placeholder="Legal entity name"
                        />
                    </div>

                    <div class="space-y-2">
                        <Label for="email" class="form-label">Email</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            bind:value={$form.email}
                            placeholder="billing@example.com"
                            class={$errors.email ? "border-destructive" : ""}
                        />
                        {#if $errors.email}
                            <p class="form-error">{$errors.email}</p>
                        {/if}
                    </div>

                    <div class="space-y-2">
                        <Label for="phone" class="form-label">Phone</Label>
                        <Input
                            id="phone"
                            name="phone"
                            bind:value={$form.phone}
                            placeholder="+91 98765 43210"
                            class={$errors.phone ? "border-destructive" : ""}
                        />
                        {#if $errors.phone}
                            <p class="form-error">{$errors.phone}</p>
                        {/if}
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
                        <p class="form-section-subtitle">Customer billing address</p>
                    </div>
                </div>

                <div class="grid gap-4 md:grid-cols-2">
                    <div class="space-y-2 md:col-span-2">
                        <Label for="billing_address" class="form-label">Billing Address</Label>
                        <Input
                            id="billing_address"
                            name="billing_address"
                            bind:value={$form.billing_address}
                            placeholder="Street, Building, Area"
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
                            <Select.Trigger id="state_code" class={$errors.state_code ? "border-destructive" : ""}>
                                {INDIAN_STATES.find((s) => s.code === $form.state_code)?.name || "Select state"}
                            </Select.Trigger>
                            <Select.Content class="max-h-[200px]">
                                {#each INDIAN_STATES as state}
                                    <Select.Item value={state.code}>{state.name}</Select.Item>
                                {/each}
                            </Select.Content>
                        </Select.Root>
                        {#if $errors.state_code}
                            <p class="form-error">{$errors.state_code}</p>
                        {/if}
                    </div>

                    <div class="space-y-2">
                        <Label for="pincode" class="form-label">Pincode</Label>
                        <Input
                            id="pincode"
                            name="pincode"
                            bind:value={$form.pincode}
                            placeholder="000000"
                            maxlength={6}
                            class={$errors.pincode ? "border-destructive" : ""}
                        />
                        {#if $errors.pincode}
                            <p class="form-error">{$errors.pincode}</p>
                        {/if}
                    </div>
                </div>
            </div>

            <!-- Tax & Payment -->
            <div class="form-section">
                <div class="form-section-header">
                    <div class="form-section-icon bg-green-100">
                        <FileText class="size-5 text-green-600" />
                    </div>
                    <div>
                        <h2 class="form-section-title">Tax & Payment</h2>
                        <p class="form-section-subtitle">GST registration and payment terms</p>
                    </div>
                </div>

                <div class="grid gap-4 md:grid-cols-2">
                    <div class="space-y-2">
                        <Label for="gst_treatment" class="form-label">GST Treatment</Label>
                        <Select.Root type="single" name="gst_treatment" bind:value={$form.gst_treatment}>
                            <Select.Trigger id="gst_treatment">
                                {GST_TREATMENTS.find((t) => t.value === $form.gst_treatment)?.label || "Select treatment"}
                            </Select.Trigger>
                            <Select.Content>
                                {#each GST_TREATMENTS as treatment}
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
                            placeholder="22AAAAA0000A1Z5"
                            class="uppercase font-mono tracking-wide {$errors.gstin ? 'border-destructive' : ''}"
                        />
                        {#if $errors.gstin}
                            <p class="form-error">{$errors.gstin}</p>
                        {/if}
                    </div>

                    <div class="space-y-2">
                        <Label for="payment_terms" class="form-label">Payment Terms (Days)</Label>
                        <Input
                            id="payment_terms"
                            name="payment_terms"
                            type="number"
                            bind:value={$form.payment_terms}
                            min="0"
                            max="365"
                            placeholder="e.g. 15"
                        />
                    </div>
                </div>
            </div>
        </form>
    </main>

    <!-- Bottom Action Bar -->
    <div class="action-bar">
        <div class="action-bar-group">
            <Button type="submit" form="customer-form" disabled={$submitting}>
                <Save class="mr-2 size-4" />
                {$submitting ? "Saving..." : "Save Customer"}
            </Button>
            <Button variant="ghost" href="/customers">
                Cancel
            </Button>
        </div>
    </div>
</div>
