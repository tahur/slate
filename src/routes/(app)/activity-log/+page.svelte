<script lang="ts">
    import { goto } from "$app/navigation";
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import { History, RefreshCw, FileText, User, CreditCard, Receipt, Users, Building2, BookOpen } from "lucide-svelte";

    let { data } = $props();

    let startDate = $state(data.startDate);
    let endDate = $state(data.endDate);
    let entityType = $state(data.entityType);

    function applyFilter() {
        const params = new URLSearchParams();
        params.set('from', startDate);
        params.set('to', endDate);
        if (entityType !== 'all') {
            params.set('type', entityType);
        }
        goto(`/activity-log?${params.toString()}`);
    }

    function formatDateTime(dateStr: string | null): string {
        if (!dateStr) return "—";
        const date = new Date(dateStr);
        return date.toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    function formatRelativeTime(dateStr: string | null): string {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return "";
    }

    function getEntityIcon(entityType: string) {
        switch (entityType) {
            case 'invoice': return FileText;
            case 'payment': return CreditCard;
            case 'expense': return Receipt;
            case 'credit_note': return FileText;
            case 'customer': return Users;
            case 'vendor': return Building2;
            case 'journal_entry': return BookOpen;
            default: return FileText;
        }
    }

    function getEntityLink(entityType: string, entityId: string): string | null {
        switch (entityType) {
            case 'invoice': return `/invoices/${entityId}`;
            case 'payment': return `/payments/${entityId}`;
            case 'expense': return `/expenses/${entityId}`;
            case 'credit_note': return `/credit-notes/${entityId}`;
            case 'customer': return `/customers/${entityId}`;
            case 'vendor': return `/vendors/${entityId}`;
            default: return null;
        }
    }

    function getActionColor(action: string): string {
        switch (action) {
            case 'created': return 'text-green-600 bg-green-50';
            case 'issued': return 'text-blue-600 bg-blue-50';
            case 'paid':
            case 'partially_paid': return 'text-emerald-600 bg-emerald-50';
            case 'cancelled':
            case 'voided':
            case 'deleted': return 'text-red-600 bg-red-50';
            case 'updated': return 'text-amber-600 bg-amber-50';
            case 'applied': return 'text-purple-600 bg-purple-50';
            default: return 'text-text-subtle bg-surface-2';
        }
    }

    function formatEntityType(type: string): string {
        return type.replace('_', ' ');
    }
</script>

<div class="page-full-bleed">
    <!-- Header -->
    <div class="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-0">
        <div class="flex items-center gap-3">
            <History class="size-5 text-text-muted" />
            <h1 class="text-xl font-bold tracking-tight text-text-strong">
                Activity Log
            </h1>
        </div>

        <!-- Filters -->
        <div class="flex items-center gap-3">
            <div class="flex items-center gap-2">
                <Label for="type" class="text-xs text-text-muted whitespace-nowrap">Type</Label>
                <select
                    id="type"
                    bind:value={entityType}
                    class="h-9 w-32 rounded-md border border-border-strong bg-surface-0 px-2 text-sm text-text-strong"
                >
                    <option value="all">All</option>
                    <option value="invoice">Invoice</option>
                    <option value="payment">Payment</option>
                    <option value="expense">Expense</option>
                    <option value="credit_note">Credit Note</option>
                    <option value="customer">Customer</option>
                    <option value="vendor">Vendor</option>
                </select>
            </div>
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
        {#if data.logs.length === 0}
            <div class="flex flex-col items-center justify-center py-20 border border-dashed border-border-strong rounded-lg bg-surface-0">
                <History class="size-12 text-text-muted/30 mb-4" />
                <h3 class="text-lg font-bold text-text-strong">No activity yet</h3>
                <p class="text-sm text-text-muted mb-6">
                    Activity will appear here as actions are performed
                </p>
            </div>
        {:else}
            <div class="space-y-2">
                {#each data.logs as log}
                    {@const Icon = getEntityIcon(log.entity_type)}
                    {@const link = getEntityLink(log.entity_type, log.entity_id)}
                    <div class="flex items-start gap-4 p-4 rounded-lg border border-border bg-surface-0 hover:bg-surface-2/50 transition-colors">
                        <!-- Icon -->
                        <div class="flex-shrink-0 p-2 rounded-lg bg-surface-2">
                            <Icon class="size-4 text-text-muted" />
                        </div>

                        <!-- Content -->
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-2 flex-wrap">
                                <span class="px-2 py-0.5 rounded text-xs font-medium capitalize {getActionColor(log.action)}">
                                    {log.action}
                                </span>
                                <span class="text-sm text-text-strong capitalize">
                                    {formatEntityType(log.entity_type)}
                                </span>
                                {#if link}
                                    <a
                                        href={link}
                                        class="text-sm font-mono text-primary hover:underline"
                                    >
                                        {log.entity_id.slice(0, 8)}...
                                    </a>
                                {:else}
                                    <span class="text-sm font-mono text-text-muted">
                                        {log.entity_id.slice(0, 8)}...
                                    </span>
                                {/if}
                            </div>

                            {#if log.changed_fields}
                                {@const changes = JSON.parse(log.changed_fields)}
                                <div class="mt-2 text-xs text-text-muted">
                                    {#each Object.entries(changes) as [field, change]}
                                        <span class="inline-block mr-3">
                                            <span class="font-medium">{field}:</span>
                                            {#if (change as any).old !== undefined}
                                                <span class="line-through text-red-500">{(change as any).old}</span>
                                                →
                                            {/if}
                                            <span class="text-green-600">{(change as any).new}</span>
                                        </span>
                                    {/each}
                                </div>
                            {/if}

                            <div class="flex items-center gap-3 mt-2 text-xs text-text-muted">
                                <div class="flex items-center gap-1">
                                    <User class="size-3" />
                                    <span>{log.user_name || log.user_email || 'System'}</span>
                                </div>
                                <span>·</span>
                                <span title={formatDateTime(log.created_at)}>
                                    {formatDateTime(log.created_at)}
                                    {#if formatRelativeTime(log.created_at)}
                                        <span class="text-text-placeholder">({formatRelativeTime(log.created_at)})</span>
                                    {/if}
                                </span>
                            </div>
                        </div>
                    </div>
                {/each}
            </div>
        {/if}
    </div>
</div>
