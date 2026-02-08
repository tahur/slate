<script lang="ts">
    import { superForm } from "sveltekit-superforms";
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import { Card } from "$lib/components/ui/card";
    import * as Select from "$lib/components/ui/select";
    import type { PageData } from "./$types";
    import { Building2, ArrowRight } from "lucide-svelte";

    let { data, form }: { data: PageData; form: any } = $props();

    const {
        form: formData,
        errors,
        constraints,
        enhance,
        delayed,
    } = superForm(data.form, {
        onUpdated: ({ form }) => {
            // If form submission was successful, redirect to dashboard
            if (form.valid) {
                window.location.href = "/dashboard";
            }
        },
    });

    // Indian States for Dropdown
    const states = [
        { code: "37", name: "Andhra Pradesh" },
        { code: "12", name: "Arunachal Pradesh" },
        { code: "18", name: "Assam" },
        { code: "10", name: "Bihar" },
        { code: "22", name: "Chhattisgarh" },
        { code: "30", name: "Goa" },
        { code: "24", name: "Gujarat" },
        { code: "06", name: "Haryana" },
        { code: "02", name: "Himachal Pradesh" },
        { code: "20", name: "Jharkhand" },
        { code: "29", name: "Karnataka" },
        { code: "32", name: "Kerala" },
        { code: "23", name: "Madhya Pradesh" },
        { code: "27", name: "Maharashtra" },
        { code: "14", name: "Manipur" },
        { code: "17", name: "Meghalaya" },
        { code: "15", name: "Mizoram" },
        { code: "13", name: "Nagaland" },
        { code: "21", name: "Odisha" },
        { code: "03", name: "Punjab" },
        { code: "08", name: "Rajasthan" },
        { code: "11", name: "Sikkim" },
        { code: "33", name: "Tamil Nadu" },
        { code: "36", name: "Telangana" },
        { code: "16", name: "Tripura" },
        { code: "09", name: "Uttar Pradesh" },
        { code: "05", name: "Uttarakhand" },
        { code: "19", name: "West Bengal" },
        { code: "35", name: "Andaman and Nicobar Islands" },
        { code: "04", name: "Chandigarh" },
        { code: "26", name: "Dadra and Nagar Haveli and Daman and Diu" },
        { code: "07", name: "Delhi" },
        { code: "01", name: "Jammu and Kashmir" },
        { code: "31", name: "Lakshadweep" },
        { code: "34", name: "Puducherry" },
        { code: "38", name: "Ladakh" },
    ].sort((a, b) => a.name.localeCompare(b.name));
</script>

<div class="min-h-screen bg-surface-1 flex flex-col">
    <!-- Header -->
    <header class="border-b border-border bg-surface-0 px-6 py-4">
        <div class="max-w-2xl mx-auto flex items-center gap-3">
            <div class="bg-primary/10 p-2 rounded-lg">
                <img src="/logo.svg" alt="Slate Logo" class="w-6 h-6" />
            </div>
            <span class="font-display text-xl font-bold text-text-strong"
                >Slate</span
            >
        </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 flex items-center justify-center p-6">
        <div class="w-full max-w-2xl">
            <!-- Card -->
            <Card class="p-8 bg-surface-0 border-border shadow-lg">
                <div class="text-center mb-8">
                    <div
                        class="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4"
                    >
                        <Building2 class="size-7 text-primary" />
                    </div>
                    <h2 class="text-3xl font-bold text-text-strong mb-2">
                        Set up your business
                    </h2>
                    <p class="text-text-muted">
                        This information appears on your invoices
                    </p>
                </div>

                <form method="POST" use:enhance id="setup-form">
                    <div class="space-y-6">
                        <!-- Business Info Section -->
                        <div class="space-y-4">
                            <h3 class="text-lg font-semibold text-text-strong">
                                Business Details
                            </h3>

                            <div class="space-y-2">
                                <Label for="name" class="text-text-subtle">
                                    Business Name <span class="text-destructive"
                                        >*</span
                                    >
                                </Label>
                                <Input
                                    id="name"
                                    name="name"
                                    placeholder="Acme Enterprises"
                                    bind:value={$formData.name}
                                    {...$constraints.name}
                                    class="bg-surface-0 border-border"
                                />
                                {#if $errors.name}
                                    <span class="text-xs text-destructive"
                                        >{$errors.name}</span
                                    >
                                {/if}
                            </div>

                            <div class="grid grid-cols-2 gap-4">
                                <div class="space-y-2">
                                    <Label for="email" class="text-text-subtle"
                                        >Email</Label
                                    >
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder="business@example.com"
                                        bind:value={$formData.email}
                                        class="bg-surface-0 border-border"
                                    />
                                </div>
                                <div class="space-y-2">
                                    <Label for="phone" class="text-text-subtle"
                                        >Phone</Label
                                    >
                                    <Input
                                        id="phone"
                                        name="phone"
                                        placeholder="+91 98765 43210"
                                        bind:value={$formData.phone}
                                        class="bg-surface-0 border-border"
                                    />
                                </div>
                            </div>
                        </div>

                        <!-- Address Section -->
                        <div class="space-y-4">
                            <h3 class="text-lg font-semibold text-text-strong">
                                Address
                            </h3>

                            <div class="space-y-2">
                                <Label for="address" class="text-text-subtle">
                                    Street Address <span
                                        class="text-destructive">*</span
                                    >
                                </Label>
                                <Input
                                    id="address"
                                    name="address"
                                    placeholder="123, Business Street, Area"
                                    bind:value={$formData.address}
                                    {...$constraints.address}
                                    class="bg-surface-0 border-border"
                                />
                                {#if $errors.address}
                                    <span class="text-xs text-destructive"
                                        >{$errors.address}</span
                                    >
                                {/if}
                            </div>

                            <div class="grid grid-cols-2 gap-4">
                                <div class="space-y-2">
                                    <Label
                                        for="state_code"
                                        class="text-text-subtle"
                                    >
                                        State <span class="text-destructive"
                                            >*</span
                                        >
                                    </Label>
                                    <Select.Root
                                        type="single"
                                        bind:value={
                                            $formData.state_code as string
                                        }
                                        name="state_code"
                                    >
                                        <Select.Trigger
                                            class="bg-surface-0 border-border"
                                        >
                                            {#if $formData.state_code}
                                                {states.find(
                                                    (s) =>
                                                        s.code ===
                                                        $formData.state_code,
                                                )?.name}
                                            {:else}
                                                <span class="text-text-muted"
                                                    >Select state</span
                                                >
                                            {/if}
                                        </Select.Trigger>
                                        <Select.Content class="max-h-[200px]">
                                            {#each states as state}
                                                <Select.Item value={state.code}
                                                    >{state.name}</Select.Item
                                                >
                                            {/each}
                                        </Select.Content>
                                    </Select.Root>
                                    <input
                                        type="hidden"
                                        name="state_code"
                                        value={$formData.state_code}
                                    />
                                    {#if $errors.state_code}
                                        <span class="text-xs text-destructive"
                                            >{$errors.state_code}</span
                                        >
                                    {/if}
                                </div>
                                <div class="space-y-2">
                                    <Label
                                        for="pincode"
                                        class="text-text-subtle"
                                    >
                                        Pincode <span class="text-destructive"
                                            >*</span
                                        >
                                    </Label>
                                    <Input
                                        id="pincode"
                                        name="pincode"
                                        placeholder="560001"
                                        maxlength={6}
                                        bind:value={$formData.pincode}
                                        {...$constraints.pincode}
                                        class="bg-surface-0 border-border font-mono"
                                    />
                                    {#if $errors.pincode}
                                        <span class="text-xs text-destructive"
                                            >{$errors.pincode}</span
                                        >
                                    {/if}
                                </div>
                            </div>
                        </div>

                        <!-- GST Section -->
                        <div class="space-y-4">
                            <div>
                                <h3
                                    class="text-lg font-semibold text-text-strong"
                                >
                                    GST Registration
                                </h3>
                                <p class="text-sm text-text-muted mt-1">
                                    Optional — add this later in Settings
                                </p>
                            </div>

                            <div class="space-y-2">
                                <Label for="gstin" class="text-text-subtle"
                                    >GSTIN</Label
                                >
                                <Input
                                    id="gstin"
                                    name="gstin"
                                    placeholder="29ABCDE1234F1Z5"
                                    bind:value={$formData.gstin}
                                    {...$constraints.gstin}
                                    class="bg-surface-0 border-border font-mono uppercase"
                                />
                                <p class="text-xs text-text-muted">
                                    15-character GST number
                                </p>
                                {#if $errors.gstin}
                                    <span class="text-xs text-destructive"
                                        >{$errors.gstin}</span
                                    >
                                {/if}
                            </div>

                            <div
                                class="bg-blue-50 border border-blue-200 rounded-lg p-4"
                            >
                                <p class="text-sm text-blue-800">
                                    <strong>Not registered for GST?</strong> You
                                    can still create invoices without GSTIN. Add
                                    it later when you register.
                                </p>
                            </div>
                        </div>
                    </div>

                    {#if form?.error}
                        <div
                            class="mt-6 text-sm text-destructive font-medium text-center py-2 px-3 bg-red-50 rounded-lg border border-red-200"
                        >
                            {form.error}
                        </div>
                    {/if}

                    <!-- Submit Button -->
                    <div class="mt-8">
                        <Button
                            type="submit"
                            disabled={$delayed}
                            class="w-full gap-2"
                        >
                            {#if $delayed}
                                Setting up...
                            {:else}
                                Start Invoicing
                                <ArrowRight class="size-4" />
                            {/if}
                        </Button>
                    </div>
                </form>
            </Card>

            <!-- Help text -->
            <p class="text-center text-xs text-text-muted mt-6">
                Need help? Check our <a
                    href="https://github.com/anthropics/slate"
                    class="text-primary hover:underline"
                    target="_blank"
                    rel="noopener">documentation</a
                >
            </p>
        </div>
    </main>
</div>
