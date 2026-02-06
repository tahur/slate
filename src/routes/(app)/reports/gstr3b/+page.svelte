<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { Card } from "$lib/components/ui/card";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
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

    let { data } = $props();

    let startDate = $state(data.startDate);
    let endDate = $state(data.endDate);

    function applyFilter() {
        goto(`/reports/gstr3b?from=${startDate}&to=${endDate}`);
    }

    function formatCurrency(amount: number): string {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 2,
        }).format(amount);
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
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card class="p-4">
            <p class="text-xs text-text-muted">Total Purchases</p>
            <p class="text-2xl font-bold text-text-strong">{data.data.summary.totalPurchases}</p>
        </Card>
        <Card class="p-4">
            <p class="text-xs text-text-muted">Expense Value</p>
            <p class="text-2xl font-bold font-mono text-text-strong">
                {formatCurrency(data.data.summary.totalExpenseValue)}
            </p>
        </Card>
        <Card class="p-4">
            <p class="text-xs text-text-muted">Eligible ITC</p>
            <p class="text-2xl font-bold font-mono text-positive">
                {formatCurrency(data.data.summary.totalEligibleItc)}
            </p>
        </Card>
        <Card class="p-4">
            <p class="text-xs text-text-muted">Ineligible ITC</p>
            <p class="text-2xl font-bold font-mono text-negative">
                {formatCurrency(data.data.summary.ineligibleItc)}
            </p>
        </Card>
        <Card class="p-4 bg-positive/5 border-positive/20">
            <p class="text-xs text-text-muted">Net ITC Available</p>
            <p class="text-2xl font-bold font-mono text-positive">
                {formatCurrency(data.data.summary.totalEligibleItc)}
            </p>
        </Card>
    </div>

    <!-- ITC Breakdown -->
    <div class="grid gap-4 md:grid-cols-3">
        <Card class="p-4">
            <p class="text-xs text-text-muted mb-2">CGST ITC</p>
            <p class="text-xl font-bold font-mono text-text-strong">
                {formatCurrency(data.data.summary.eligibleItcCgst)}
            </p>
        </Card>
        <Card class="p-4">
            <p class="text-xs text-text-muted mb-2">SGST ITC</p>
            <p class="text-xl font-bold font-mono text-text-strong">
                {formatCurrency(data.data.summary.eligibleItcSgst)}
            </p>
        </Card>
        <Card class="p-4">
            <p class="text-xs text-text-muted mb-2">IGST ITC</p>
            <p class="text-xl font-bold font-mono text-text-strong">
                {formatCurrency(data.data.summary.eligibleItcIgst)}
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
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Vendor</th>
                                <th>GSTIN</th>
                                <th class="text-center">Expenses</th>
                                <th class="text-right">Amount</th>
                                <th class="text-right">CGST</th>
                                <th class="text-right">SGST</th>
                                <th class="text-right">IGST</th>
                                <th class="text-right">Total Tax</th>
                                <th class="text-center">ITC</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each data.data.vendorWise as vendor}
                                <tr>
                                    <td class="font-medium">{vendor.vendorName}</td>
                                    <td class="font-mono text-xs data-cell--muted">
                                        {vendor.gstin || "-"}
                                    </td>
                                    <td class="text-center">{vendor.expenseCount}</td>
                                    <td class="data-cell--number">{formatCurrency(vendor.totalAmount)}</td>
                                    <td class="data-cell--number">{formatCurrency(vendor.cgst)}</td>
                                    <td class="data-cell--number">{formatCurrency(vendor.sgst)}</td>
                                    <td class="data-cell--number">{formatCurrency(vendor.igst)}</td>
                                    <td class="data-cell--number font-medium">{formatCurrency(vendor.totalTax)}</td>
                                    <td class="text-center">
                                        {#if vendor.isRegistered}
                                            <CheckCircle2 class="size-4 text-positive inline" />
                                        {:else}
                                            <XCircle class="size-4 text-negative inline" />
                                        {/if}
                                    </td>
                                </tr>
                            {/each}
                        </tbody>
                        <tfoot>
                            <tr class="border-t-2 border-border font-semibold bg-surface-1">
                                <td class="px-4 py-3">Total</td>
                                <td></td>
                                <td class="text-center px-4 py-3">{data.data.summary.totalPurchases}</td>
                                <td class="data-cell--number px-4 py-3">{formatCurrency(data.data.summary.totalExpenseValue)}</td>
                                <td class="data-cell--number px-4 py-3">{formatCurrency(data.data.vendorWise.reduce((sum, v) => sum + v.cgst, 0))}</td>
                                <td class="data-cell--number px-4 py-3">{formatCurrency(data.data.vendorWise.reduce((sum, v) => sum + v.sgst, 0))}</td>
                                <td class="data-cell--number px-4 py-3">{formatCurrency(data.data.vendorWise.reduce((sum, v) => sum + v.igst, 0))}</td>
                                <td class="data-cell--number px-4 py-3">{formatCurrency(data.data.vendorWise.reduce((sum, v) => sum + v.totalTax, 0))}</td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
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
