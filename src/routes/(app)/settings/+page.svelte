<script lang="ts">
    import { superForm } from "sveltekit-superforms";
    import { Card } from "$lib/components/ui/card";
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import * as Select from "$lib/components/ui/select";
    import { toast } from "svelte-sonner";
    import { INDIAN_STATES } from "../customers/new/schema";
    import {
        Building2,
        CreditCard,
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
    } from "lucide-svelte";

    let { data } = $props();
    let activeTab = $state("business");

    const tabs = [
        { id: "business", label: "Business Info", icon: Building2 },
        { id: "bank", label: "Bank & UPI", icon: CreditCard },
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
    } = superForm(data.orgForm, {
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
    } = superForm(data.profileForm, {
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
    } = superForm(data.seriesForm, {
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
    } = superForm(data.smtpForm, {
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
        return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(
            gstin,
        );
    }

    function isIfscValid(ifsc: string): boolean {
        if (!ifsc) return true;
        return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc.toUpperCase());
    }

    let showBankPreview = $state(false);
</script>

<div class="flex flex-col gap-6">
    <!-- Header -->
    <div>
        <h2 class="text-2xl font-bold tracking-tight text-text-strong">
            Settings
        </h2>
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

        <!-- Bank & UPI Tab -->
        {#if activeTab === "bank"}
            <form
                method="POST"
                action="?/updateOrg"
                use:orgEnhance
                class="space-y-6"
            >
                <!-- Hidden fields for other form data -->
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

                <div class="flex justify-end pt-2">
                    <Button type="submit" disabled={$orgSubmitting}>
                        {$orgSubmitting ? "Saving..." : "Save Bank Details"}
                    </Button>
                </div>
            </form>
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
