<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import {
        Plus,
        Search,
        Building2,
        Users,
        Wallet,
        Phone,
        Mail,
        MapPin,
        FileText,
        Info,
    } from "lucide-svelte";
    import * as Tooltip from "$lib/components/ui/tooltip";
    import { INDIAN_STATES } from "./new/schema";
    import { formatINR } from "$lib/utils/currency";

    let { data } = $props();

    let searchQuery = $state("");

    const filteredCustomers = $derived(
        data.customers.filter((customer) => {
            const query = searchQuery.toLowerCase();
            return (
                customer.name.toLowerCase().includes(query) ||
                customer.company_name?.toLowerCase().includes(query) ||
                customer.email?.toLowerCase().includes(query) ||
                customer.gstin?.toLowerCase().includes(query)
            );
        }),
    );

    function getStateName(code: string | null): string {
        if (!code) return "";
        return INDIAN_STATES.find((s) => s.code === code)?.name || code;
    }
</script>

<div class="page-full-bleed">
    <!-- Header -->
    <header
        class="flex flex-col md:flex-row md:items-center justify-between gap-4 px-6 py-4 border-b border-border bg-surface-0 z-20"
    >
        <div>
            <h1 class="text-xl font-bold tracking-tight text-text-strong">
                Customers
            </h1>
            <p class="text-sm text-text-muted">
                Manage your customers and their details
            </p>
        </div>
        <div class="flex items-center gap-2">
            <div class="flex items-center gap-1">
                <Button href="/credit-notes" variant="outline" size="sm">
                    <FileText class="mr-2 size-4" />
                    Credit Notes
                </Button>
                <Tooltip.Root>
                    <Tooltip.Trigger>
                        <Info class="size-4 text-text-muted cursor-help" />
                    </Tooltip.Trigger>
                    <Tooltip.Content>
                        <p class="max-w-[250px] text-xs">
                            A credit note is a document issued to a customer
                            that indicates a return of funds in the event of an
                            invoice error or return.
                        </p>
                    </Tooltip.Content>
                </Tooltip.Root>
            </div>
            <Button href="/customers/new">
                <Plus class="mr-2 size-4" />
                New Customer
            </Button>
        </div>
    </header>

    <!-- Summary Cards -->
    <div class="px-6 py-4 bg-surface-1 border-b border-border">
        <div class="grid grid-cols-3 gap-4 max-w-3xl">
            <div class="bg-surface-0 rounded-lg border border-border p-4">
                <div class="flex items-center gap-2 text-text-muted mb-1">
                    <Users class="size-4" />
                    <span class="text-xs font-medium uppercase tracking-wider"
                        >Total Customers</span
                    >
                </div>
                <p class="text-2xl font-bold text-text-strong">
                    {data.summary.totalCustomers}
                </p>
            </div>
            <div class="bg-surface-0 rounded-lg border border-border p-4">
                <div class="flex items-center gap-2 text-text-muted mb-1">
                    <Building2 class="size-4" />
                    <span class="text-xs font-medium uppercase tracking-wider"
                        >Active</span
                    >
                </div>
                <p class="text-2xl font-bold text-green-600">
                    {data.summary.activeCustomers}
                </p>
            </div>
            <div class="bg-surface-0 rounded-lg border border-border p-4">
                <div class="flex items-center gap-2 text-text-muted mb-1">
                    <Wallet class="size-4" />
                    <span class="text-xs font-medium uppercase tracking-wider"
                        >Total Receivable</span
                    >
                </div>
                <p
                    class="text-2xl font-bold font-mono {data.summary
                        .totalReceivable > 0
                        ? 'text-amber-600'
                        : 'text-text-strong'}"
                >
                    {formatINR(data.summary.totalReceivable)}
                </p>
            </div>
        </div>
    </div>

    <!-- Search Bar -->
    <div class="px-6 py-3 bg-surface-0 border-b border-border">
        <div class="relative max-w-md">
            <Search
                class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-text-muted"
            />
            <Input
                type="search"
                placeholder="Search customers..."
                bind:value={searchQuery}
                class="pl-10"
            />
        </div>
    </div>

    <!-- Customer List -->
    <div class="flex-1 overflow-y-auto bg-surface-1">
        {#if filteredCustomers.length === 0}
            <div
                class="flex flex-col items-center justify-center h-full text-center p-8"
            >
                <Users class="size-16 text-text-muted/30 mb-4" />
                {#if searchQuery}
                    <h3 class="text-lg font-medium text-text-strong">
                        No customers found
                    </h3>
                    <p class="text-sm text-text-muted mt-1">
                        Try a different search term
                    </p>
                {:else}
                    <h3 class="text-lg font-medium text-text-strong">
                        No customers yet
                    </h3>
                    <p class="text-sm text-text-muted mt-1">
                        Add your first customer to start invoicing
                    </p>
                    <Button href="/customers/new" class="mt-4">
                        <Plus class="mr-2 size-4" />
                        Add Customer
                    </Button>
                {/if}
            </div>
        {:else}
            <div class="divide-y divide-border">
                {#each filteredCustomers as customer}
                    <a
                        href="/customers/{customer.id}"
                        class="flex items-center gap-4 px-6 py-4 bg-surface-0 hover:bg-surface-2/50 transition-colors"
                    >
                        <!-- Avatar -->
                        <div
                            class="size-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0"
                        >
                            <span class="text-lg font-semibold text-primary">
                                {customer.name.charAt(0).toUpperCase()}
                            </span>
                        </div>

                        <!-- Info -->
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-2">
                                <h3
                                    class="font-semibold text-text-strong truncate"
                                >
                                    {customer.name}
                                </h3>
                                {#if customer.status !== "active"}
                                    <span
                                        class="px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-600"
                                    >
                                        Inactive
                                    </span>
                                {/if}
                                {#if customer.gstin}
                                    <span
                                        class="px-2 py-0.5 text-xs rounded bg-green-100 text-green-700 font-mono"
                                    >
                                        GST
                                    </span>
                                {/if}
                            </div>
                            {#if customer.company_name}
                                <p class="text-sm text-text-muted truncate">
                                    {customer.company_name}
                                </p>
                            {/if}
                            <div
                                class="flex items-center gap-4 mt-1 text-xs text-text-muted"
                            >
                                {#if customer.phone}
                                    <span class="flex items-center gap-1">
                                        <Phone class="size-3" />
                                        {customer.phone}
                                    </span>
                                {/if}
                                {#if customer.email}
                                    <span class="flex items-center gap-1">
                                        <Mail class="size-3" />
                                        {customer.email}
                                    </span>
                                {/if}
                                {#if customer.city || customer.state_code}
                                    <span class="flex items-center gap-1">
                                        <MapPin class="size-3" />
                                        {customer.city}{customer.city &&
                                        customer.state_code
                                            ? ", "
                                            : ""}{getStateName(
                                            customer.state_code,
                                        )}
                                    </span>
                                {/if}
                            </div>
                        </div>

                        <!-- Balance -->
                        <div class="text-right shrink-0">
                            <p
                                class="text-xs text-text-muted uppercase tracking-wider"
                            >
                                Receivable
                            </p>
                            <p
                                class="font-mono font-semibold {(customer.balance ||
                                    0) > 0
                                    ? 'text-amber-600'
                                    : 'text-text-muted'}"
                            >
                                {formatINR(customer.balance)}
                            </p>
                        </div>
                    </a>
                {/each}
            </div>
        {/if}
    </div>
</div>
