<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { Card } from "$lib/components/ui/card";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import {
        ArrowLeft,
        RefreshCw,
        Download,
        FileJson,
        FileSpreadsheet,
        FileText,
        Building2,
        Users,
        ShoppingCart,
        Receipt,
        Package,
    } from "lucide-svelte";
    import { goto } from "$app/navigation";

    let { data } = $props();

    let startDate = $state(data.startDate);
    let endDate = $state(data.endDate);
    let activeTab = $state<"b2b" | "b2cl" | "b2cs" | "cdnr" | "hsn">("b2b");

    function applyFilter() {
        goto(`/reports/gstr1?from=${startDate}&to=${endDate}`);
    }

    function formatCurrency(amount: number): string {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 2,
        }).format(amount);
    }

    function formatDate(dateStr: string): string {
        return new Date(dateStr).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    }

    function downloadCSV() {
        window.open(
            `/api/reports/gstr1/csv?from=${startDate}&to=${endDate}`,
            "_blank",
        );
    }

    function downloadPDF() {
        window.open(
            `/api/reports/gstr1/pdf?from=${startDate}&to=${endDate}`,
            "_blank",
        );
    }

    function downloadJSON() {
        window.open(
            `/api/reports/gstr1/json?from=${startDate}&to=${endDate}`,
            "_blank",
        );
    }

    const tabs = [
        {
            id: "b2b" as const,
            label: "B2B",
            icon: Building2,
            count: data.data.b2b.length,
        },
        {
            id: "b2cl" as const,
            label: "B2CL",
            icon: Users,
            count: data.data.b2cl.length,
        },
        {
            id: "b2cs" as const,
            label: "B2CS",
            icon: ShoppingCart,
            count: data.data.b2cs.length,
        },
        {
            id: "cdnr" as const,
            label: "Credit Notes",
            icon: Receipt,
            count: data.data.cdnr.length,
        },
        {
            id: "hsn" as const,
            label: "HSN Summary",
            icon: Package,
            count: data.data.hsn.length,
        },
    ];
</script>

<div class="space-y-4">
    <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
            <Button variant="ghost" href="/reports" class="p-2">
                <ArrowLeft class="size-4" />
            </Button>
            <div>
                <h1 class="text-xl font-semibold">GSTR-1 Sales Register</h1>
                <p class="text-sm text-muted-foreground">
                    Outward supplies data for GST filing
                </p>
            </div>
        </div>

        <div class="flex items-center gap-2">
            <Button variant="outline" size="sm" onclick={downloadCSV}>
                <FileSpreadsheet class="mr-2 size-4" />
                CSV
            </Button>
            <Button variant="outline" size="sm" onclick={downloadPDF}>
                <FileText class="mr-2 size-4" />
                PDF
            </Button>
            <Button variant="outline" size="sm" onclick={downloadJSON}>
                <FileJson class="mr-2 size-4" />
                JSON
            </Button>
        </div>
    </div>

    <!-- Date Filter -->
    <Card class="p-4">
        <div class="flex items-end gap-4 flex-wrap">
            <div class="space-y-2">
                <Label for="from">From</Label>
                <Input type="date" id="from" bind:value={startDate} />
            </div>
            <div class="space-y-2">
                <Label for="to">To</Label>
                <Input type="date" id="to" bind:value={endDate} />
            </div>
            <Button onclick={applyFilter}>
                <RefreshCw class="mr-2 size-4" />
                Apply
            </Button>
        </div>
        <p class="text-xs text-muted-foreground mt-2">
            Period: {data.period}
            {#if data.gstin}
                <span class="ml-4">GSTIN: {data.gstin}</span>
            {/if}
        </p>
    </Card>

    <!-- Summary Cards -->
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card class="p-4">
            <p class="text-xs text-muted-foreground">Total Invoices</p>
            <p class="text-2xl font-bold">{data.data.summary.totalInvoices}</p>
        </Card>
        <Card class="p-4">
            <p class="text-xs text-muted-foreground">Taxable Value</p>
            <p class="text-2xl font-bold font-mono">
                {formatCurrency(data.data.summary.totalTaxableValue)}
            </p>
        </Card>
        <Card class="p-4">
            <p class="text-xs text-muted-foreground">Total GST</p>
            <p class="text-2xl font-bold font-mono text-red-600">
                {formatCurrency(
                    data.data.summary.totalCgst +
                        data.data.summary.totalSgst +
                        data.data.summary.totalIgst,
                )}
            </p>
        </Card>
        <Card class="p-4">
            <p class="text-xs text-muted-foreground">Total Value</p>
            <p class="text-2xl font-bold font-mono">
                {formatCurrency(data.data.summary.totalValue)}
            </p>
        </Card>
    </div>

    <!-- Tabs -->
    <div class="border-b">
        <nav class="flex gap-1" aria-label="Tabs">
            {#each tabs as tab}
                <button
                    onclick={() => (activeTab = tab.id)}
                    class="px-4 py-2 text-sm font-medium rounded-t-md transition-colors flex items-center gap-2 {activeTab ===
                    tab.id
                        ? 'bg-background border border-b-background -mb-px text-foreground'
                        : 'text-muted-foreground hover:text-foreground'}"
                >
                    <svelte:component this={tab.icon} class="size-4" />
                    {tab.label}
                    <span
                        class="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-muted"
                    >
                        {tab.count}
                    </span>
                </button>
            {/each}
        </nav>
    </div>

    <!-- Tab Content -->
    <Card class="p-4">
        {#if activeTab === "b2b"}
            <div class="space-y-2">
                <h3 class="font-medium">
                    B2B Supplies (To Registered Customers)
                </h3>
                <p class="text-xs text-muted-foreground">
                    Invoices to customers with valid GSTIN
                </p>
                {#if data.data.b2b.length === 0}
                    <p class="text-sm text-muted-foreground py-8 text-center">
                        No B2B invoices in this period
                    </p>
                {:else}
                    <div class="overflow-x-auto">
                        <table class="w-full text-sm">
                            <thead>
                                <tr class="border-b">
                                    <th class="text-left py-2 px-2">GSTIN</th>
                                    <th class="text-left py-2 px-2"
                                        >Invoice No</th
                                    >
                                    <th class="text-left py-2 px-2">Date</th>
                                    <th class="text-right py-2 px-2">Taxable</th
                                    >
                                    <th class="text-right py-2 px-2">CGST</th>
                                    <th class="text-right py-2 px-2">SGST</th>
                                    <th class="text-right py-2 px-2">IGST</th>
                                    <th class="text-right py-2 px-2">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {#each data.data.b2b as entry}
                                    <tr class="border-b hover:bg-muted/50">
                                        <td class="py-2 px-2 font-mono text-xs"
                                            >{entry.gstin}</td
                                        >
                                        <td class="py-2 px-2"
                                            >{entry.invoiceNumber}</td
                                        >
                                        <td class="py-2 px-2"
                                            >{formatDate(entry.invoiceDate)}</td
                                        >
                                        <td class="py-2 px-2 text-right font-mono"
                                            >{formatCurrency(
                                                entry.taxableValue,
                                            )}</td
                                        >
                                        <td class="py-2 px-2 text-right font-mono"
                                            >{formatCurrency(entry.cgst)}</td
                                        >
                                        <td class="py-2 px-2 text-right font-mono"
                                            >{formatCurrency(entry.sgst)}</td
                                        >
                                        <td class="py-2 px-2 text-right font-mono"
                                            >{formatCurrency(entry.igst)}</td
                                        >
                                        <td
                                            class="py-2 px-2 text-right font-mono font-medium"
                                            >{formatCurrency(
                                                entry.invoiceValue,
                                            )}</td
                                        >
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    </div>
                {/if}
            </div>
        {:else if activeTab === "b2cl"}
            <div class="space-y-2">
                <h3 class="font-medium">
                    B2CL Supplies (Large Value, Inter-State)
                </h3>
                <p class="text-xs text-muted-foreground">
                    Unregistered customers, inter-state supplies > 2.5L
                </p>
                {#if data.data.b2cl.length === 0}
                    <p class="text-sm text-muted-foreground py-8 text-center">
                        No B2CL invoices in this period
                    </p>
                {:else}
                    <div class="overflow-x-auto">
                        <table class="w-full text-sm">
                            <thead>
                                <tr class="border-b">
                                    <th class="text-left py-2 px-2"
                                        >Invoice No</th
                                    >
                                    <th class="text-left py-2 px-2">Date</th>
                                    <th class="text-left py-2 px-2">POS</th>
                                    <th class="text-right py-2 px-2">Taxable</th
                                    >
                                    <th class="text-right py-2 px-2">IGST</th>
                                    <th class="text-right py-2 px-2">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {#each data.data.b2cl as entry}
                                    <tr class="border-b hover:bg-muted/50">
                                        <td class="py-2 px-2"
                                            >{entry.invoiceNumber}</td
                                        >
                                        <td class="py-2 px-2"
                                            >{formatDate(entry.invoiceDate)}</td
                                        >
                                        <td class="py-2 px-2"
                                            >{entry.placeOfSupply}</td
                                        >
                                        <td class="py-2 px-2 text-right font-mono"
                                            >{formatCurrency(
                                                entry.taxableValue,
                                            )}</td
                                        >
                                        <td class="py-2 px-2 text-right font-mono"
                                            >{formatCurrency(entry.igst)}</td
                                        >
                                        <td
                                            class="py-2 px-2 text-right font-mono font-medium"
                                            >{formatCurrency(
                                                entry.invoiceValue,
                                            )}</td
                                        >
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    </div>
                {/if}
            </div>
        {:else if activeTab === "b2cs"}
            <div class="space-y-2">
                <h3 class="font-medium">B2CS Supplies (Small Value / Intra-State)</h3>
                <p class="text-xs text-muted-foreground">
                    Unregistered customers, intra-state or inter-state &le; 2.5L
                    (aggregated by POS & rate)
                </p>
                {#if data.data.b2cs.length === 0}
                    <p class="text-sm text-muted-foreground py-8 text-center">
                        No B2CS supplies in this period
                    </p>
                {:else}
                    <div class="overflow-x-auto">
                        <table class="w-full text-sm">
                            <thead>
                                <tr class="border-b">
                                    <th class="text-left py-2 px-2">Place of Supply</th>
                                    <th class="text-left py-2 px-2">Type</th>
                                    <th class="text-right py-2 px-2">Rate</th>
                                    <th class="text-right py-2 px-2">Taxable</th>
                                    <th class="text-right py-2 px-2">CGST</th>
                                    <th class="text-right py-2 px-2">SGST</th>
                                    <th class="text-right py-2 px-2">IGST</th>
                                </tr>
                            </thead>
                            <tbody>
                                {#each data.data.b2cs as entry}
                                    <tr class="border-b hover:bg-muted/50">
                                        <td class="py-2 px-2">{entry.placeOfSupply}</td>
                                        <td class="py-2 px-2">{entry.type}</td>
                                        <td class="py-2 px-2 text-right">{entry.rate}%</td>
                                        <td class="py-2 px-2 text-right font-mono">{formatCurrency(entry.taxableValue)}</td>
                                        <td class="py-2 px-2 text-right font-mono">{formatCurrency(entry.cgst)}</td>
                                        <td class="py-2 px-2 text-right font-mono">{formatCurrency(entry.sgst)}</td>
                                        <td class="py-2 px-2 text-right font-mono">{formatCurrency(entry.igst)}</td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    </div>
                {/if}
            </div>
        {:else if activeTab === "cdnr"}
            <div class="space-y-2">
                <h3 class="font-medium">Credit/Debit Notes (Registered)</h3>
                <p class="text-xs text-muted-foreground">
                    Credit notes issued to registered customers
                </p>
                {#if data.data.cdnr.length === 0}
                    <p class="text-sm text-muted-foreground py-8 text-center">
                        No credit notes in this period
                    </p>
                {:else}
                    <div class="overflow-x-auto">
                        <table class="w-full text-sm">
                            <thead>
                                <tr class="border-b">
                                    <th class="text-left py-2 px-2">GSTIN</th>
                                    <th class="text-left py-2 px-2">Note No</th>
                                    <th class="text-left py-2 px-2">Date</th>
                                    <th class="text-left py-2 px-2">Type</th>
                                    <th class="text-right py-2 px-2">Taxable</th>
                                    <th class="text-right py-2 px-2">CGST</th>
                                    <th class="text-right py-2 px-2">SGST</th>
                                    <th class="text-right py-2 px-2">IGST</th>
                                    <th class="text-right py-2 px-2">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {#each data.data.cdnr as entry}
                                    <tr class="border-b hover:bg-muted/50">
                                        <td class="py-2 px-2 font-mono text-xs">{entry.gstin}</td>
                                        <td class="py-2 px-2">{entry.noteNumber}</td>
                                        <td class="py-2 px-2">{formatDate(entry.noteDate)}</td>
                                        <td class="py-2 px-2">{entry.noteType === 'C' ? 'Credit' : 'Debit'}</td>
                                        <td class="py-2 px-2 text-right font-mono">{formatCurrency(entry.taxableValue)}</td>
                                        <td class="py-2 px-2 text-right font-mono">{formatCurrency(entry.cgst)}</td>
                                        <td class="py-2 px-2 text-right font-mono">{formatCurrency(entry.sgst)}</td>
                                        <td class="py-2 px-2 text-right font-mono">{formatCurrency(entry.igst)}</td>
                                        <td class="py-2 px-2 text-right font-mono font-medium">{formatCurrency(entry.noteValue)}</td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    </div>
                {/if}
            </div>
        {:else if activeTab === "hsn"}
            <div class="space-y-2">
                <h3 class="font-medium">HSN/SAC Summary</h3>
                <p class="text-xs text-muted-foreground">
                    Aggregated by HSN/SAC code
                </p>
                {#if data.data.hsn.length === 0}
                    <p class="text-sm text-muted-foreground py-8 text-center">
                        No HSN data in this period
                    </p>
                {:else}
                    <div class="overflow-x-auto">
                        <table class="w-full text-sm">
                            <thead>
                                <tr class="border-b">
                                    <th class="text-left py-2 px-2">HSN/SAC</th>
                                    <th class="text-left py-2 px-2">Description</th>
                                    <th class="text-left py-2 px-2">UQC</th>
                                    <th class="text-right py-2 px-2">Qty</th>
                                    <th class="text-right py-2 px-2">Taxable</th>
                                    <th class="text-right py-2 px-2">CGST</th>
                                    <th class="text-right py-2 px-2">SGST</th>
                                    <th class="text-right py-2 px-2">IGST</th>
                                    <th class="text-right py-2 px-2">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {#each data.data.hsn as entry}
                                    <tr class="border-b hover:bg-muted/50">
                                        <td class="py-2 px-2 font-mono">{entry.hsnCode}</td>
                                        <td class="py-2 px-2 max-w-[200px] truncate">{entry.description}</td>
                                        <td class="py-2 px-2">{entry.uqc}</td>
                                        <td class="py-2 px-2 text-right">{entry.totalQuantity}</td>
                                        <td class="py-2 px-2 text-right font-mono">{formatCurrency(entry.taxableValue)}</td>
                                        <td class="py-2 px-2 text-right font-mono">{formatCurrency(entry.cgst)}</td>
                                        <td class="py-2 px-2 text-right font-mono">{formatCurrency(entry.sgst)}</td>
                                        <td class="py-2 px-2 text-right font-mono">{formatCurrency(entry.igst)}</td>
                                        <td class="py-2 px-2 text-right font-mono font-medium">{formatCurrency(entry.totalValue)}</td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    </div>
                {/if}
            </div>
        {/if}
    </Card>
</div>
