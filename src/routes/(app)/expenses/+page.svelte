<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { Plus, Receipt } from "lucide-svelte";
    import * as Tooltip from "$lib/components/ui/tooltip";
    import { formatINR } from "$lib/utils/currency";
    import { formatDate } from "$lib/utils/date";

    let { data } = $props();
</script>

<div class="page-full-bleed">
    <!-- Header / Filter Bar -->
    <div
        class="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-0"
    >
        <div>
            <div class="flex items-center gap-2">
                <Tooltip.Root>
                    <Tooltip.Trigger
                        class="text-xl font-bold tracking-tight text-text-strong underline decoration-dotted decoration-text-muted/50 cursor-help underline-offset-4"
                    >
                        Expenses
                    </Tooltip.Trigger>
                    <Tooltip.Content>
                        <p class="max-w-[250px] text-xs">
                            Expenses are costs you incur to run your business,
                            like rent, utilities, or office supplies.
                        </p>
                    </Tooltip.Content>
                </Tooltip.Root>
            </div>
            <p class="text-sm text-text-muted">
                Track money you spend on business costs
            </p>
        </div>
        <Button href="/expenses/new">
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
                <Button href="/expenses/new">
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
                            <tr class="group cursor-pointer">
                                <td class="data-cell--muted font-medium">
                                    <a
                                        href="/expenses/{expense.id}"
                                        class="data-row-link"
                                    >
                                        {formatDate(expense.expense_date)}
                                    </a>
                                </td>
                                <td>
                                    <a
                                        href="/expenses/{expense.id}"
                                        class="data-row-link font-mono text-sm font-medium text-primary whitespace-nowrap"
                                    >
                                        {expense.expense_number}
                                    </a>
                                </td>
                                <td>
                                    <a
                                        href="/expenses/{expense.id}"
                                        class="data-row-link"
                                    >
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
                                    </a>
                                </td>
                                <td class="text-sm text-text-strong">
                                    {#if expense.vendor_id}
                                        <a
                                            href="/vendors/{expense.vendor_id}"
                                            class="text-primary hover:underline relative z-10"
                                        >
                                            {expense.vendor_display_name ||
                                                expense.vendor_actual_name ||
                                                expense.vendor_name}
                                        </a>
                                    {:else}
                                        <a
                                            href="/expenses/{expense.id}"
                                            class="data-row-link"
                                        >
                                            {expense.vendor_name || "—"}
                                        </a>
                                    {/if}
                                </td>
                                <td class="data-cell--number text-text-subtle">
                                    <a
                                        href="/expenses/{expense.id}"
                                        class="data-row-link justify-end"
                                    >
                                        {formatINR(expense.amount)}
                                    </a>
                                </td>
                                <td class="data-cell--number text-text-subtle">
                                    <a
                                        href="/expenses/{expense.id}"
                                        class="data-row-link justify-end"
                                    >
                                        {formatINR(
                                            (expense.cgst || 0) +
                                                (expense.sgst || 0) +
                                                (expense.igst || 0),
                                        )}
                                    </a>
                                </td>
                                <td
                                    class="data-cell--number font-medium text-text-strong"
                                >
                                    <a
                                        href="/expenses/{expense.id}"
                                        class="data-row-link justify-end"
                                    >
                                        {formatINR(expense.total)}
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
