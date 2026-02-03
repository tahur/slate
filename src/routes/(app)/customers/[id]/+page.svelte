<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import { Card } from "$lib/components/ui/card";
    import { Badge } from "$lib/components/ui/badge";
    import * as Select from "$lib/components/ui/select";
    import { superForm } from "sveltekit-superforms";
    import { addToast } from "$lib/stores/toast";
    import { INDIAN_STATES, GST_TREATMENTS } from "../new/schema";
    import {
        ArrowLeft,
        Save,
        Pencil,
        X,
        FileText,
        Download,
    } from "lucide-svelte";

    let { data } = $props();

    let isEditing = $state(false);

    const { form, errors, enhance, submitting } = superForm(data.form, {
        onResult: ({ result }) => {
            if (result.type === "success") {
                isEditing = false;
                addToast({
                    type: "success",
                    message: "Customer updated successfully.",
                });
            }
            if (result.type === "failure" && result.data?.error) {
                addToast({
                    type: "error",
                    message: result.data.error as string,
                });
            }
        },
    });

    function formatCurrency(amount: number | null): string {
        if (amount === null || amount === undefined) return "₹0.00";
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 2,
        }).format(amount);
    }

    function getStateName(code: string | null): string {
        if (!code) return "—";
        return INDIAN_STATES.find((s) => s.code === code)?.name || code;
    }
</script>

<div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
            <Button variant="ghost" href="/customers" class="p-2">
                <ArrowLeft class="size-4" />
            </Button>
            <div>
                <h1 class="text-xl font-semibold">{data.customer.name}</h1>
                {#if data.customer.company_name}
                    <p class="text-sm text-muted-foreground">
                        {data.customer.company_name}
                    </p>
                {/if}
            </div>
        </div>
        <div class="flex items-center gap-2">
            <Badge
                variant={data.customer.status === "active"
                    ? "default"
                    : "secondary"}
            >
                {data.customer.status}
            </Badge>
            <Button
                variant="outline"
                href="/api/customers/{data.customer.id}/statement"
                target="_blank"
            >
                <Download class="mr-2 size-4" />
                Statement
            </Button>
            {#if !isEditing}
                <Button variant="outline" onclick={() => (isEditing = true)}>
                    <Pencil class="mr-2 size-4" />
                    Edit
                </Button>
            {/if}
        </div>
    </div>

    <!-- Content -->
    <div class="grid gap-4 lg:grid-cols-3">
        <!-- Main Info -->
        <Card class="p-6 lg:col-span-2">
            {#if isEditing}
                <!-- Edit Form -->
                <form method="POST" use:enhance class="space-y-6">
                    <!-- Basic Info -->
                    <div class="space-y-4">
                        <h2 class="text-lg font-medium border-b pb-2">
                            Basic Information
                        </h2>
                        <div class="grid gap-4 md:grid-cols-2">
                            <div class="space-y-2">
                                <Label for="name">Customer Name *</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    bind:value={$form.name}
                                    class={$errors.name
                                        ? "border-destructive"
                                        : ""}
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
                                />
                            </div>

                            <div class="space-y-2">
                                <Label for="email">Email</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    bind:value={$form.email}
                                    class={$errors.email
                                        ? "border-destructive"
                                        : ""}
                                />
                            </div>

                            <div class="space-y-2">
                                <Label for="phone">Phone</Label>
                                <Input
                                    id="phone"
                                    name="phone"
                                    bind:value={$form.phone}
                                    class={$errors.phone
                                        ? "border-destructive"
                                        : ""}
                                />
                            </div>
                        </div>
                    </div>

                    <!-- Address -->
                    <div class="space-y-4">
                        <h2 class="text-lg font-medium border-b pb-2">
                            Address
                        </h2>
                        <div class="grid gap-4 md:grid-cols-2">
                            <div class="space-y-2 md:col-span-2">
                                <Label for="billing_address"
                                    >Billing Address</Label
                                >
                                <Input
                                    id="billing_address"
                                    name="billing_address"
                                    bind:value={$form.billing_address}
                                />
                            </div>

                            <div class="space-y-2">
                                <Label for="city">City</Label>
                                <Input
                                    id="city"
                                    name="city"
                                    bind:value={$form.city}
                                />
                            </div>

                            <div class="space-y-2">
                                <Label for="state_code">State</Label>
                                <Select.Root
                                    type="single"
                                    name="state_code"
                                    bind:value={$form.state_code}
                                >
                                    <Select.Trigger id="state_code">
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
                            </div>

                            <div class="space-y-2">
                                <Label for="pincode">Pincode</Label>
                                <Input
                                    id="pincode"
                                    name="pincode"
                                    bind:value={$form.pincode}
                                    class={$errors.pincode
                                        ? "border-destructive"
                                        : ""}
                                />
                            </div>
                        </div>
                    </div>

                    <!-- GST Details -->
                    <div class="space-y-4">
                        <h2 class="text-lg font-medium border-b pb-2">
                            GST Details
                        </h2>
                        <div class="grid gap-4 md:grid-cols-2">
                            <div class="space-y-2">
                                <Label for="gst_treatment">GST Treatment</Label>
                                <Select.Root
                                    type="single"
                                    name="gst_treatment"
                                    bind:value={$form.gst_treatment}
                                >
                                    <Select.Trigger id="gst_treatment">
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
                                <Label for="gstin">GSTIN</Label>
                                <Input
                                    id="gstin"
                                    name="gstin"
                                    bind:value={$form.gstin}
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
                                <Label for="payment_terms"
                                    >Payment Terms (days)</Label
                                >
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
                        <Button
                            variant="outline"
                            type="button"
                            onclick={() => (isEditing = false)}
                        >
                            <X class="mr-2 size-4" />
                            Cancel
                        </Button>
                        <Button type="submit" disabled={$submitting}>
                            <Save class="mr-2 size-4" />
                            {$submitting ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </form>
            {:else}
                <!-- View Mode -->
                <div class="space-y-6">
                    <div class="space-y-4">
                        <h2 class="text-lg font-medium border-b pb-2">
                            Contact Information
                        </h2>
                        <div class="grid gap-4 md:grid-cols-2">
                            <div>
                                <p class="text-sm text-muted-foreground">
                                    Email
                                </p>
                                <p class="font-medium">
                                    {data.customer.email || "—"}
                                </p>
                            </div>
                            <div>
                                <p class="text-sm text-muted-foreground">
                                    Phone
                                </p>
                                <p class="font-medium">
                                    {data.customer.phone || "—"}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div class="space-y-4">
                        <h2 class="text-lg font-medium border-b pb-2">
                            Address
                        </h2>
                        <div class="grid gap-4 md:grid-cols-2">
                            <div class="md:col-span-2">
                                <p class="text-sm text-muted-foreground">
                                    Billing Address
                                </p>
                                <p class="font-medium">
                                    {data.customer.billing_address || "—"}
                                    {#if data.customer.city}, {data.customer
                                            .city}{/if}
                                    {#if data.customer.pincode}
                                        - {data.customer.pincode}{/if}
                                </p>
                            </div>
                            <div>
                                <p class="text-sm text-muted-foreground">
                                    State
                                </p>
                                <p class="font-medium">
                                    {getStateName(data.customer.state_code)}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div class="space-y-4">
                        <h2 class="text-lg font-medium border-b pb-2">
                            GST Details
                        </h2>
                        <div class="grid gap-4 md:grid-cols-2">
                            <div>
                                <p class="text-sm text-muted-foreground">
                                    GST Treatment
                                </p>
                                <p class="font-medium capitalize">
                                    {data.customer.gst_treatment}
                                </p>
                            </div>
                            <div>
                                <p class="text-sm text-muted-foreground">
                                    GSTIN
                                </p>
                                <p class="font-medium font-mono">
                                    {data.customer.gstin || "—"}
                                </p>
                            </div>
                            <div>
                                <p class="text-sm text-muted-foreground">
                                    Payment Terms
                                </p>
                                <p class="font-medium">
                                    {data.customer.payment_terms || 0} days
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            {/if}
        </Card>

        <!-- Sidebar -->
        <div class="space-y-4">
            <!-- Balance Card -->
            <Card class="p-6">
                <h3 class="text-sm font-medium text-muted-foreground mb-2">
                    Outstanding Balance
                </h3>
                <p class="text-2xl font-semibold font-mono">
                    {formatCurrency(data.customer.balance)}
                </p>
            </Card>

            <!-- Invoices Placeholder -->
            <Card class="p-6">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-sm font-medium text-muted-foreground">
                        Recent Invoices
                    </h3>
                    <FileText class="size-4 text-muted-foreground" />
                </div>
                <p class="text-sm text-muted-foreground text-center py-4">
                    No invoices yet
                </p>
            </Card>
        </div>
    </div>
</div>
