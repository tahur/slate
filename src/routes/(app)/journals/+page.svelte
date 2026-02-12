<script lang="ts">
    import { goto } from "$app/navigation";
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import { Badge } from "$lib/components/ui/badge";
    import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "$lib/components/ui/table";
    import { FileText, RefreshCw, Lock } from "lucide-svelte";
    import { formatINR } from "$lib/utils/currency";
    import { formatDate } from "$lib/utils/date";

    let { data } = $props();
    const { startDate: initStart, endDate: initEnd } = data;

    let startDate = $state(initStart);
    let endDate = $state(initEnd);

    function applyFilter() {
        goto(`/journals?from=${startDate}&to=${endDate}`);
    }

    function getStatusVariant(status: string | null): "success" | "warning" | "destructive" {
        switch (status) {
            case "posted":
                return "success";
            case "draft":
                return "warning";
            case "reversed":
                return "destructive";
            default:
                return "warning";
        }
    }
</script>

<div class="page-full-bleed">
    <!-- Header -->
    <div
        class="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-0"
    >
        <div class="flex items-center gap-4">
            <h1 class="text-xl font-bold tracking-tight text-text-strong">
                Journal Entries
            </h1>
        </div>

        <!-- Date Filter -->
        <div class="flex items-center gap-3">
            <div class="flex items-center gap-2">
                <Label for="from" class="text-xs text-text-muted whitespace-nowrap">From</Label>
                <Input
                    type="date"
                    id="from"
                    bind:value={startDate}
                    class="h-9 w-36 text-sm"
                />
            </div>
            <div class="flex items-center gap-2">
                <Label for="to" class="text-xs text-text-muted whitespace-nowrap">To</Label>
                <Input
                    type="date"
                    id="to"
                    bind:value={endDate}
                    class="h-9 w-36 text-sm"
                />
            </div>
            <Button size="sm" variant="outline" onclick={applyFilter}>
                <RefreshCw class="size-3 mr-1.5" />
                Apply
            </Button>
        </div>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-auto bg-surface-1 p-6">
        {#if data.journals.length === 0}
            <div
                class="flex flex-col items-center justify-center py-20 border border-dashed border-border-strong rounded-lg bg-surface-0"
            >
                <FileText class="size-12 text-text-muted/30 mb-4" />
                <h3 class="text-lg font-bold text-text-strong">
                    No journal entries yet
                </h3>
                <p class="text-sm text-text-muted mb-6">
                    Journal entries will appear here as transactions are recorded
                </p>
            </div>
        {:else}
            <div
                class="border border-border rounded-lg overflow-hidden shadow-sm bg-surface-0"
            >
                <Table>
                    <TableHeader>
                        <TableRow class="hover:bg-transparent">
                            <TableHead class="w-32">Date</TableHead>
                            <TableHead class="w-36">Entry #</TableHead>
                            <TableHead class="w-32">Ref Type</TableHead>
                            <TableHead>Narration</TableHead>
                            <TableHead class="text-right w-32">Debit</TableHead>
                            <TableHead class="text-right w-32">Credit</TableHead>
                            <TableHead class="text-right w-24">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {#each data.journals as entry}
                            <TableRow>
                                <TableCell class="text-text-muted font-medium">
                                    {formatDate(entry.entry_date)}
                                </TableCell>
                                <TableCell>
                                    <span
                                        class="font-mono text-sm font-medium text-primary"
                                    >
                                        {entry.entry_number}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <span
                                        class="text-sm text-text-subtle capitalize"
                                        >{entry.reference_type}</span
                                    >
                                </TableCell>
                                <TableCell>
                                    <span class="text-sm text-text-strong"
                                        >{entry.narration || "—"}</span
                                    >
                                </TableCell>
                                <TableCell class="text-right font-mono tabular-nums text-[0.8125rem] text-text-strong">
                                    {formatINR(entry.total_debit)}
                                </TableCell>
                                <TableCell class="text-right font-mono tabular-nums text-[0.8125rem] text-text-strong">
                                    {formatINR(entry.total_credit)}
                                </TableCell>
                                <TableCell class="text-right">
                                    <div class="flex items-center justify-end gap-1.5">
                                        <Badge variant={getStatusVariant(entry.status)} class="capitalize">
                                            {entry.status}
                                        </Badge>
                                        {#if entry.status === "posted"}
                                            <span class="text-text-muted" title="This journal entry is immutable">
                                                <Lock class="size-3" />
                                            </span>
                                        {/if}
                                    </div>
                                </TableCell>
                            </TableRow>
                        {/each}
                    </TableBody>
                </Table>
            </div>
        {/if}
    </div>
</div>
