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

    function formatDate(dateStr: string): string {
        return new Date(dateStr).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    }

    function downloadCSV() {
        window.open(
            `/api/reports/gstr3b/csv?from=${startDate}&to=${endDate}`,
            "_blank",
        );
    }

    function downloadPDF() {
        window.open(
            `/api/reports/gstr3b/pdf?from=${startDate}&to=${endDate}`,
            "_blank",
        );
    }

    function downloadJSON() {
        window.open(
            `/api/reports/gstr3b/json?from=${startDate}&to=${endDate}`,
            "_blank",
        );
    }
</script>

<div class="space-y-4">
    <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
            <Button variant="ghost" href="/reports" class="p-2">
                <ArrowLeft class="size-4" />
            </Button>
            <div>
                <h1 class="text-xl font-semibold">GSTR-3B Purchase Data</h1>
                <p class="text-sm text-muted-foreground">
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
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card class="p-4">
            <p class="text-xs text-muted-foreground">Total Purchases</p>
            <p class="text-2xl font-bold">{data.data.summary.totalPurchases}</p>
        </Card>
        <Card class="p-4">
            <p class="text-xs text-muted-foreground">Expense Value</p>
            <p class="text-2xl font-bold font-mono">
                {formatCurrency(data.data.summary.totalExpenseValue)}
            </p>
        </Card>
        <Card class="p-4">
            <p class="text-xs text-muted-foreground">Eligible ITC</p>
            <p class="text-2xl font-bold font-mono text-green-600">
                {formatCurrency(data.data.summary.totalEligibleItc)}
            </p>
        </Card>
        <Card class="p-4">
            <p class="text-xs text-muted-foreground">Ineligible ITC</p>
            <p class="text-2xl font-bold font-mono text-red-600">
                {formatCurrency(data.data.summary.ineligibleItc)}
            </p>
        </Card>
        <Card class="p-4 bg-green-50 dark:bg-green-950/30">
            <p class="text-xs text-muted-foreground">Net ITC Available</p>
            <p class="text-2xl font-bold font-mono text-green-700 dark:text-green-400">
                {formatCurrency(data.data.summary.totalEligibleItc)}
            </p>
        </Card>
    </div>

    <!-- ITC Breakdown -->
    <div class="grid gap-4 md:grid-cols-3">
        <Card class="p-4">
            <p class="text-xs text-muted-foreground mb-2">CGST ITC</p>
            <p class="text-xl font-bold font-mono">
                {formatCurrency(data.data.summary.eligibleItcCgst)}
            </p>
        </Card>
        <Card class="p-4">
            <p class="text-xs text-muted-foreground mb-2">SGST ITC</p>
            <p class="text-xl font-bold font-mono">
                {formatCurrency(data.data.summary.eligibleItcSgst)}
            </p>
        </Card>
        <Card class="p-4">
            <p class="text-xs text-muted-foreground mb-2">IGST ITC</p>
            <p class="text-xl font-bold font-mono">
                {formatCurrency(data.data.summary.eligibleItcIgst)}
            </p>
        </Card>
    </div>

    <!-- Vendor-wise Table -->
    <Card class="p-4">
        <div class="space-y-2">
            <h3 class="font-medium">Vendor-wise ITC Breakdown</h3>
            <p class="text-xs text-muted-foreground">
                Purchase summary by vendor with ITC eligibility
            </p>
            {#if data.data.vendorWise.length === 0}
                <p class="text-sm text-muted-foreground py-8 text-center">
                    No expenses in this period
                </p>
            {:else}
                <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead>
                            <tr class="border-b">
                                <th class="text-left py-2 px-2">Vendor</th>
                                <th class="text-left py-2 px-2">GSTIN</th>
                                <th class="text-center py-2 px-2">Expenses</th>
                                <th class="text-right py-2 px-2">Amount</th>
                                <th class="text-right py-2 px-2">CGST</th>
                                <th class="text-right py-2 px-2">SGST</th>
                                <th class="text-right py-2 px-2">IGST</th>
                                <th class="text-right py-2 px-2">Total Tax</th>
                                <th class="text-center py-2 px-2">ITC</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each data.data.vendorWise as vendor}
                                <tr class="border-b hover:bg-muted/50">
                                    <td class="py-2 px-2 font-medium"
                                        >{vendor.vendorName}</td
                                    >
                                    <td class="py-2 px-2 font-mono text-xs">
                                        {vendor.gstin || "-"}
                                    </td>
                                    <td class="py-2 px-2 text-center"
                                        >{vendor.expenseCount}</td
                                    >
                                    <td class="py-2 px-2 text-right font-mono"
                                        >{formatCurrency(vendor.totalAmount)}</td
                                    >
                                    <td class="py-2 px-2 text-right font-mono"
                                        >{formatCurrency(vendor.cgst)}</td
                                    >
                                    <td class="py-2 px-2 text-right font-mono"
                                        >{formatCurrency(vendor.sgst)}</td
                                    >
                                    <td class="py-2 px-2 text-right font-mono"
                                        >{formatCurrency(vendor.igst)}</td
                                    >
                                    <td
                                        class="py-2 px-2 text-right font-mono font-medium"
                                        >{formatCurrency(vendor.totalTax)}</td
                                    >
                                    <td class="py-2 px-2 text-center">
                                        {#if vendor.isRegistered}
                                            <CheckCircle2
                                                class="size-4 text-green-600 inline"
                                            />
                                        {:else}
                                            <XCircle
                                                class="size-4 text-red-500 inline"
                                            />
                                        {/if}
                                    </td>
                                </tr>
                            {/each}
                        </tbody>
                        <tfoot>
                            <tr class="border-t-2 font-semibold bg-muted/50">
                                <td class="py-2 px-2">Total</td>
                                <td class="py-2 px-2"></td>
                                <td class="py-2 px-2 text-center"
                                    >{data.data.summary.totalPurchases}</td
                                >
                                <td class="py-2 px-2 text-right font-mono"
                                    >{formatCurrency(
                                        data.data.summary.totalExpenseValue,
                                    )}</td
                                >
                                <td class="py-2 px-2 text-right font-mono"
                                    >{formatCurrency(
                                        data.data.vendorWise.reduce(
                                            (sum, v) => sum + v.cgst,
                                            0,
                                        ),
                                    )}</td
                                >
                                <td class="py-2 px-2 text-right font-mono"
                                    >{formatCurrency(
                                        data.data.vendorWise.reduce(
                                            (sum, v) => sum + v.sgst,
                                            0,
                                        ),
                                    )}</td
                                >
                                <td class="py-2 px-2 text-right font-mono"
                                    >{formatCurrency(
                                        data.data.vendorWise.reduce(
                                            (sum, v) => sum + v.igst,
                                            0,
                                        ),
                                    )}</td
                                >
                                <td class="py-2 px-2 text-right font-mono"
                                    >{formatCurrency(
                                        data.data.vendorWise.reduce(
                                            (sum, v) => sum + v.totalTax,
                                            0,
                                        ),
                                    )}</td
                                >
                                <td class="py-2 px-2"></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            {/if}
        </div>
    </Card>

    <!-- ITC Eligibility Note -->
    <Card class="p-4 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
        <div class="flex items-start gap-3">
            <div class="text-amber-600 dark:text-amber-400 mt-0.5">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="size-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                >
                    <path
                        fill-rule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clip-rule="evenodd"
                    />
                </svg>
            </div>
            <div>
                <h4 class="font-medium text-amber-800 dark:text-amber-200">
                    ITC Eligibility Note
                </h4>
                <p class="text-sm text-amber-700 dark:text-amber-300 mt-1">
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
