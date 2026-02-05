<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { Plus, FileText } from "lucide-svelte";

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

<div class="flex flex-col h-full">
    <!-- Header / Filter Bar -->
    <div
        class="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-0"
    >
        <div class="flex items-center gap-4">
            <h1 class="text-xl font-bold tracking-tight text-text-strong">
                Payments Received
            </h1>
            <div class="h-6 w-px bg-border-subtle"></div>
            <!-- Placeholder for filters -->
            <button
                class="text-xs font-semibold uppercase tracking-wider text-primary hover:underline"
            >
                Filter
            </button>
        </div>
        <Button
            href="/payments/new"
            class="bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
        >
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
                <Button
                    href="/payments/new"
                    class="bg-primary text-primary-foreground"
                >
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
                            <th class="w-32">Date</th>
                            <th class="w-40">Payment #</th>
                            <th>Customer Name</th>
                            <th class="w-32">Mode</th>
                            <th class="text-right w-32">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each data.payments as payment}
                            <tr
                                class="group hover:bg-surface-2 transition-colors cursor-pointer"
                                onclick={() =>
                                    (window.location.href = `/payments/${payment.id}`)}
                            >
                                <td class="font-mono text-xs text-text-strong">
                                    {formatDate(payment.payment_date)}
                                </td>
                                <td>
                                    <span
                                        class="font-mono text-xs font-medium text-primary hover:underline"
                                    >
                                        {payment.payment_number}
                                    </span>
                                </td>
                                <td>
                                    <div class="flex flex-col">
                                        <span
                                            class="font-medium text-text-strong text-sm"
                                        >
                                            {payment.customer_name || payment.customer_company || "—"}
                                        </span>
                                        {#if payment.reference}
                                            <span
                                                class="text-[10px] text-text-muted truncate max-w-[12rem]"
                                            >
                                                Ref: {payment.reference}
                                            </span>
                                        {/if}
                                    </div>
                                </td>
                                <td>
                                    <span
                                        class="capitalize text-xs text-text-subtle font-medium border border-border-subtle px-2 py-0.5 rounded-full bg-surface-1"
                                    >
                                        {getModeLabel(payment.payment_mode)}
                                    </span>
                                </td>
                                <td
                                    class="text-right font-mono font-medium text-text-strong"
                                >
                                    {formatCurrency(payment.amount)}
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        {/if}
    </div>
</div>
