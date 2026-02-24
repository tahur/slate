<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import * as Select from "$lib/components/ui/select";
    import { Checkbox } from "$lib/components/ui/checkbox";
    import { TableContainer } from "$lib/components/ui/table";
    import { superForm } from "sveltekit-superforms";
    import { toast } from "svelte-sonner";
    import { INDIAN_STATES } from "../../customers/new/schema";
    import { VENDOR_GST_TREATMENTS, TDS_SECTIONS } from "../new/schema";
    import {
        ArrowLeft,
        Save,
        Pencil,
        X,
        Receipt,
        Plus,
        TrendingDown,
        Wallet,
        FileText,
        Phone,
        Mail,
        MapPin,
        Building2,
        Globe,
    } from "lucide-svelte";
    import { formatINR } from "$lib/utils/currency";
    import { formatDate } from "$lib/utils/date";

    let { data } = $props();
    const { form: initialForm } = data;

    let isEditing = $state(false);
    let activeTab = $state<"expenses" | "ledger">("expenses");

    const { form, errors, enhance, submitting } = superForm(initialForm, {
        onResult: ({ result }) => {
            if (result.type === "success") {
                isEditing = false;
                toast.success("Supplier updated successfully.");
            }
            if (result.type === "failure" && result.data?.error) {
                toast.error(result.data.error as string);
            }
        },
    });

    function getStateName(code: string | null): string {
        if (!code) return "—";
        return INDIAN_STATES.find((s) => s.code === code)?.name || code;
    }

    function getLedgerDocLabel(type: string): string {
        if (type === "expense") return "Expense";
        if (type === "supplier_payment") return "Payment";
        return "Entry";
    }

    function getLedgerDocClass(type: string): string {
        if (type === "expense") return "bg-red-50 text-red-700";
        if (type === "supplier_payment") return "bg-green-50 text-green-700";
        return "bg-surface-2 text-text-subtle";
    }
</script>

<div class="page-full-bleed">
    <!-- Header -->
    <header
        class="flex items-center justify-between gap-4 px-6 py-4 border-b border-border bg-surface-0 z-20"
    >
        <div class="flex items-center gap-4">
            <Button
                variant="ghost"
                href="/vendors"
                size="icon"
                class="h-8 w-8"
            >
                <ArrowLeft class="size-4" />
            </Button>
            <div>
                <h1 class="text-xl font-bold tracking-tight text-text-strong">
                    {data.vendor.display_name || data.vendor.name}
                </h1>
                {#if data.vendor.company_name}
                    <p class="text-sm text-text-muted">
                        {data.vendor.company_name}
                    </p>
                {/if}
            </div>
        </div>
        <div class="flex items-center gap-2">
            {#if !isEditing}
                <Button
                    variant="outline"
                    size="sm"
                    onclick={() => (isEditing = true)}
                >
                    <Pencil class="mr-2 size-3" />
                    Edit
                </Button>
            {/if}
            <Button size="sm" href="/expenses/new?vendor={data.vendor.id}">
                <Plus class="mr-2 size-3" />
                Record Expense
            </Button>
        </div>
    </header>

    <!-- Main Content -->
    <div class="flex-1 overflow-y-auto bg-surface-1">
        <div class="p-6 space-y-6">
            <!-- Summary Cards -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="bg-surface-0 rounded-lg border border-border p-4">
                    <div class="flex items-center gap-2 text-text-muted mb-1">
                        <Receipt class="size-4" />
                        <span
                            class="text-xs font-medium uppercase tracking-wide"
                            >Expenses</span
                        >
                    </div>
                    <p class="text-xl font-bold text-text-strong">
                        {data.summary.expenseCount}
                    </p>
                </div>
                <div class="bg-surface-0 rounded-lg border border-border p-4">
                    <div class="flex items-center gap-2 text-text-muted mb-1">
                        <TrendingDown class="size-4" />
                        <span
                            class="text-xs font-medium uppercase tracking-wide"
                            >Total Spent</span
                        >
                    </div>
                    <p class="text-xl font-bold font-mono text-text-strong">
                        {formatINR(data.summary.totalExpenses)}
                    </p>
                </div>
                <div class="bg-surface-0 rounded-lg border border-border p-4">
                    <div class="flex items-center gap-2 text-text-muted mb-1">
                        <FileText class="size-4" />
                        <span
                            class="text-xs font-medium uppercase tracking-wide"
                            >Input GST</span
                        >
                    </div>
                    <p class="text-xl font-bold font-mono text-green-600">
                        {formatINR(data.summary.totalInputGst)}
                    </p>
                </div>
                <div class="bg-surface-0 rounded-lg border border-border p-4">
                    <div class="flex items-center gap-2 text-text-muted mb-1">
                        <Wallet class="size-4" />
                        <span
                            class="text-xs font-medium uppercase tracking-wide"
                            >To Pay</span
                        >
                    </div>
                    <p
                        class="text-xl font-bold font-mono {data.summary
                            .balance > 0
                            ? 'text-amber-600'
                            : 'text-text-strong'}"
                    >
                        {formatINR(data.summary.balance)}
                    </p>
                </div>
            </div>

            <!-- Vendor Info + Actions Row -->
            <div class="grid md:grid-cols-3 gap-4">
                <!-- Contact Info Card -->
                <div
                    class="bg-surface-0 rounded-lg border border-border p-4 space-y-3"
                >
                    <h3
                        class="text-xs font-bold uppercase tracking-wide text-text-muted"
                    >
                        Contact
                    </h3>
                    {#if data.vendor.email}
                        <div
                            class="flex items-center gap-2 text-sm text-text-strong"
                        >
                            <Mail class="size-4 text-text-muted" />
                            <span>{data.vendor.email}</span>
                        </div>
                    {/if}
                    {#if data.vendor.phone}
                        <div
                            class="flex items-center gap-2 text-sm text-text-strong"
                        >
                            <Phone class="size-4 text-text-muted" />
                            <span>{data.vendor.phone}</span>
                        </div>
                    {/if}
                    {#if data.vendor.website}
                        <div
                            class="flex items-center gap-2 text-sm text-text-strong"
                        >
                            <Globe class="size-4 text-text-muted" />
                            <a
                                href={data.vendor.website}
                                target="_blank"
                                class="text-primary hover:underline"
                            >
                                {data.vendor.website}
                            </a>
                        </div>
                    {/if}
                    {#if data.vendor.billing_address || data.vendor.city}
                        <div
                            class="flex items-start gap-2 text-sm text-text-strong"
                        >
                            <MapPin class="size-4 text-text-muted mt-0.5" />
                            <span class="text-text-strong">
                                {data.vendor.billing_address || ""}
                                {data.vendor.city
                                    ? `, ${data.vendor.city}`
                                    : ""}
                                {data.vendor.pincode
                                    ? ` - ${data.vendor.pincode}`
                                    : ""}
                            </span>
                        </div>
                    {/if}
                </div>

                <!-- GST Info Card -->
                <div
                    class="bg-surface-0 rounded-lg border border-border p-4 space-y-3"
                >
                    <h3
                        class="text-xs font-bold uppercase tracking-wide text-text-muted"
                    >
                        GST & Tax
                    </h3>
                    <div class="flex items-center gap-2 text-sm">
                        <Building2 class="size-4 text-text-muted" />
                        <span class="capitalize text-text-strong"
                            >{data.vendor.gst_treatment || "Unregistered"}</span
                        >
                    </div>
                    {#if data.vendor.gstin}
                        <div class="text-sm">
                            <span class="text-text-muted">GSTIN:</span>
                            <span class="font-mono ml-2 text-text-strong"
                                >{data.vendor.gstin}</span
                            >
                        </div>
                    {/if}
                    {#if data.vendor.pan}
                        <div class="text-sm">
                            <span class="text-text-muted">PAN:</span>
                            <span class="font-mono ml-2 text-text-strong"
                                >{data.vendor.pan}</span
                            >
                        </div>
                    {/if}
                    <div class="text-sm">
                        <span class="text-text-muted">State:</span>
                        <span class="ml-2 text-text-strong"
                            >{getStateName(data.vendor.state_code)}</span
                        >
                    </div>
                    {#if data.vendor.tds_applicable}
                        <div class="text-sm">
                            <span class="text-text-muted">TDS:</span>
                            <span class="ml-2 text-text-strong"
                                >{data.vendor.tds_section || "Applicable"}</span
                            >
                        </div>
                    {/if}
                </div>

                <!-- Quick Actions Card -->
                <div
                    class="bg-surface-0 rounded-lg border border-border p-4 space-y-3"
                >
                    <h3
                        class="text-xs font-bold uppercase tracking-wide text-text-muted"
                    >
                        Quick Actions
                    </h3>
                    <div class="grid grid-cols-2 gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            href="/expenses/new?vendor={data.vendor.id}"
                            class="justify-start"
                        >
                            <Receipt class="mr-2 size-3" />
                            Record Expense
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            href="/expenses/new?vendor={data.vendor.id}&mode=credit"
                            class="justify-start"
                        >
                            <Wallet class="mr-2 size-3" />
                            Credit Expense
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onclick={() => (isEditing = true)}
                            class="justify-start"
                        >
                            <Pencil class="mr-2 size-3" />
                            Edit Info
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            href="/reports/ledger?party=supplier&partyId={data.vendor.id}"
                            class="justify-start"
                        >
                            <FileText class="mr-2 size-3" />
                            Statement
                        </Button>
                    </div>
                    {#if data.vendor.notes}
                        <div class="pt-2 border-t border-border">
                            <p class="text-xs text-text-muted">
                                {data.vendor.notes}
                            </p>
                        </div>
                    {/if}
                </div>
            </div>

            <!-- Expenses Tab -->
            <div
                class="bg-surface-0 rounded-lg border border-border overflow-hidden"
            >
                <div class="flex border-b border-border">
                    <button
                        type="button"
                        onclick={() => (activeTab = "expenses")}
                        class="px-4 py-3 text-sm font-medium transition-colors border-b-2 {activeTab === 'expenses'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-text-muted hover:text-text-strong'}"
                    >
                        Expenses ({data.expenses.length})
                    </button>
                    <button
                        type="button"
                        onclick={() => (activeTab = "ledger")}
                        class="px-4 py-3 text-sm font-medium transition-colors border-b-2 {activeTab === 'ledger'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-text-muted hover:text-text-strong'}"
                    >
                        Ledger ({data.ledger.entries.length})
                    </button>
                </div>

                <div class="p-4">
                    {#if activeTab === "expenses"}
                        {#if data.expenses.length === 0}
                            <div class="text-center py-12 text-text-muted">
                                <Receipt class="size-12 mx-auto mb-4 opacity-30" />
                                <p>No expense entries yet</p>
                                <Button
                                    href="/expenses/new?vendor={data.vendor.id}"
                                    class="mt-4"
                                >
                                    <Plus class="mr-2 size-4" />
                                    Record Expense
                                </Button>
                            </div>
                        {:else}
                            <TableContainer>
                                <table class="w-full text-sm">
                                <thead>
                                    <tr
                                        class="text-left text-xs uppercase tracking-wide text-text-muted border-b border-border"
                                    >
                                        <th class="pb-3 pr-4">Date</th>
                                        <th class="pb-3 pr-4">Expense #</th>
                                        <th class="pb-3 pr-4">Description</th>
                                        <th class="pb-3 pr-4 text-right">Amount</th>
                                        <th class="pb-3 pr-4 text-right">GST</th>
                                        <th class="pb-3 text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-border-subtle">
                                    {#each data.expenses as expense}
                                        <tr class="hover:bg-surface-2/50">
                                            <td class="py-3 pr-4 text-text-muted"
                                                >{formatDate(
                                                    expense.expense_date,
                                                )}</td
                                            >
                                            <td class="py-3 pr-4">
                                                <span class="font-mono text-primary"
                                                    >{expense.expense_number}</span
                                                >
                                            </td>
                                            <td class="py-3 pr-4 text-text-subtle"
                                                >{expense.description || "—"}</td
                                            >
                                            <td
                                                class="py-3 pr-4 text-right font-mono text-text-strong"
                                                >{formatINR(expense.amount)}</td
                                            >
                                            <td
                                                class="py-3 pr-4 text-right font-mono text-green-600"
                                            >
                                                {formatINR(
                                                    (expense.cgst || 0) +
                                                        (expense.sgst || 0) +
                                                        (expense.igst || 0),
                                                )}
                                            </td>
                                            <td
                                                class="py-3 text-right font-mono font-medium text-text-strong"
                                                >{formatINR(expense.total)}</td
                                            >
                                        </tr>
                                    {/each}
                                </tbody>
                                </table>
                            </TableContainer>
                        {/if}
                    {:else}
                        <div class="space-y-3">
                            <div class="flex flex-wrap items-center justify-between gap-3">
                                <p class="text-xs text-text-muted">
                                    Statement: {formatDate(data.ledgerRange.startDate)} to {formatDate(data.ledgerRange.endDate)}
                                </p>
                                <a
                                    href="/reports/ledger?party=supplier&partyId={data.vendor.id}&from={data.ledgerRange.startDate}&to={data.ledgerRange.endDate}"
                                    class="text-xs font-medium text-primary hover:underline"
                                >
                                    Open full statement
                                </a>
                            </div>

                            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div class="rounded border border-border bg-surface-1 p-3">
                                    <p class="text-[10px] uppercase tracking-wide text-text-muted">Opening</p>
                                    <p class="text-sm font-semibold font-mono text-text-strong">{formatINR(data.ledger.opening)}</p>
                                </div>
                                <div class="rounded border border-border bg-surface-1 p-3">
                                    <p class="text-[10px] uppercase tracking-wide text-text-muted">Bills</p>
                                    <p class="text-sm font-semibold font-mono text-text-strong">{formatINR(data.ledger.totalCharges)}</p>
                                </div>
                                <div class="rounded border border-border bg-surface-1 p-3">
                                    <p class="text-[10px] uppercase tracking-wide text-text-muted">Paid</p>
                                    <p class="text-sm font-semibold font-mono text-red-600">{formatINR(data.ledger.totalSettlements)}</p>
                                </div>
                                <div class="rounded border border-border bg-surface-1 p-3">
                                    <p class="text-[10px] uppercase tracking-wide text-text-muted">Closing</p>
                                    <p class="text-sm font-semibold font-mono {data.ledger.closing > 0 ? 'text-amber-600' : data.ledger.closing < 0 ? 'text-blue-600' : 'text-text-strong'}">{formatINR(data.ledger.closing)}</p>
                                </div>
                            </div>

                            {#if data.ledger.entries.length === 0}
                                <div class="text-center py-12 text-text-muted">
                                    <FileText class="size-12 mx-auto mb-4 opacity-30" />
                                    <p>No ledger entries in selected period</p>
                                </div>
                            {:else}
                                <TableContainer>
                                    <table class="w-full text-sm">
                                    <thead>
                                        <tr
                                            class="text-left text-xs uppercase tracking-wide text-text-muted border-b border-border"
                                        >
                                            <th class="pb-3 pr-4">Date</th>
                                            <th class="pb-3 pr-4">Doc</th>
                                            <th class="pb-3 pr-4">Number</th>
                                            <th class="pb-3 pr-4">Reason</th>
                                            <th class="pb-3 pr-4">Method</th>
                                            <th class="pb-3 pr-4 text-right">Bill</th>
                                            <th class="pb-3 pr-4 text-right">Paid</th>
                                            <th class="pb-3 text-right">Balance</th>
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-border-subtle">
                                        {#each data.ledger.entries as entry}
                                            <tr class="hover:bg-surface-2/50">
                                                <td class="py-3 pr-4 text-text-muted">
                                                    {formatDate(entry.date)}
                                                </td>
                                                <td class="py-3 pr-4">
                                                    <span class="inline-flex px-2 py-0.5 rounded text-xs font-medium {getLedgerDocClass(entry.sourceType)}">
                                                        {getLedgerDocLabel(entry.sourceType)}
                                                    </span>
                                                </td>
                                                <td class="py-3 pr-4">
                                                    <a href={entry.href} class="font-mono text-primary hover:underline">
                                                        {entry.number}
                                                    </a>
                                                </td>
                                                <td class="py-3 pr-4 text-text-subtle">{entry.reason}</td>
                                                <td class="py-3 pr-4 text-xs text-text-muted">{entry.methodLabel || "—"}</td>
                                                <td class="py-3 pr-4 text-right font-mono">{entry.charge > 0 ? formatINR(entry.charge) : "—"}</td>
                                                <td class="py-3 pr-4 text-right font-mono text-red-600">{entry.settlement > 0 ? formatINR(entry.settlement) : "—"}</td>
                                                <td class="py-3 text-right font-mono font-medium {entry.balance > 0 ? 'text-amber-600' : entry.balance < 0 ? 'text-blue-600' : 'text-text-subtle'}">
                                                    {formatINR(entry.balance)}
                                                </td>
                                            </tr>
                                        {/each}
                                    </tbody>
                                    </table>
                                </TableContainer>
                            {/if}
                        </div>
                    {/if}
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Edit Supplier Modal -->
{#if isEditing}
    <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    >
        <div
            class="bg-surface-0 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-border"
        >
            <div
                class="p-4 border-b border-border flex justify-between items-center bg-surface-2"
            >
                <h3 class="font-bold text-lg">Edit Supplier</h3>
                <button
                    onclick={() => (isEditing = false)}
                    class="text-text-muted hover:text-text-strong"
                    aria-label="Close"
                >
                    <X class="size-5" />
                </button>
            </div>

            <form
                method="POST"
                use:enhance
                class="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]"
            >
                <div class="space-y-6">
                    <!-- Basic Info -->
                    <div class="grid gap-4 md:grid-cols-2">
                        <div class="space-y-2">
                            <Label for="name">Supplier Name *</Label>
                            <Input
                                id="name"
                                name="name"
                                bind:value={$form.name}
                                class={$errors.name ? "border-destructive" : ""}
                            />
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
                            />
                        </div>
                        <div class="space-y-2">
                            <Label for="phone">Phone</Label>
                            <Input
                                id="phone"
                                name="phone"
                                bind:value={$form.phone}
                            />
                        </div>
                    </div>

                    <!-- Address -->
                    <div class="grid gap-4 md:grid-cols-2">
                        <div class="space-y-2 md:col-span-2">
                            <Label for="billing_address">Address</Label>
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
                            />
                        </div>
                    </div>

                    <!-- GST Details -->
                    <div class="grid gap-4 md:grid-cols-2">
                        <div class="space-y-2">
                            <Label for="gst_treatment">GST Treatment</Label>
                            <Select.Root
                                type="single"
                                name="gst_treatment"
                                bind:value={$form.gst_treatment}
                            >
                                <Select.Trigger id="gst_treatment">
                                    {VENDOR_GST_TREATMENTS.find(
                                        (t) => t.value === $form.gst_treatment,
                                    )?.label || "Select"}
                                </Select.Trigger>
                                <Select.Content>
                                    {#each VENDOR_GST_TREATMENTS as treatment}
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
                                class="font-mono uppercase"
                            />
                        </div>
                        <div class="space-y-2">
                            <Label for="pan">PAN</Label>
                            <Input
                                id="pan"
                                name="pan"
                                bind:value={$form.pan}
                                class="font-mono uppercase"
                            />
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
                            />
                        </div>
                    </div>

                    <!-- TDS -->
                    <div class="grid gap-4 md:grid-cols-2">
                        <div class="flex items-center gap-3">
                            <Checkbox
                                id="tds_applicable"
                                name="tds_applicable"
                                bind:checked={$form.tds_applicable}
                            />
                            <Label for="tds_applicable">TDS Applicable</Label>
                        </div>
                        {#if $form.tds_applicable}
                            <div class="space-y-2">
                                <Label for="tds_section">TDS Section</Label>
                                <Select.Root
                                    type="single"
                                    name="tds_section"
                                    bind:value={$form.tds_section}
                                >
                                    <Select.Trigger id="tds_section">
                                        {TDS_SECTIONS.find(
                                            (s) =>
                                                s.value === $form.tds_section,
                                        )?.label || "Select"}
                                    </Select.Trigger>
                                    <Select.Content>
                                        {#each TDS_SECTIONS as section}
                                            <Select.Item value={section.value}
                                                >{section.label}</Select.Item
                                            >
                                        {/each}
                                    </Select.Content>
                                </Select.Root>
                            </div>
                        {/if}
                    </div>
                </div>

                <div
                    class="flex justify-end gap-3 mt-6 pt-4 border-t border-border"
                >
                    <Button
                        variant="ghost"
                        type="button"
                        onclick={() => (isEditing = false)}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" disabled={$submitting}>
                        <Save class="mr-2 size-4" />
                        {$submitting ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </form>
        </div>
    </div>
{/if}
