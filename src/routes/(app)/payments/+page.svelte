<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { Card } from "$lib/components/ui/card";
    import { Plus } from "lucide-svelte";

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

<div class="space-y-4">
    <div class="flex items-center justify-between">
        <div>
            <h1 class="text-xl font-semibold">Payments</h1>
            <p class="text-sm text-muted-foreground">
                Record and track customer payments
            </p>
        </div>
        <Button href="/payments/new">
            <Plus class="mr-2 size-4" />
            Record Payment
        </Button>
    </div>

    <Card class="overflow-hidden">
        {#if data.payments.length === 0}
            <div class="p-12 text-center">
                <p class="text-muted-foreground mb-4">
                    No payments recorded yet
                </p>
                <Button href="/payments/new" variant="outline">
                    <Plus class="mr-2 size-4" />
                    Record First Payment
                </Button>
            </div>
        {:else}
            <div class="overflow-x-auto">
                <table class="w-full text-sm">
                    <thead>
                        <tr class="border-b bg-muted/50">
                            <th
                                class="px-4 py-3 text-left font-medium text-muted-foreground"
                                >Date</th
                            >
                            <th
                                class="px-4 py-3 text-left font-medium text-muted-foreground"
                                >Number</th
                            >
                            <th
                                class="px-4 py-3 text-left font-medium text-muted-foreground"
                                >Customer</th
                            >
                            <th
                                class="px-4 py-3 text-left font-medium text-muted-foreground"
                                >Mode</th
                            >
                            <th
                                class="px-4 py-3 text-left font-medium text-muted-foreground"
                                >Reference</th
                            >
                            <th
                                class="px-4 py-3 text-right font-medium text-muted-foreground"
                                >Amount</th
                            >
                        </tr>
                    </thead>
                    <tbody>
                        {#each data.payments as payment}
                            <tr
                                class="border-b hover:bg-muted/30 transition-colors"
                            >
                                <td class="px-4 py-3"
                                    >{formatDate(payment.payment_date)}</td
                                >
                                <td class="px-4 py-3">
                                    <a
                                        href="/payments/{payment.id}"
                                        class="font-mono text-primary hover:underline"
                                    >
                                        {payment.payment_number}
                                    </a>
                                </td>
                                <td class="px-4 py-3">
                                    <div>
                                        <span class="font-medium"
                                            >{payment.customer_name}</span
                                        >
                                        {#if payment.customer_company}
                                            <span
                                                class="text-muted-foreground ml-1"
                                            >
                                                · {payment.customer_company}
                                            </span>
                                        {/if}
                                    </div>
                                </td>
                                <td class="px-4 py-3">
                                    <span
                                        class="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700"
                                    >
                                        {getModeLabel(payment.payment_mode)}
                                    </span>
                                </td>
                                <td
                                    class="px-4 py-3 font-mono text-muted-foreground"
                                >
                                    {payment.reference || "—"}
                                </td>
                                <td
                                    class="px-4 py-3 text-right font-mono text-green-600 font-medium"
                                >
                                    {formatCurrency(payment.amount)}
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        {/if}
    </Card>
</div>
