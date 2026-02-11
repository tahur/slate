<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import * as Select from "$lib/components/ui/select";
    import { superForm } from "sveltekit-superforms";
    import { toast } from "svelte-sonner";
    import { INDIAN_STATES, GST_TREATMENTS } from "./schema";
    import { ArrowLeft, Save } from "lucide-svelte";

    let { data } = $props();

    const { form, errors, enhance, submitting } = superForm(data.form, {
        onResult: ({ result }) => {
            if (result.type === "failure" && result.data?.error) {
                toast.error(result.data.error as string);
            }
        },
    });
</script>

<div class="page-full-bleed">
    <!-- Header -->
    <header
        class="flex items-center gap-4 px-6 py-4 border-b border-border bg-surface-0 z-20"
    >
        <Button variant="ghost" href="/customers" size="icon" class="h-8 w-8">
            <ArrowLeft class="size-4" />
        </Button>
        <div>
            <h1 class="text-xl font-bold tracking-tight text-text-strong">
                New Customer
            </h1>
            <p class="text-sm text-text-muted">
                Add a new customer to your business
            </p>
        </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 overflow-y-auto bg-surface-1">
        <form
            id="customer-form"
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
                                <Label for="name" variant="form">
                                    Customer Name <span class="text-destructive"
                                        >*</span
                                    >
                                </Label>
                                <Input
                                    id="name"
                                    name="name"
                                    bind:value={$form.name}
                                    placeholder="e.g. Acme Corp"
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
                                <Label for="company_name" variant="form"
                                    >Company Name</Label
                                >
                                <Input
                                    id="company_name"
                                    name="company_name"
                                    bind:value={$form.company_name}
                                    placeholder="Legal entity name"
                                    class="border-border-strong bg-surface-0"
                                />
                            </div>

                            <div class="space-y-2">
                                <Label for="email" variant="form"
                                    >Email</Label
                                >
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    bind:value={$form.email}
                                    placeholder="billing@example.com"
                                    class="border-border-strong bg-surface-0 {$errors.email
                                        ? 'border-destructive'
                                        : ''}"
                                />
                                {#if $errors.email}
                                    <p class="text-xs text-destructive">
                                        {$errors.email}
                                    </p>
                                {/if}
                            </div>

                            <div class="space-y-2">
                                <Label for="phone" variant="form"
                                    >Phone</Label
                                >
                                <Input
                                    id="phone"
                                    name="phone"
                                    bind:value={$form.phone}
                                    placeholder="+91 98765 43210"
                                    class="border-border-strong bg-surface-0 {$errors.phone
                                        ? 'border-destructive'
                                        : ''}"
                                />
                                {#if $errors.phone}
                                    <p class="text-xs text-destructive">
                                        {$errors.phone}
                                    </p>
                                {/if}
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
                                <Label for="billing_address" variant="form"
                                    >Billing Address</Label
                                >
                                <Input
                                    id="billing_address"
                                    name="billing_address"
                                    bind:value={$form.billing_address}
                                    placeholder="Street, Building, Area"
                                    class="border-border-strong bg-surface-0"
                                />
                            </div>

                            <div class="space-y-2">
                                <Label for="city" variant="form">City</Label
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
                                <Label for="state_code" variant="form"
                                    >State</Label
                                >
                                <Select.Root
                                    type="single"
                                    name="state_code"
                                    bind:value={$form.state_code}
                                >
                                    <Select.Trigger
                                        id="state_code"
                                        class="border-border-strong bg-surface-0 {$errors.state_code
                                            ? 'border-destructive'
                                            : ''}"
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
                                {#if $errors.state_code}
                                    <p class="text-xs text-destructive">
                                        {$errors.state_code}
                                    </p>
                                {/if}
                            </div>

                            <div class="space-y-2">
                                <Label for="pincode" variant="form"
                                    >Pincode</Label
                                >
                                <Input
                                    id="pincode"
                                    name="pincode"
                                    bind:value={$form.pincode}
                                    placeholder="000000"
                                    maxlength={6}
                                    class="border-border-strong bg-surface-0 {$errors.pincode
                                        ? 'border-destructive'
                                        : ''}"
                                />
                                {#if $errors.pincode}
                                    <p class="text-xs text-destructive">
                                        {$errors.pincode}
                                    </p>
                                {/if}
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            <!-- RIGHT COLUMN: Tax & Payment -->
            <div class="w-full md:w-96 bg-surface-0 p-6 md:p-8">
                <div class="space-y-8">
                    <!-- Section: Tax Details -->
                    <section class="space-y-6">
                        <h3
                            class="text-xs font-bold uppercase tracking-wide text-text-muted"
                        >
                            Tax & Payment
                        </h3>

                        <div class="space-y-4">
                            <div class="space-y-2">
                                <Label for="gst_treatment" variant="form"
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
                                        {GST_TREATMENTS.find(
                                            (t) =>
                                                t.value === $form.gst_treatment,
                                        )?.label || "Select treatment"}
                                    </Select.Trigger>
                                    <Select.Content>
                                        {#each GST_TREATMENTS as treatment}
                                            <Select.Item value={treatment.value}
                                                >{treatment.label}</Select.Item
                                            >
                                        {/each}
                                    </Select.Content>
                                </Select.Root>
                            </div>

                            <div class="space-y-2">
                                <Label for="gstin" variant="form"
                                    >GSTIN</Label
                                >
                                <Input
                                    id="gstin"
                                    name="gstin"
                                    bind:value={$form.gstin}
                                    placeholder="22AAAAA0000A1Z5"
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
                                <Label for="payment_terms" variant="form"
                                    >Payment Terms (Days)</Label
                                >
                                <Input
                                    id="payment_terms"
                                    name="payment_terms"
                                    type="number"
                                    bind:value={$form.payment_terms}
                                    min="0"
                                    max="365"
                                    placeholder="e.g. 15"
                                    class="border-border-strong bg-surface-0"
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
            <Button type="submit" form="customer-form" disabled={$submitting}>
                <Save class="mr-2 size-4" />
                {$submitting ? "Saving..." : "Save Customer"}
            </Button>
            <Button variant="ghost" href="/customers">Cancel</Button>
        </div>
    </div>
</div>
