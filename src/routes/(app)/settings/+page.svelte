<script lang="ts">
    import { superForm } from "sveltekit-superforms";
    import { enhance as formEnhance } from "$app/forms";
    import { Card } from "$lib/components/ui/card";
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import * as Select from "$lib/components/ui/select";
    import { toast } from "svelte-sonner";
    import { INDIAN_STATES } from "../customers/new/schema";
    import {
        Building2,
        FileText,
        Hash,
        User,
        Upload,
        X,
        Smartphone,
        PenTool,
        Eye,
        CheckCircle,
        AlertCircle,
        Mail,
        Send,
        Loader2,
        Wallet,
        Pencil,
        Trash2,
        Plus,
    } from "lucide-svelte";

    let { data } = $props();
    const { orgForm: initOrgForm, profileForm: initProfileForm, seriesForm: initSeriesForm, smtpForm: initSmtpForm } = data;
    let activeTab = $state("business");

    const tabs = [
        { id: "business", label: "Business Info", icon: Building2 },
        { id: "payments", label: "Payments", icon: Wallet },
        { id: "invoice", label: "Invoice Settings", icon: FileText },
        { id: "series", label: "Number Series", icon: Hash },
        { id: "email", label: "Email (SMTP)", icon: Mail },
        { id: "profile", label: "My Profile", icon: User },
    ];

    const {
        form: orgForm,
        errors: orgErrors,
        enhance: orgEnhance,
        submitting: orgSubmitting,
    } = superForm(initOrgForm, {
        id: "org-settings",
        onResult: ({ result }) => {
            if (result.type === "success") {
                toast.success("Settings saved successfully.");
            }
            if (result.type === "failure" && result.data?.error) {
                toast.error(result.data.error as string);
            }
        },
    });

    const {
        form: profileForm,
        enhance: profileEnhance,
        submitting: profileSubmitting,
    } = superForm(initProfileForm, {
        id: "profile-settings",
        onResult: ({ result }) => {
            if (result.type === "success") {
                toast.success("Profile updated.");
            }
        },
    });

    const {
        form: seriesForm,
        enhance: seriesEnhance,
        submitting: seriesSubmitting,
    } = superForm(initSeriesForm, {
        id: "series-settings",
        onResult: ({ result }) => {
            if (result.type === "success") {
                toast.success("Number series updated.");
            }
        },
    });

    let smtpTestResult = $state<{ success: boolean; error?: string } | null>(
        null,
    );
    let smtpTesting = $state(false);

    const {
        form: smtpForm,
        errors: smtpErrors,
        enhance: smtpEnhance,
        submitting: smtpSubmitting,
    } = superForm(initSmtpForm, {
        id: "smtp-settings",
        onResult: ({ result }) => {
            if (result.type === "success") {
                const data = result.data as any;
                if (data?.testResult) {
                    smtpTestResult = data.testResult;
                    smtpTesting = false;
                    if (data.testResult.success) {
                        toast.success("SMTP connection successful!");
                    } else {
                        toast.error(
                            data.testResult.error || "Connection failed",
                        );
                    }
                } else {
                    toast.success("Email settings saved.");
                }
            }
            if (result.type === "failure" && (result.data as any)?.error) {
                toast.error((result.data as any).error as string);
            }
        },
    });

    // Logo Upload Logic
    let logoInput = $state<HTMLInputElement>();
    let signatureInput = $state<HTMLInputElement>();

    function handleLogoUpload(e: Event) {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;

        if (file.size > 1024 * 1024) {
            toast.error("Logo must be smaller than 1MB");
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            $orgForm.logo_url = e.target?.result as string;
        };
        reader.readAsDataURL(file);
    }

    function handleSignatureUpload(e: Event) {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;

        if (file.size > 512 * 1024) {
            toast.error("Signature must be smaller than 512KB");
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            $orgForm.signature_url = e.target?.result as string;
        };
        reader.readAsDataURL(file);
    }

    // Validation helpers
    function isGstinValid(gstin: string): boolean {
        if (!gstin) return true;
        return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9A-Z]{1}Z[0-9A-Z]{1}$/.test(
            gstin.trim().toUpperCase(),
        );
    }

    function isIfscValid(ifsc: string): boolean {
        if (!ifsc) return true;
        return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc.toUpperCase());
    }

    let showBankPreview = $state(false);

    // Payment Modes state
    let isPaymentModeModalOpen = $state(false);
    let editingMode = $state<any>(null);
    let modeLabel = $state("");
    let modeLinkedAccountIds = $state<string[]>([]);

    function openAddMode() {
        editingMode = null;
        modeLabel = "";
        modeLinkedAccountIds = [];
        isPaymentModeModalOpen = true;
    }

    function openEditMode(mode: any) {
        editingMode = mode;
        modeLabel = mode.label;
        // Load all linked account IDs from methodMappings
        const mappings = data.methodMappings[mode.id] || [];
        modeLinkedAccountIds = mappings.map((m: any) => m.accountId);
        isPaymentModeModalOpen = true;
    }

    function closePaymentModeModal() {
        isPaymentModeModalOpen = false;
        editingMode = null;
    }

    function getLinkedAccounts(methodId: string) {
        return data.methodMappings[methodId] || [];
    }

    // Payment Accounts state
    let isPaymentAccountModalOpen = $state(false);
    let editingAccount = $state<any>(null);
    let accountLabel = $state("");
    let accountKind = $state<"bank" | "cash">("bank");
    let accountBankName = $state("");
    let accountLast4 = $state("");
    let accountIfsc = $state("");
    let accountUpiId = $state("");
    let accountCardLabel = $state("");

    function openAddAccount() {
        editingAccount = null;
        accountLabel = "";
        accountKind = "bank";
        accountBankName = "";
        accountLast4 = "";
        accountIfsc = "";
        accountUpiId = "";
        accountCardLabel = "";
        isPaymentAccountModalOpen = true;
    }

    function openEditAccount(account: any) {
        editingAccount = account;
        accountLabel = account.label || "";
        accountKind =
            account.kind === "cash" || account.ledger_code === "1000"
                ? "cash"
                : "bank";
        accountBankName = account.bank_name || "";
        accountLast4 = account.account_number_last4 || "";
        accountIfsc = account.ifsc || "";
        accountUpiId = account.upi_id || "";
        accountCardLabel = account.card_label || "";
        isPaymentAccountModalOpen = true;
    }

    function closePaymentAccountModal() {
        isPaymentAccountModalOpen = false;
        editingAccount = null;
    }

</script>

<div class="flex flex-col gap-6">
    <!-- Header -->
    <div>
        <h1 class="text-xl font-bold tracking-tight text-text-strong">
            Settings
        </h1>
        <p class="text-sm text-text-muted">
            Configure your business and invoice preferences.
        </p>
    </div>

    <!-- Tab Navigation -->
    <div class="flex overflow-x-auto border-b border-border">
        {#each tabs as tab}
            <button
                onclick={() => (activeTab = tab.id)}
                class="whitespace-nowrap flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors {activeTab ===
                tab.id
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-text-muted hover:text-text-strong'}"
            >
                <tab.icon class="size-3.5" />
                {tab.label}
            </button>
        {/each}
    </div>

    <!-- Content -->
    <div class="max-w-3xl">
        <!-- Business Info Tab -->
        {#if activeTab === "business"}
            <form
                method="POST"
                action="?/updateOrg"
                use:orgEnhance
                class="space-y-6"
            >
                <!-- Logo Section -->
                <Card class="p-6">
                    <div class="flex items-start gap-6">
                        <input
                            type="hidden"
                            name="logo_url"
                            bind:value={$orgForm.logo_url}
                        />
                        <div
                            class="relative group size-24 shrink-0 rounded-xl border-2 border-dashed border-border flex items-center justify-center bg-surface-1 overflow-hidden transition-all hover:border-primary/50 hover:shadow-sm"
                        >
                            {#if $orgForm.logo_url}
                                <img
                                    src={$orgForm.logo_url}
                                    alt="Logo"
                                    class="w-full h-full object-contain"
                                />
                                <button
                                    type="button"
                                    onclick={() => ($orgForm.logo_url = "")}
                                    class="absolute top-1 right-1 bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X class="size-3" />
                                </button>
                            {:else}
                                <Upload class="size-6 text-text-muted/50" />
                            {/if}
                            <input
                                type="file"
                                accept="image/*"
                                class="absolute inset-0 opacity-0 cursor-pointer"
                                onchange={handleLogoUpload}
                            />
                        </div>
                        <div class="space-y-1 pt-2">
                            <h3 class="text-sm font-semibold text-text-strong">
                                Business Logo
                            </h3>
                            <p
                                class="text-xs text-text-muted leading-relaxed max-w-sm"
                            >
                                This logo appears on your invoices and
                                documents. Recommended: 200x200px, max 1MB.
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                class="mt-2"
                                onclick={() => logoInput?.click()}
                            >
                                <Upload class="mr-2 size-3" />
                                Upload Logo
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
                </Card>

                <!-- Basic Details -->
                <Card class="p-6 space-y-6">
                    <div>
                        <h2 class="text-base font-semibold text-text-strong">
                            Business Details
                        </h2>
                        <p class="text-sm text-text-subtle">
                            Your legal business information.
                        </p>
                        <p class="text-xs text-text-muted mt-2 font-mono">
                            Organization ID: {data.orgId}
                        </p>
                    </div>

                    <div class="grid gap-4 md:grid-cols-2">
                        <div class="space-y-2">
                            <Label for="name"
                                >Business Name <span class="text-destructive"
                                    >*</span
                                ></Label
                            >
                            <Input
                                id="name"
                                name="name"
                                bind:value={$orgForm.name}
                                placeholder="Your Business Name"
                                class={$orgErrors.name
                                    ? "border-destructive"
                                    : ""}
                            />
                            {#if $orgErrors.name}
                                <p class="text-xs text-destructive">
                                    {$orgErrors.name}
                                </p>
                            {/if}
                        </div>
                        <div class="space-y-2">
                            <Label for="email">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                bind:value={$orgForm.email}
                                placeholder="business@example.com"
                            />
                        </div>
                        <div class="space-y-2">
                            <Label for="phone">Phone</Label>
                            <Input
                                id="phone"
                                name="phone"
                                bind:value={$orgForm.phone}
                                placeholder="+91 98765 43210"
                            />
                        </div>
                        <div class="space-y-2">
                            <Label for="pan">PAN</Label>
                            <Input
                                id="pan"
                                name="pan"
                                bind:value={$orgForm.pan}
                                class="uppercase font-mono"
                                placeholder="ABCDE1234F"
                            />
                        </div>
                    </div>
                </Card>

                <!-- GST Details -->
                <Card class="p-6 space-y-6">
                    <div>
                        <h2 class="text-base font-semibold text-text-strong">
                            GST Registration
                        </h2>
                        <p class="text-sm text-text-subtle">
                            Your GST details for tax invoices.
                        </p>
                    </div>

                    <div class="grid gap-4 md:grid-cols-2">
                        <div class="space-y-2">
                            <Label for="gstin">GSTIN</Label>
                            <div class="relative">
                                <Input
                                    id="gstin"
                                    name="gstin"
                                    bind:value={$orgForm.gstin}
                                    class="uppercase font-mono pr-10 {$orgErrors.gstin
                                        ? 'border-destructive'
                                        : ''}"
                                    placeholder="29ABCDE1234F1Z5"
                                />
                                {#if $orgForm.gstin}
                                    <div
                                        class="absolute right-3 top-1/2 -translate-y-1/2"
                                    >
                                        {#if isGstinValid($orgForm.gstin)}
                                            <CheckCircle
                                                class="size-4 text-green-500"
                                            />
                                        {:else}
                                            <AlertCircle
                                                class="size-4 text-destructive"
                                            />
                                        {/if}
                                    </div>
                                {/if}
                            </div>
                            {#if $orgErrors.gstin}
                                <p class="text-xs text-destructive">
                                    {$orgErrors.gstin}
                                </p>
                            {:else}
                                <p class="text-xs text-text-subtle">
                                    15-character GST number
                                </p>
                            {/if}
                        </div>
                        <div class="space-y-2">
                            <Label for="state_code"
                                >State <span class="text-destructive">*</span
                                ></Label
                            >
                            <Select.Root
                                type="single"
                                name="state_code"
                                bind:value={$orgForm.state_code}
                            >
                                <Select.Trigger id="state_code">
                                    {INDIAN_STATES.find(
                                        (s) => s.code === $orgForm.state_code,
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
                            <p class="text-xs text-text-subtle">
                                Place of supply for GST
                            </p>
                        </div>
                    </div>
                </Card>

                <!-- Address -->
                <Card class="p-6 space-y-6">
                    <div>
                        <h2 class="text-base font-semibold text-text-strong">
                            Business Address
                        </h2>
                        <p class="text-sm text-text-subtle">
                            This appears on your invoices.
                        </p>
                    </div>

                    <div class="grid gap-4 md:grid-cols-2">
                        <div class="space-y-2 md:col-span-2">
                            <Label for="address">Address Line</Label>
                            <Input
                                id="address"
                                name="address"
                                bind:value={$orgForm.address}
                                placeholder="123, Business Street"
                            />
                        </div>
                        <div class="space-y-2">
                            <Label for="city">City</Label>
                            <Input
                                id="city"
                                name="city"
                                bind:value={$orgForm.city}
                                placeholder="Bangalore"
                            />
                        </div>
                        <div class="space-y-2">
                            <Label for="pincode">Pincode</Label>
                            <Input
                                id="pincode"
                                name="pincode"
                                bind:value={$orgForm.pincode}
                                class="font-mono"
                                placeholder="560001"
                                maxlength={6}
                            />
                        </div>
                    </div>
                </Card>

                <div class="flex justify-end pt-2">
                    <Button type="submit" disabled={$orgSubmitting}>
                        {$orgSubmitting ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </form>
        {/if}

        <!-- Payments Tab -->
        {#if activeTab === "payments"}
            <div class="space-y-8 max-w-2xl">
                <p class="text-sm text-text-muted">
                    Add your banks and cash. Then link payment methods (UPI, card, etc.) to them so when you record a payment or expense, you choose where the money goes.
                </p>

                <!-- Banks & Cash -->
                <section>
                    <div class="flex items-end justify-between gap-4 mb-3">
                        <div>
                            <h2 class="text-xs font-semibold uppercase tracking-wider text-text-muted">
                                Banks & Cash
                            </h2>
                            <p class="text-sm text-text-muted mt-0.5">
                                Where money is received and paid from.
                            </p>
                        </div>
                        <Button size="sm" onclick={openAddAccount}>
                            <Plus class="mr-2 size-3.5" />
                            Add
                        </Button>
                    </div>
                    <Card class="border border-border overflow-hidden">
                        {#if data.paymentAccounts.length === 0}
                            <div class="flex flex-col items-center justify-center py-12 px-4 text-center">
                                <Wallet class="size-10 text-text-muted/40 mb-3" />
                                <p class="text-sm font-medium text-text-strong">No banks or cash yet</p>
                                <p class="text-xs text-text-muted mt-1 max-w-xs">Add at least one account so you can record payments and expenses.</p>
                                <Button size="sm" class="mt-4" onclick={openAddAccount}>
                                    <Plus class="mr-2 size-3.5" />
                                    Add bank or cash
                                </Button>
                            </div>
                        {:else}
                            <ul class="divide-y divide-border">
                                {#each data.paymentAccounts as account}
                                    <li class="flex items-center justify-between gap-4 px-4 py-3 {!account.is_active ? 'opacity-60' : ''}">
                                        <div class="min-w-0 flex-1">
                                            <p class="text-sm font-medium text-text-strong truncate">
                                                {account.label}
                                            </p>
                                            <p class="text-xs text-text-muted mt-0.5 truncate">
                                                {#if account.kind === 'cash' || account.ledger_code === '1000'}
                                                    Cash
                                                {:else if account.bank_name || account.account_number_last4}
                                                    {[account.bank_name, account.account_number_last4 ? `•••• ${account.account_number_last4}` : null].filter(Boolean).join(' · ')}
                                                {:else}
                                                    Bank account
                                                {/if}
                                            </p>
                                        </div>
                                        <div class="flex items-center gap-1 shrink-0">
                                            <Button variant="ghost" size="icon" class="h-8 w-8" onclick={() => openEditAccount(account)} title="Edit">
                                                <Pencil class="size-3.5" />
                                            </Button>
                                            {#if account.is_active}
                                                <form method="POST" action="?/deletePaymentAccount" use:formEnhance class="inline">
                                                    <input type="hidden" name="id" value={account.id} />
                                                    <Button variant="ghost" size="icon" class="h-8 w-8 text-text-muted hover:text-destructive" type="submit" title="Remove">
                                                        <Trash2 class="size-3.5" />
                                                    </Button>
                                                </form>
                                            {/if}
                                        </div>
                                    </li>
                                {/each}
                            </ul>
                        {/if}
                    </Card>
                </section>

                <!-- Payment methods -->
                <section>
                    <div class="flex items-end justify-between gap-4 mb-3">
                        <div>
                            <h2 class="text-xs font-semibold uppercase tracking-wider text-text-muted">
                                Payment methods
                            </h2>
                            <p class="text-sm text-text-muted mt-0.5">
                                How you receive and pay — linked to the accounts above.
                            </p>
                        </div>
                        <Button size="sm" onclick={openAddMode}>
                            <Plus class="mr-2 size-3.5" />
                            Add
                        </Button>
                    </div>
                    <Card class="border border-border overflow-hidden">
                        {#if data.paymentModes.length === 0}
                            <div class="flex flex-col items-center justify-center py-12 px-4 text-center">
                                <Wallet class="size-10 text-text-muted/40 mb-3" />
                                <p class="text-sm font-medium text-text-strong">No payment methods yet</p>
                                <p class="text-xs text-text-muted mt-1 max-w-xs">Add UPI, card, etc. and link each to a bank or cash account.</p>
                                <Button size="sm" class="mt-4" onclick={openAddMode}>
                                    <Plus class="mr-2 size-3.5" />
                                    Add payment method
                                </Button>
                            </div>
                        {:else}
                            <ul class="divide-y divide-border">
                                {#each data.paymentModes as mode}
                                    <li class="flex items-center gap-3 px-4 py-3 {!mode.is_active ? 'opacity-60' : ''}">
                                        {#if mode.is_active}
                                            <form method="POST" action="?/setDefaultPaymentMode" use:formEnhance class="shrink-0">
                                                <input type="hidden" name="id" value={mode.id} />
                                                <button
                                                    type="submit"
                                                    class="size-4 rounded-full border-2 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 {mode.is_default ? 'border-primary bg-primary' : 'border-border hover:border-primary/50'}"
                                                    title={mode.is_default ? 'Default' : 'Set as default'}
                                                >
                                                    {#if mode.is_default}<div class="size-1.5 rounded-full bg-white"></div>{/if}
                                                </button>
                                            </form>
                                        {:else}
                                            <div class="size-4 shrink-0"></div>
                                        {/if}
                                        <div class="min-w-0 flex-1">
                                            <p class="text-sm font-medium text-text-strong">
                                                {mode.label}
                                                {#if mode.is_default}
                                                    <span class="text-xs font-normal text-text-muted ml-1">(default)</span>
                                                {/if}
                                                {#if !mode.is_active}
                                                    <span class="text-xs text-text-muted ml-1">— Inactive</span>
                                                {/if}
                                            </p>
                                            <p class="text-xs text-text-muted mt-0.5">
                                                {#if getLinkedAccounts(mode.id).length > 0}
                                                    Linked to {getLinkedAccounts(mode.id).map((a) => a.accountLabel).join(', ')}
                                                {:else}
                                                    Not linked to any account
                                                {/if}
                                            </p>
                                        </div>
                                        <div class="flex items-center gap-1 shrink-0">
                                            <Button variant="ghost" size="icon" class="h-8 w-8" onclick={() => openEditMode(mode)} title="Edit">
                                                <Pencil class="size-3.5" />
                                            </Button>
                                            {#if mode.is_active}
                                                <form method="POST" action="?/deletePaymentMode" use:formEnhance class="inline">
                                                    <input type="hidden" name="id" value={mode.id} />
                                                    <Button variant="ghost" size="icon" class="h-8 w-8 text-text-muted hover:text-destructive" type="submit" title="Remove">
                                                        <Trash2 class="size-3.5" />
                                                    </Button>
                                                </form>
                                            {/if}
                                        </div>
                                    </li>
                                {/each}
                            </ul>
                        {/if}
                    </Card>
                </section>
            </div>

            <!-- Payment Account Modal -->
            {#if isPaymentAccountModalOpen}
                <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <button
                        type="button"
                        class="absolute inset-0 bg-black/50"
                        aria-label="Close"
                        onclick={closePaymentAccountModal}
                        tabindex="-1"
                    ></button>
                    <div class="relative bg-surface-0 rounded-xl shadow-xl border border-border w-full max-w-md">
                        <div class="flex items-center justify-between px-6 py-4 border-b border-border">
                            <h3 class="text-base font-semibold text-text-strong">
                                {editingAccount ? "Edit account" : "Add bank or cash"}
                            </h3>
                            <Button variant="ghost" size="icon" class="h-8 w-8" onclick={closePaymentAccountModal} aria-label="Close">
                                <X class="size-4" />
                            </Button>
                        </div>
                        <form
                            method="POST"
                            action={editingAccount ? "?/updatePaymentAccount" : "?/addPaymentAccount"}
                            use:formEnhance={() => {
                                closePaymentAccountModal();
                                return async ({ update }) => { await update(); };
                            }}
                            class="p-6 space-y-4"
                        >
                            {#if editingAccount}
                                <input type="hidden" name="id" value={editingAccount.id} />
                            {/if}
                            <div class="space-y-2">
                                <Label for="account_label" variant="form">Name <span class="text-destructive">*</span></Label>
                                <Input
                                    id="account_label"
                                    name="label"
                                    bind:value={accountLabel}
                                    placeholder="e.g. HDFC Current, Office Cash"
                                    required
                                />
                            </div>
                            <div class="space-y-2">
                                <Label for="account_kind" variant="form">Type <span class="text-destructive">*</span></Label>
                                <select
                                    id="account_kind"
                                    name="kind"
                                    bind:value={accountKind}
                                    class="w-full h-9 rounded-md border border-border bg-surface-0 px-3 py-1.5 text-sm text-text-strong focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring"
                                >
                                    <option value="bank">Bank</option>
                                    <option value="cash">Cash</option>
                                </select>
                            </div>
                            {#if accountKind === "bank"}
                                <details class="group rounded-lg border border-border bg-surface-1/50">
                                    <summary class="flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 text-sm font-medium text-text-subtle select-none">
                                        Optional details (for your reference)
                                    </summary>
                                    <div class="px-3 pb-3 pt-1 space-y-3 border-t border-border mt-0">
                                        <div class="space-y-1.5">
                                            <Label for="account_bank_name" variant="form" class="text-xs">Bank name</Label>
                                            <Input id="account_bank_name" name="bank_name" bind:value={accountBankName} placeholder="HDFC Bank" class="h-9" />
                                        </div>
                                        <div class="grid grid-cols-2 gap-3">
                                            <div class="space-y-1.5">
                                                <Label for="account_last4" variant="form" class="text-xs">A/c last 4</Label>
                                                <Input id="account_last4" name="account_number_last4" bind:value={accountLast4} maxlength={4} placeholder="1234" class="h-9 font-mono" />
                                            </div>
                                            <div class="space-y-1.5">
                                                <Label for="account_ifsc" variant="form" class="text-xs">IFSC</Label>
                                                <Input id="account_ifsc" name="ifsc" bind:value={accountIfsc} placeholder="HDFC0001234" class="h-9 font-mono uppercase" />
                                            </div>
                                        </div>
                                        <div class="space-y-1.5">
                                            <Label for="account_upi_id" variant="form" class="text-xs">UPI ID</Label>
                                            <Input id="account_upi_id" name="upi_id" bind:value={accountUpiId} placeholder="business@upi" class="h-9 font-mono" />
                                        </div>
                                        <div class="space-y-1.5">
                                            <Label for="account_card_label" variant="form" class="text-xs">Card label</Label>
                                            <Input id="account_card_label" name="card_label" bind:value={accountCardLabel} placeholder="Corporate Card" class="h-9" />
                                        </div>
                                    </div>
                                </details>
                            {/if}
                            <div class="flex justify-end gap-2 pt-2">
                                <Button variant="outline" type="button" onclick={closePaymentAccountModal}>Cancel</Button>
                                <Button type="submit">{editingAccount ? "Save" : "Add"}</Button>
                            </div>
                        </form>
                    </div>
                </div>
            {/if}

            <!-- Payment Method Modal -->
            {#if isPaymentModeModalOpen}
                <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <button
                        type="button"
                        class="absolute inset-0 bg-black/50"
                        aria-label="Close"
                        onclick={closePaymentModeModal}
                        tabindex="-1"
                    ></button>
                    <div class="relative bg-surface-0 rounded-xl shadow-xl border border-border w-full max-w-md">
                        <div class="flex items-center justify-between px-6 py-4 border-b border-border">
                            <h3 class="text-base font-semibold text-text-strong">
                                {editingMode ? "Edit method" : "Add payment method"}
                            </h3>
                            <Button variant="ghost" size="icon" class="h-8 w-8" onclick={closePaymentModeModal} aria-label="Close">
                                <X class="size-4" />
                            </Button>
                        </div>
                        <form
                            method="POST"
                            action={editingMode ? "?/updatePaymentMode" : "?/addPaymentMode"}
                            use:formEnhance={() => {
                                closePaymentModeModal();
                                return async ({ update }) => { await update(); };
                            }}
                            class="p-6 space-y-4"
                        >
                            {#if editingMode}
                                <input type="hidden" name="id" value={editingMode.id} />
                            {/if}
                            {#each modeLinkedAccountIds as accountId}
                                <input type="hidden" name="linked_account_ids" value={accountId} />
                            {/each}
                            <div class="space-y-2">
                                <Label for="mode_label" variant="form">Name <span class="text-destructive">*</span></Label>
                                <Input
                                    id="mode_label"
                                    name="label"
                                    bind:value={modeLabel}
                                    placeholder="e.g. UPI, NEFT, Card"
                                    required
                                />
                            </div>
                            <div class="space-y-2">
                                <Label variant="form" class="text-xs">Link to accounts</Label>
                                <p class="text-xs text-text-muted">When someone pays by this method, money goes to:</p>
                                <ul class="space-y-2 max-h-40 overflow-y-auto rounded-lg border border-border p-2">
                                    {#each data.paymentAccounts.filter((a) => a.is_active) as account}
                                        <li>
                                            <label class="flex items-center gap-2 p-2 rounded-md hover:bg-surface-1 cursor-pointer {modeLinkedAccountIds.includes(account.id) ? 'bg-surface-2' : ''}">
                                                <input
                                                    type="checkbox"
                                                    checked={modeLinkedAccountIds.includes(account.id)}
                                                    onchange={() => {
                                                        if (modeLinkedAccountIds.includes(account.id)) {
                                                            modeLinkedAccountIds = modeLinkedAccountIds.filter((id) => id !== account.id);
                                                        } else {
                                                            modeLinkedAccountIds = [...modeLinkedAccountIds, account.id];
                                                        }
                                                    }}
                                                    class="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                                                />
                                                <span class="text-sm text-text-strong">{account.label}</span>
                                            </label>
                                        </li>
                                    {/each}
                                </ul>
                            </div>
                            <div class="flex justify-end gap-2 pt-2">
                                <Button variant="outline" type="button" onclick={closePaymentModeModal}>Cancel</Button>
                                <Button type="submit">{editingMode ? "Save" : "Add"}</Button>
                            </div>
                        </form>
                    </div>
                </div>
            {/if}
        {/if}

        <!-- Invoice Settings Tab -->
        {#if activeTab === "invoice"}
            <form
                method="POST"
                action="?/updateOrg"
                use:orgEnhance
                class="space-y-6"
            >
                <!-- Hidden fields -->
                <input type="hidden" name="name" value={$orgForm.name} />
                <input
                    type="hidden"
                    name="state_code"
                    value={$orgForm.state_code}
                />
                <input
                    type="hidden"
                    name="logo_url"
                    bind:value={$orgForm.logo_url}
                />
                <input
                    type="hidden"
                    name="signature_url"
                    bind:value={$orgForm.signature_url}
                />

                <!-- GST Pricing -->
                <Card class="p-6 space-y-6">
                    <div>
                        <h2 class="text-base font-semibold text-text-strong">
                            GST Pricing
                        </h2>
                        <p class="text-sm text-text-subtle">
                            Configure how rates and prices are treated for GST.
                        </p>
                    </div>

                    <div class="flex items-center justify-between">
                        <div class="space-y-1">
                            <Label for="prices_include_gst" class="text-sm font-medium text-text-strong">
                                Prices include GST
                            </Label>
                            <p class="text-xs text-text-muted max-w-md">
                                When enabled, item rates entered on invoices are treated as GST-inclusive.
                                Tax is calculated backwards from the entered amount. This is the default for new invoices — you can override it per invoice.
                            </p>
                        </div>
                        <input
                            type="checkbox"
                            id="prices_include_gst"
                            name="prices_include_gst"
                            bind:checked={$orgForm.prices_include_gst}
                            class="h-5 w-5 rounded border-border text-primary focus:ring-primary"
                        />
                    </div>
                </Card>

                <!-- Signature -->
                <Card class="p-6 space-y-6">
                    <div class="flex items-center gap-3">
                        <div class="p-2 bg-blue-100 rounded-lg">
                            <PenTool class="size-5 text-blue-600" />
                        </div>
                        <div>
                            <h2
                                class="text-base font-semibold text-text-strong"
                            >
                                Digital Signature
                            </h2>
                            <p class="text-sm text-text-subtle">
                                Appears on invoices for authorization.
                            </p>
                        </div>
                    </div>

                    <div class="flex items-start gap-6">
                        <input
                            type="hidden"
                            name="signature_url"
                            bind:value={$orgForm.signature_url}
                        />
                        <div
                            class="relative group w-48 h-24 shrink-0 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-surface-1 overflow-hidden transition-all hover:border-primary/50"
                        >
                            {#if $orgForm.signature_url}
                                <img
                                    src={$orgForm.signature_url}
                                    alt="Signature"
                                    class="w-full h-full object-contain p-2"
                                />
                                <button
                                    type="button"
                                    onclick={() =>
                                        ($orgForm.signature_url = "")}
                                    class="absolute top-1 right-1 bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X class="size-3" />
                                </button>
                            {:else}
                                <div class="text-center">
                                    <PenTool
                                        class="size-6 text-text-muted/50 mx-auto"
                                    />
                                    <p class="text-xs text-text-muted mt-1">
                                        No signature
                                    </p>
                                </div>
                            {/if}
                            <input
                                type="file"
                                accept="image/*"
                                class="absolute inset-0 opacity-0 cursor-pointer"
                                onchange={handleSignatureUpload}
                            />
                        </div>
                        <div class="space-y-2 pt-2">
                            <p
                                class="text-xs text-text-muted leading-relaxed max-w-sm"
                            >
                                Upload a transparent PNG of your signature. Max
                                512KB. This will appear in the "Authorized
                                Signature" area.
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                onclick={() => signatureInput?.click()}
                            >
                                <Upload class="mr-2 size-3" />
                                Upload Signature
                                <input
                                    type="file"
                                    bind:this={signatureInput}
                                    accept="image/*"
                                    class="hidden"
                                    onchange={handleSignatureUpload}
                                />
                            </Button>
                        </div>
                    </div>
                </Card>

                <!-- Bank Account Section (for invoice display) -->
                <Card class="p-6 space-y-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <h2
                                class="text-base font-semibold text-text-strong"
                            >
                                Bank Account
                            </h2>
                            <p class="text-sm text-text-subtle">
                                Bank details shown on invoices for payments.
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onclick={() => (showBankPreview = !showBankPreview)}
                        >
                            <Eye class="mr-2 size-3" />
                            {showBankPreview ? "Hide" : "Preview"}
                        </Button>
                    </div>

                    {#if showBankPreview}
                        <div
                            class="bg-surface-2 rounded-lg p-4 border border-border"
                        >
                            <p
                                class="text-xs font-semibold text-text-muted mb-2"
                            >
                                BANK DETAILS (as shown on invoice)
                            </p>
                            <div class="text-sm space-y-1">
                                <p>
                                    <span class="text-text-muted">Bank:</span>
                                    {$orgForm.bank_name || "—"}
                                </p>
                                <p>
                                    <span class="text-text-muted">A/c No:</span>
                                    <span class="font-mono"
                                        >{$orgForm.account_number || "—"}</span
                                    >
                                </p>
                                <p>
                                    <span class="text-text-muted">IFSC:</span>
                                    <span class="font-mono"
                                        >{$orgForm.ifsc || "—"}</span
                                    >
                                </p>
                                <p>
                                    <span class="text-text-muted">Branch:</span>
                                    {$orgForm.branch || "—"}
                                </p>
                                {#if $orgForm.upi_id}
                                    <p>
                                        <span class="text-text-muted">UPI:</span
                                        >
                                        <span class="font-mono"
                                            >{$orgForm.upi_id}</span
                                        >
                                    </p>
                                {/if}
                            </div>
                        </div>
                    {/if}

                    <div class="grid gap-4 md:grid-cols-2">
                        <div class="space-y-2">
                            <Label for="bank_name">Bank Name</Label>
                            <Input
                                id="bank_name"
                                name="bank_name"
                                bind:value={$orgForm.bank_name}
                                placeholder="HDFC Bank"
                            />
                        </div>
                        <div class="space-y-2">
                            <Label for="branch">Branch</Label>
                            <Input
                                id="branch"
                                name="branch"
                                bind:value={$orgForm.branch}
                                placeholder="Koramangala, Bangalore"
                            />
                        </div>
                        <div class="space-y-2">
                            <Label for="account_number">Account Number</Label>
                            <Input
                                id="account_number"
                                name="account_number"
                                bind:value={$orgForm.account_number}
                                class="font-mono"
                                placeholder="50100123456789"
                            />
                        </div>
                        <div class="space-y-2">
                            <Label for="ifsc">IFSC Code</Label>
                            <div class="relative">
                                <Input
                                    id="ifsc"
                                    name="ifsc"
                                    bind:value={$orgForm.ifsc}
                                    class="uppercase font-mono pr-10"
                                    placeholder="HDFC0001234"
                                />
                                {#if $orgForm.ifsc}
                                    <div
                                        class="absolute right-3 top-1/2 -translate-y-1/2"
                                    >
                                        {#if isIfscValid($orgForm.ifsc)}
                                            <CheckCircle
                                                class="size-4 text-green-500"
                                            />
                                        {:else}
                                            <AlertCircle
                                                class="size-4 text-amber-500"
                                            />
                                        {/if}
                                    </div>
                                {/if}
                            </div>
                        </div>
                    </div>
                </Card>

                <!-- UPI Payment -->
                <Card class="p-6 space-y-6">
                    <div class="flex items-center gap-3">
                        <div class="p-2 bg-purple-100 rounded-lg">
                            <Smartphone class="size-5 text-purple-600" />
                        </div>
                        <div>
                            <h2
                                class="text-base font-semibold text-text-strong"
                            >
                                UPI Payment
                            </h2>
                            <p class="text-sm text-text-subtle">
                                Accept payments via UPI.
                            </p>
                        </div>
                    </div>

                    <div class="space-y-2">
                        <Label for="upi_id">UPI ID</Label>
                        <Input
                            id="upi_id"
                            name="upi_id"
                            bind:value={$orgForm.upi_id}
                            class="font-mono"
                            placeholder="business@upi"
                        />
                        <p class="text-xs text-text-subtle">
                            Your UPI ID for receiving payments (e.g.,
                            yourname@paytm)
                        </p>
                    </div>
                </Card>

                <!-- Default Notes & Terms -->
                <Card class="p-6 space-y-6">
                    <div>
                        <h2 class="text-base font-semibold text-text-strong">
                            Default Content
                        </h2>
                        <p class="text-sm text-text-subtle">
                            Pre-fill these on new invoices.
                        </p>
                    </div>

                    <div class="space-y-4">
                        <div class="space-y-2">
                            <Label for="invoice_terms_default"
                                >Terms & Conditions</Label
                            >
                            <textarea
                                id="invoice_terms_default"
                                name="invoice_terms_default"
                                bind:value={$orgForm.invoice_terms_default}
                                rows="4"
                                class="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-y min-h-[100px]"
                                placeholder="1. Payment is due within 15 days of invoice date.&#10;2. Late payments may incur interest at 18% p.a.&#10;3. Goods once sold cannot be returned."
                            ></textarea>
                        </div>
                        <div class="space-y-2">
                            <Label for="invoice_notes_default"
                                >Customer Notes</Label
                            >
                            <textarea
                                id="invoice_notes_default"
                                name="invoice_notes_default"
                                bind:value={$orgForm.invoice_notes_default}
                                rows="2"
                                class="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                                placeholder="Thank you for your business!"
                            ></textarea>
                        </div>
                    </div>
                </Card>

                <div class="flex justify-end pt-2">
                    <Button type="submit" disabled={$orgSubmitting}>
                        {$orgSubmitting ? "Saving..." : "Save Invoice Settings"}
                    </Button>
                </div>
            </form>
        {/if}

        <!-- Number Series Tab -->
        {#if activeTab === "series"}
            <form
                method="POST"
                action="?/updateSeries"
                use:seriesEnhance
                class="space-y-6"
            >
                <Card class="p-6 space-y-6">
                    <div>
                        <h2 class="text-base font-semibold text-text-strong">
                            Number Series
                        </h2>
                        <p class="text-sm text-text-subtle">
                            Customize document prefixes for FY {data.fyYear}.
                            Format: PREFIX-YYYY-YY-NNNN
                        </p>
                    </div>

                    <div class="space-y-4">
                        <div class="grid gap-4 md:grid-cols-2">
                            <div class="space-y-2">
                                <Label for="invoice_prefix"
                                    >Invoice Prefix</Label
                                >
                                <div class="flex items-center gap-2">
                                    <Input
                                        id="invoice_prefix"
                                        name="invoice_prefix"
                                        bind:value={$seriesForm.invoice_prefix}
                                        class="uppercase font-mono w-24"
                                        maxlength={6}
                                    />
                                    <span
                                        class="text-sm text-text-muted font-mono"
                                    >
                                        -{data.fyYear}-0001
                                    </span>
                                </div>
                            </div>
                            <div class="space-y-2">
                                <Label for="payment_prefix"
                                    >Payment Prefix</Label
                                >
                                <div class="flex items-center gap-2">
                                    <Input
                                        id="payment_prefix"
                                        name="payment_prefix"
                                        bind:value={$seriesForm.payment_prefix}
                                        class="uppercase font-mono w-24"
                                        maxlength={6}
                                    />
                                    <span
                                        class="text-sm text-text-muted font-mono"
                                    >
                                        -{data.fyYear}-0001
                                    </span>
                                </div>
                            </div>
                            <div class="space-y-2">
                                <Label for="credit_note_prefix"
                                    >Credit Note Prefix</Label
                                >
                                <div class="flex items-center gap-2">
                                    <Input
                                        id="credit_note_prefix"
                                        name="credit_note_prefix"
                                        bind:value={
                                            $seriesForm.credit_note_prefix
                                        }
                                        class="uppercase font-mono w-24"
                                        maxlength={6}
                                    />
                                    <span
                                        class="text-sm text-text-muted font-mono"
                                    >
                                        -{data.fyYear}-0001
                                    </span>
                                </div>
                            </div>
                            <div class="space-y-2">
                                <Label for="expense_prefix"
                                    >Expense Prefix</Label
                                >
                                <div class="flex items-center gap-2">
                                    <Input
                                        id="expense_prefix"
                                        name="expense_prefix"
                                        bind:value={$seriesForm.expense_prefix}
                                        class="uppercase font-mono w-24"
                                        maxlength={6}
                                    />
                                    <span
                                        class="text-sm text-text-muted font-mono"
                                    >
                                        -{data.fyYear}-0001
                                    </span>
                                </div>
                            </div>
                            <div class="space-y-2">
                                <Label for="journal_prefix"
                                    >Journal Entry Prefix</Label
                                >
                                <div class="flex items-center gap-2">
                                    <Input
                                        id="journal_prefix"
                                        name="journal_prefix"
                                        bind:value={$seriesForm.journal_prefix}
                                        class="uppercase font-mono w-24"
                                        maxlength={6}
                                    />
                                    <span
                                        class="text-sm text-text-muted font-mono"
                                    >
                                        -{data.fyYear}-0001
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div
                        class="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800"
                    >
                        <p class="font-medium">Note:</p>
                        <p class="mt-1">
                            Changing prefixes only affects new documents.
                            Existing documents keep their original numbers.
                        </p>
                    </div>
                </Card>

                <div class="flex justify-end pt-2">
                    <Button type="submit" disabled={$seriesSubmitting}>
                        {$seriesSubmitting ? "Saving..." : "Save Number Series"}
                    </Button>
                </div>
            </form>
        {/if}

        <!-- Email Tab -->
        {#if activeTab === "email"}
            <div class="space-y-6">
                <Card class="p-6 space-y-6">
                    <div class="flex items-center gap-3">
                        <div class="p-2 bg-blue-100 rounded-lg">
                            <Mail class="size-5 text-blue-600" />
                        </div>
                        <div>
                            <h2
                                class="text-base font-semibold text-text-strong"
                            >
                                Email Configuration
                            </h2>
                            <p class="text-sm text-text-subtle">
                                Configure SMTP to send invoices and password
                                reset emails.
                            </p>
                        </div>
                    </div>

                    {#if data.smtpEnabled}
                        <div
                            class="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between"
                        >
                            <div class="flex items-center gap-3">
                                <CheckCircle class="size-5 text-green-600" />
                                <span class="text-sm font-medium text-green-800"
                                    >Email is configured and enabled</span
                                >
                            </div>
                            <form method="POST" action="?/disableSmtp">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    type="submit"
                                >
                                    Disable
                                </Button>
                            </form>
                        </div>
                    {/if}
                </Card>

                <form method="POST" action="?/updateSmtp" use:smtpEnhance>
                    <Card class="p-6 space-y-6">
                        <div>
                            <h3 class="text-sm font-semibold text-text-strong">
                                SMTP Settings
                            </h3>
                            <p class="text-xs text-text-muted mt-1">
                                For Gmail: use smtp.gmail.com, port 587, and an
                                App Password.
                            </p>
                        </div>

                        <div class="grid gap-4 md:grid-cols-2">
                            <div class="space-y-2">
                                <Label for="smtp_host">SMTP Host</Label>
                                <Input
                                    id="smtp_host"
                                    name="smtp_host"
                                    bind:value={$smtpForm.smtp_host}
                                    placeholder="smtp.gmail.com"
                                    class={$smtpErrors.smtp_host
                                        ? "border-destructive"
                                        : ""}
                                />
                                {#if $smtpErrors.smtp_host}
                                    <p class="text-xs text-destructive">
                                        {$smtpErrors.smtp_host}
                                    </p>
                                {/if}
                            </div>
                            <div class="space-y-2">
                                <Label for="smtp_port">Port</Label>
                                <Input
                                    id="smtp_port"
                                    name="smtp_port"
                                    type="number"
                                    bind:value={$smtpForm.smtp_port}
                                    placeholder="587"
                                    class="font-mono"
                                />
                            </div>
                            <div class="space-y-2">
                                <Label for="smtp_user">Username / Email</Label>
                                <Input
                                    id="smtp_user"
                                    name="smtp_user"
                                    bind:value={$smtpForm.smtp_user}
                                    placeholder="you@gmail.com"
                                    class={$smtpErrors.smtp_user
                                        ? "border-destructive"
                                        : ""}
                                />
                                {#if $smtpErrors.smtp_user}
                                    <p class="text-xs text-destructive">
                                        {$smtpErrors.smtp_user}
                                    </p>
                                {/if}
                            </div>
                            <div class="space-y-2">
                                <Label for="smtp_pass"
                                    >Password / App Password</Label
                                >
                                <Input
                                    id="smtp_pass"
                                    name="smtp_pass"
                                    type="password"
                                    bind:value={$smtpForm.smtp_pass}
                                    placeholder="••••••••••••••••"
                                    class={$smtpErrors.smtp_pass
                                        ? "border-destructive"
                                        : ""}
                                />
                                {#if $smtpErrors.smtp_pass}
                                    <p class="text-xs text-destructive">
                                        {$smtpErrors.smtp_pass}
                                    </p>
                                {/if}
                            </div>
                            <div class="space-y-2">
                                <Label for="smtp_from"
                                    >From Address (optional)</Label
                                >
                                <Input
                                    id="smtp_from"
                                    name="smtp_from"
                                    bind:value={$smtpForm.smtp_from}
                                    placeholder="invoices@yourcompany.com"
                                />
                                <p class="text-xs text-text-muted">
                                    Defaults to username if empty
                                </p>
                            </div>
                            <div class="space-y-2">
                                <Label>Security</Label>
                                <div class="flex items-center gap-2 h-9">
                                    <input
                                        type="checkbox"
                                        id="smtp_secure"
                                        name="smtp_secure"
                                        bind:checked={$smtpForm.smtp_secure}
                                        class="rounded border-border"
                                    />
                                    <label
                                        for="smtp_secure"
                                        class="text-sm text-text-subtle"
                                    >
                                        Use SSL/TLS (port 465)
                                    </label>
                                </div>
                            </div>
                        </div>

                        {#if smtpTestResult}
                            <div
                                class={`rounded-lg p-4 flex items-center gap-3 ${smtpTestResult.success ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}
                            >
                                {#if smtpTestResult.success}
                                    <CheckCircle
                                        class="size-5 text-green-600"
                                    />
                                    <span
                                        class="text-sm font-medium text-green-800"
                                        >Connection successful!</span
                                    >
                                {:else}
                                    <AlertCircle class="size-5 text-red-600" />
                                    <span class="text-sm text-red-800"
                                        >{smtpTestResult.error}</span
                                    >
                                {/if}
                            </div>
                        {/if}

                        <div
                            class="flex items-center justify-between pt-4 border-t border-border"
                        >
                            <Button
                                type="submit"
                                formaction="?/testSmtp"
                                variant="outline"
                                disabled={smtpTesting || $smtpSubmitting}
                                onclick={() => {
                                    smtpTesting = true;
                                    smtpTestResult = null;
                                }}
                            >
                                {#if smtpTesting}
                                    <Loader2 class="mr-2 size-4 animate-spin" />
                                    Testing...
                                {:else}
                                    <Send class="mr-2 size-4" />
                                    Test Connection
                                {/if}
                            </Button>
                            <Button type="submit" disabled={$smtpSubmitting}>
                                {$smtpSubmitting
                                    ? "Saving..."
                                    : "Save Email Settings"}
                            </Button>
                        </div>
                    </Card>
                </form>

                <!-- Help Section -->
                <Card class="p-6">
                    <h3 class="text-sm font-semibold text-text-strong mb-4">
                        Gmail Setup Guide
                    </h3>
                    <ol
                        class="text-sm text-text-subtle space-y-3 list-decimal list-inside"
                    >
                        <li>
                            Enable 2-Factor Authentication on your Google
                            account
                        </li>
                        <li>
                            Go to <a
                                href="https://myaccount.google.com/apppasswords"
                                target="_blank"
                                rel="noopener"
                                class="text-primary hover:underline"
                                >Google App Passwords</a
                            >
                        </li>
                        <li>Create a new App Password for "Mail"</li>
                        <li>
                            Use the 16-character password above (not your Gmail
                            password)
                        </li>
                    </ol>
                    <div class="mt-4 p-3 bg-surface-2 rounded-lg">
                        <p class="text-xs font-mono text-text-muted">
                            Host: smtp.gmail.com | Port: 587 | SSL: Off
                        </p>
                    </div>
                </Card>
            </div>
        {/if}

        <!-- Profile Tab -->
        {#if activeTab === "profile"}
            <form
                method="POST"
                action="?/updateProfile"
                use:profileEnhance
                class="space-y-6"
            >
                <Card class="p-6 space-y-6">
                    <div class="flex items-center gap-4">
                        <div
                            class="size-16 rounded-full bg-primary/10 flex items-center justify-center"
                        >
                            <User class="size-8 text-primary" />
                        </div>
                        <div>
                            <h2
                                class="text-base font-semibold text-text-strong"
                            >
                                My Profile
                            </h2>
                            <p class="text-sm text-text-subtle">
                                Your personal account details.
                            </p>
                        </div>
                    </div>

                    <div class="grid gap-4 md:grid-cols-2">
                        <div class="space-y-2">
                            <Label for="profile_name">Name</Label>
                            <Input
                                id="profile_name"
                                name="name"
                                bind:value={$profileForm.name}
                                placeholder="Your Name"
                            />
                        </div>
                        <div class="space-y-2">
                            <Label for="profile_email">Email</Label>
                            <Input
                                id="profile_email"
                                name="email"
                                type="email"
                                bind:value={$profileForm.email}
                                placeholder="you@example.com"
                            />
                        </div>
                    </div>
                </Card>

                <div class="flex justify-end pt-2">
                    <Button type="submit" disabled={$profileSubmitting}>
                        {$profileSubmitting ? "Saving..." : "Save Profile"}
                    </Button>
                </div>
            </form>
        {/if}
    </div>
</div>
