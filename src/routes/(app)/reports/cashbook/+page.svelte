<script lang="ts">
    import { goto } from "$app/navigation";
    import { Button } from "$lib/components/ui/button";
    import { Card } from "$lib/components/ui/card";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import * as Select from "$lib/components/ui/select";
    import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "$lib/components/ui/table";
    import { ArrowLeft, RefreshCw, Building2, ArrowUpRight, ArrowDownLeft } from "lucide-svelte";
    import { formatINR } from "$lib/utils/currency";
    import { formatDate } from "$lib/utils/date";

    let { data } = $props();

    let startDate = $state(data.startDate);
    let endDate = $state(data.endDate);
    let selectedAccountId = $state(data.selectedAccountId);
    let selectedMethodId = $state(data.selectedMethodId);
    const ALL_ACCOUNT = "__all_accounts";
    const ALL_METHOD = "__all_methods";

    type Preset = "this-month" | "last-month" | "fy" | "last-90";

    function buildIsoDate(date: Date): string {
        const year = date.getFullYear();
        const month = `${date.getMonth() + 1}`.padStart(2, "0");
        const day = `${date.getDate()}`.padStart(2, "0");
        return `${year}-${month}-${day}`;
    }

    function getPresetRange(preset: Preset) {
        const now = new Date();

        if (preset === "this-month") {
            return {
                from: buildIsoDate(new Date(now.getFullYear(), now.getMonth(), 1)),
                to: buildIsoDate(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
            };
        }

        if (preset === "last-month") {
            return {
                from: buildIsoDate(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
                to: buildIsoDate(new Date(now.getFullYear(), now.getMonth(), 0)),
            };
        }

        if (preset === "last-90") {
            const ninetyDaysAgo = new Date(now);
            ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
            return {
                from: buildIsoDate(ninetyDaysAgo),
                to: buildIsoDate(now),
            };
        }

        const currentYear = now.getFullYear();
        const isAfterMarch = now.getMonth() >= 3;
        const startYear = isAfterMarch ? currentYear : currentYear - 1;
        const endYear = isAfterMarch ? currentYear + 1 : currentYear;
        return {
            from: `${startYear}-04-01`,
            to: `${endYear}-03-31`,
        };
    }

    function applyPreset(preset: Preset) {
        const range = getPresetRange(preset);
        startDate = range.from;
        endDate = range.to;
    }

    function isPresetActive(preset: Preset) {
        const range = getPresetRange(preset);
        return startDate === range.from && endDate === range.to;
    }

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

    function getSelectedAccountLabel() {
        if (!selectedAccountId) return "All Accounts";
        return (
            data.accounts.find((account) => account.id === selectedAccountId)
                ?.name || "All Accounts"
        );
    }

    function getSelectedMethodLabel() {
        if (!selectedMethodId) return "All Methods";
        return (
            data.paymentMethods.find((method) => method.id === selectedMethodId)
                ?.label || "All Methods"
        );
    }
</script>

<div class="page-full-bleed">
    <header class="page-header items-center">
        <div class="flex items-center gap-4">
            <Button variant="ghost" href="/reports" size="icon" class="h-8 w-8">
                <ArrowLeft class="size-4" />
            </Button>
            <div>
                <h1 class="text-xl font-bold tracking-tight text-text-strong">
                    Cashbook (Cash & Bank)
                </h1>
                <p class="text-sm text-text-muted">
                    Daily credit and debit movement by account
                </p>
            </div>
        </div>
    </header>

    <main class="page-body">
        <div class="content-width-standard space-y-6">
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
                        <Select.Root
                            type="single"
                            value={selectedAccountId || ALL_ACCOUNT}
                            onValueChange={(value) =>
                                (selectedAccountId =
                                    value === ALL_ACCOUNT ? "" : value)}
                        >
                            <Select.Trigger id="account" class="w-full">
                                {getSelectedAccountLabel()}
                            </Select.Trigger>
                            <Select.Content>
                                <Select.Item value={ALL_ACCOUNT}>All Accounts</Select.Item>
                                {#each data.accounts as account}
                                    <Select.Item value={account.id}>
                                        {account.name}
                                    </Select.Item>
                                {/each}
                            </Select.Content>
                        </Select.Root>
                    </div>
                    <div class="space-y-2 min-w-48">
                        <Label for="method" variant="form">Method</Label>
                        <Select.Root
                            type="single"
                            value={selectedMethodId || ALL_METHOD}
                            onValueChange={(value) =>
                                (selectedMethodId =
                                    value === ALL_METHOD ? "" : value)}
                        >
                            <Select.Trigger id="method" class="w-full">
                                {getSelectedMethodLabel()}
                            </Select.Trigger>
                            <Select.Content>
                                <Select.Item value={ALL_METHOD}>All Methods</Select.Item>
                                {#each data.paymentMethods as method}
                                    <Select.Item value={method.id}>
                                        {method.label}
                                    </Select.Item>
                                {/each}
                            </Select.Content>
                        </Select.Root>
                    </div>
                    <Button onclick={applyFilter}>
                        <RefreshCw class="mr-2 size-4" />
                        Apply
                    </Button>
                </div>

                <div class="flex flex-wrap gap-2 mt-4">
                    <Button
                        variant="outline"
                        size="sm"
                        class={isPresetActive("this-month")
                            ? "border-primary text-primary bg-surface-0"
                            : ""}
                        onclick={() => applyPreset("this-month")}
                    >
                        This Month
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        class={isPresetActive("last-month")
                            ? "border-primary text-primary bg-surface-0"
                            : ""}
                        onclick={() => applyPreset("last-month")}
                    >
                        Last Month
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        class={isPresetActive("fy")
                            ? "border-primary text-primary bg-surface-0"
                            : ""}
                        onclick={() => applyPreset("fy")}
                    >
                        This FY
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        class={isPresetActive("last-90")
                            ? "border-primary text-primary bg-surface-0"
                            : ""}
                        onclick={() => applyPreset("last-90")}
                    >
                        Last 90 Days
                    </Button>
                </div>

                <p class="text-xs text-text-muted mt-3">
                    Shows all bank and cash accounts from Settings. Includes customer receipts and expenses.
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
                            Add bank/cash accounts in Settings to use Cashbook.
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
                        <p class="text-xs text-text-muted">Credit</p>
                        <p class="text-2xl font-bold font-mono text-green-600">
                            {formatINR(data.selectedSummary?.received || 0)}
                        </p>
                    </Card>
                    <Card class="p-4">
                        <p class="text-xs text-text-muted">Debit</p>
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
                            Transactions
                        </h2>
                        <p class="text-sm text-text-muted mt-1">
                            {data.selectedSummary ? data.selectedSummary.accountName : "Selected account"}
                        </p>
                    </div>

                    {#if data.entries.length === 0}
                        <p class="text-sm text-text-muted py-8 text-center">
                            No entries for the selected filters.
                        </p>
                    {:else}
                        <div class="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow class="hover:bg-transparent">
                                        <TableHead class="w-28">Date</TableHead>
                                        <TableHead class="w-24">Entry</TableHead>
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
                                                    class="inline-flex items-center gap-1 text-xs font-medium {entry.sourceType === 'payment'
                                                        ? 'text-green-700'
                                                        : 'text-red-700'}"
                                                >
                                                    {#if entry.sourceType === "payment"}
                                                        <ArrowDownLeft class="size-3.5" />
                                                        Credit
                                                    {:else}
                                                        <ArrowUpRight class="size-3.5" />
                                                        Debit
                                                    {/if}
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
    </main>
</div>
