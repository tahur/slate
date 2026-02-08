<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { Plus, FileText } from "lucide-svelte";
    import Badge from "$lib/components/ui/badge/badge.svelte";
    import { formatINR } from "$lib/utils/currency";
    import { formatDate } from "$lib/utils/date";

    let { data } = $props();

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

<div class="page-full-bleed">
    <!-- Header / Filter Bar -->
    <div
        class="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-0"
    >
        <div>
            <h1 class="text-xl font-bold tracking-tight text-text-strong">
                Payments Received
            </h1>
            <p class="text-sm text-text-muted">
                Record and manage payments you receive from customers
            </p>
        </div>
        <Button href="/payments/new">
            <Plus class="mr-2 size-4" />
            Record Payment
        </Button>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-auto bg-surface-1 p-6">
        <!-- Payment Table or Empty State -->
        {#if data.payments.length === 0}
            <div
                class="flex flex-col items-center justify-center py-20 border border-dashed border-border-strong rounded-lg bg-surface-0"
            >
                <FileText class="size-12 text-text-muted/30 mb-4" />
                <h3 class="text-lg font-bold text-text-strong">
                    No payments yet
                </h3>
                <p class="text-sm text-text-muted mb-6">
                    Record your first customer payment to get started
                </p>
                <Button href="/payments/new">
                    <Plus class="mr-2 size-4" />
                    Record Payment
                </Button>
            </div>
        {:else}
            <div
                class="border border-border rounded-lg overflow-hidden shadow-sm bg-surface-0"
            >
                <table class="data-table w-full">
                    <thead>
                        <tr>
                            <th class="w-28">Date</th>
                            <th>Payment #</th>
                            <th>Customer Name</th>
                            <th class="w-32">Mode</th>
                            <th class="text-right w-32">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each data.payments as payment}
                            <tr class="group cursor-pointer">
                                <td class="data-cell--muted font-medium">
                                    <a
                                        href="/payments/{payment.id}"
                                        class="data-row-link"
                                    >
                                        {formatDate(payment.payment_date)}
                                    </a>
                                </td>
                                <td>
                                    <a
                                        href="/payments/{payment.id}"
                                        class="data-row-link font-mono text-sm font-medium text-primary whitespace-nowrap"
                                    >
                                        {payment.payment_number}
                                    </a>
                                </td>
                                <td>
                                    <a
                                        href="/payments/{payment.id}"
                                        class="data-row-link"
                                    >
                                        <div class="flex flex-col">
                                            <span
                                                class="font-medium text-text-strong text-sm"
                                            >
                                                {payment.customer_name ||
                                                    payment.customer_company ||
                                                    "—"}
                                            </span>
                                            {#if payment.reference}
                                                <span
                                                    class="text-[10px] text-text-muted truncate max-w-[12rem]"
                                                >
                                                    Ref: {payment.reference}
                                                </span>
                                            {/if}
                                        </div>
                                    </a>
                                </td>
                                <td>
                                    <a
                                        href="/payments/{payment.id}"
                                        class="data-row-link"
                                    >
                                        <Badge
                                            variant="outline"
                                            class="capitalize bg-surface-1"
                                        >
                                            {getModeLabel(payment.payment_mode)}
                                        </Badge>
                                    </a>
                                </td>
                                <td class="data-cell--number text-text-strong">
                                    <a
                                        href="/payments/{payment.id}"
                                        class="data-row-link justify-end"
                                    >
                                        {formatINR(payment.amount)}
                                    </a>
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        {/if}
    </div>
</div>
