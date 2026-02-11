<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { Plus, Receipt } from "lucide-svelte";
    import * as Tooltip from "$lib/components/ui/tooltip";
    import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "$lib/components/ui/table";
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
                <Table>
                    <TableHeader>
                        <TableRow class="hover:bg-transparent">
                            <TableHead class="w-32">Date</TableHead>
                            <TableHead class="w-32">Number</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead class="w-48">Vendor</TableHead>
                            <TableHead class="text-right w-32">Amount (Ex)</TableHead>
                            <TableHead class="text-right w-32">Input Tax</TableHead>
                            <TableHead class="text-right w-32">Total</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {#each data.expenses as expense}
                            <TableRow class="group cursor-pointer">
                                <TableCell class="text-text-muted font-medium">
                                    <a
                                        href="/expenses/{expense.id}"
                                        class="flex items-center w-full h-full text-inherit no-underline"
                                    >
                                        {formatDate(expense.expense_date)}
                                    </a>
                                </TableCell>
                                <TableCell>
                                    <a
                                        href="/expenses/{expense.id}"
                                        class="flex items-center w-full h-full text-inherit no-underline font-mono text-sm font-medium text-primary whitespace-nowrap"
                                    >
                                        {expense.expense_number}
                                    </a>
                                </TableCell>
                                <TableCell>
                                    <a
                                        href="/expenses/{expense.id}"
                                        class="flex items-center w-full h-full text-inherit no-underline"
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
                                </TableCell>
                                <TableCell class="text-sm text-text-strong">
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
                                            class="flex items-center w-full h-full text-inherit no-underline"
                                        >
                                            {expense.vendor_name || "—"}
                                        </a>
                                    {/if}
                                </TableCell>
                                <TableCell class="text-right font-mono tabular-nums text-[0.8125rem] text-text-subtle">
                                    <a
                                        href="/expenses/{expense.id}"
                                        class="flex items-center justify-end w-full h-full text-inherit no-underline"
                                    >
                                        {formatINR(expense.amount)}
                                    </a>
                                </TableCell>
                                <TableCell class="text-right font-mono tabular-nums text-[0.8125rem] text-text-subtle">
                                    <a
                                        href="/expenses/{expense.id}"
                                        class="flex items-center justify-end w-full h-full text-inherit no-underline"
                                    >
                                        {formatINR(
                                            (expense.cgst || 0) +
                                                (expense.sgst || 0) +
                                                (expense.igst || 0),
                                        )}
                                    </a>
                                </TableCell>
                                <TableCell
                                    class="text-right font-mono tabular-nums text-[0.8125rem] font-medium text-text-strong"
                                >
                                    <a
                                        href="/expenses/{expense.id}"
                                        class="flex items-center justify-end w-full h-full text-inherit no-underline"
                                    >
                                        {formatINR(expense.total)}
                                    </a>
                                </TableCell>
                            </TableRow>
                        {/each}
                    </TableBody>
                </Table>
            </div>
        {/if}
    </div>
</div>
