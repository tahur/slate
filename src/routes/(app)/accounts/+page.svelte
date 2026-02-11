<script lang="ts">
    import { BookOpen } from "lucide-svelte";
    import { Badge } from "$lib/components/ui/badge";
    import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "$lib/components/ui/table";
    import { formatINR } from "$lib/utils/currency";

    let { data } = $props();

    const typeOrder = ["asset", "liability", "equity", "income", "expense"] as const;

    const typeLabels: Record<string, string> = {
        asset: "Assets",
        liability: "Liabilities",
        equity: "Equity",
        income: "Income",
        expense: "Expenses",
    };

    const grouped = $derived(
        typeOrder
            .map((type) => ({
                type,
                label: typeLabels[type],
                accounts: data.accounts.filter(
                    (a: { account_type: string }) => a.account_type === type,
                ),
            }))
            .filter((g) => g.accounts.length > 0),
    );
</script>

<div class="page-full-bleed">
    <!-- Header -->
    <div
        class="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-0"
    >
        <div class="flex items-center gap-4">
            <h1 class="text-xl font-bold tracking-tight text-text-strong">
                Chart of Accounts
            </h1>
        </div>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-auto bg-surface-1 p-6">
        {#if data.accounts.length === 0}
            <div
                class="flex flex-col items-center justify-center py-20 border border-dashed border-border-strong rounded-lg bg-surface-0"
            >
                <BookOpen class="size-12 text-text-muted/30 mb-4" />
                <h3 class="text-lg font-bold text-text-strong">
                    No accounts yet
                </h3>
                <p class="text-sm text-text-muted mb-6">
                    Your chart of accounts will appear here once configured
                </p>
            </div>
        {:else}
            <div class="space-y-6">
                {#each grouped as group}
                    <div>
                        <h2
                            class="text-xs font-bold uppercase tracking-wider text-text-muted mb-2 px-1"
                        >
                            {group.label}
                        </h2>
                        <div
                            class="border border-border rounded-lg overflow-hidden shadow-sm bg-surface-0"
                        >
                            <Table>
                                <TableHeader>
                                    <TableRow class="hover:bg-transparent">
                                        <TableHead class="w-28">Code</TableHead>
                                        <TableHead>Account Name</TableHead>
                                        <TableHead class="w-28">Type</TableHead>
                                        <TableHead class="text-right w-36">Balance</TableHead>
                                        <TableHead class="text-right w-24">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {#each group.accounts as account}
                                        <TableRow>
                                            <TableCell>
                                                <span
                                                    class="font-mono text-sm font-medium text-primary"
                                                >
                                                    {account.account_code}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span
                                                    class="text-sm font-semibold text-text-strong"
                                                    >{account.account_name}</span
                                                >
                                            </TableCell>
                                            <TableCell>
                                                <span
                                                    class="text-sm text-text-subtle capitalize"
                                                    >{account.account_type}</span
                                                >
                                            </TableCell>
                                            <TableCell
                                                class="text-right font-mono tabular-nums text-[0.8125rem] text-text-strong"
                                            >
                                                {formatINR(account.balance)}
                                            </TableCell>
                                            <TableCell class="text-right">
                                                <Badge variant={account.is_active ? "success" : "destructive"}>
                                                    {account.is_active
                                                        ? "active"
                                                        : "inactive"}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    {/each}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                {/each}
            </div>
        {/if}
    </div>
</div>
