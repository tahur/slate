<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { Card } from "$lib/components/ui/card";
    import { Label } from "$lib/components/ui/label";
    import { ArrowLeft } from "lucide-svelte";
    import { goto } from "$app/navigation";
    import { formatINR } from "$lib/utils/currency";
    import { formatDate } from "$lib/utils/date";

    let { data } = $props();

    let selectedCustomer = $state(data.ledger?.id || "");

    function handleCustomerChange(e: Event) {
        const value = (e.target as HTMLSelectElement).value;
        if (value) {
            goto(`/reports/ledger?customer=${value}`);
        } else {
            goto("/reports/ledger");
        }
    }
</script>

<div class="space-y-4">
    <div class="flex items-center gap-4">
        <Button variant="ghost" href="/reports" class="p-2">
            <ArrowLeft class="size-4" />
        </Button>
        <div>
            <h1 class="text-xl font-semibold">Customer Ledger</h1>
            <p class="text-sm text-muted-foreground">
                Transaction history by customer
            </p>
        </div>
    </div>

    <!-- Customer Selector -->
    <Card class="p-4">
        <div class="flex items-center gap-4">
            <Label for="customer" class="whitespace-nowrap"
                >Select Customer:</Label
            >
            <select
                id="customer"
                value={selectedCustomer}
                onchange={handleCustomerChange}
                class="w-full max-w-sm rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
                <option value="">Choose a customer...</option>
                {#each data.customers as customer}
                    <option value={customer.id}>
                        {customer.name}
                        {#if customer.company_name}
                            ({customer.company_name})
                        {/if}
                        — Balance: {formatINR(customer.balance || 0)}
                    </option>
                {/each}
            </select>
        </div>
    </Card>

    {#if data.ledger}
        <Card class="overflow-hidden">
            <div class="p-4 border-b bg-muted/50">
                <h2 class="font-medium">
                    {data.ledger.name}
                    {#if data.ledger.company_name}
                        <span class="text-muted-foreground font-normal">
                            · {data.ledger.company_name}
                        </span>
                    {/if}
                </h2>
            </div>

            {#if data.ledger.entries.length === 0}
                <div class="p-12 text-center">
                    <p class="text-muted-foreground">
                        No transactions for this customer
                    </p>
                </div>
            {:else}
                <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead>
                            <tr class="border-b bg-muted/30">
                                <th
                                    class="px-4 py-3 text-left font-medium text-muted-foreground"
                                    >Date</th
                                >
                                <th
                                    class="px-4 py-3 text-left font-medium text-muted-foreground"
                                    >Type</th
                                >
                                <th
                                    class="px-4 py-3 text-left font-medium text-muted-foreground"
                                    >Number</th
                                >
                                <th
                                    class="px-4 py-3 text-right font-medium text-muted-foreground"
                                    >Debit</th
                                >
                                <th
                                    class="px-4 py-3 text-right font-medium text-muted-foreground"
                                    >Credit</th
                                >
                                <th
                                    class="px-4 py-3 text-right font-medium text-muted-foreground"
                                    >Balance</th
                                >
                            </tr>
                        </thead>
                        <tbody>
                            {#each data.ledger.entries as entry}
                                <tr class="border-b hover:bg-muted/30">
                                    <td class="px-4 py-3"
                                        >{formatDate(entry.date)}</td
                                    >
                                    <td class="px-4 py-3">
                                        <span
                                            class="inline-flex px-2 py-0.5 rounded text-xs font-medium {entry.type ===
                                            'invoice'
                                                ? 'bg-blue-100 text-blue-700'
                                                : 'bg-green-100 text-green-700'}"
                                        >
                                            {entry.type === "invoice"
                                                ? "Invoice"
                                                : "Payment"}
                                        </span>
                                    </td>
                                    <td class="px-4 py-3">
                                        <a
                                            href="/{entry.type === 'invoice'
                                                ? 'invoices'
                                                : 'payments'}/{entry.id}"
                                            class="font-mono text-primary hover:underline"
                                        >
                                            {entry.number}
                                        </a>
                                    </td>
                                    <td
                                        class="px-4 py-3 text-right font-mono {entry.debit >
                                        0
                                            ? 'text-red-600'
                                            : 'text-muted-foreground'}"
                                    >
                                        {entry.debit > 0
                                            ? formatINR(entry.debit)
                                            : "—"}
                                    </td>
                                    <td
                                        class="px-4 py-3 text-right font-mono {entry.credit >
                                        0
                                            ? 'text-green-600'
                                            : 'text-muted-foreground'}"
                                    >
                                        {entry.credit > 0
                                            ? formatINR(entry.credit)
                                            : "—"}
                                    </td>
                                    <td
                                        class="px-4 py-3 text-right font-mono font-medium {entry.balance >
                                        0
                                            ? 'text-red-600'
                                            : entry.balance < 0
                                              ? 'text-green-600'
                                              : ''}"
                                    >
                                        {formatINR(entry.balance)}
                                    </td>
                                </tr>
                            {/each}
                        </tbody>
                        <tfoot>
                            <tr class="bg-muted/50 font-semibold">
                                <td colspan="3" class="px-4 py-3">Total</td>
                                <td class="px-4 py-3 text-right font-mono"
                                    >{formatINR(
                                        data.ledger.totalDebit,
                                    )}</td
                                >
                                <td class="px-4 py-3 text-right font-mono"
                                    >{formatINR(
                                        data.ledger.totalCredit,
                                    )}</td
                                >
                                <td
                                    class="px-4 py-3 text-right font-mono {data
                                        .ledger.balance > 0
                                        ? 'text-red-600'
                                        : 'text-green-600'}"
                                >
                                    {formatINR(data.ledger.balance)}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            {/if}
        </Card>
    {:else if !selectedCustomer}
        <Card class="p-12 text-center">
            <p class="text-muted-foreground">
                Select a customer to view their ledger
            </p>
        </Card>
    {/if}
</div>
