<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { Plus, Receipt } from "lucide-svelte";

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

<div class="flex flex-col h-full">
    <!-- Header / Filter Bar -->
    <div
        class="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-0"
    >
        <div class="flex items-center gap-4">
            <h1 class="text-xl font-bold tracking-tight text-text-strong">
                Expenses
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
            href="/expenses/new"
            class="bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
        >
            <Plus class="mr-2 size-4" />
            Add Expense
        </Button>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-auto bg-surface-1 p-6">
        <!-- Expense Table or Empty State -->
        {#if data.expenses.length === 0}
            <div
                class="flex flex-col items-center justify-center py-20 border border-dashed border-border-strong rounded-lg bg-surface-0"
            >
                <Receipt class="size-12 text-text-muted/30 mb-4" />
                <h3 class="text-lg font-bold text-text-strong">
                    No expenses yet
                </h3>
                <p class="text-sm text-text-muted mb-6">
                    Record your business expenses here to track spending
                </p>
                <Button
                    href="/expenses/new"
                    class="bg-primary text-primary-foreground"
                >
                    <Plus class="mr-2 size-4" />
                    Add Expense
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
                            <th class="w-32">Number</th>
                            <th>Category</th>
                            <th class="w-48">Vendor</th>
                            <th class="text-right w-32">Amount (Ex)</th>
                            <th class="text-right w-32">Input Tax</th>
                            <th class="text-right w-32">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each data.expenses as expense}
                            <tr
                                class="group hover:bg-surface-2 transition-colors cursor-pointer"
                                onclick={() =>
                                    (window.location.href = `/expenses/${expense.id}`)}
                            >
                                <td class="font-mono text-xs text-text-strong">
                                    {formatDate(expense.expense_date)}
                                </td>
                                <td>
                                    <span
                                        class="font-mono text-xs font-medium text-primary hover:underline"
                                    >
                                        {expense.expense_number}
                                    </span>
                                </td>
                                <td>
                                    <div class="flex flex-col">
                                        <span
                                            class="font-medium text-text-strong text-sm"
                                        >
                                            {expense.category_name}
                                        </span>
                                        {#if expense.description}
                                            <span
                                                class="text-[10px] text-text-muted truncate max-w-[12rem]"
                                            >
                                                {expense.description}
                                            </span>
                                        {/if}
                                    </div>
                                </td>
                                <td class="text-sm text-text-strong">
                                    {#if expense.vendor_id}
                                        <a href="/vendors/{expense.vendor_id}" class="text-primary hover:underline">
                                            {expense.vendor_display_name || expense.vendor_actual_name || expense.vendor_name}
                                        </a>
                                    {:else}
                                        {expense.vendor_name || "—"}
                                    {/if}
                                </td>
                                <td
                                    class="text-right font-mono text-text-subtle"
                                >
                                    {formatCurrency(expense.amount)}
                                </td>
                                <td
                                    class="text-right font-mono text-text-subtle"
                                >
                                    {formatCurrency(
                                        (expense.cgst || 0) +
                                            (expense.sgst || 0) +
                                            (expense.igst || 0),
                                    )}
                                </td>
                                <td
                                    class="text-right font-mono font-medium text-text-strong"
                                >
                                    {formatCurrency(expense.total)}
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        {/if}
    </div>
</div>
