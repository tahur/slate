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

    function getStatusClass(status: string | null): string {
        switch (status) {
            case "issued":
                return "status-pill--info";
            case "applied":
                return "status-pill--positive";
            case "cancelled":
                return "status-pill--negative";
            default:
                return "status-pill--warning";
        }
    }
</script>

<div class="flex flex-col h-full">
    <!-- Header / Filter Bar -->
    <div
        class="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-0"
    >
        <div class="flex items-center gap-4">
            <h1 class="text-xl font-bold tracking-tight text-text-strong">
                Credit Notes
            </h1>
        </div>
        <Button
            href="/credit-notes/new"
            class="bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
        >
            <Plus class="mr-2 size-4" />
            New
        </Button>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-auto bg-surface-1 p-6">
        {#if data.creditNotes.length === 0}
            <div
                class="flex flex-col items-center justify-center py-20 border border-dashed border-border-strong rounded-lg bg-surface-0"
            >
                <FileText class="size-12 text-text-muted/30 mb-4" />
                <h3 class="text-lg font-bold text-text-strong">
                    No credit notes yet
                </h3>
                <p class="text-sm text-text-muted mb-6">
                    Create your first credit note to get started
                </p>
                <Button
                    href="/credit-notes/new"
                    class="bg-primary text-primary-foreground"
                >
                    <Plus class="mr-2 size-4" />
                    Create Credit Note
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
                            <th class="w-40">CN #</th>
                            <th>Customer</th>
                            <th>Reason</th>
                            <th class="text-right w-28">Status</th>
                            <th class="text-right w-32">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each data.creditNotes as cn}
                            <tr
                                class="group hover:bg-surface-2 transition-colors cursor-pointer"
                                onclick={() =>
                                    (window.location.href = `/credit-notes/${cn.id}`)}
                            >
                                <td class="data-cell--muted font-medium">
                                    {formatDate(cn.credit_note_date)}
                                </td>
                                <td>
                                    <span
                                        class="font-mono text-sm font-medium text-primary"
                                    >
                                        {cn.credit_note_number}
                                    </span>
                                </td>
                                <td>
                                    <span
                                        class="text-sm font-semibold text-text-strong"
                                        >{cn.customer_name || "—"}</span
                                    >
                                </td>
                                <td>
                                    <span class="text-sm text-text-subtle capitalize"
                                        >{cn.reason}</span
                                    >
                                </td>
                                <td class="text-right">
                                    <span
                                        class="status-pill {getStatusClass(cn.status)}"
                                    >
                                        {cn.status}
                                    </span>
                                </td>
                                <td class="data-cell--number text-text-strong">
                                    {formatCurrency(cn.total)}
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        {/if}
    </div>
</div>
