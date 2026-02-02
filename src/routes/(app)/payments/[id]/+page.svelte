<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { Card } from "$lib/components/ui/card";
    import { ArrowLeft, Printer } from "lucide-svelte";

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

    function getModeLabel(mode: string): string {
        const labels: Record<string, string> = {
            cash: "Cash",
            bank: "Bank Transfer",
            upi: "UPI",
            cheque: "Cheque",
        };
        return labels[mode] || mode;
    }
</script>

<div class="max-w-3xl mx-auto space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
            <Button variant="ghost" href="/payments" class="p-2">
                <ArrowLeft class="size-4" />
            </Button>
            <div>
                <h1 class="text-xl font-semibold font-mono">
                    {data.payment.payment_number}
                </h1>
                <p class="text-sm text-muted-foreground">
                    {data.customer?.name || "Unknown Customer"}
                    {#if data.customer?.company_name}
                        · {data.customer.company_name}
                    {/if}
                </p>
            </div>
        </div>
        <Button variant="outline">
            <Printer class="mr-2 size-4" />
            Print Receipt
        </Button>
    </div>

    <div class="grid gap-4 md:grid-cols-3">
        <!-- Payment Details -->
        <Card class="p-6 md:col-span-2 space-y-6">
            <div class="grid gap-4 md:grid-cols-3 text-sm">
                <div>
                    <p class="text-muted-foreground">Payment Date</p>
                    <p class="font-medium">
                        {formatDate(data.payment.payment_date)}
                    </p>
                </div>
                <div>
                    <p class="text-muted-foreground">Mode</p>
                    <p class="font-medium">
                        {getModeLabel(data.payment.payment_mode)}
                    </p>
                </div>
                {#if data.payment.reference}
                    <div>
                        <p class="text-muted-foreground">Reference</p>
                        <p class="font-mono">{data.payment.reference}</p>
                    </div>
                {/if}
            </div>

            <!-- Customer Details -->
            <div class="border-t pt-4">
                <h3 class="text-sm font-medium text-muted-foreground mb-2">
                    Received From
                </h3>
                <div class="text-sm">
                    <p class="font-medium">{data.customer?.name}</p>
                    {#if data.customer?.company_name}
                        <p>{data.customer.company_name}</p>
                    {/if}
                </div>
            </div>

            <!-- Invoice Allocations -->
            {#if data.allocations.length > 0}
                <div class="border-t pt-4">
                    <h3 class="text-sm font-medium text-muted-foreground mb-3">
                        Applied to Invoices
                    </h3>
                    <div class="space-y-2">
                        {#each data.allocations as alloc}
                            <div
                                class="flex items-center justify-between p-3 rounded bg-muted/30"
                            >
                                <div>
                                    <a
                                        href="/invoices/{alloc.invoice_id}"
                                        class="font-mono text-sm text-primary hover:underline"
                                    >
                                        {alloc.invoice_number}
                                    </a>
                                    <p class="text-xs text-muted-foreground">
                                        {formatDate(alloc.invoice_date)} · Total:
                                        {formatCurrency(alloc.invoice_total)}
                                    </p>
                                </div>
                                <span class="font-mono text-green-600">
                                    {formatCurrency(alloc.amount)}
                                </span>
                            </div>
                        {/each}
                    </div>
                </div>
            {/if}

            <!-- Notes -->
            {#if data.payment.notes}
                <div class="border-t pt-4">
                    <h3 class="text-sm font-medium text-muted-foreground mb-2">
                        Notes
                    </h3>
                    <p class="text-sm">{data.payment.notes}</p>
                </div>
            {/if}
        </Card>

        <!-- Amount Card -->
        <Card class="p-6">
            <h3 class="text-sm font-medium text-muted-foreground mb-3">
                Amount Received
            </h3>
            <p class="text-3xl font-bold font-mono text-green-600">
                {formatCurrency(data.payment.amount)}
            </p>

            {#if data.allocations.length > 0}
                {@const totalAllocated = data.allocations.reduce(
                    (s, a) => s + a.amount,
                    0,
                )}
                {@const excess = data.payment.amount - totalAllocated}
                <div class="mt-4 pt-4 border-t text-sm space-y-2">
                    <div class="flex justify-between">
                        <span class="text-muted-foreground"
                            >Total Allocated</span
                        >
                        <span class="font-mono">
                            {formatCurrency(totalAllocated)}
                        </span>
                    </div>
                    {#if excess > 0.01}
                        <div class="flex justify-between text-amber-600">
                            <span>Advance</span>
                            <span class="font-mono"
                                >{formatCurrency(excess)}</span
                            >
                        </div>
                    {/if}
                </div>
            {/if}
        </Card>
    </div>
</div>
