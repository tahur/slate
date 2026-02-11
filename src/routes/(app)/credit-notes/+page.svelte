<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { Plus, FileText } from "lucide-svelte";
    import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "$lib/components/ui/table";
    import StatusBadge from "$lib/components/ui/badge/StatusBadge.svelte";
    import { formatINR } from "$lib/utils/currency";
    import { formatDate } from "$lib/utils/date";

    let { data } = $props();
</script>

<div class="page-full-bleed">
    <!-- Header / Filter Bar -->
    <div
        class="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-0"
    >
        <div class="flex items-center gap-4">
            <h1 class="text-xl font-bold tracking-tight text-text-strong">
                Credit Notes
            </h1>
        </div>
        <Button href="/credit-notes/new">
            <Plus class="mr-2 size-4" />
            New Credit Note
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
                <p class="text-sm text-text-subtle mb-6">
                    Create your first credit note to get started
                </p>
                <Button href="/credit-notes/new">
                    <Plus class="mr-2 size-4" />
                    Create Credit Note
                </Button>
            </div>
        {:else}
            <div
                class="border border-border rounded-lg overflow-hidden shadow-sm bg-surface-0"
            >
                <Table>
                    <TableHeader>
                        <TableRow class="hover:bg-transparent">
                            <TableHead class="w-28">Date</TableHead>
                            <TableHead>CN #</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Reason</TableHead>
                            <TableHead class="text-right w-28">Status</TableHead>
                            <TableHead class="text-right w-32">Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {#each data.creditNotes as cn}
                            <TableRow class="group cursor-pointer">
                                <TableCell class="text-text-muted font-medium">
                                    <a href="/credit-notes/{cn.id}" class="flex items-center w-full h-full text-inherit no-underline">
                                        {formatDate(cn.credit_note_date)}
                                    </a>
                                </TableCell>
                                <TableCell>
                                    <a href="/credit-notes/{cn.id}" class="flex items-center w-full h-full text-inherit no-underline font-mono text-sm font-medium text-primary whitespace-nowrap">
                                        {cn.credit_note_number}
                                    </a>
                                </TableCell>
                                <TableCell>
                                    <a href="/credit-notes/{cn.id}" class="flex items-center w-full h-full text-inherit no-underline">
                                        <span
                                            class="text-sm font-semibold text-text-strong"
                                            >{cn.customer_name || "—"}</span
                                        >
                                    </a>
                                </TableCell>
                                <TableCell>
                                    <a href="/credit-notes/{cn.id}" class="flex items-center w-full h-full text-inherit no-underline">
                                        <span
                                            class="text-sm text-text-subtle capitalize"
                                            >{cn.reason}</span
                                        >
                                    </a>
                                </TableCell>
                                <TableCell class="text-right">
                                    <a href="/credit-notes/{cn.id}" class="flex items-center justify-end w-full h-full text-inherit no-underline">
                                        <StatusBadge
                                            status={cn.status}
                                        />
                                    </a>
                                </TableCell>
                                <TableCell class="text-right font-mono tabular-nums text-[0.8125rem] text-text-strong">
                                    <a href="/credit-notes/{cn.id}" class="flex items-center justify-end w-full h-full text-inherit no-underline">
                                        {formatINR(cn.total)}
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
