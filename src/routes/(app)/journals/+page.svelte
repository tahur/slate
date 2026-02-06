<script lang="ts">
    import { goto } from "$app/navigation";
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import { FileText, RefreshCw, Lock } from "lucide-svelte";
    import { formatINR } from "$lib/utils/currency";
    import { formatDate } from "$lib/utils/date";

    let { data } = $props();

    let startDate = $state(data.startDate);
    let endDate = $state(data.endDate);

    function applyFilter() {
        goto(`/journals?from=${startDate}&to=${endDate}`);
    }

    function getStatusClass(status: string | null): string {
        switch (status) {
            case "posted":
                return "status-pill--positive";
            case "draft":
                return "status-pill--warning";
            case "reversed":
                return "status-pill--negative";
            default:
                return "status-pill--warning";
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
                <table class="data-table w-full">
                    <thead>
                        <tr>
                            <th class="w-32">Date</th>
                            <th class="w-36">Entry #</th>
                            <th class="w-32">Ref Type</th>
                            <th>Narration</th>
                            <th class="text-right w-32">Debit</th>
                            <th class="text-right w-32">Credit</th>
                            <th class="text-right w-24">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each data.journals as entry}
                            <tr
                                class="group hover:bg-surface-2 transition-colors"
                            >
                                <td class="data-cell--muted font-medium">
                                    {formatDate(entry.entry_date)}
                                </td>
                                <td>
                                    <span
                                        class="font-mono text-sm font-medium text-primary"
                                    >
                                        {entry.entry_number}
                                    </span>
                                </td>
                                <td>
                                    <span
                                        class="text-sm text-text-subtle capitalize"
                                        >{entry.reference_type}</span
                                    >
                                </td>
                                <td>
                                    <span class="text-sm text-text-strong"
                                        >{entry.narration || "—"}</span
                                    >
                                </td>
                                <td class="data-cell--number text-text-strong">
                                    {formatINR(entry.total_debit)}
                                </td>
                                <td class="data-cell--number text-text-strong">
                                    {formatINR(entry.total_credit)}
                                </td>
                                <td class="text-right">
                                    <div class="flex items-center justify-end gap-1.5">
                                        <span
                                            class="status-pill {getStatusClass(entry.status)}"
                                        >
                                            {entry.status}
                                        </span>
                                        {#if entry.status === "posted"}
                                            <span class="text-text-muted" title="This journal entry is immutable">
                                                <Lock class="size-3" />
                                            </span>
                                        {/if}
                                    </div>
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        {/if}
    </div>
</div>
