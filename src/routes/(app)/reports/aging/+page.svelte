<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { Card } from "$lib/components/ui/card";
    import { ArrowLeft } from "lucide-svelte";

    let { data } = $props();

    function formatCurrency(amount: number): string {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 0,
        }).format(amount);
    }

    function getCellClass(amount: number, isOverdue: boolean = false): string {
        if (amount === 0) return "text-muted-foreground";
        if (isOverdue) return "text-red-600 font-medium";
        return "";
    }
</script>

<div class="space-y-4">
    <div class="flex items-center gap-4">
        <Button variant="ghost" href="/reports" class="p-2">
            <ArrowLeft class="size-4" />
        </Button>
        <div>
            <h1 class="text-xl font-semibold">Accounts Receivable Aging</h1>
            <p class="text-sm text-muted-foreground">
                Outstanding invoices by age bucket
            </p>
        </div>
    </div>

    <Card class="overflow-hidden">
        {#if data.customerAging.length === 0}
            <div class="p-12 text-center">
                <p class="text-muted-foreground">No outstanding invoices</p>
            </div>
        {:else}
            <div class="overflow-x-auto">
                <table class="w-full text-sm">
                    <thead>
                        <tr class="border-b bg-muted/50">
                            <th
                                class="px-4 py-3 text-left font-medium text-muted-foreground"
                                >Customer</th
                            >
                            <th
                                class="px-4 py-3 text-right font-medium text-muted-foreground"
                                >Current</th
                            >
                            <th
                                class="px-4 py-3 text-right font-medium text-muted-foreground"
                                >1-30 days</th
                            >
                            <th
                                class="px-4 py-3 text-right font-medium text-muted-foreground"
                                >31-60 days</th
                            >
                            <th
                                class="px-4 py-3 text-right font-medium text-muted-foreground"
                                >61-90 days</th
                            >
                            <th
                                class="px-4 py-3 text-right font-medium text-muted-foreground"
                                >90+ days</th
                            >
                            <th
                                class="px-4 py-3 text-right font-medium text-muted-foreground"
                                >Total</th
                            >
                        </tr>
                    </thead>
                    <tbody>
                        {#each data.customerAging as customer}
                            <tr class="border-b hover:bg-muted/30">
                                <td class="px-4 py-3">
                                    <a
                                        href="/customers/{customer.id}"
                                        class="text-primary hover:underline font-medium"
                                    >
                                        {customer.name}
                                    </a>
                                    {#if customer.company_name}
                                        <span
                                            class="text-muted-foreground text-xs ml-1"
                                        >
                                            ({customer.company_name})
                                        </span>
                                    {/if}
                                </td>
                                <td
                                    class="px-4 py-3 text-right font-mono {getCellClass(
                                        customer.aging.current,
                                    )}"
                                >
                                    {customer.aging.current > 0
                                        ? formatCurrency(customer.aging.current)
                                        : "—"}
                                </td>
                                <td
                                    class="px-4 py-3 text-right font-mono {getCellClass(
                                        customer.aging.days1_30,
                                        true,
                                    )}"
                                >
                                    {customer.aging.days1_30 > 0
                                        ? formatCurrency(
                                              customer.aging.days1_30,
                                          )
                                        : "—"}
                                </td>
                                <td
                                    class="px-4 py-3 text-right font-mono {getCellClass(
                                        customer.aging.days31_60,
                                        true,
                                    )}"
                                >
                                    {customer.aging.days31_60 > 0
                                        ? formatCurrency(
                                              customer.aging.days31_60,
                                          )
                                        : "—"}
                                </td>
                                <td
                                    class="px-4 py-3 text-right font-mono {getCellClass(
                                        customer.aging.days61_90,
                                        true,
                                    )}"
                                >
                                    {customer.aging.days61_90 > 0
                                        ? formatCurrency(
                                              customer.aging.days61_90,
                                          )
                                        : "—"}
                                </td>
                                <td
                                    class="px-4 py-3 text-right font-mono {getCellClass(
                                        customer.aging.days90plus,
                                        true,
                                    )}"
                                >
                                    {customer.aging.days90plus > 0
                                        ? formatCurrency(
                                              customer.aging.days90plus,
                                          )
                                        : "—"}
                                </td>
                                <td
                                    class="px-4 py-3 text-right font-mono font-semibold"
                                >
                                    {formatCurrency(customer.aging.total)}
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                    <tfoot>
                        <tr class="bg-muted/50 font-semibold">
                            <td class="px-4 py-3">Total</td>
                            <td class="px-4 py-3 text-right font-mono"
                                >{formatCurrency(data.totals.current)}</td
                            >
                            <td
                                class="px-4 py-3 text-right font-mono text-red-600"
                                >{formatCurrency(data.totals.days1_30)}</td
                            >
                            <td
                                class="px-4 py-3 text-right font-mono text-red-600"
                                >{formatCurrency(data.totals.days31_60)}</td
                            >
                            <td
                                class="px-4 py-3 text-right font-mono text-red-600"
                                >{formatCurrency(data.totals.days61_90)}</td
                            >
                            <td
                                class="px-4 py-3 text-right font-mono text-red-600"
                                >{formatCurrency(data.totals.days90plus)}</td
                            >
                            <td class="px-4 py-3 text-right font-mono"
                                >{formatCurrency(data.totals.total)}</td
                            >
                        </tr>
                    </tfoot>
                </table>
            </div>
        {/if}
    </Card>
</div>
