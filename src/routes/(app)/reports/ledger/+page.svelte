<script lang="ts">
    import { goto } from "$app/navigation";
    import { Button } from "$lib/components/ui/button";
    import { Card } from "$lib/components/ui/card";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import {
        Table,
        TableHeader,
        TableBody,
        TableRow,
        TableHead,
        TableCell,
        TableFooter,
    } from "$lib/components/ui/table";
    import { ArrowLeft, Download, RefreshCw } from "lucide-svelte";
    import { formatINR } from "$lib/utils/currency";
    import { formatDate } from "$lib/utils/date";

    let { data } = $props();

    type PartyType = "customer" | "supplier";
    type Preset = "this-month" | "last-month" | "fy" | "last-90";

    let partyType = $state<PartyType>(data.partyType);
    let selectedPartyId = $state(data.selectedPartyId);
    let startDate = $state(data.startDate);
    let endDate = $state(data.endDate);
    let pageSize = $state(data.pagination?.pageSize || 50);

    const partyOptions = $derived(
        partyType === "customer" ? data.customers : data.suppliers,
    );

    $effect(() => {
        const exists = partyOptions.some((party: any) => party.id === selectedPartyId);
        if (!exists) {
            selectedPartyId = "";
        }
    });

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

    function buildQuery(nextPage = 1) {
        const params = new URLSearchParams();
        params.set("party", partyType);
        params.set("from", startDate);
        params.set("to", endDate);
        params.set("page", String(nextPage));
        params.set("page_size", String(pageSize));

        if (selectedPartyId) {
            params.set("partyId", selectedPartyId);
        }

        return params;
    }

    function applyFilter(nextPage = 1) {
        const params = buildQuery(nextPage);
        goto(`/reports/ledger?${params.toString()}`);
    }

    function exportCsv() {
        if (!selectedPartyId) return;
        const params = buildQuery(1);
        window.open(`/api/reports/ledger/csv?${params.toString()}`, "_blank");
    }

    function handlePartyTypeChange(e: Event) {
        partyType = (e.target as HTMLSelectElement).value as PartyType;
        selectedPartyId = "";
    }

    function getDocumentLabel(type: string): string {
        if (type === "invoice") return "Bill";
        if (type === "receipt") return "Receipt";
        if (type === "supplier_payment") return "Payment";
        if (type === "credit_note") return "Credit Note";
        return "Expense";
    }

    function getDocumentClass(type: string): string {
        if (type === "invoice") return "bg-blue-50 text-blue-700";
        if (type === "receipt") return "bg-green-50 text-green-700";
        if (type === "supplier_payment") return "bg-red-50 text-red-700";
        if (type === "credit_note") return "bg-amber-50 text-amber-700";
        return "bg-red-50 text-red-700";
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
                <h1 class="text-xl font-bold tracking-tight text-text-strong">Party Ledger</h1>
                <p class="text-sm text-text-muted">
                    Customer and supplier statement with clear transaction reasons
                </p>
            </div>
        </div>
    </header>

    <div class="flex-1 overflow-auto bg-surface-1 p-6">
        <div class="max-w-7xl mx-auto space-y-4">
            <Card class="p-4">
                <div class="flex flex-wrap items-end gap-4">
                    <div class="space-y-2 min-w-40">
                        <Label for="party-type" variant="form">Party Type</Label>
                        <select
                            id="party-type"
                            bind:value={partyType}
                            onchange={handlePartyTypeChange}
                            class="w-full h-9 rounded-md border border-border-strong bg-surface-0 px-3 py-1.5 text-sm text-text-strong focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40"
                        >
                            <option value="customer">Customer</option>
                            <option value="supplier">Supplier</option>
                        </select>
                    </div>

                    <div class="space-y-2 min-w-72">
                        <Label for="party-id" variant="form">
                            {partyType === "customer" ? "Customer" : "Supplier"}
                        </Label>
                        <select
                            id="party-id"
                            bind:value={selectedPartyId}
                            class="w-full h-9 rounded-md border border-border-strong bg-surface-0 px-3 py-1.5 text-sm text-text-strong focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40"
                        >
                            <option value="">
                                {partyType === "customer"
                                    ? "Select customer..."
                                    : "Select supplier..."}
                            </option>
                            {#each partyOptions as party}
                                <option value={party.id}>
                                    {party.name}
                                    {#if party.companyName}
                                        ({party.companyName})
                                    {/if}
                                </option>
                            {/each}
                        </select>
                    </div>

                    <div class="space-y-2">
                        <Label for="from" variant="form">From</Label>
                        <Input type="date" id="from" bind:value={startDate} />
                    </div>

                    <div class="space-y-2">
                        <Label for="to" variant="form">To</Label>
                        <Input type="date" id="to" bind:value={endDate} />
                    </div>

                    <div class="space-y-2 min-w-28">
                        <Label for="page-size" variant="form">Rows</Label>
                        <select
                            id="page-size"
                            bind:value={pageSize}
                            class="w-full h-9 rounded-md border border-border-strong bg-surface-0 px-3 py-1.5 text-sm text-text-strong focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40"
                        >
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                    </div>

                    <Button onclick={() => applyFilter(1)}>
                        <RefreshCw class="mr-2 size-4" />
                        Apply
                    </Button>
                    <Button
                        variant="outline"
                        onclick={exportCsv}
                        disabled={!selectedPartyId}
                    >
                        <Download class="mr-2 size-4" />
                        Export CSV
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
            </Card>

            {#if !data.ledger}
                <Card class="p-12 text-center">
                    <p class="text-text-muted">
                        Select a {partyType === "customer" ? "customer" : "supplier"} and click Apply to view the statement.
                    </p>
                </Card>
            {:else}
                <div class="sticky top-0 z-10 bg-surface-1/95 backdrop-blur-sm">
                    <div class="space-y-4 pb-2">
                        <Card class="p-4">
                            <div class="flex flex-col gap-1">
                                <h2 class="text-base font-semibold text-text-strong">
                                    {data.ledger.partyName}
                                </h2>
                                {#if data.ledger.partyCompanyName}
                                    <p class="text-sm text-text-muted">{data.ledger.partyCompanyName}</p>
                                {/if}
                                <p class="text-xs text-text-muted">
                                    {data.ledger.partyType === "customer"
                                        ? "Bills, receipts, and credit notes"
                                        : "Supplier bills and payments"}
                                </p>
                            </div>
                        </Card>

                        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <Card class="p-4">
                                <p class="text-xs text-text-muted">
                                    {data.ledger.partyType === "customer" ? "Opening Pending" : "Opening Payable"}
                                </p>
                                <p class="text-2xl font-bold font-mono text-text-strong">
                                    {formatINR(data.ledger.opening)}
                                </p>
                            </Card>
                            <Card class="p-4">
                                <p class="text-xs text-text-muted">Bills in Period</p>
                                <p class="text-2xl font-bold font-mono text-text-strong">
                                    {formatINR(data.ledger.totalCharges)}
                                </p>
                            </Card>
                            <Card class="p-4">
                                <p class="text-xs text-text-muted">
                                    {data.ledger.partyType === "customer" ? "Received / Credits" : "Paid in Period"}
                                </p>
                                <p
                                    class="text-2xl font-bold font-mono {data.ledger.partyType === "customer"
                                        ? 'text-green-600'
                                        : 'text-red-600'}"
                                >
                                    {formatINR(data.ledger.totalSettlements)}
                                </p>
                            </Card>
                            <Card class="p-4">
                                <p class="text-xs text-text-muted">
                                    {data.ledger.partyType === "customer" ? "Closing Pending" : "Closing Payable"}
                                </p>
                                <p
                                    class="text-2xl font-bold font-mono {data.ledger.closing > 0
                                        ? 'text-amber-600'
                                        : data.ledger.closing < 0
                                          ? 'text-blue-600'
                                          : 'text-text-muted'}"
                                >
                                    {formatINR(data.ledger.closing)}
                                </p>
                            </Card>
                        </div>
                    </div>
                </div>

                <Card class="p-4">
                    <div class="mb-3 flex items-center justify-between gap-3">
                        <div>
                            <h3 class="text-xs font-semibold uppercase tracking-wider text-text-muted">
                                Statement Entries
                            </h3>
                            <p class="text-xs text-text-muted mt-1">
                                {startDate} to {endDate}
                            </p>
                        </div>
                        {#if data.pagination}
                            <p class="text-xs text-text-muted">
                                {data.pagination.totalEntries === 0
                                    ? "0 entries"
                                    : `${(data.pagination.page - 1) * data.pagination.pageSize + 1}-${Math.min(
                                          data.pagination.page * data.pagination.pageSize,
                                          data.pagination.totalEntries,
                                      )} of ${data.pagination.totalEntries}`}
                            </p>
                        {/if}
                    </div>

                    {#if data.ledger.entries.length === 0}
                        <p class="text-sm text-text-muted py-8 text-center">
                            No entries in selected period.
                        </p>
                    {:else}
                        <div class="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow class="hover:bg-transparent">
                                        <TableHead class="w-28">Date</TableHead>
                                        <TableHead class="w-32">Document</TableHead>
                                        <TableHead class="w-36">Doc #</TableHead>
                                        <TableHead class="min-w-[16rem]">Reason</TableHead>
                                        <TableHead class="w-28">Method</TableHead>
                                        <TableHead class="w-32">Reference</TableHead>
                                        <TableHead class="text-right w-32">Bill Amt</TableHead>
                                        <TableHead class="text-right w-36">
                                            {data.ledger.partyType === "customer" ? "Received/Credit" : "Paid"}
                                        </TableHead>
                                        <TableHead class="text-right w-32">
                                            {data.ledger.partyType === "customer" ? "Pending" : "Payable"}
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {#each data.ledger.entries as entry}
                                        <TableRow>
                                            <TableCell class="text-text-muted">
                                                {formatDate(entry.date)}
                                            </TableCell>
                                            <TableCell>
                                                <span
                                                    class="inline-flex px-2 py-0.5 rounded text-xs font-medium {getDocumentClass(
                                                        entry.sourceType,
                                                    )}"
                                                >
                                                    {getDocumentLabel(entry.sourceType)}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <a href={entry.href} class="font-mono text-primary hover:underline">
                                                    {entry.number}
                                                </a>
                                            </TableCell>
                                            <TableCell class="text-sm text-text-subtle">
                                                {entry.reason}
                                            </TableCell>
                                            <TableCell class="text-xs text-text-muted">
                                                {entry.methodLabel || "—"}
                                            </TableCell>
                                            <TableCell class="text-xs text-text-muted">
                                                {entry.reference || "—"}
                                            </TableCell>
                                            <TableCell class="text-right font-mono tabular-nums text-[0.8125rem] text-text-strong">
                                                {entry.charge > 0 ? formatINR(entry.charge) : "—"}
                                            </TableCell>
                                            <TableCell
                                                class="text-right font-mono tabular-nums text-[0.8125rem] {data.ledger.partyType === "customer"
                                                    ? 'text-green-600'
                                                    : 'text-red-600'}"
                                            >
                                                {entry.settlement > 0 ? formatINR(entry.settlement) : "—"}
                                            </TableCell>
                                            <TableCell
                                                class="text-right font-mono tabular-nums text-[0.8125rem] font-semibold {entry.balance >
                                                0
                                                    ? 'text-amber-600'
                                                    : entry.balance < 0
                                                      ? 'text-blue-600'
                                                      : 'text-text-muted'}"
                                            >
                                                {formatINR(entry.balance)}
                                            </TableCell>
                                        </TableRow>
                                    {/each}
                                </TableBody>
                                <TableFooter>
                                    <TableRow class="hover:bg-transparent bg-surface-2/60 font-semibold">
                                        <TableCell colspan={6}>Total</TableCell>
                                        <TableCell class="text-right font-mono tabular-nums text-[0.8125rem]">
                                            {formatINR(data.ledger.totalCharges)}
                                        </TableCell>
                                        <TableCell
                                            class="text-right font-mono tabular-nums text-[0.8125rem] {data.ledger.partyType === "customer"
                                                ? 'text-green-600'
                                                : 'text-red-600'}"
                                        >
                                            {formatINR(data.ledger.totalSettlements)}
                                        </TableCell>
                                        <TableCell class="text-right font-mono tabular-nums text-[0.8125rem]">
                                            {formatINR(data.ledger.closing)}
                                        </TableCell>
                                    </TableRow>
                                </TableFooter>
                            </Table>
                        </div>
                    {/if}

                    {#if data.pagination && data.pagination.totalPages > 1}
                        <div class="mt-4 flex items-center justify-end gap-2 border-t border-border pt-3">
                            <Button
                                variant="outline"
                                size="sm"
                                onclick={() => applyFilter(data.pagination.page - 1)}
                                disabled={!data.pagination.hasPreviousPage}
                            >
                                Previous
                            </Button>
                            <p class="text-xs text-text-muted px-2">
                                Page {data.pagination.page} of {data.pagination.totalPages}
                            </p>
                            <Button
                                variant="outline"
                                size="sm"
                                onclick={() => applyFilter(data.pagination.page + 1)}
                                disabled={!data.pagination.hasNextPage}
                            >
                                Next
                            </Button>
                        </div>
                    {/if}
                </Card>
            {/if}
        </div>
    </div>
</div>
