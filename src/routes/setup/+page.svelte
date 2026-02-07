<script lang="ts">
    import { superForm } from "sveltekit-superforms";
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import { Card } from "$lib/components/ui/card";
    import * as Select from "$lib/components/ui/select";
    import type { PageData } from "./$types";
    import {
        Building2,
        FileText,
        CreditCard,
        Check,
        ArrowRight,
        ArrowLeft,
    } from "lucide-svelte";

    let { data, form }: { data: PageData; form: any } = $props();

    // Step management
    let currentStep = $state(1);
    const totalSteps = 3;

    const {
        form: formData,
        errors,
        constraints,
        enhance,
        delayed,
    } = superForm(data.form);

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

    const steps = [
        { id: 1, title: "Business", icon: Building2 },
        { id: 2, title: "GST", icon: FileText },
        { id: 3, title: "Bank", icon: CreditCard },
    ];

    function nextStep() {
        if (currentStep < totalSteps) {
            currentStep++;
        }
    }

    function prevStep() {
        if (currentStep > 1) {
            currentStep--;
        }
    }

    // Validation for step 1
    const canProceedStep1 = $derived(
        $formData.name?.trim() &&
            $formData.state_code &&
            $formData.address?.trim() &&
            $formData.pincode?.trim(),
    );
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
            <!-- Progress Steps -->
            <div class="mb-8">
                <div class="flex items-center justify-center gap-2 mb-4">
                    {#each steps as step, i}
                        <div class="flex items-center">
                            <div
                                class="flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all {currentStep >
                                step.id
                                    ? 'bg-primary border-primary text-white'
                                    : currentStep === step.id
                                      ? 'border-primary text-primary bg-primary/10'
                                      : 'border-border text-text-muted bg-surface-0'}"
                            >
                                {#if currentStep > step.id}
                                    <Check class="size-5" />
                                {:else}
                                    <step.icon class="size-5" />
                                {/if}
                            </div>
                            {#if i < steps.length - 1}
                                <div
                                    class="w-12 h-0.5 mx-2 {currentStep >
                                    step.id
                                        ? 'bg-primary'
                                        : 'bg-border'}"
                                ></div>
                            {/if}
                        </div>
                    {/each}
                </div>
                <p class="text-center text-sm text-text-muted">
                    Step {currentStep} of {totalSteps}
                </p>
            </div>

            <!-- Card -->
            <Card class="p-8 bg-surface-0 border-border shadow-lg">
                <form method="POST" use:enhance id="setup-form">
                    <!-- Step 1: Business Info -->
                    {#if currentStep === 1}
                        <div class="text-center mb-6">
                            <h2
                                class="text-2xl font-bold text-text-strong mb-2"
                            >
                                Let's set up your business
                            </h2>
                            <p class="text-text-muted">
                                This information appears on your invoices
                            </p>
                        </div>

                        <div class="space-y-4">
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

                            <div class="space-y-2">
                                <Label for="address" class="text-text-subtle">
                                    Address <span class="text-destructive"
                                        >*</span
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
                                    <Label for="email" class="text-text-subtle"
                                        >Email</Label
                                    >
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder="business@example.com"
                                        bind:value={$formData.email}
                                        {...$constraints.email}
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
                                        {...$constraints.phone}
                                        class="bg-surface-0 border-border"
                                    />
                                </div>
                            </div>
                        </div>
                    {/if}

                    <!-- Step 2: GST Info -->
                    {#if currentStep === 2}
                        <div class="text-center mb-6">
                            <h2
                                class="text-2xl font-bold text-text-strong mb-2"
                            >
                                GST Registration
                            </h2>
                            <p class="text-text-muted">
                                Optional — add this later in Settings
                            </p>
                        </div>

                        <div class="space-y-4">
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
                    {/if}

                    <!-- Step 3: Bank Info -->
                    {#if currentStep === 3}
                        <div class="text-center mb-6">
                            <h2
                                class="text-2xl font-bold text-text-strong mb-2"
                            >
                                Bank Details
                            </h2>
                            <p class="text-text-muted">
                                Optional — shows on invoices for payment
                            </p>
                        </div>

                        <div class="space-y-4">
                            <div class="grid grid-cols-2 gap-4">
                                <div class="space-y-2">
                                    <Label
                                        for="bank_name"
                                        class="text-text-subtle"
                                        >Bank Name</Label
                                    >
                                    <Input
                                        id="bank_name"
                                        name="bank_name"
                                        placeholder="HDFC Bank"
                                        class="bg-surface-0 border-border"
                                    />
                                </div>
                                <div class="space-y-2">
                                    <Label for="branch" class="text-text-subtle"
                                        >Branch</Label
                                    >
                                    <Input
                                        id="branch"
                                        name="branch"
                                        placeholder="Koramangala"
                                        class="bg-surface-0 border-border"
                                    />
                                </div>
                            </div>

                            <div class="grid grid-cols-2 gap-4">
                                <div class="space-y-2">
                                    <Label
                                        for="account_number"
                                        class="text-text-subtle"
                                        >Account Number</Label
                                    >
                                    <Input
                                        id="account_number"
                                        name="account_number"
                                        placeholder="50100123456789"
                                        class="bg-surface-0 border-border font-mono"
                                    />
                                </div>
                                <div class="space-y-2">
                                    <Label for="ifsc" class="text-text-subtle"
                                        >IFSC Code</Label
                                    >
                                    <Input
                                        id="ifsc"
                                        name="ifsc"
                                        placeholder="HDFC0001234"
                                        class="bg-surface-0 border-border font-mono uppercase"
                                    />
                                </div>
                            </div>

                            <div class="space-y-2">
                                <Label for="upi_id" class="text-text-subtle"
                                    >UPI ID</Label
                                >
                                <Input
                                    id="upi_id"
                                    name="upi_id"
                                    placeholder="business@upi"
                                    class="bg-surface-0 border-border font-mono"
                                />
                            </div>

                            <div
                                class="bg-amber-50 border border-amber-200 rounded-lg p-4"
                            >
                                <p class="text-sm text-amber-800">
                                    You can always add or edit bank details
                                    later in <strong
                                        >Settings → Bank & UPI</strong
                                    >
                                </p>
                            </div>
                        </div>
                    {/if}

                    {#if form?.error}
                        <div
                            class="mt-4 text-sm text-destructive font-medium text-center py-2 px-3 bg-red-50 rounded-lg border border-red-200"
                        >
                            {form.error}
                        </div>
                    {/if}

                    <!-- Navigation Buttons -->
                    <div class="mt-8 flex items-center justify-between">
                        {#if currentStep > 1}
                            <Button
                                type="button"
                                variant="ghost"
                                onclick={prevStep}
                                class="gap-2"
                            >
                                <ArrowLeft class="size-4" />
                                Back
                            </Button>
                        {:else}
                            <div></div>
                        {/if}

                        {#if currentStep < totalSteps}
                            <div class="flex items-center gap-3">
                                {#if currentStep > 1}
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onclick={nextStep}
                                        class="text-text-muted"
                                    >
                                        Skip
                                    </Button>
                                {/if}
                                <Button
                                    type="button"
                                    onclick={nextStep}
                                    disabled={currentStep === 1 &&
                                        !canProceedStep1}
                                    class="gap-2"
                                >
                                    Continue
                                    <ArrowRight class="size-4" />
                                </Button>
                            </div>
                        {:else}
                            <div class="flex items-center gap-3">
                                <Button
                                    type="submit"
                                    disabled={$delayed}
                                    class="gap-2"
                                >
                                    {#if $delayed}
                                        Setting up...
                                    {:else}
                                        Start Invoicing
                                        <ArrowRight class="size-4" />
                                    {/if}
                                </Button>
                            </div>
                        {/if}
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
