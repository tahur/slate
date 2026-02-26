<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { Plus, Receipt } from "lucide-svelte";
    import * as Tooltip from "$lib/components/ui/tooltip";
    import {
        Table,
        TableContainer,
        TableHeader,
        TableBody,
        TableRow,
        TableHead,
        TableCell,
    } from "$lib/components/ui/table";
    import { formatINR } from "$lib/utils/currency";
    import { formatDate } from "$lib/utils/date";

    let { data } = $props();

    function isCreditExpense(expense: any): boolean {
        return expense.payment_status === "unpaid" && (expense.balance_due || 0) > 0;
    }
</script>

<div class="page-full-bleed">
    <!-- Header / Filter Bar -->
    <div class="page-header items-center">
        <div>
            <div class="flex items-center gap-2">
                <Tooltip.Root>
                    <Tooltip.Trigger
                        class="cursor-help text-xl font-semibold tracking-tight text-text-strong"
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
            Record Expense
        </Button>
    </div>

    <!-- Content -->
    <div class="page-body">
        <div class="content-width-standard">
            <!-- Expense Table or Empty State -->
            {#if data.expenses.length === 0}
                <div
                    class="flex flex-col items-center justify-center rounded-xl border border-dashed border-border-strong bg-surface-0 py-20"
                >
                    <Receipt class="size-12 text-blue-300 mb-4" />
                    <h3 class="text-lg font-bold text-text-strong">
                        No expenses yet
                    </h3>
                    <p class="text-sm text-text-muted mb-6">
                        Add your expense entries here to track spending
                    </p>
                    <Button href="/expenses/new">
                        <Plus class="mr-2 size-4" />
                        Record Expense
                    </Button>
                </div>
            {:else}
                <div class="space-y-3 sm:hidden">
                    {#each data.expenses as expense}
                        <a
                            href="/expenses/{expense.id}"
                            class="block rounded-xl border border-border bg-surface-0 p-4 shadow-sm transition-colors active:bg-surface-2"
                        >
                            <div class="flex items-center justify-between gap-3">
                                <span
                                    class="font-mono text-sm font-semibold text-text-strong truncate"
                                >
                                    {expense.expense_number}
                                </span>
                                <span class="font-mono text-sm font-semibold text-text-strong">
                                    {formatINR(expense.total)}
                                </span>
                            </div>
                            <p class="mt-1 text-sm font-medium text-text-strong truncate">
                                {expense.category_name}
                                {#if expense.vendor_display_name || expense.vendor_actual_name || expense.vendor_name}
                                    <span class="text-text-muted">
                                        • {expense.vendor_display_name ||
                                            expense.vendor_actual_name ||
                                            expense.vendor_name}
                                    </span>
                                {/if}
                            </p>
                            <div class="mt-2 flex items-center justify-between gap-2">
                                <p class="text-xs text-text-muted">
                                    {formatDate(expense.expense_date)}
                                </p>
                                <div class="flex items-center gap-2">
                                    <span
                                        class="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium {isCreditExpense(
                                            expense,
                                        )
                                            ? 'bg-amber-50 text-amber-700'
                                            : 'bg-green-50 text-green-700'}"
                                    >
                                        {isCreditExpense(expense) ? "Credit" : "Paid"}
                                    </span>
                                    {#if isCreditExpense(expense)}
                                        <span class="font-mono text-xs text-amber-600">
                                            {formatINR(expense.balance_due)}
                                        </span>
                                    {/if}
                                </div>
                            </div>
                        </a>
                    {/each}
                </div>

                <div
                    class="hidden sm:block border border-border rounded-xl overflow-hidden shadow-sm bg-surface-0"
                >
                    <TableContainer>
                        <Table class="min-w-[64rem]">
                            <TableHeader>
                                <TableRow class="hover:bg-transparent">
                                    <TableHead class="w-32">Date</TableHead>
                                    <TableHead class="w-32">Number</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead class="w-48">Supplier</TableHead>
                                    <TableHead class="w-32">Status</TableHead>
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
                                                class="flex items-center w-full h-full text-inherit no-underline font-mono text-sm font-medium text-text-strong whitespace-nowrap"
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
                                        <TableCell>
                                            <a
                                                href="/expenses/{expense.id}"
                                                class="flex items-center w-full h-full text-inherit no-underline"
                                            >
                                                <div class="flex flex-col gap-1">
                                                    <span
                                                        class="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium {expense.payment_status === 'unpaid' && (expense.balance_due || 0) > 0
                                                            ? 'bg-amber-50 text-amber-700'
                                                            : 'bg-green-50 text-green-700'}"
                                                    >
                                                        {expense.payment_status === "unpaid" && (expense.balance_due || 0) > 0
                                                            ? "Credit"
                                                            : "Paid"}
                                                    </span>
                                                    {#if expense.payment_status === "unpaid" && (expense.balance_due || 0) > 0}
                                                        <span class="font-mono text-xs text-amber-600">
                                                            {formatINR(expense.balance_due)}
                                                        </span>
                                                    {/if}
                                                </div>
                                            </a>
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
                    </TableContainer>
                </div>
            {/if}
        </div>
    </div>
</div>
