<script lang="ts">
    import { BookOpen, ArrowLeft, Plus, X } from "lucide-svelte";
    import { Badge } from "$lib/components/ui/badge";
    import { Button } from "$lib/components/ui/button";
    import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "$lib/components/ui/table";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import * as Card from "$lib/components/ui/card";
    import * as Select from "$lib/components/ui/select";
    import { formatINR } from "$lib/utils/currency";
    import { enhance } from "$app/forms";

    let { data, form } = $props();

    let showForm = $state(false);

    const typeOrder = ["asset", "liability", "equity", "income", "expense"] as const;

    const typeLabels: Record<string, string> = {
        asset: "Assets",
        liability: "Liabilities",
        equity: "Equity",
        income: "Income",
        expense: "Expenses",
    };

    const typeOptions = [
        { value: "asset", label: "Asset" },
        { value: "liability", label: "Liability" },
        { value: "equity", label: "Equity" },
        { value: "income", label: "Income" },
        { value: "expense", label: "Expense" },
    ];

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

    // Show form if there was a validation error
    $effect(() => {
        if (form?.error) {
            showForm = true;
        }
    });
</script>

<div class="page-full-bleed">
    <!-- Header -->
    <header class="page-header items-center">
        <div class="flex items-center gap-4">
            <Button variant="ghost" href="/reports" size="icon" class="h-8 w-8">
                <ArrowLeft class="size-4" />
            </Button>
            <h1 class="text-xl font-bold tracking-tight text-text-strong">
                Chart of Accounts
            </h1>
        </div>
        <Button
            variant="outline"
            size="sm"
            onclick={() => (showForm = !showForm)}
        >
            {#if showForm}
                <X class="size-4 mr-1.5" />
                Cancel
            {:else}
                <Plus class="size-4 mr-1.5" />
                Add Account
            {/if}
        </Button>
    </header>

    <!-- Content -->
    <main class="page-body">
        <div class="content-width-standard">
        <!-- Inline Add Account Form -->
        {#if showForm}
            <Card.Root class="mb-6">
                <Card.Header>
                    <Card.Title class="text-base">New Account</Card.Title>
                </Card.Header>
                <Card.Content>
                    {#if form?.error}
                        <div class="mb-4 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                            {form.error}
                        </div>
                    {/if}
                    <form method="POST" action="?/create" use:enhance class="grid grid-cols-1 sm:grid-cols-[1fr_2fr_1fr_auto] gap-4 items-end">
                        <div class="space-y-1.5">
                            <Label for="code">Code</Label>
                            <Input
                                id="code"
                                name="code"
                                placeholder="e.g. 7100"
                                maxlength={10}
                                value={form?.code ?? ""}
                                required
                            />
                        </div>
                        <div class="space-y-1.5">
                            <Label for="name">Name</Label>
                            <Input
                                id="name"
                                name="name"
                                placeholder="e.g. Marketing Events"
                                maxlength={100}
                                value={form?.name ?? ""}
                                required
                            />
                        </div>
                        <div class="space-y-1.5">
                            <Label for="type">Type</Label>
                            <Select.Root type="single" name="type" value={form?.type ?? "expense"}>
                                <Select.Trigger
                                    id="type"
                                    class="w-full border-slate-300 bg-white focus:ring-1 focus:ring-slate-200"
                                >
                                    <span class="text-sm text-slate-500">Select type</span>
                                </Select.Trigger>
                                <Select.Content class="bg-[#FAFAFA] border-slate-200 shadow-lg">
                                    {#each typeOptions as opt}
                                        <Select.Item
                                            value={opt.value}
                                            class="hover:bg-slate-100 focus:bg-slate-100 cursor-pointer"
                                        >
                                            {opt.label}
                                        </Select.Item>
                                    {/each}
                                </Select.Content>
                            </Select.Root>
                        </div>
                        <div class="flex gap-2">
                            <Button type="submit" size="sm">Save</Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onclick={() => (showForm = false)}
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                </Card.Content>
            </Card.Root>
        {/if}

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
                            class="text-xs font-bold uppercase tracking-wide text-text-muted mb-2 px-1"
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
    </main>
</div>
