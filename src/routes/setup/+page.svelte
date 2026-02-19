<script lang="ts">
    import { superForm } from "sveltekit-superforms";
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import { Card } from "$lib/components/ui/card";
    import { INDIAN_STATES } from "../(app)/customers/new/schema";
    import type { PageData } from "./$types";
    import { Building2, ArrowRight } from "lucide-svelte";

    let { data, form }: { data: PageData; form: any } = $props();
    const { form: initialForm } = data;

    const {
        form: formData,
        errors,
        constraints,
        enhance,
        delayed,
    } = superForm(initialForm);

    let stateSearch = $state("");
    let stateDropdownOpen = $state(false);
    const filteredStates = $derived(
        stateSearch
            ? INDIAN_STATES.filter(
                  (s) =>
                      s.name.toLowerCase().includes(stateSearch.toLowerCase()) ||
                      s.code.includes(stateSearch),
              )
            : INDIAN_STATES,
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
                                <div class="space-y-2 relative">
                                    <Label
                                        for="state_code"
                                        class="text-text-subtle"
                                    >
                                        State <span class="text-destructive"
                                            >*</span
                                        >
                                    </Label>
                                    <input type="hidden" name="state_code" value={$formData.state_code} />
                                    <div class="relative">
                                        <input
                                            id="state_code"
                                            type="text"
                                            class="flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary bg-surface-0 border-border {$errors.state_code ? 'border-destructive' : ''}"
                                            placeholder="Search state..."
                                            value={INDIAN_STATES.find((s) => s.code === $formData.state_code)?.name || ""}
                                            onfocus={() => (stateDropdownOpen = true)}
                                            onblur={() => setTimeout(() => (stateDropdownOpen = false), 150)}
                                            oninput={(e) => {
                                                stateSearch = (e.target as HTMLInputElement).value;
                                                stateDropdownOpen = true;
                                                if (!INDIAN_STATES.some((s) => s.name === stateSearch)) {
                                                    $formData.state_code = "";
                                                }
                                            }}
                                        />
                                        {#if stateDropdownOpen && filteredStates.length > 0}
                                            <!-- svelte-ignore a11y_no_static_element_interactions -->
                                            <div
                                                class="absolute z-50 mt-1 w-full max-h-[200px] overflow-auto rounded-md border border-border bg-surface-0 shadow-lg"
                                                onmousedown={(e) => e.preventDefault()}
                                            >
                                                {#each filteredStates as state}
                                                    <button
                                                        type="button"
                                                        class="w-full text-left px-3 py-2 text-sm hover:bg-surface-2 transition-colors {$formData.state_code === state.code ? 'bg-primary/10 text-primary font-medium' : 'text-text-strong'}"
                                                        onclick={() => {
                                                            $formData.state_code = state.code;
                                                            stateSearch = "";
                                                            stateDropdownOpen = false;
                                                        }}
                                                    >
                                                        <span class="font-mono text-text-muted mr-2">{state.code}</span>
                                                        {state.name}
                                                    </button>
                                                {/each}
                                            </div>
                                        {/if}
                                    </div>
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
