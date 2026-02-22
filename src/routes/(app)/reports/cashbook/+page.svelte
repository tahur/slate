<script lang="ts">
    import { goto } from "$app/navigation";
    import { Button } from "$lib/components/ui/button";
    import { Card } from "$lib/components/ui/card";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "$lib/components/ui/table";
    import { ArrowLeft, RefreshCw, Building2 } from "lucide-svelte";
    import { formatINR } from "$lib/utils/currency";
    import { formatDate } from "$lib/utils/date";

    let { data } = $props();

    let startDate = $state(data.startDate);
    let endDate = $state(data.endDate);
    let selectedAccountId = $state(data.selectedAccountId);
    let selectedMethodId = $state(data.selectedMethodId);

    function applyFilter() {
        const params = new URLSearchParams();
        params.set("from", startDate);
        params.set("to", endDate);
        if (selectedAccountId) {
            params.set("account", selectedAccountId);
        }
        if (selectedMethodId) {
            params.set("method", selectedMethodId);
        }
        goto(`/reports/cashbook?${params.toString()}`);
    }
</script>

<div class="page-full-bleed">
    <header
        class="flex items-center justify-between gap-4 px-6 py-4 border-b border-border bg-surface-0 z-20"
    >
        <div class="flex items-center gap-4">
            <Button variant="ghost" href="/reports" size="icon" class="h-8 w-8">
                <ArrowLeft class="size-4" />
            </Button>
            <div>
                <h1 class="text-xl font-bold tracking-tight text-text-strong">
                    Cash & Bank Statement
                </h1>
                <p class="text-sm text-text-muted">
                    Money received and paid by account (business view)
                </p>
            </div>
        </div>
    </header>

    <div class="flex-1 overflow-auto bg-surface-1 p-6">
        <div class="max-w-7xl mx-auto space-y-6">
            <Card class="p-4">
                <div class="flex flex-wrap items-end gap-4">
                    <div class="space-y-2">
                        <Label for="from" variant="form">From</Label>
                        <Input type="date" id="from" bind:value={startDate} />
                    </div>
                    <div class="space-y-2">
                        <Label for="to" variant="form">To</Label>
                        <Input type="date" id="to" bind:value={endDate} />
                    </div>
                    <div class="space-y-2 min-w-72">
                        <Label for="account" variant="form">Account</Label>
                        <select
                            id="account"
                            bind:value={selectedAccountId}
                            class="w-full h-9 rounded-md border border-border bg-surface-0 px-3 py-1.5 text-sm text-text-strong focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring/50"
                        >
                            {#each data.accounts as account}
                                <option value={account.id}>{account.name}</option>
                            {/each}
                        </select>
                    </div>
                    <div class="space-y-2 min-w-48">
                        <Label for="method" variant="form">Method</Label>
                        <select
                            id="method"
                            bind:value={selectedMethodId}
                            class="w-full h-9 rounded-md border border-border bg-surface-0 px-3 py-1.5 text-sm text-text-strong focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring/50"
                        >
                            <option value="">All Methods</option>
                            {#each data.paymentMethods as method}
                                <option value={method.id}>{method.label}</option>
                            {/each}
                        </select>
                    </div>
                    <Button onclick={applyFilter}>
                        <RefreshCw class="mr-2 size-4" />
                        Apply
                    </Button>
                </div>
                <p class="text-xs text-text-muted mt-3">
                    Account lists all configured banks and cash. Only customer payments and expenses are included; manual journals are excluded.
                </p>
            </Card>

            {#if data.accounts.length === 0}
                <Card class="p-12 text-center">
                    <div class="flex flex-col items-center gap-3">
                        <Building2 class="size-10 text-text-muted/40" />
                        <h3 class="text-lg font-bold text-text-strong">
                            No bank or cash accounts
                        </h3>
                        <p class="text-sm text-text-muted">
                            Add payment accounts (banks and cash) in Settings to see the cashbook and statement by account.
                        </p>
                        <Button href="/settings" variant="outline" class="mt-2">
                            Open Settings
                        </Button>
                    </div>
                </Card>
            {:else}
                <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                    <Card class="p-4">
                        <p class="text-xs text-text-muted">Opening</p>
                        <p class="text-2xl font-bold font-mono text-text-strong">
                            {formatINR(data.selectedSummary?.opening || 0)}
                        </p>
                    </Card>
                    <Card class="p-4">
                        <p class="text-xs text-text-muted">Money In</p>
                        <p class="text-2xl font-bold font-mono text-green-600">
                            {formatINR(data.selectedSummary?.received || 0)}
                        </p>
                    </Card>
                    <Card class="p-4">
                        <p class="text-xs text-text-muted">Money Out</p>
                        <p class="text-2xl font-bold font-mono text-red-600">
                            {formatINR(data.selectedSummary?.paid || 0)}
                        </p>
                    </Card>
                    <Card class="p-4">
                        <p class="text-xs text-text-muted">Net Movement</p>
                        <p
                            class="text-2xl font-bold font-mono {(data.selectedSummary?.net || 0) >= 0
                                ? 'text-green-600'
                                : 'text-red-600'}"
                        >
                            {formatINR(data.selectedSummary?.net || 0)}
                        </p>
                    </Card>
                    <Card class="p-4">
                        <p class="text-xs text-text-muted">Closing</p>
                        <p class="text-2xl font-bold font-mono text-text-strong">
                            {formatINR(data.selectedSummary?.closing || 0)}
                        </p>
                    </Card>
                </div>

                <Card class="p-4">
                    <div class="flex items-center justify-between mb-3">
                        <div>
                            <h2 class="text-xs font-semibold uppercase tracking-wider text-text-muted">
                                Account-Wise Summary
                            </h2>
                            <p class="text-xs text-text-muted mt-1">
                                Combined view across all accounts in selected period
                            </p>
                        </div>
                    </div>

                    <div class="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow class="hover:bg-transparent">
                                    <TableHead>Account</TableHead>
                                    <TableHead class="text-right">Opening</TableHead>
                                    <TableHead class="text-right">Received</TableHead>
                                    <TableHead class="text-right">Paid</TableHead>
                                    <TableHead class="text-right">Closing</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {#each data.accountSummaries as summary}
                                    <TableRow>
                                        <TableCell class="font-medium text-text-strong">
                                            {summary.accountName}
                                        </TableCell>
                                        <TableCell class="text-right font-mono tabular-nums text-[0.8125rem] text-text-subtle">
                                            {formatINR(summary.opening)}
                                        </TableCell>
                                        <TableCell class="text-right font-mono tabular-nums text-[0.8125rem] text-green-600">
                                            {formatINR(summary.received)}
                                        </TableCell>
                                        <TableCell class="text-right font-mono tabular-nums text-[0.8125rem] text-red-600">
                                            {formatINR(summary.paid)}
                                        </TableCell>
                                        <TableCell class="text-right font-mono tabular-nums text-[0.8125rem] font-semibold text-text-strong">
                                            {formatINR(summary.closing)}
                                        </TableCell>
                                    </TableRow>
                                {/each}
                                <TableRow class="bg-surface-2/60 font-semibold">
                                    <TableCell>Total</TableCell>
                                    <TableCell class="text-right font-mono tabular-nums text-[0.8125rem]">
                                        {formatINR(data.totals.opening)}
                                    </TableCell>
                                    <TableCell class="text-right font-mono tabular-nums text-[0.8125rem] text-green-600">
                                        {formatINR(data.totals.received)}
                                    </TableCell>
                                    <TableCell class="text-right font-mono tabular-nums text-[0.8125rem] text-red-600">
                                        {formatINR(data.totals.paid)}
                                    </TableCell>
                                    <TableCell class="text-right font-mono tabular-nums text-[0.8125rem]">
                                        {formatINR(data.totals.closing)}
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                </Card>

                <Card class="p-4">
                    <div class="mb-3">
                        <h2 class="text-xs font-semibold uppercase tracking-wider text-text-muted">
                            Statement Entries
                        </h2>
                        <p class="text-sm text-text-muted mt-1">
                            {data.selectedSummary ? data.selectedSummary.accountName : "Selected account"}
                        </p>
                    </div>

                    {#if data.entries.length === 0}
                        <p class="text-sm text-text-muted py-8 text-center">
                            No entries for this account in selected period.
                        </p>
                    {:else}
                        <div class="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow class="hover:bg-transparent">
                                        <TableHead class="w-28">Date</TableHead>
                                        <TableHead class="w-28">Type</TableHead>
                                        <TableHead class="w-36">Voucher #</TableHead>
                                        <TableHead>Party</TableHead>
                                        <TableHead>Method</TableHead>
                                        <TableHead class="min-w-[12rem]">Remark</TableHead>
                                        <TableHead class="w-24">Reference</TableHead>
                                        <TableHead class="text-right w-32">Received</TableHead>
                                        <TableHead class="text-right w-32">Paid</TableHead>
                                        <TableHead class="text-right w-32">Balance</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {#each data.entries as entry}
                                        <TableRow>
                                            <TableCell class="text-text-muted">
                                                {formatDate(entry.date)}
                                            </TableCell>
                                            <TableCell>
                                                <span
                                                    class="inline-flex px-2 py-0.5 rounded text-xs font-medium {entry.sourceType === 'payment'
                                                        ? 'bg-green-50 text-green-700'
                                                        : 'bg-red-50 text-red-700'}"
                                                >
                                                    {entry.sourceType === "payment"
                                                        ? "Received"
                                                        : "Paid"}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <a
                                                    href={entry.href}
                                                    class="font-mono text-primary hover:underline"
                                                >
                                                    {entry.voucherNumber}
                                                </a>
                                            </TableCell>
                                            <TableCell class="text-text-strong">
                                                {entry.partyName}
                                            </TableCell>
                                            <TableCell class="text-text-muted text-xs">
                                                {entry.methodLabel || "—"}
                                            </TableCell>
                                            <TableCell class="text-sm text-text-subtle">
                                                {entry.remark}
                                            </TableCell>
                                            <TableCell class="text-text-muted text-xs">
                                                {entry.reference || "—"}
                                            </TableCell>
                                            <TableCell class="text-right font-mono tabular-nums text-[0.8125rem] text-green-600">
                                                {entry.received > 0 ? formatINR(entry.received) : "—"}
                                            </TableCell>
                                            <TableCell class="text-right font-mono tabular-nums text-[0.8125rem] text-red-600">
                                                {entry.paid > 0 ? formatINR(entry.paid) : "—"}
                                            </TableCell>
                                            <TableCell class="text-right font-mono tabular-nums text-[0.8125rem] font-semibold text-text-strong">
                                                {formatINR(entry.balance)}
                                            </TableCell>
                                        </TableRow>
                                    {/each}
                                </TableBody>
                            </Table>
                        </div>
                    {/if}
                </Card>
            {/if}
        </div>
    </div>
</div>
