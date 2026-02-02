<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { Card } from "$lib/components/ui/card";
    import { ArrowLeft, Receipt } from "lucide-svelte";

    let { data } = $props();

    function formatCurrency(amount: number | null): string {
        if (amount === null || amount === undefined) return "₹0.00";
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 2,
        }).format(amount);
    }

    function formatDate(dateStr: string | null): string {
        if (!dateStr) return "—";
        return new Date(dateStr).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    }
</script>

<div class="max-w-2xl mx-auto space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
            <Button variant="ghost" href="/expenses" class="p-2">
                <ArrowLeft class="size-4" />
            </Button>
            <div>
                <h1 class="text-xl font-semibold font-mono">
                    {data.expense.expense_number}
                </h1>
                <p class="text-sm text-muted-foreground">
                    {data.expense.category_name}
                </p>
            </div>
        </div>
    </div>

    <div class="grid gap-4 md:grid-cols-3">
        <!-- Details -->
        <Card class="p-6 md:col-span-2 space-y-6">
            <div class="grid gap-4 md:grid-cols-3 text-sm">
                <div>
                    <p class="text-muted-foreground">Date</p>
                    <p class="font-medium">
                        {formatDate(data.expense.expense_date)}
                    </p>
                </div>
                <div>
                    <p class="text-muted-foreground">Category</p>
                    <p class="font-medium">{data.expense.category_name}</p>
                </div>
                <div>
                    <p class="text-muted-foreground">Paid Through</p>
                    <p class="font-medium">{data.paymentAccountName}</p>
                </div>
            </div>

            {#if data.expense.vendor}
                <div class="border-t pt-4">
                    <p class="text-sm text-muted-foreground mb-1">Vendor</p>
                    <p class="font-medium">{data.expense.vendor}</p>
                </div>
            {/if}

            {#if data.expense.description}
                <div class="border-t pt-4">
                    <p class="text-sm text-muted-foreground mb-1">
                        Description
                    </p>
                    <p>{data.expense.description}</p>
                </div>
            {/if}

            {#if data.expense.reference}
                <div class="border-t pt-4">
                    <p class="text-sm text-muted-foreground mb-1">Reference</p>
                    <p class="font-mono">{data.expense.reference}</p>
                </div>
            {/if}
        </Card>

        <!-- Amount Card -->
        <Card class="p-6">
            <h3 class="text-sm font-medium text-muted-foreground mb-3">
                Amount
            </h3>
            <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                    <span class="text-muted-foreground">Base Amount</span>
                    <span class="font-mono"
                        >{formatCurrency(data.expense.amount)}</span
                    >
                </div>

                {#if data.expense.gst_rate && data.expense.gst_rate > 0}
                    {#if data.expense.igst && data.expense.igst > 0}
                        <div class="flex justify-between">
                            <span class="text-muted-foreground"
                                >IGST ({data.expense.gst_rate}%)</span
                            >
                            <span class="font-mono"
                                >{formatCurrency(data.expense.igst)}</span
                            >
                        </div>
                    {:else}
                        <div class="flex justify-between">
                            <span class="text-muted-foreground"
                                >CGST ({(data.expense.gst_rate || 0) /
                                    2}%)</span
                            >
                            <span class="font-mono"
                                >{formatCurrency(data.expense.cgst)}</span
                            >
                        </div>
                        <div class="flex justify-between">
                            <span class="text-muted-foreground"
                                >SGST ({(data.expense.gst_rate || 0) /
                                    2}%)</span
                            >
                            <span class="font-mono"
                                >{formatCurrency(data.expense.sgst)}</span
                            >
                        </div>
                    {/if}
                {/if}

                <div
                    class="border-t pt-3 flex justify-between font-semibold text-lg"
                >
                    <span>Total</span>
                    <span class="font-mono text-red-600"
                        >{formatCurrency(data.expense.total)}</span
                    >
                </div>
            </div>
        </Card>
    </div>
</div>
