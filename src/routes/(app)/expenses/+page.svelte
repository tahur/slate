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
</script>

<div class="space-y-4">
    <div class="flex items-center justify-between">
        <div>
            <h1 class="text-xl font-semibold">Expenses</h1>
            <p class="text-sm text-muted-foreground">
                Track business expenses and deductions
            </p>
        </div>
        <Button href="/expenses/new">
            <Plus class="mr-2 size-4" />
            Add Expense
        </Button>
    </div>

    <Card class="overflow-hidden">
        {#if data.expenses.length === 0}
            <div class="p-12 text-center">
                <p class="text-muted-foreground mb-4">
                    No expenses recorded yet
                </p>
                <Button href="/expenses/new" variant="outline">
                    <Plus class="mr-2 size-4" />
                    Add First Expense
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
                                >Category</th
                            >
                            <th
                                class="px-4 py-3 text-left font-medium text-muted-foreground"
                                >Vendor</th
                            >
                            <th
                                class="px-4 py-3 text-left font-medium text-muted-foreground"
                                >Description</th
                            >
                            <th
                                class="px-4 py-3 text-right font-medium text-muted-foreground"
                                >Amount</th
                            >
                        </tr>
                    </thead>
                    <tbody>
                        {#each data.expenses as expense}
                            <tr
                                class="border-b hover:bg-muted/30 transition-colors"
                            >
                                <td class="px-4 py-3"
                                    >{formatDate(expense.expense_date)}</td
                                >
                                <td class="px-4 py-3">
                                    <a
                                        href="/expenses/{expense.id}"
                                        class="font-mono text-primary hover:underline"
                                    >
                                        {expense.expense_number}
                                    </a>
                                </td>
                                <td class="px-4 py-3">
                                    <span
                                        class="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-700"
                                    >
                                        {expense.category_name ||
                                            "Uncategorized"}
                                    </span>
                                </td>
                                <td class="px-4 py-3"
                                    >{expense.vendor || "—"}</td
                                >
                                <td
                                    class="px-4 py-3 max-w-[200px] truncate text-muted-foreground"
                                >
                                    {expense.description || "—"}
                                </td>
                                <td
                                    class="px-4 py-3 text-right font-mono text-red-600 font-medium"
                                >
                                    {formatCurrency(expense.total)}
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        {/if}
    </Card>
</div>
