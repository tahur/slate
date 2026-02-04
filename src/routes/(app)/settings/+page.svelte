<script lang="ts">
    import { superForm } from "sveltekit-superforms";
    import { Card } from "$lib/components/ui/card";
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import * as Select from "$lib/components/ui/select";
    import { addToast } from "$lib/stores/toast";
    import { INDIAN_STATES } from "../customers/new/schema";
    import {
        Building,
        CreditCard,
        FileText,
        Hash,
        User,
        Upload,
        X,
    } from "lucide-svelte";

    let { data } = $props();
    let activeTab = $state("general");

    const tabs = [
        { id: "general", label: "General", icon: Building },
        { id: "bank", label: "Bank Details", icon: CreditCard },
        { id: "defaults", label: "Preferences", icon: FileText },
        { id: "series", label: "Number Series", icon: Hash },
        { id: "profile", label: "My Profile", icon: User },
    ];

    const org = superForm(data.orgForm, {
        id: "org-settings",
        onResult: ({ result }) => {
            if (result.type === "success") {
                addToast({
                    type: "success",
                    message: "Organization settings updated.",
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

    const profile = superForm(data.profileForm, {
        id: "profile-settings",
        onResult: ({ result }) => {
            if (result.type === "success") {
                addToast({ type: "success", message: "Profile updated." });
            }
        },
    });

    const series = superForm(data.seriesForm, {
        id: "series-settings",
        onResult: ({ result }) => {
            if (result.type === "success") {
                addToast({
                    type: "success",
                    message: "Number series updated.",
                });
            }
        },
    });

    // Logo Upload Logic
    let logoInput: HTMLInputElement;

    function handleLogoUpload(e: Event) {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;

        if (file.size > 1024 * 1024) {
            // 1MB limit for base64
            addToast({
                type: "error",
                message: "Logo must be smaller than 1MB",
            });
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            $org.form.logo_url = e.target?.result as string;
        };
        reader.readAsDataURL(file);
    }
</script>

<div
    class="flex flex-col h-[calc(100vh-3.5rem)] -mx-4 md:-mx-5 -my-4 md:-my-5 bg-surface-1"
>
    <div class="flex flex-1 overflow-hidden">
        <!-- Sidebar Navigation -->
        <aside
            class="w-64 border-r border-border bg-surface-0 flex-none overflow-y-auto hidden md:block"
        >
            <div class="p-6">
                <h1
                    class="text-xl font-bold tracking-tight text-text-strong mb-2"
                >
                    Settings
                </h1>
                <p class="text-xs text-text-muted">
                    Manage your organization preferences.
                </p>
            </div>
            <nav class="px-3 space-y-1">
                {#each tabs as tab}
                    <button
                        onclick={() => (activeTab = tab.id)}
                        class="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors {activeTab ===
                        tab.id
                            ? 'bg-primary/10 text-primary'
                            : 'text-text-subtle hover:bg-surface-2 hover:text-text-strong'}"
                    >
                        <tab.icon class="size-4" />
                        {tab.label}
                    </button>
                {/each}
            </nav>
        </aside>

        <!-- Main Content Area -->
        <main class="flex-1 overflow-y-auto p-6 md:p-8">
            <div class="max-w-4xl mx-auto">
                <!-- Mobile Tabs -->
                <div
                    class="md:hidden mb-6 flex overflow-x-auto gap-2 pb-2 border-b border-border"
                >
                    {#each tabs as tab}
                        <button
                            onclick={() => (activeTab = tab.id)}
                            class="whitespace-nowrap px-4 py-2 text-sm font-medium rounded-full border {activeTab ===
                            tab.id
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-surface-0 border-border text-text-muted'}"
                        >
                            {tab.label}
                        </button>
                    {/each}
                </div>

                <!-- Form Container -->
                {#if activeTab === "general" || activeTab === "bank" || activeTab === "defaults"}
                    <form
                        method="POST"
                        action="?/updateOrg"
                        use:org.enhance
                        class="space-y-6"
                    >
                        {#if activeTab === "general"}
                            <Card class="p-6 space-y-6">
                                <div>
                                    <h2
                                        class="text-lg font-bold text-text-strong"
                                    >
                                        Organization Profile
                                    </h2>
                                    <p class="text-sm text-text-muted">
                                        Basic details about your business.
                                    </p>
                                </div>

                                <div class="grid gap-6 md:grid-cols-2">
                                    <!-- Logo Section -->
                                    <div
                                        class="md:col-span-2 flex items-start gap-6 pb-6 border-b border-border-dashed"
                                    >
                                        <input
                                            type="hidden"
                                            name="logo_url"
                                            bind:value={$org.form.logo_url}
                                        />
                                        <div
                                            class="relative group size-24 shrink-0 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-surface-1 overflow-hidden transition-colors hover:border-primary/50"
                                        >
                                            {#if $org.form.logo_url}
                                                <img
                                                    src={$org.form.logo_url}
                                                    alt="Logo"
                                                    class="w-full h-full object-contain"
                                                />
                                                <button
                                                    type="button"
                                                    onclick={() =>
                                                        ($org.form.logo_url =
                                                            "")}
                                                    class="absolute top-1 right-1 bg-destructive text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X class="size-3" />
                                                </button>
                                            {:else}
                                                <Upload
                                                    class="size-6 text-text-muted/50"
                                                />
                                            {/if}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                class="absolute inset-0 opacity-0 cursor-pointer"
                                                onchange={handleLogoUpload}
                                            />
                                        </div>
                                        <div class="space-y-1 pt-2">
                                            <h3
                                                class="text-sm font-medium text-text-strong"
                                            >
                                                Organization Logo
                                            </h3>
                                            <p
                                                class="text-xs text-text-muted leading-relaxed max-w-xs"
                                            >
                                                Upload your company logo.
                                                Recommended size: 200x200px. Max
                                                1MB.
                                            </p>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                class="relative mt-2"
                                                onclick={() =>
                                                    logoInput?.click()}
                                            >
                                                Upload Image
                                                <input
                                                    type="file"
                                                    bind:this={logoInput}
                                                    accept="image/*"
                                                    class="hidden"
                                                    onchange={handleLogoUpload}
                                                />
                                            </Button>
                                        </div>
                                    </div>

                                    <div class="space-y-2">
                                        <Label for="name">Business Name</Label>
                                        <Input
                                            id="name"
                                            name="name"
                                            bind:value={$org.form.name}
                                        />
                                        {#if $org.errors.name}<p
                                                class="text-xs text-destructive"
                                            >
                                                {$org.errors.name}
                                            </p>{/if}
                                    </div>
                                    <div class="space-y-2">
                                        <Label for="email">Email Address</Label>
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            bind:value={$org.form.email}
                                        />
                                    </div>
                                    <div class="space-y-2">
                                        <Label for="gstin">GSTIN</Label>
                                        <Input
                                            id="gstin"
                                            name="gstin"
                                            bind:value={$org.form.gstin}
                                            class="uppercase font-mono"
                                            placeholder="29ABCDE1234F1Z5"
                                        />
                                        {#if $org.errors.gstin}<p
                                                class="text-xs text-destructive"
                                            >
                                                {$org.errors.gstin}
                                            </p>{/if}
                                    </div>
                                    <div class="space-y-2">
                                        <Label for="phone">Phone</Label>
                                        <Input
                                            id="phone"
                                            name="phone"
                                            bind:value={$org.form.phone}
                                        />
                                    </div>
                                </div>

                                <div
                                    class="grid gap-4 md:grid-cols-2 pt-4 border-t border-border-dashed"
                                >
                                    <div class="space-y-2 md:col-span-2">
                                        <Label for="address">Address Line</Label
                                        >
                                        <Input
                                            id="address"
                                            name="address"
                                            bind:value={$org.form.address}
                                        />
                                    </div>
                                    <div class="space-y-2">
                                        <Label for="city">City</Label>
                                        <Input
                                            id="city"
                                            name="city"
                                            bind:value={$org.form.city}
                                        />
                                    </div>
                                    <div class="space-y-2">
                                        <Label for="state_code">State</Label>
                                        <Select.Root
                                            type="single"
                                            name="state_code"
                                            bind:value={$org.form.state_code}
                                        >
                                            <Select.Trigger id="state_code">
                                                {INDIAN_STATES.find(
                                                    (s) =>
                                                        s.code ===
                                                        $org.form.state_code,
                                                )?.name || "Select state"}
                                            </Select.Trigger>
                                            <Select.Content>
                                                {#each INDIAN_STATES as state}
                                                    <Select.Item
                                                        value={state.code}
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
                                            bind:value={$org.form.pincode}
                                            class="font-mono"
                                        />
                                    </div>
                                </div>
                            </Card>
                        {/if}

                        {#if activeTab === "bank"}
                            <Card class="p-6 space-y-6">
                                <div>
                                    <h2
                                        class="text-lg font-bold text-text-strong"
                                    >
                                        Bank Details
                                    </h2>
                                    <p class="text-sm text-text-muted">
                                        These details will appear on your
                                        invoices.
                                    </p>
                                </div>
                                <div class="grid gap-6 md:grid-cols-2">
                                    <div class="space-y-2">
                                        <Label for="bank_name">Bank Name</Label>
                                        <Input
                                            id="bank_name"
                                            name="bank_name"
                                            bind:value={$org.form.bank_name}
                                        />
                                    </div>
                                    <div class="space-y-2">
                                        <Label for="account_number"
                                            >Account Number</Label
                                        >
                                        <Input
                                            id="account_number"
                                            name="account_number"
                                            bind:value={
                                                $org.form.account_number
                                            }
                                            class="font-mono"
                                        />
                                    </div>
                                    <div class="space-y-2">
                                        <Label for="ifsc">IFSC Code</Label>
                                        <Input
                                            id="ifsc"
                                            name="ifsc"
                                            bind:value={$org.form.ifsc}
                                            class="uppercase font-mono"
                                        />
                                    </div>
                                    <div class="space-y-2">
                                        <Label for="branch">Branch</Label>
                                        <Input
                                            id="branch"
                                            name="branch"
                                            bind:value={$org.form.branch}
                                        />
                                    </div>
                                </div>
                            </Card>
                        {/if}

                        {#if activeTab === "defaults"}
                            <Card class="p-6 space-y-6">
                                <div>
                                    <h2
                                        class="text-lg font-bold text-text-strong"
                                    >
                                        Default Preferences
                                    </h2>
                                    <p class="text-sm text-text-muted">
                                        Set default notes and terms for new
                                        invoices.
                                    </p>
                                </div>
                                <div class="space-y-6">
                                    <div class="space-y-2">
                                        <Label for="invoice_terms_default"
                                            >Default Terms & Conditions</Label
                                        >
                                        <textarea
                                            id="invoice_terms_default"
                                            name="invoice_terms_default"
                                            bind:value={
                                                $org.form.invoice_terms_default
                                            }
                                            rows="4"
                                            class="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-y min-h-[100px]"
                                            placeholder="e.g. Payment due within 15 days..."
                                        ></textarea>
                                    </div>
                                    <div class="space-y-2">
                                        <Label for="invoice_notes_default"
                                            >Default Customer Notes</Label
                                        >
                                        <textarea
                                            id="invoice_notes_default"
                                            name="invoice_notes_default"
                                            bind:value={
                                                $org.form.invoice_notes_default
                                            }
                                            rows="3"
                                            class="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                                            placeholder="e.g. Thank you for your business!"
                                        ></textarea>
                                    </div>
                                </div>
                            </Card>
                        {/if}

                        <div class="flex justify-end pt-4">
                            <Button type="submit" disabled={$org.submitting}>
                                {$org.submitting ? "Saving..." : "Save Changes"}
                            </Button>
                        </div>
                    </form>
                {/if}

                {#if activeTab === "series"}
                    <form
                        method="POST"
                        action="?/updateSeries"
                        use:series.enhance
                    >
                        <Card class="p-6 space-y-6">
                            <div>
                                <h2 class="text-lg font-bold text-text-strong">
                                    Number Series
                                </h2>
                                <p class="text-sm text-text-muted">
                                    Customize prefixes for your documents for FY {data.fyYear}.
                                </p>
                            </div>
                            <div class="grid gap-6 md:grid-cols-2">
                                <div class="space-y-2">
                                    <Label for="invoice_prefix"
                                        >Invoice Prefix</Label
                                    >
                                    <Input
                                        id="invoice_prefix"
                                        name="invoice_prefix"
                                        bind:value={$series.form.invoice_prefix}
                                        class="uppercase font-mono"
                                    />
                                </div>
                                <div class="space-y-2">
                                    <Label for="payment_prefix"
                                        >Payment Prefix</Label
                                    >
                                    <Input
                                        id="payment_prefix"
                                        name="payment_prefix"
                                        bind:value={$series.form.payment_prefix}
                                        class="uppercase font-mono"
                                    />
                                </div>
                                <div class="space-y-2">
                                    <Label for="expense_prefix"
                                        >Expense Prefix</Label
                                    >
                                    <Input
                                        id="expense_prefix"
                                        name="expense_prefix"
                                        bind:value={$series.form.expense_prefix}
                                        class="uppercase font-mono"
                                    />
                                </div>
                            </div>
                            <div class="flex justify-end pt-4">
                                <Button
                                    type="submit"
                                    disabled={$series.submitting}
                                >
                                    {$series.submitting
                                        ? "Saving..."
                                        : "Save Series"}
                                </Button>
                            </div>
                        </Card>
                    </form>
                {/if}

                {#if activeTab === "profile"}
                    <form
                        method="POST"
                        action="?/updateProfile"
                        use:profile.enhance
                    >
                        <Card class="p-6 space-y-6">
                            <div>
                                <h2 class="text-lg font-bold text-text-strong">
                                    My Profile
                                </h2>
                                <p class="text-sm text-text-muted">
                                    Manage your personal account details.
                                </p>
                            </div>
                            <div class="grid gap-6 md:grid-cols-2">
                                <div class="space-y-2">
                                    <Label for="profile_name">Name</Label>
                                    <Input
                                        id="profile_name"
                                        name="name"
                                        bind:value={$profile.form.name}
                                    />
                                </div>
                                <div class="space-y-2">
                                    <Label for="profile_email">Email</Label>
                                    <Input
                                        id="profile_email"
                                        name="email"
                                        type="email"
                                        bind:value={$profile.form.email}
                                    />
                                </div>
                            </div>
                            <div class="flex justify-end pt-4">
                                <Button
                                    type="submit"
                                    disabled={$profile.submitting}
                                >
                                    {$profile.submitting
                                        ? "Saving..."
                                        : "Save Profile"}
                                </Button>
                            </div>
                        </Card>
                    </form>
                {/if}
            </div>
        </main>
    </div>
</div>
