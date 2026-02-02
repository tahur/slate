<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { Card } from "$lib/components/ui/card";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import { ArrowLeft, RefreshCw } from "lucide-svelte";
    import { goto } from "$app/navigation";

    let { data } = $props();

    let startDate = $state(data.startDate);
    let endDate = $state(data.endDate);

    function applyFilter() {
        goto(`/reports/gst?from=${startDate}&to=${endDate}`);
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
</script>

<div class="space-y-4">
    <div class="flex items-center gap-4">
        <Button variant="ghost" href="/reports" class="p-2">
            <ArrowLeft class="size-4" />
        </Button>
        <div>
            <h1 class="text-xl font-semibold">GST Summary</h1>
            <p class="text-sm text-muted-foreground">
                GST collected and input credits for the period
            </p>
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
            Showing: {formatDate(data.startDate)} to {formatDate(data.endDate)}
        </p>
    </Card>

    <div class="grid gap-4 md:grid-cols-2">
        <!-- Output GST (Collected) -->
        <Card class="p-6">
            <h3 class="font-medium text-lg mb-4 flex items-center gap-2">
                <span class="w-3 h-3 rounded-full bg-red-500"></span>
                Output GST (Collected)
            </h3>
            <p class="text-xs text-muted-foreground mb-4">
                From {data.output.invoiceCount} invoice(s) · Taxable Value: {formatCurrency(
                    data.output.taxableValue,
                )}
            </p>

            <div class="space-y-3 text-sm">
                <div class="flex justify-between">
                    <span class="text-muted-foreground">CGST Collected</span>
                    <span class="font-mono"
                        >{formatCurrency(data.output.cgst)}</span
                    >
                </div>
                <div class="flex justify-between">
                    <span class="text-muted-foreground">SGST Collected</span>
                    <span class="font-mono"
                        >{formatCurrency(data.output.sgst)}</span
                    >
                </div>
                <div class="flex justify-between">
                    <span class="text-muted-foreground">IGST Collected</span>
                    <span class="font-mono"
                        >{formatCurrency(data.output.igst)}</span
                    >
                </div>
                <div class="border-t pt-3 flex justify-between font-semibold">
                    <span>Total Output GST</span>
                    <span class="font-mono text-red-600"
                        >{formatCurrency(data.output.total)}</span
                    >
                </div>
            </div>
        </Card>

        <!-- Input GST (Credit) -->
        <Card class="p-6">
            <h3 class="font-medium text-lg mb-4 flex items-center gap-2">
                <span class="w-3 h-3 rounded-full bg-green-500"></span>
                Input GST (Credit)
            </h3>
            <p class="text-xs text-muted-foreground mb-4">
                From {data.input.expenseCount} expense(s) · Expense Value: {formatCurrency(
                    data.input.expenseValue,
                )}
            </p>

            <div class="space-y-3 text-sm">
                <div class="flex justify-between">
                    <span class="text-muted-foreground">CGST Credit</span>
                    <span class="font-mono"
                        >{formatCurrency(data.input.cgst)}</span
                    >
                </div>
                <div class="flex justify-between">
                    <span class="text-muted-foreground">SGST Credit</span>
                    <span class="font-mono"
                        >{formatCurrency(data.input.sgst)}</span
                    >
                </div>
                <div class="flex justify-between">
                    <span class="text-muted-foreground">IGST Credit</span>
                    <span class="font-mono"
                        >{formatCurrency(data.input.igst)}</span
                    >
                </div>
                <div class="border-t pt-3 flex justify-between font-semibold">
                    <span>Total Input GST</span>
                    <span class="font-mono text-green-600"
                        >{formatCurrency(data.input.total)}</span
                    >
                </div>
            </div>
        </Card>
    </div>

    <!-- Net Liability -->
    <Card class="p-6">
        <div class="flex items-center justify-between">
            <div>
                <h3 class="font-medium text-lg">Net GST Liability</h3>
                <p class="text-sm text-muted-foreground">
                    Output GST - Input GST Credit
                </p>
            </div>
            <div class="text-right">
                <p
                    class="text-3xl font-bold font-mono {data.netLiability >= 0
                        ? 'text-red-600'
                        : 'text-green-600'}"
                >
                    {formatCurrency(data.netLiability)}
                </p>
                <p class="text-xs text-muted-foreground">
                    {data.netLiability >= 0
                        ? "Payable to Government"
                        : "Credit Available"}
                </p>
            </div>
        </div>
    </Card>
</div>
