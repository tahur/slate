<script lang="ts">
    import { superForm } from "sveltekit-superforms";
    import { Card } from "$lib/components/ui/card";
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import * as Select from "$lib/components/ui/select";
    import { addToast } from "$lib/stores/toast";
    import { INDIAN_STATES } from "../customers/new/schema";

    let { data } = $props();

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
                addToast({
                    type: "success",
                    message: "Profile updated.",
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

    const series = superForm(data.seriesForm, {
        id: "series-settings",
        onResult: ({ result }) => {
            if (result.type === "success") {
                addToast({
                    type: "success",
                    message: "Number series updated.",
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

    const months = [
        { value: 1, label: "January" },
        { value: 2, label: "February" },
        { value: 3, label: "March" },
        { value: 4, label: "April" },
        { value: 5, label: "May" },
        { value: 6, label: "June" },
        { value: 7, label: "July" },
        { value: 8, label: "August" },
        { value: 9, label: "September" },
        { value: 10, label: "October" },
        { value: 11, label: "November" },
        { value: 12, label: "December" },
    ];
</script>

<div class="space-y-6">
    <div>
        <h1 class="text-xl font-semibold">Settings</h1>
        <p class="text-sm text-muted-foreground">
            Manage organization, tax, and numbering preferences
        </p>
    </div>

    <div class="grid gap-6 lg:grid-cols-3">
        <Card class="p-6 lg:col-span-2 space-y-6">
            <div class="space-y-1">
                <h2 class="text-lg font-medium">Organization Details</h2>
                <p class="text-sm text-muted-foreground">
                    Update business and tax information
                </p>
            </div>

            <form
                method="POST"
                action="?/updateOrg"
                use:org.enhance
                class="space-y-4"
            >
                <div class="grid gap-4 md:grid-cols-2">
                    <div class="space-y-2">
                        <Label for="name">Business Name</Label>
                        <Input
                            id="name"
                            name="name"
                            bind:value={$org.form.name}
                            class={$org.errors.name ? "border-destructive" : ""}
                        />
                        {#if $org.errors.name}
                            <p class="text-sm text-destructive">
                                {$org.errors.name}
                            </p>
                        {/if}
                    </div>
                    <div class="space-y-2">
                        <Label for="email">Email</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            bind:value={$org.form.email}
                        />
                    </div>
                    <div class="space-y-2">
                        <Label for="phone">Phone</Label>
                        <Input
                            id="phone"
                            name="phone"
                            bind:value={$org.form.phone}
                        />
                    </div>
                    <div class="space-y-2">
                        <Label for="currency">Currency</Label>
                        <Input
                            id="currency"
                            name="currency"
                            bind:value={$org.form.currency}
                            class="uppercase"
                        />
                    </div>
                </div>

                <div class="grid gap-4 md:grid-cols-2">
                    <div class="space-y-2 md:col-span-2">
                        <Label for="address">Address</Label>
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
                            <Select.Trigger
                                id="state_code"
                                class={$org.errors.state_code
                                    ? "border-destructive"
                                    : ""}
                            >
                                {INDIAN_STATES.find(
                                    (s) => s.code === $org.form.state_code,
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
                        {#if $org.errors.state_code}
                            <p class="text-sm text-destructive">
                                {$org.errors.state_code}
                            </p>
                        {/if}
                    </div>
                    <div class="space-y-2">
                        <Label for="pincode">Pincode</Label>
                        <Input
                            id="pincode"
                            name="pincode"
                            bind:value={$org.form.pincode}
                        />
                        {#if $org.errors.pincode}
                            <p class="text-sm text-destructive">
                                {$org.errors.pincode}
                            </p>
                        {/if}
                    </div>
                </div>

                <div class="grid gap-4 md:grid-cols-2">
                    <div class="space-y-2">
                        <Label for="gstin">GSTIN</Label>
                        <Input
                            id="gstin"
                            name="gstin"
                            bind:value={$org.form.gstin}
                            class="font-mono uppercase"
                        />
                        {#if $org.errors.gstin}
                            <p class="text-sm text-destructive">
                                {$org.errors.gstin}
                            </p>
                        {/if}
                    </div>
                    <div class="space-y-2">
                        <Label for="pan">PAN</Label>
                        <Input
                            id="pan"
                            name="pan"
                            bind:value={$org.form.pan}
                            class="font-mono uppercase"
                        />
                    </div>
                </div>

                <div class="space-y-4 pt-4 border-t">
                    <h3 class="text-base font-medium">Bank Details</h3>
                    <div class="grid gap-4 md:grid-cols-2">
                        <div class="space-y-2">
                            <Label for="bank_name">Bank Name</Label>
                            <Input
                                id="bank_name"
                                name="bank_name"
                                bind:value={$org.form.bank_name}
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
                        <div class="space-y-2">
                            <Label for="account_number">Account Number</Label>
                            <Input
                                id="account_number"
                                name="account_number"
                                bind:value={$org.form.account_number}
                                class="font-mono"
                            />
                        </div>
                        <div class="space-y-2">
                            <Label for="ifsc">IFSC Code</Label>
                            <Input
                                id="ifsc"
                                name="ifsc"
                                bind:value={$org.form.ifsc}
                                class="font-mono uppercase"
                            />
                        </div>
                    </div>
                </div>

                <div class="space-y-2 max-w-sm">
                    <Label for="fy_start_month">Fiscal Year Start</Label>
                    <Select.Root
                        type="single"
                        name="fy_start_month"
                        bind:value={$org.form.fy_start_month}
                    >
                        <Select.Trigger id="fy_start_month">
                            {months.find(
                                (m) =>
                                    m.value ===
                                    Number($org.form.fy_start_month),
                            )?.label || "Select month"}
                        </Select.Trigger>
                        <Select.Content>
                            {#each months as month}
                                <Select.Item value={String(month.value)}
                                    >{month.label}</Select.Item
                                >
                            {/each}
                        </Select.Content>
                    </Select.Root>
                </div>

                <div class="flex justify-end">
                    <Button type="submit" disabled={$org.submitting}>
                        {$org.submitting ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </form>
        </Card>

        <div class="space-y-6">
            <Card class="p-6 space-y-4">
                <div class="space-y-1">
                    <h2 class="text-lg font-medium">User Profile</h2>
                    <p class="text-sm text-muted-foreground">
                        Update your account details
                    </p>
                </div>

                <form
                    method="POST"
                    action="?/updateProfile"
                    use:profile.enhance
                    class="space-y-3"
                >
                    <div class="space-y-2">
                        <Label for="profile_name">Name</Label>
                        <Input
                            id="profile_name"
                            name="name"
                            bind:value={$profile.form.name}
                            class={$profile.errors.name
                                ? "border-destructive"
                                : ""}
                        />
                        {#if $profile.errors.name}
                            <p class="text-sm text-destructive">
                                {$profile.errors.name}
                            </p>
                        {/if}
                    </div>
                    <div class="space-y-2">
                        <Label for="profile_email">Email</Label>
                        <Input
                            id="profile_email"
                            name="email"
                            type="email"
                            bind:value={$profile.form.email}
                            class={$profile.errors.email
                                ? "border-destructive"
                                : ""}
                        />
                        {#if $profile.errors.email}
                            <p class="text-sm text-destructive">
                                {$profile.errors.email}
                            </p>
                        {/if}
                    </div>
                    <Button type="submit" disabled={$profile.submitting}>
                        {$profile.submitting ? "Saving..." : "Save Profile"}
                    </Button>
                </form>
            </Card>

            <Card class="p-6 space-y-4">
                <div class="space-y-1">
                    <h2 class="text-lg font-medium">Number Series</h2>
                    <p class="text-sm text-muted-foreground">
                        Prefixes for FY {data.fyYear}
                    </p>
                </div>

                <form
                    method="POST"
                    action="?/updateSeries"
                    use:series.enhance
                    class="space-y-3"
                >
                    <div class="space-y-2">
                        <Label for="invoice_prefix">Invoice Prefix</Label>
                        <Input
                            id="invoice_prefix"
                            name="invoice_prefix"
                            bind:value={$series.form.invoice_prefix}
                            class="uppercase font-mono"
                        />
                    </div>
                    <div class="space-y-2">
                        <Label for="payment_prefix">Payment Prefix</Label>
                        <Input
                            id="payment_prefix"
                            name="payment_prefix"
                            bind:value={$series.form.payment_prefix}
                            class="uppercase font-mono"
                        />
                    </div>
                    <div class="space-y-2">
                        <Label for="expense_prefix">Expense Prefix</Label>
                        <Input
                            id="expense_prefix"
                            name="expense_prefix"
                            bind:value={$series.form.expense_prefix}
                            class="uppercase font-mono"
                        />
                    </div>
                    <div class="space-y-2">
                        <Label for="journal_prefix">Journal Prefix</Label>
                        <Input
                            id="journal_prefix"
                            name="journal_prefix"
                            bind:value={$series.form.journal_prefix}
                            class="uppercase font-mono"
                        />
                    </div>
                    <Button type="submit" disabled={$series.submitting}>
                        {$series.submitting ? "Saving..." : "Save Series"}
                    </Button>
                </form>
            </Card>
        </div>
    </div>
</div>
