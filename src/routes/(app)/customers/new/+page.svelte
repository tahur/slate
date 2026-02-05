<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import { Card } from "$lib/components/ui/card";
    import * as Select from "$lib/components/ui/select";
    import { superForm } from "sveltekit-superforms";
    import { addToast } from "$lib/stores/toast";
    import { INDIAN_STATES, GST_TREATMENTS } from "./schema";
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

<div class="flex flex-col h-[calc(100vh-3.5rem)] -mx-4 md:-mx-8 md:-my-6 -my-4">
    <!-- Header -->
    <div
        class="flex-none px-6 py-4 border-b border-border bg-surface-0 flex items-center gap-4"
    >
        <Button
            variant="ghost"
            href="/customers"
            size="icon"
            class="text-text-muted hover:text-text-strong"
        >
            <ArrowLeft class="size-4" />
        </Button>
        <div>
            <h1 class="text-xl font-bold tracking-tight text-text-strong">
                New Customer
            </h1>
            <p class="text-xs text-text-muted">
                Add a new customer to your business
            </p>
        </div>
    </div>

    <!-- Scrollable Content -->
    <main class="flex-1 overflow-y-auto bg-background p-6">
        <div class="max-w-3xl mx-auto space-y-6">
            <form
                id="customer-form"
                method="POST"
                use:enhance
                class="space-y-6 pb-24"
            >
                <!-- Card 1: Basic Information -->
                <div
                    class="bg-surface-1 rounded-lg border border-border p-6 shadow-sm"
                >
                    <h3
                        class="text-xs font-bold uppercase tracking-widest text-text-muted mb-6"
                    >
                        Basic Information
                    </h3>
                    <div class="grid gap-5 md:grid-cols-2">
                        <div class="space-y-2">
                            <Label
                                for="name"
                                class="text-xs uppercase tracking-wider text-text-muted font-bold"
                                >Customer Name <span class="text-primary"
                                    >*</span
                                ></Label
                            >
                            <Input
                                id="name"
                                name="name"
                                bind:value={$form.name}
                                placeholder="e.g. Acme Corp"
                                class={$errors.name
                                    ? "border-destructive bg-surface-0"
                                    : "bg-surface-0"}
                            />
                            {#if $errors.name}
                                <p class="text-xs text-destructive font-medium">
                                    {$errors.name}
                                </p>
                            {/if}
                        </div>

                        <div class="space-y-2">
                            <Label
                                for="company_name"
                                class="text-xs uppercase tracking-wider text-text-muted font-bold"
                                >Company Name</Label
                            >
                            <Input
                                id="company_name"
                                name="company_name"
                                bind:value={$form.company_name}
                                placeholder="Legal entity name"
                                class="bg-surface-0"
                            />
                        </div>

                        <div class="space-y-2">
                            <Label
                                for="email"
                                class="text-xs uppercase tracking-wider text-text-muted font-bold"
                                >Email</Label
                            >
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                bind:value={$form.email}
                                placeholder="billing@example.com"
                                class={$errors.email
                                    ? "border-destructive bg-surface-0"
                                    : "bg-surface-0"}
                            />
                            {#if $errors.email}
                                <p class="text-xs text-destructive font-medium">
                                    {$errors.email}
                                </p>
                            {/if}
                        </div>

                        <div class="space-y-2">
                            <Label
                                for="phone"
                                class="text-xs uppercase tracking-wider text-text-muted font-bold"
                                >Phone</Label
                            >
                            <Input
                                id="phone"
                                name="phone"
                                bind:value={$form.phone}
                                placeholder="+91 98765 43210"
                                class={$errors.phone
                                    ? "border-destructive bg-surface-0"
                                    : "bg-surface-0"}
                            />
                            {#if $errors.phone}
                                <p class="text-xs text-destructive font-medium">
                                    {$errors.phone}
                                </p>
                            {/if}
                        </div>
                    </div>
                </div>

                <!-- Card 2: Address -->
                <div
                    class="bg-surface-1 rounded-lg border border-border p-6 shadow-sm"
                >
                    <h3
                        class="text-xs font-bold uppercase tracking-widest text-text-muted mb-6"
                    >
                        Address
                    </h3>
                    <div class="grid gap-5 md:grid-cols-2">
                        <div class="space-y-2 md:col-span-2">
                            <Label
                                for="billing_address"
                                class="text-xs uppercase tracking-wider text-text-muted font-bold"
                                >Billing Address</Label
                            >
                            <Input
                                id="billing_address"
                                name="billing_address"
                                bind:value={$form.billing_address}
                                placeholder="Street, Building, Area"
                                class="bg-surface-0"
                            />
                        </div>

                        <div class="space-y-2">
                            <Label
                                for="city"
                                class="text-xs uppercase tracking-wider text-text-muted font-bold"
                                >City</Label
                            >
                            <Input
                                id="city"
                                name="city"
                                bind:value={$form.city}
                                placeholder="City"
                                class="bg-surface-0"
                            />
                        </div>

                        <div class="space-y-2">
                            <Label
                                for="pincode"
                                class="text-xs uppercase tracking-wider text-text-muted font-bold"
                                >Pincode</Label
                            >
                            <Input
                                id="pincode"
                                name="pincode"
                                bind:value={$form.pincode}
                                placeholder="000000"
                                class={$errors.pincode
                                    ? "border-destructive bg-surface-0"
                                    : "bg-surface-0"}
                            />
                            {#if $errors.pincode}
                                <p class="text-xs text-destructive font-medium">
                                    {$errors.pincode}
                                </p>
                            {/if}
                        </div>

                        <div class="space-y-2">
                            <Label
                                for="state_code"
                                class="text-xs uppercase tracking-wider text-text-muted font-bold"
                                >State</Label
                            >
                            <Select.Root
                                type="single"
                                name="state_code"
                                bind:value={$form.state_code}
                            >
                                <Select.Trigger
                                    id="state_code"
                                    class={$errors.state_code
                                        ? "border-destructive bg-surface-0"
                                        : "bg-surface-0"}
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
                                <p class="text-xs text-destructive font-medium">
                                    {$errors.state_code}
                                </p>
                            {/if}
                        </div>
                    </div>
                </div>

                <!-- Card 3: GST Details -->
                <div
                    class="bg-surface-1 rounded-lg border border-border p-6 shadow-sm"
                >
                    <h3
                        class="text-xs font-bold uppercase tracking-widest text-text-muted mb-6"
                    >
                        Tax & Payment
                    </h3>
                    <div class="grid gap-5 md:grid-cols-2">
                        <div class="space-y-2">
                            <Label
                                for="gst_treatment"
                                class="text-xs uppercase tracking-wider text-text-muted font-bold"
                                >GST Treatment</Label
                            >
                            <Select.Root
                                type="single"
                                name="gst_treatment"
                                bind:value={$form.gst_treatment}
                            >
                                <Select.Trigger
                                    id="gst_treatment"
                                    class="bg-surface-0"
                                >
                                    {GST_TREATMENTS.find(
                                        (t) => t.value === $form.gst_treatment,
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
                            <Label
                                for="gstin"
                                class="text-xs uppercase tracking-wider text-text-muted font-bold"
                                >GSTIN</Label
                            >
                            <Input
                                id="gstin"
                                name="gstin"
                                bind:value={$form.gstin}
                                placeholder="22AAAAA0000A1Z5"
                                class="uppercase font-mono tracking-wide bg-surface-0 {$errors.gstin
                                    ? 'border-destructive'
                                    : ''}"
                            />
                            {#if $errors.gstin}
                                <p class="text-xs text-destructive font-medium">
                                    {$errors.gstin}
                                </p>
                            {/if}
                        </div>

                        <div class="space-y-2">
                            <Label
                                for="payment_terms"
                                class="text-xs uppercase tracking-wider text-text-muted font-bold"
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
                                class="bg-surface-0"
                            />
                        </div>
                    </div>
                </div>
            </form>
        </div>
    </main>

    <!-- Sticky Bottom Bar -->
    <div
        class="flex-none bg-surface-1 border-t border-border shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] px-6 py-4 flex items-center justify-end gap-3 z-20"
    >
        <Button
            variant="ghost"
            href="/customers"
            type="button"
            class="text-text-muted hover:text-destructive"
        >
            Cancel
        </Button>
        <Button
            type="submit"
            form="customer-form"
            disabled={$submitting}
            class="bg-primary text-primary-foreground font-semibold tracking-wide shadow-sm hover:bg-primary/90 shadow-primary/20 min-w-[140px]"
        >
            <Save class="mr-2 size-4" />
            {$submitting ? "Saving..." : "Save Customer"}
        </Button>
    </div>
</div>
