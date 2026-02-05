<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
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
        CreditCard,
        Receipt,
        Plus,
        TrendingUp,
        TrendingDown,
        Wallet,
        BadgePercent,
        Phone,
        Mail,
        MapPin,
        Building2,
    } from "lucide-svelte";

    let { data } = $props();

    let isEditing = $state(false);
    let activeTab = $state<'ledger' | 'invoices' | 'payments' | 'credits'>('ledger');

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

    function formatCurrency(amount: number | null | undefined): string {
        if (amount === null || amount === undefined) return "₹0.00";
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 2,
        }).format(amount);
    }

    function formatDate(dateStr: string | null): string {
        if (!dateStr) return "—";
        return new Date(dateStr).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    }

    function getStateName(code: string | null): string {
        if (!code) return "—";
        return INDIAN_STATES.find((s) => s.code === code)?.name || code;
    }

    function getStatusClass(status: string | null): string {
        switch (status) {
            case "paid":
                return "bg-green-100 text-green-700";
            case "issued":
                return "bg-blue-100 text-blue-700";
            case "partially_paid":
                return "bg-amber-100 text-amber-700";
            case "overdue":
            case "cancelled":
                return "bg-red-100 text-red-700";
            default:
                return "bg-gray-100 text-gray-700";
        }
    }
</script>

<div class="flex flex-col h-[calc(100vh-3.5rem)] -mx-4 md:-mx-5 -my-4 md:-my-5">
    <!-- Header -->
    <header class="flex items-center justify-between gap-4 px-6 py-4 border-b border-border bg-surface-0 z-20">
        <div class="flex items-center gap-4">
            <Button
                variant="ghost"
                href="/customers"
                size="icon"
                class="h-8 w-8"
            >
                <ArrowLeft class="size-4" />
            </Button>
            <div>
                <h1 class="text-xl font-bold tracking-tight text-text-strong">
                    {data.customer.name}
                </h1>
                {#if data.customer.company_name}
                    <p class="text-sm text-text-secondary">{data.customer.company_name}</p>
                {/if}
            </div>
        </div>
        <div class="flex items-center gap-2">
            {#if !isEditing}
                <Button variant="outline" size="sm" onclick={() => (isEditing = true)}>
                    <Pencil class="mr-2 size-3" />
                    Edit
                </Button>
            {/if}
            <Button size="sm" href="/invoices/new?customer={data.customer.id}">
                <Plus class="mr-2 size-3" />
                New Invoice
            </Button>
        </div>
    </header>

    <!-- Main Content -->
    <div class="flex-1 overflow-y-auto bg-surface-1">
        <div class="p-6 space-y-6">
            <!-- Summary Cards -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="bg-surface-0 rounded-lg border border-border p-4">
                    <div class="flex items-center gap-2 text-text-secondary mb-1">
                        <TrendingUp class="size-4" />
                        <span class="text-xs font-medium uppercase tracking-wider">Invoiced</span>
                    </div>
                    <p class="text-xl font-bold font-mono text-text-strong">
                        {formatCurrency(data.summary.totalInvoiced)}
                    </p>
                </div>
                <div class="bg-surface-0 rounded-lg border border-border p-4">
                    <div class="flex items-center gap-2 text-text-secondary mb-1">
                        <TrendingDown class="size-4" />
                        <span class="text-xs font-medium uppercase tracking-wider">Received</span>
                    </div>
                    <p class="text-xl font-bold font-mono text-green-600">
                        {formatCurrency(data.summary.totalReceived)}
                    </p>
                </div>
                <div class="bg-surface-0 rounded-lg border border-border p-4">
                    <div class="flex items-center gap-2 text-text-secondary mb-1">
                        <Wallet class="size-4" />
                        <span class="text-xs font-medium uppercase tracking-wider">Outstanding</span>
                    </div>
                    <p class="text-xl font-bold font-mono {data.summary.outstanding > 0 ? 'text-amber-600' : data.summary.outstanding < 0 ? 'text-blue-600' : 'text-text-strong'}">
                        {formatCurrency(Math.abs(data.summary.outstanding))}
                        {#if data.summary.outstanding < 0}
                            <span class="text-xs font-normal">(Credit)</span>
                        {/if}
                    </p>
                </div>
                <div class="bg-surface-0 rounded-lg border border-border p-4">
                    <div class="flex items-center gap-2 text-text-secondary mb-1">
                        <BadgePercent class="size-4" />
                        <span class="text-xs font-medium uppercase tracking-wider">Available Credits</span>
                    </div>
                    <p class="text-xl font-bold font-mono text-blue-600">
                        {formatCurrency(data.summary.availableCredits)}
                    </p>
                </div>
            </div>

            <!-- Customer Info + Actions Row -->
            <div class="grid md:grid-cols-3 gap-4">
                <!-- Contact Info Card -->
                <div class="bg-surface-0 rounded-lg border border-border p-4 space-y-3">
                    <h3 class="text-xs font-semibold uppercase tracking-wide text-text-secondary">Contact</h3>
                    {#if data.customer.email}
                        <div class="flex items-center gap-2 text-sm">
                            <Mail class="size-4 text-text-secondary" />
                            <span>{data.customer.email}</span>
                        </div>
                    {/if}
                    {#if data.customer.phone}
                        <div class="flex items-center gap-2 text-sm">
                            <Phone class="size-4 text-text-secondary" />
                            <span>{data.customer.phone}</span>
                        </div>
                    {/if}
                    {#if data.customer.billing_address || data.customer.city}
                        <div class="flex items-start gap-2 text-sm">
                            <MapPin class="size-4 text-text-muted mt-0.5" />
                            <span>
                                {data.customer.billing_address || ""}
                                {data.customer.city ? `, ${data.customer.city}` : ""}
                                {data.customer.pincode ? ` - ${data.customer.pincode}` : ""}
                            </span>
                        </div>
                    {/if}
                </div>

                <!-- GST Info Card -->
                <div class="bg-surface-0 rounded-lg border border-border p-4 space-y-3">
                    <h3 class="text-xs font-semibold uppercase tracking-wide text-text-secondary">GST Details</h3>
                    <div class="flex items-center gap-2 text-sm">
                        <Building2 class="size-4 text-text-secondary" />
                        <span class="capitalize">{data.customer.gst_treatment || "Unregistered"}</span>
                    </div>
                    {#if data.customer.gstin}
                        <div class="text-sm">
                            <span class="text-text-muted">GSTIN:</span>
                            <span class="font-mono ml-2">{data.customer.gstin}</span>
                        </div>
                    {/if}
                    <div class="text-sm">
                        <span class="text-text-muted">State:</span>
                        <span class="ml-2">{getStateName(data.customer.state_code)}</span>
                    </div>
                </div>

                <!-- Quick Actions Card -->
                <div class="bg-surface-0 rounded-lg border border-border p-4 space-y-3">
                    <h3 class="text-xs font-semibold uppercase tracking-wide text-text-secondary">Quick Actions</h3>
                    <div class="grid grid-cols-2 gap-2">
                        <Button variant="outline" size="sm" href="/invoices/new?customer={data.customer.id}" class="justify-start">
                            <FileText class="mr-2 size-3" />
                            Invoice
                        </Button>
                        <Button variant="outline" size="sm" href="/payments/new?customer={data.customer.id}" class="justify-start">
                            <CreditCard class="mr-2 size-3" />
                            Payment
                        </Button>
                        <Button variant="outline" size="sm" href="/credit-notes/new?customer={data.customer.id}" class="justify-start">
                            <Receipt class="mr-2 size-3" />
                            Credit Note
                        </Button>
                        <Button variant="outline" size="sm" onclick={() => (isEditing = true)} class="justify-start">
                            <Pencil class="mr-2 size-3" />
                            Edit Info
                        </Button>
                    </div>
                </div>
            </div>

            <!-- Tabs -->
            <div class="bg-surface-0 rounded-lg border border-border overflow-hidden">
                <div class="flex border-b border-border">
                    <button
                        class="px-4 py-3 text-sm font-medium transition-colors {activeTab === 'ledger' ? 'border-b-2 border-primary text-primary' : 'text-text-muted hover:text-text-strong'}"
                        onclick={() => activeTab = 'ledger'}
                    >
                        Ledger
                    </button>
                    <button
                        class="px-4 py-3 text-sm font-medium transition-colors {activeTab === 'invoices' ? 'border-b-2 border-primary text-primary' : 'text-text-muted hover:text-text-strong'}"
                        onclick={() => activeTab = 'invoices'}
                    >
                        Invoices ({data.invoices.length})
                    </button>
                    <button
                        class="px-4 py-3 text-sm font-medium transition-colors {activeTab === 'payments' ? 'border-b-2 border-primary text-primary' : 'text-text-muted hover:text-text-strong'}"
                        onclick={() => activeTab = 'payments'}
                    >
                        Payments ({data.payments.length})
                    </button>
                    <button
                        class="px-4 py-3 text-sm font-medium transition-colors {activeTab === 'credits' ? 'border-b-2 border-primary text-primary' : 'text-text-muted hover:text-text-strong'}"
                        onclick={() => activeTab = 'credits'}
                    >
                        Credits ({data.creditNotes.length + data.advances.length})
                    </button>
                </div>

                <div class="p-4">
                    {#if activeTab === 'ledger'}
                        <!-- Ledger View -->
                        {#if data.ledger.length === 0}
                            <div class="text-center py-12 text-text-muted">
                                <FileText class="size-12 mx-auto mb-4 opacity-30" />
                                <p>No transactions yet</p>
                            </div>
                        {:else}
                            <table class="w-full text-sm">
                                <thead>
                                    <tr class="text-left text-xs uppercase tracking-wide text-text-secondary border-b border-border">
                                        <th class="pb-3 pr-4">Date</th>
                                        <th class="pb-3 pr-4">Type</th>
                                        <th class="pb-3 pr-4">Number</th>
                                        <th class="pb-3 pr-4">Description</th>
                                        <th class="pb-3 pr-4 text-right">Debit</th>
                                        <th class="pb-3 pr-4 text-right">Credit</th>
                                        <th class="pb-3 text-right">Balance</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-border-subtle">
                                    {#each data.ledger as entry}
                                        <tr class="hover:bg-surface-2/50">
                                            <td class="py-3 pr-4 text-text-muted">{formatDate(entry.date)}</td>
                                            <td class="py-3 pr-4">
                                                <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                                                    {entry.type === 'invoice' ? 'bg-blue-100 text-blue-700' :
                                                     entry.type === 'payment' ? 'bg-green-100 text-green-700' :
                                                     'bg-purple-100 text-purple-700'}">
                                                    {entry.type === 'credit_note' ? 'Credit Note' : entry.type}
                                                </span>
                                            </td>
                                            <td class="py-3 pr-4">
                                                <a href="/{entry.type === 'credit_note' ? 'credit-notes' : entry.type + 's'}/{entry.id}"
                                                   class="font-mono text-primary hover:underline">
                                                    {entry.number}
                                                </a>
                                            </td>
                                            <td class="py-3 pr-4 text-text-subtle">{entry.description}</td>
                                            <td class="py-3 pr-4 text-right font-mono {entry.debit > 0 ? 'text-text-strong' : 'text-text-muted'}">
                                                {entry.debit > 0 ? formatCurrency(entry.debit) : '—'}
                                            </td>
                                            <td class="py-3 pr-4 text-right font-mono {entry.credit > 0 ? 'text-green-600' : 'text-text-muted'}">
                                                {entry.credit > 0 ? formatCurrency(entry.credit) : '—'}
                                            </td>
                                            <td class="py-3 text-right font-mono font-medium {entry.balance > 0 ? 'text-amber-600' : entry.balance < 0 ? 'text-blue-600' : ''}">
                                                {formatCurrency(Math.abs(entry.balance))}
                                                {#if entry.balance < 0}<span class="text-xs"> Cr</span>{/if}
                                            </td>
                                        </tr>
                                    {/each}
                                </tbody>
                            </table>
                        {/if}

                    {:else if activeTab === 'invoices'}
                        <!-- Invoices View -->
                        {#if data.invoices.length === 0}
                            <div class="text-center py-12 text-text-muted">
                                <FileText class="size-12 mx-auto mb-4 opacity-30" />
                                <p>No invoices yet</p>
                                <Button href="/invoices/new?customer={data.customer.id}" class="mt-4">
                                    <Plus class="mr-2 size-4" />
                                    Create Invoice
                                </Button>
                            </div>
                        {:else}
                            <table class="w-full text-sm">
                                <thead>
                                    <tr class="text-left text-xs uppercase tracking-wide text-text-secondary border-b border-border">
                                        <th class="pb-3 pr-4">Date</th>
                                        <th class="pb-3 pr-4">Invoice #</th>
                                        <th class="pb-3 pr-4">Due Date</th>
                                        <th class="pb-3 pr-4 text-right">Total</th>
                                        <th class="pb-3 pr-4 text-right">Balance Due</th>
                                        <th class="pb-3 text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-border-subtle">
                                    {#each data.invoices as invoice}
                                        <tr class="hover:bg-surface-2/50">
                                            <td class="py-3 pr-4 text-text-muted">{formatDate(invoice.invoice_date)}</td>
                                            <td class="py-3 pr-4">
                                                <a href="/invoices/{invoice.id}" class="font-mono text-primary hover:underline">
                                                    {invoice.invoice_number}
                                                </a>
                                            </td>
                                            <td class="py-3 pr-4 text-text-muted">{formatDate(invoice.due_date)}</td>
                                            <td class="py-3 pr-4 text-right font-mono">{formatCurrency(invoice.total)}</td>
                                            <td class="py-3 pr-4 text-right font-mono {invoice.balance_due > 0 ? 'text-amber-600' : 'text-green-600'}">
                                                {formatCurrency(invoice.balance_due)}
                                            </td>
                                            <td class="py-3 text-right">
                                                <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize {getStatusClass(invoice.status)}">
                                                    {invoice.status}
                                                </span>
                                            </td>
                                        </tr>
                                    {/each}
                                </tbody>
                            </table>
                        {/if}

                    {:else if activeTab === 'payments'}
                        <!-- Payments View -->
                        {#if data.payments.length === 0}
                            <div class="text-center py-12 text-text-muted">
                                <CreditCard class="size-12 mx-auto mb-4 opacity-30" />
                                <p>No payments yet</p>
                                <Button href="/payments/new?customer={data.customer.id}" class="mt-4">
                                    <Plus class="mr-2 size-4" />
                                    Record Payment
                                </Button>
                            </div>
                        {:else}
                            <table class="w-full text-sm">
                                <thead>
                                    <tr class="text-left text-xs uppercase tracking-wide text-text-secondary border-b border-border">
                                        <th class="pb-3 pr-4">Date</th>
                                        <th class="pb-3 pr-4">Payment #</th>
                                        <th class="pb-3 pr-4">Mode</th>
                                        <th class="pb-3 pr-4">Reference</th>
                                        <th class="pb-3 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-border-subtle">
                                    {#each data.payments as payment}
                                        <tr class="hover:bg-surface-2/50">
                                            <td class="py-3 pr-4 text-text-muted">{formatDate(payment.payment_date)}</td>
                                            <td class="py-3 pr-4">
                                                <span class="font-mono text-primary">{payment.payment_number}</span>
                                            </td>
                                            <td class="py-3 pr-4">
                                                <span class="capitalize text-xs bg-surface-2 px-2 py-0.5 rounded">{payment.payment_mode}</span>
                                            </td>
                                            <td class="py-3 pr-4 text-text-muted">{payment.reference || '—'}</td>
                                            <td class="py-3 text-right font-mono font-medium text-green-600">
                                                {formatCurrency(payment.amount)}
                                            </td>
                                        </tr>
                                    {/each}
                                </tbody>
                            </table>
                        {/if}

                    {:else if activeTab === 'credits'}
                        <!-- Credits View (Credit Notes + Advances) -->
                        <div class="space-y-6">
                            <!-- Credit Notes -->
                            <div>
                                <h4 class="text-xs font-bold uppercase tracking-wider text-text-muted mb-3">Credit Notes</h4>
                                {#if data.creditNotes.length === 0}
                                    <p class="text-sm text-text-muted py-4">No credit notes</p>
                                {:else}
                                    <table class="w-full text-sm">
                                        <thead>
                                            <tr class="text-left text-xs uppercase tracking-wide text-text-secondary border-b border-border">
                                                <th class="pb-3 pr-4">Date</th>
                                                <th class="pb-3 pr-4">Number</th>
                                                <th class="pb-3 pr-4">Reason</th>
                                                <th class="pb-3 pr-4 text-right">Total</th>
                                                <th class="pb-3 pr-4 text-right">Available</th>
                                                <th class="pb-3 text-right">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody class="divide-y divide-border-subtle">
                                            {#each data.creditNotes as cn}
                                                <tr class="hover:bg-surface-2/50">
                                                    <td class="py-3 pr-4 text-text-muted">{formatDate(cn.credit_note_date)}</td>
                                                    <td class="py-3 pr-4">
                                                        <span class="font-mono text-primary">{cn.credit_note_number}</span>
                                                    </td>
                                                    <td class="py-3 pr-4 capitalize">{cn.reason}</td>
                                                    <td class="py-3 pr-4 text-right font-mono">{formatCurrency(cn.total)}</td>
                                                    <td class="py-3 pr-4 text-right font-mono {cn.balance && cn.balance > 0 ? 'text-blue-600' : 'text-text-muted'}">
                                                        {formatCurrency(cn.balance)}
                                                    </td>
                                                    <td class="py-3 text-right">
                                                        <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize
                                                            {cn.status === 'issued' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}">
                                                            {cn.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            {/each}
                                        </tbody>
                                    </table>
                                {/if}
                            </div>

                            <!-- Advances -->
                            <div>
                                <h4 class="text-xs font-bold uppercase tracking-wider text-text-muted mb-3">Customer Advances</h4>
                                {#if data.advances.length === 0}
                                    <p class="text-sm text-text-muted py-4">No advances</p>
                                {:else}
                                    <table class="w-full text-sm">
                                        <thead>
                                            <tr class="text-left text-xs uppercase tracking-wide text-text-secondary border-b border-border">
                                                <th class="pb-3 pr-4">Date</th>
                                                <th class="pb-3 pr-4">Source</th>
                                                <th class="pb-3 pr-4 text-right">Original</th>
                                                <th class="pb-3 text-right">Available</th>
                                            </tr>
                                        </thead>
                                        <tbody class="divide-y divide-border-subtle">
                                            {#each data.advances as advance}
                                                <tr class="hover:bg-surface-2/50">
                                                    <td class="py-3 pr-4 text-text-muted">{formatDate(advance.created_at)}</td>
                                                    <td class="py-3 pr-4 text-text-subtle">{advance.notes || 'Advance payment'}</td>
                                                    <td class="py-3 pr-4 text-right font-mono">{formatCurrency(advance.amount)}</td>
                                                    <td class="py-3 text-right font-mono {advance.balance > 0.01 ? 'text-blue-600 font-medium' : 'text-text-muted'}">
                                                        {formatCurrency(advance.balance)}
                                                    </td>
                                                </tr>
                                            {/each}
                                        </tbody>
                                    </table>
                                {/if}
                            </div>
                        </div>
                    {/if}
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Edit Customer Modal -->
{#if isEditing}
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div class="bg-surface-0 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-border">
            <div class="p-4 border-b border-border flex justify-between items-center bg-surface-2">
                <h3 class="font-bold text-lg">Edit Customer</h3>
                <button
                    onclick={() => (isEditing = false)}
                    class="text-text-muted hover:text-text-strong"
                    aria-label="Close"
                >
                    <X class="size-5" />
                </button>
            </div>

            <form method="POST" use:enhance class="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
                <div class="space-y-6">
                    <!-- Basic Info -->
                    <div class="grid gap-4 md:grid-cols-2">
                        <div class="space-y-2">
                            <Label for="name">Customer Name *</Label>
                            <Input
                                id="name"
                                name="name"
                                bind:value={$form.name}
                                class={$errors.name ? "border-destructive" : ""}
                            />
                        </div>
                        <div class="space-y-2">
                            <Label for="company_name">Company Name</Label>
                            <Input id="company_name" name="company_name" bind:value={$form.company_name} />
                        </div>
                        <div class="space-y-2">
                            <Label for="email">Email</Label>
                            <Input id="email" name="email" type="email" bind:value={$form.email} />
                        </div>
                        <div class="space-y-2">
                            <Label for="phone">Phone</Label>
                            <Input id="phone" name="phone" bind:value={$form.phone} />
                        </div>
                    </div>

                    <!-- Address -->
                    <div class="grid gap-4 md:grid-cols-2">
                        <div class="space-y-2 md:col-span-2">
                            <Label for="billing_address">Billing Address</Label>
                            <Input id="billing_address" name="billing_address" bind:value={$form.billing_address} />
                        </div>
                        <div class="space-y-2">
                            <Label for="city">City</Label>
                            <Input id="city" name="city" bind:value={$form.city} />
                        </div>
                        <div class="space-y-2">
                            <Label for="state_code">State</Label>
                            <Select.Root type="single" name="state_code" bind:value={$form.state_code}>
                                <Select.Trigger id="state_code">
                                    {INDIAN_STATES.find((s) => s.code === $form.state_code)?.name || "Select state"}
                                </Select.Trigger>
                                <Select.Content>
                                    {#each INDIAN_STATES as state}
                                        <Select.Item value={state.code}>{state.name}</Select.Item>
                                    {/each}
                                </Select.Content>
                            </Select.Root>
                        </div>
                        <div class="space-y-2">
                            <Label for="pincode">Pincode</Label>
                            <Input id="pincode" name="pincode" bind:value={$form.pincode} />
                        </div>
                    </div>

                    <!-- GST Details -->
                    <div class="grid gap-4 md:grid-cols-2">
                        <div class="space-y-2">
                            <Label for="gst_treatment">GST Treatment</Label>
                            <Select.Root type="single" name="gst_treatment" bind:value={$form.gst_treatment}>
                                <Select.Trigger id="gst_treatment">
                                    {GST_TREATMENTS.find((t) => t.value === $form.gst_treatment)?.label || "Select"}
                                </Select.Trigger>
                                <Select.Content>
                                    {#each GST_TREATMENTS as treatment}
                                        <Select.Item value={treatment.value}>{treatment.label}</Select.Item>
                                    {/each}
                                </Select.Content>
                            </Select.Root>
                        </div>
                        <div class="space-y-2">
                            <Label for="gstin">GSTIN</Label>
                            <Input id="gstin" name="gstin" bind:value={$form.gstin} class="font-mono uppercase" />
                        </div>
                        <div class="space-y-2">
                            <Label for="payment_terms">Payment Terms (days)</Label>
                            <Input id="payment_terms" name="payment_terms" type="number" bind:value={$form.payment_terms} min="0" />
                        </div>
                    </div>
                </div>

                <div class="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
                    <Button variant="ghost" type="button" onclick={() => (isEditing = false)}>
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
