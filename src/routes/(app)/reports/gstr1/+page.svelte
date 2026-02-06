<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { Card } from "$lib/components/ui/card";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import { Tabs, TabsList, TabsTrigger, TabsContent } from "$lib/components/ui/tabs";
    import {
        ArrowLeft,
        RefreshCw,
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
    import { formatINR } from "$lib/utils/currency";
    import { formatDate } from "$lib/utils/date";

    let { data } = $props();

    let startDate = $state(data.startDate);
    let endDate = $state(data.endDate);

    function applyFilter() {
        goto(`/reports/gstr1?from=${startDate}&to=${endDate}`);
    }

    function downloadCSV() {
        window.open(`/api/reports/gstr1/csv?from=${startDate}&to=${endDate}`, "_blank");
    }

    function downloadPDF() {
        window.open(`/api/reports/gstr1/pdf?from=${startDate}&to=${endDate}`, "_blank");
    }

    function downloadJSON() {
        window.open(`/api/reports/gstr1/json?from=${startDate}&to=${endDate}`, "_blank");
    }
</script>

<div class="space-y-4">
    <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
            <Button variant="ghost" href="/reports" class="p-2">
                <ArrowLeft class="size-4" />
            </Button>
            <div>
                <h1 class="text-xl font-semibold text-text-strong">GSTR-1 Sales Register</h1>
                <p class="text-sm text-text-muted">
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
                <Label for="from" class="form-label">From</Label>
                <Input type="date" id="from" bind:value={startDate} />
            </div>
            <div class="space-y-2">
                <Label for="to" class="form-label">To</Label>
                <Input type="date" id="to" bind:value={endDate} />
            </div>
            <Button onclick={applyFilter}>
                <RefreshCw class="mr-2 size-4" />
                Apply
            </Button>
        </div>
        <p class="text-xs text-text-muted mt-2">
            Period: {data.period}
            {#if data.gstin}
                <span class="ml-4">GSTIN: <span class="font-mono">{data.gstin}</span></span>
            {/if}
        </p>
    </Card>

    <!-- Summary Cards -->
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card class="p-4">
            <p class="text-xs text-text-muted">Total Invoices</p>
            <p class="text-2xl font-bold text-text-strong">{data.data.summary.totalInvoices}</p>
        </Card>
        <Card class="p-4">
            <p class="text-xs text-text-muted">Taxable Value</p>
            <p class="text-2xl font-bold font-mono text-text-strong">
                {formatINR(data.data.summary.totalTaxableValue)}
            </p>
        </Card>
        <Card class="p-4">
            <p class="text-xs text-text-muted">Total GST</p>
            <p class="text-2xl font-bold font-mono text-negative">
                {formatINR(
                    data.data.summary.totalCgst +
                        data.data.summary.totalSgst +
                        data.data.summary.totalIgst,
                )}
            </p>
        </Card>
        <Card class="p-4">
            <p class="text-xs text-text-muted">Total Value</p>
            <p class="text-2xl font-bold font-mono text-text-strong">
                {formatINR(data.data.summary.totalValue)}
            </p>
        </Card>
    </div>

    <!-- Tabs -->
    <Tabs value="b2b">
        <TabsList class="w-full justify-start flex-wrap">
            <TabsTrigger value="b2b">
                <Building2 class="size-4" />
                B2B
                <span class="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-surface-2 font-normal">
                    {data.data.b2b.length}
                </span>
            </TabsTrigger>
            <TabsTrigger value="b2cl">
                <Users class="size-4" />
                B2CL
                <span class="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-surface-2 font-normal">
                    {data.data.b2cl.length}
                </span>
            </TabsTrigger>
            <TabsTrigger value="b2cs">
                <ShoppingCart class="size-4" />
                B2CS
                <span class="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-surface-2 font-normal">
                    {data.data.b2cs.length}
                </span>
            </TabsTrigger>
            <TabsTrigger value="cdnr">
                <Receipt class="size-4" />
                Credit Notes
                <span class="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-surface-2 font-normal">
                    {data.data.cdnr.length}
                </span>
            </TabsTrigger>
            <TabsTrigger value="hsn">
                <Package class="size-4" />
                HSN Summary
                <span class="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-surface-2 font-normal">
                    {data.data.hsn.length}
                </span>
            </TabsTrigger>
        </TabsList>

        <!-- B2B -->
        <TabsContent value="b2b">
            <Card class="p-4 space-y-2">
                <h3 class="font-medium text-text-strong">B2B Supplies (To Registered Customers)</h3>
                <p class="text-xs text-text-muted">Invoices to customers with valid GSTIN</p>
                {#if data.data.b2b.length === 0}
                    <p class="text-sm text-text-muted py-8 text-center">No B2B invoices in this period</p>
                {:else}
                    <div class="overflow-x-auto">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>GSTIN</th>
                                    <th>Invoice No</th>
                                    <th>Date</th>
                                    <th class="text-right">Taxable</th>
                                    <th class="text-right">CGST</th>
                                    <th class="text-right">SGST</th>
                                    <th class="text-right">IGST</th>
                                    <th class="text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {#each data.data.b2b as entry}
                                    <tr>
                                        <td class="font-mono text-xs">{entry.gstin}</td>
                                        <td>{entry.invoiceNumber}</td>
                                        <td class="data-cell--muted">{formatDate(entry.invoiceDate)}</td>
                                        <td class="data-cell--number">{formatINR(entry.taxableValue)}</td>
                                        <td class="data-cell--number">{formatINR(entry.cgst)}</td>
                                        <td class="data-cell--number">{formatINR(entry.sgst)}</td>
                                        <td class="data-cell--number">{formatINR(entry.igst)}</td>
                                        <td class="data-cell--number font-medium">{formatINR(entry.invoiceValue)}</td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    </div>
                {/if}
            </Card>
        </TabsContent>

        <!-- B2CL -->
        <TabsContent value="b2cl">
            <Card class="p-4 space-y-2">
                <h3 class="font-medium text-text-strong">B2CL Supplies (Large Value, Inter-State)</h3>
                <p class="text-xs text-text-muted">Unregistered customers, inter-state supplies > 2.5L</p>
                {#if data.data.b2cl.length === 0}
                    <p class="text-sm text-text-muted py-8 text-center">No B2CL invoices in this period</p>
                {:else}
                    <div class="overflow-x-auto">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Invoice No</th>
                                    <th>Date</th>
                                    <th>POS</th>
                                    <th class="text-right">Taxable</th>
                                    <th class="text-right">IGST</th>
                                    <th class="text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {#each data.data.b2cl as entry}
                                    <tr>
                                        <td>{entry.invoiceNumber}</td>
                                        <td class="data-cell--muted">{formatDate(entry.invoiceDate)}</td>
                                        <td>{entry.placeOfSupply}</td>
                                        <td class="data-cell--number">{formatINR(entry.taxableValue)}</td>
                                        <td class="data-cell--number">{formatINR(entry.igst)}</td>
                                        <td class="data-cell--number font-medium">{formatINR(entry.invoiceValue)}</td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    </div>
                {/if}
            </Card>
        </TabsContent>

        <!-- B2CS -->
        <TabsContent value="b2cs">
            <Card class="p-4 space-y-2">
                <h3 class="font-medium text-text-strong">B2CS Supplies (Small Value / Intra-State)</h3>
                <p class="text-xs text-text-muted">Unregistered customers, intra-state or inter-state &le; 2.5L (aggregated by POS & rate)</p>
                {#if data.data.b2cs.length === 0}
                    <p class="text-sm text-text-muted py-8 text-center">No B2CS supplies in this period</p>
                {:else}
                    <div class="overflow-x-auto">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Place of Supply</th>
                                    <th>Type</th>
                                    <th class="text-right">Rate</th>
                                    <th class="text-right">Taxable</th>
                                    <th class="text-right">CGST</th>
                                    <th class="text-right">SGST</th>
                                    <th class="text-right">IGST</th>
                                </tr>
                            </thead>
                            <tbody>
                                {#each data.data.b2cs as entry}
                                    <tr>
                                        <td>{entry.placeOfSupply}</td>
                                        <td>{entry.type}</td>
                                        <td class="data-cell--number">{entry.rate}%</td>
                                        <td class="data-cell--number">{formatINR(entry.taxableValue)}</td>
                                        <td class="data-cell--number">{formatINR(entry.cgst)}</td>
                                        <td class="data-cell--number">{formatINR(entry.sgst)}</td>
                                        <td class="data-cell--number">{formatINR(entry.igst)}</td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    </div>
                {/if}
            </Card>
        </TabsContent>

        <!-- CDNR -->
        <TabsContent value="cdnr">
            <Card class="p-4 space-y-2">
                <h3 class="font-medium text-text-strong">Credit/Debit Notes (Registered)</h3>
                <p class="text-xs text-text-muted">Credit notes issued to registered customers</p>
                {#if data.data.cdnr.length === 0}
                    <p class="text-sm text-text-muted py-8 text-center">No credit notes in this period</p>
                {:else}
                    <div class="overflow-x-auto">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>GSTIN</th>
                                    <th>Note No</th>
                                    <th>Date</th>
                                    <th>Type</th>
                                    <th class="text-right">Taxable</th>
                                    <th class="text-right">CGST</th>
                                    <th class="text-right">SGST</th>
                                    <th class="text-right">IGST</th>
                                    <th class="text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {#each data.data.cdnr as entry}
                                    <tr>
                                        <td class="font-mono text-xs">{entry.gstin}</td>
                                        <td>{entry.noteNumber}</td>
                                        <td class="data-cell--muted">{formatDate(entry.noteDate)}</td>
                                        <td>{entry.noteType === 'C' ? 'Credit' : 'Debit'}</td>
                                        <td class="data-cell--number">{formatINR(entry.taxableValue)}</td>
                                        <td class="data-cell--number">{formatINR(entry.cgst)}</td>
                                        <td class="data-cell--number">{formatINR(entry.sgst)}</td>
                                        <td class="data-cell--number">{formatINR(entry.igst)}</td>
                                        <td class="data-cell--number font-medium">{formatINR(entry.noteValue)}</td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    </div>
                {/if}
            </Card>
        </TabsContent>

        <!-- HSN -->
        <TabsContent value="hsn">
            <Card class="p-4 space-y-2">
                <h3 class="font-medium text-text-strong">HSN/SAC Summary</h3>
                <p class="text-xs text-text-muted">Aggregated by HSN/SAC code</p>
                {#if data.data.hsn.length === 0}
                    <p class="text-sm text-text-muted py-8 text-center">No HSN data in this period</p>
                {:else}
                    <div class="overflow-x-auto">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>HSN/SAC</th>
                                    <th>Description</th>
                                    <th>UQC</th>
                                    <th class="text-right">Qty</th>
                                    <th class="text-right">Taxable</th>
                                    <th class="text-right">CGST</th>
                                    <th class="text-right">SGST</th>
                                    <th class="text-right">IGST</th>
                                    <th class="text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {#each data.data.hsn as entry}
                                    <tr>
                                        <td class="font-mono">{entry.hsnCode}</td>
                                        <td class="max-w-[200px] truncate">{entry.description}</td>
                                        <td>{entry.uqc}</td>
                                        <td class="data-cell--number">{entry.totalQuantity}</td>
                                        <td class="data-cell--number">{formatINR(entry.taxableValue)}</td>
                                        <td class="data-cell--number">{formatINR(entry.cgst)}</td>
                                        <td class="data-cell--number">{formatINR(entry.sgst)}</td>
                                        <td class="data-cell--number">{formatINR(entry.igst)}</td>
                                        <td class="data-cell--number font-medium">{formatINR(entry.totalValue)}</td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    </div>
                {/if}
            </Card>
        </TabsContent>
    </Tabs>
</div>
