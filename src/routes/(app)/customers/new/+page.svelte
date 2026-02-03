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

<div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center gap-4">
        <Button variant="ghost" href="/customers" class="p-2">
            <ArrowLeft class="size-4" />
        </Button>
        <div>
            <h1 class="text-xl font-semibold">New Customer</h1>
            <p class="text-sm text-muted-foreground">
                Add a new customer to your business
            </p>
        </div>
    </div>

    {#if data.error}
        <div class="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
            {data.error}
        </div>
    {/if}

    <!-- Form -->
    <Card class="p-6">
        <form method="POST" use:enhance class="space-y-6">
            <!-- Basic Info -->
            <div class="space-y-4">
                <h2 class="text-lg font-medium border-b pb-2">
                    Basic Information
                </h2>
                <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <div class="space-y-2">
                        <Label for="name">Customer Name *</Label>
                        <Input
                            id="name"
                            name="name"
                            bind:value={$form.name}
                            placeholder="Enter customer name"
                            class={$errors.name ? "border-destructive" : ""}
                        />
                        {#if $errors.name}
                            <p class="text-sm text-destructive">
                                {$errors.name}
                            </p>
                        {/if}
                    </div>

                    <div class="space-y-2">
                        <Label for="company_name">Company Name</Label>
                        <Input
                            id="company_name"
                            name="company_name"
                            bind:value={$form.company_name}
                            placeholder="Enter company name"
                        />
                    </div>

                    <div class="space-y-2">
                        <Label for="email">Email</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            bind:value={$form.email}
                            placeholder="customer@example.com"
                            class={$errors.email ? "border-destructive" : ""}
                        />
                        {#if $errors.email}
                            <p class="text-sm text-destructive">
                                {$errors.email}
                            </p>
                        {/if}
                    </div>

                    <div class="space-y-2">
                        <Label for="phone">Phone</Label>
                        <Input
                            id="phone"
                            name="phone"
                            bind:value={$form.phone}
                            placeholder="10-digit phone number"
                            class={$errors.phone ? "border-destructive" : ""}
                        />
                        {#if $errors.phone}
                            <p class="text-sm text-destructive">
                                {$errors.phone}
                            </p>
                        {/if}
                    </div>
                </div>
            </div>

            <!-- Address -->
            <div class="space-y-4">
                <h2 class="text-lg font-medium border-b pb-2">Address</h2>
                <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div class="space-y-2 lg:col-span-2">
                        <Label for="billing_address">Billing Address</Label>
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
                        <Label for="pincode">Pincode</Label>
                        <Input
                            id="pincode"
                            name="pincode"
                            bind:value={$form.pincode}
                            placeholder="6-digit pincode"
                            class={$errors.pincode ? "border-destructive" : ""}
                        />
                        {#if $errors.pincode}
                            <p class="text-sm text-destructive">
                                {$errors.pincode}
                            </p>
                        {/if}
                    </div>

                    <div class="space-y-2">
                        <Label for="state_code">State</Label>
                        <Select.Root
                            type="single"
                            name="state_code"
                            bind:value={$form.state_code}
                        >
                            <Select.Trigger
                                id="state_code"
                                class={$errors.state_code
                                    ? "border-destructive"
                                    : ""}
                            >
                                {INDIAN_STATES.find(
                                    (s) => s.code === $form.state_code,
                                )?.name || "Select state"}
                            </Select.Trigger>
                            <Select.Content>
                                {#each INDIAN_STATES as state}
                                    <Select.Item value={state.code}
                                        >{state.name}</Select.Item
                                    >
                                {/each}
                            </Select.Content>
                        </Select.Root>
                        {#if $errors.state_code}
                            <p class="text-sm text-destructive">
                                {$errors.state_code}
                            </p>
                        {/if}
                    </div>
                </div>
            </div>

            <!-- GST Details -->
            <div class="space-y-4">
                <h2 class="text-lg font-medium border-b pb-2">GST Details</h2>
                <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <div class="space-y-2">
                        <Label for="gst_treatment">GST Treatment</Label>
                        <Select.Root
                            type="single"
                            name="gst_treatment"
                            bind:value={$form.gst_treatment}
                        >
                            <Select.Trigger id="gst_treatment">
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
                        <Label for="gstin">GSTIN</Label>
                        <Input
                            id="gstin"
                            name="gstin"
                            bind:value={$form.gstin}
                            placeholder="22AAAAA0000A1Z5"
                            class="font-mono uppercase {$errors.gstin
                                ? 'border-destructive'
                                : ''}"
                        />
                        {#if $errors.gstin}
                            <p class="text-sm text-destructive">
                                {$errors.gstin}
                            </p>
                        {/if}
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

            <!-- Actions -->
            <div class="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" href="/customers" type="button">
                    Cancel
                </Button>
                <Button type="submit" disabled={$submitting}>
                    <Save class="mr-2 size-4" />
                    {$submitting ? "Saving..." : "Save Customer"}
                </Button>
            </div>
        </form>
    </Card>
</div>
