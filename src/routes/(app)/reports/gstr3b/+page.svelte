<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { Card } from "$lib/components/ui/card";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableFooter } from "$lib/components/ui/table";
    import {
        ArrowLeft,
        RefreshCw,
        FileJson,
        FileSpreadsheet,
        FileText,
        CheckCircle2,
        XCircle,
        TriangleAlert,
    } from "lucide-svelte";
    import { goto } from "$app/navigation";
    import { formatINR } from "$lib/utils/currency";

    let { data } = $props();
    const { startDate: initStart, endDate: initEnd } = data;

    let startDate = $state(initStart);
    let endDate = $state(initEnd);

    function applyFilter() {
        goto(`/reports/gstr3b?from=${startDate}&to=${endDate}`);
    }

    function downloadCSV() {
        window.open(`/api/reports/gstr3b/csv?from=${startDate}&to=${endDate}`, "_blank");
    }

    function downloadPDF() {
        window.open(`/api/reports/gstr3b/pdf?from=${startDate}&to=${endDate}`, "_blank");
    }

    function downloadJSON() {
        window.open(`/api/reports/gstr3b/json?from=${startDate}&to=${endDate}`, "_blank");
    }
</script>

<div class="space-y-4">
    <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
            <Button variant="ghost" href="/reports" class="p-2">
                <ArrowLeft class="size-4" />
            </Button>
            <div>
                <h1 class="text-xl font-semibold text-text-strong">GSTR-3B Purchase Data</h1>
                <p class="text-sm text-text-muted">
                    Input Tax Credit (ITC) data for GST filing
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
                <Label for="from" variant="form">From</Label>
                <Input type="date" id="from" bind:value={startDate} />
            </div>
            <div class="space-y-2">
                <Label for="to" variant="form">To</Label>
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
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card class="p-4">
            <p class="text-xs text-text-muted">Total Purchases</p>
            <p class="text-2xl font-bold text-text-strong">{data.data.summary.totalPurchases}</p>
        </Card>
        <Card class="p-4">
            <p class="text-xs text-text-muted">Expense Value</p>
            <p class="text-2xl font-bold font-mono text-text-strong">
                {formatINR(data.data.summary.totalExpenseValue)}
            </p>
        </Card>
        <Card class="p-4">
            <p class="text-xs text-text-muted">Eligible ITC</p>
            <p class="text-2xl font-bold font-mono text-positive">
                {formatINR(data.data.summary.totalEligibleItc)}
            </p>
        </Card>
        <Card class="p-4">
            <p class="text-xs text-text-muted">Ineligible ITC</p>
            <p class="text-2xl font-bold font-mono text-negative">
                {formatINR(data.data.summary.ineligibleItc)}
            </p>
        </Card>
        <Card class="p-4 bg-positive/5 border-positive/20">
            <p class="text-xs text-text-muted">Net ITC Available</p>
            <p class="text-2xl font-bold font-mono text-positive">
                {formatINR(data.data.summary.totalEligibleItc)}
            </p>
        </Card>
    </div>

    <!-- ITC Breakdown -->
    <div class="grid gap-4 md:grid-cols-3">
        <Card class="p-4">
            <p class="text-xs text-text-muted mb-2">CGST ITC</p>
            <p class="text-xl font-bold font-mono text-text-strong">
                {formatINR(data.data.summary.eligibleItcCgst)}
            </p>
        </Card>
        <Card class="p-4">
            <p class="text-xs text-text-muted mb-2">SGST ITC</p>
            <p class="text-xl font-bold font-mono text-text-strong">
                {formatINR(data.data.summary.eligibleItcSgst)}
            </p>
        </Card>
        <Card class="p-4">
            <p class="text-xs text-text-muted mb-2">IGST ITC</p>
            <p class="text-xl font-bold font-mono text-text-strong">
                {formatINR(data.data.summary.eligibleItcIgst)}
            </p>
        </Card>
    </div>

    <!-- Vendor-wise Table -->
    <Card class="p-4">
        <div class="space-y-2">
            <h3 class="font-medium text-text-strong">Vendor-wise ITC Breakdown</h3>
            <p class="text-xs text-text-muted">
                Purchase summary by vendor with ITC eligibility
            </p>
            {#if data.data.vendorWise.length === 0}
                <p class="text-sm text-text-muted py-8 text-center">
                    No expenses in this period
                </p>
            {:else}
                <div class="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow class="hover:bg-transparent">
                                <TableHead>Vendor</TableHead>
                                <TableHead>GSTIN</TableHead>
                                <TableHead class="text-center">Expenses</TableHead>
                                <TableHead class="text-right">Amount</TableHead>
                                <TableHead class="text-right">CGST</TableHead>
                                <TableHead class="text-right">SGST</TableHead>
                                <TableHead class="text-right">IGST</TableHead>
                                <TableHead class="text-right">Total Tax</TableHead>
                                <TableHead class="text-center">ITC</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {#each data.data.vendorWise as vendor}
                                <TableRow>
                                    <TableCell class="font-medium">{vendor.vendorName}</TableCell>
                                    <TableCell class="font-mono text-xs text-text-muted">
                                        {vendor.gstin || "-"}
                                    </TableCell>
                                    <TableCell class="text-center">{vendor.expenseCount}</TableCell>
                                    <TableCell class="text-right font-mono tabular-nums text-[0.8125rem]">{formatINR(vendor.totalAmount)}</TableCell>
                                    <TableCell class="text-right font-mono tabular-nums text-[0.8125rem]">{formatINR(vendor.cgst)}</TableCell>
                                    <TableCell class="text-right font-mono tabular-nums text-[0.8125rem]">{formatINR(vendor.sgst)}</TableCell>
                                    <TableCell class="text-right font-mono tabular-nums text-[0.8125rem]">{formatINR(vendor.igst)}</TableCell>
                                    <TableCell class="text-right font-mono tabular-nums text-[0.8125rem] font-medium">{formatINR(vendor.totalTax)}</TableCell>
                                    <TableCell class="text-center">
                                        {#if vendor.isRegistered}
                                            <CheckCircle2 class="size-4 text-positive inline" />
                                        {:else}
                                            <XCircle class="size-4 text-negative inline" />
                                        {/if}
                                    </TableCell>
                                </TableRow>
                            {/each}
                        </TableBody>
                        <TableFooter>
                            <TableRow class="hover:bg-transparent">
                                <TableCell class="font-semibold">Total</TableCell>
                                <TableCell></TableCell>
                                <TableCell class="text-center font-semibold">{data.data.summary.totalPurchases}</TableCell>
                                <TableCell class="text-right font-mono tabular-nums text-[0.8125rem] font-semibold">{formatINR(data.data.summary.totalExpenseValue)}</TableCell>
                                <TableCell class="text-right font-mono tabular-nums text-[0.8125rem] font-semibold">{formatINR(data.data.vendorWise.reduce((sum, v) => sum + v.cgst, 0))}</TableCell>
                                <TableCell class="text-right font-mono tabular-nums text-[0.8125rem] font-semibold">{formatINR(data.data.vendorWise.reduce((sum, v) => sum + v.sgst, 0))}</TableCell>
                                <TableCell class="text-right font-mono tabular-nums text-[0.8125rem] font-semibold">{formatINR(data.data.vendorWise.reduce((sum, v) => sum + v.igst, 0))}</TableCell>
                                <TableCell class="text-right font-mono tabular-nums text-[0.8125rem] font-semibold">{formatINR(data.data.vendorWise.reduce((sum, v) => sum + v.totalTax, 0))}</TableCell>
                                <TableCell></TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </div>
            {/if}
        </div>
    </Card>

    <!-- ITC Eligibility Note -->
    <Card class="p-4 bg-warning/5 border-warning/20">
        <div class="flex items-start gap-3">
            <TriangleAlert class="size-5 text-warning mt-0.5 shrink-0" />
            <div>
                <h4 class="font-medium text-warning-foreground">
                    ITC Eligibility Note
                </h4>
                <p class="text-sm text-text-subtle mt-1">
                    Input Tax Credit is only eligible from purchases made from
                    GST-registered vendors. Ensure vendor GSTIN is captured for
                    all eligible purchases. The ITC shown here is based on
                    purchase data and should be reconciled with GSTR-2B before
                    filing.
                </p>
            </div>
        </div>
    </Card>
</div>
