<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Plus, Search, Package, Briefcase, Layers } from "lucide-svelte";
    import { formatINR } from "$lib/utils/currency";

    let { data } = $props();

    let searchQuery = $state("");
    let activeFilter = $state<"all" | "product" | "service">("all");

    const filteredItems = $derived(
        data.items.filter((item) => {
            // Type filter
            if (activeFilter !== "all" && item.type !== activeFilter)
                return false;

            // Search filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                return (
                    item.name.toLowerCase().includes(query) ||
                    item.sku?.toLowerCase().includes(query) ||
                    item.description?.toLowerCase().includes(query) ||
                    item.hsn_code?.toLowerCase().includes(query)
                );
            }
            return true;
        }),
    );
</script>

<div class="page-full-bleed">
    <!-- Header -->
    <header
        class="flex flex-col md:flex-row md:items-center justify-between gap-4 px-6 py-4 border-b border-border bg-surface-0 z-20"
    >
        <div>
            <h1 class="text-xl font-bold tracking-tight text-text-strong">
                Products & Services
            </h1>
            <p class="text-sm text-text-muted">
                Manage your catalog of products and services
            </p>
        </div>
        <Button href="/items/new">
            <Plus class="mr-2 size-4" />
            New Item
        </Button>
    </header>

    <!-- Summary Cards -->
    <div class="px-6 py-4 bg-surface-1 border-b border-border">
        <div class="grid grid-cols-3 gap-4 max-w-3xl">
            <div class="bg-surface-0 rounded-lg border border-border p-4">
                <div class="flex items-center gap-2 text-text-muted mb-1">
                    <Layers class="size-4" />
                    <span class="text-xs font-medium uppercase tracking-wide"
                        >Total Items</span
                    >
                </div>
                <p class="text-2xl font-bold text-text-strong">
                    {data.summary.totalItems}
                </p>
            </div>
            <div class="bg-surface-0 rounded-lg border border-border p-4">
                <div class="flex items-center gap-2 text-text-muted mb-1">
                    <Package class="size-4" />
                    <span class="text-xs font-medium uppercase tracking-wide"
                        >Products</span
                    >
                </div>
                <p class="text-2xl font-bold text-blue-600">
                    {data.summary.products}
                </p>
            </div>
            <div class="bg-surface-0 rounded-lg border border-border p-4">
                <div class="flex items-center gap-2 text-text-muted mb-1">
                    <Briefcase class="size-4" />
                    <span class="text-xs font-medium uppercase tracking-wide"
                        >Services</span
                    >
                </div>
                <p class="text-2xl font-bold text-green-600">
                    {data.summary.services}
                </p>
            </div>
        </div>
    </div>

    <!-- Filter Tabs + Search -->
    <div
        class="px-6 py-3 bg-surface-0 border-b border-border flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between"
    >
        <div class="flex gap-1">
            {#each [{ key: "all", label: "All" }, { key: "product", label: "Products" }, { key: "service", label: "Services" }] as tab}
                <button
                    class="px-3 py-1.5 text-xs font-medium rounded-md transition-colors {activeFilter ===
                    tab.key
                        ? 'bg-primary/10 text-primary'
                        : 'text-text-muted hover:bg-surface-2 hover:text-text-strong'}"
                    onclick={() =>
                        (activeFilter = tab.key as
                            | "all"
                            | "product"
                            | "service")}
                >
                    {tab.label}
                </button>
            {/each}
        </div>
        <div class="relative max-w-md w-full sm:w-auto">
            <Search
                class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-text-muted"
            />
            <Input
                type="search"
                placeholder="Search items..."
                bind:value={searchQuery}
                class="pl-10"
            />
        </div>
    </div>

    <!-- Item List -->
    <div class="flex-1 overflow-y-auto bg-surface-1">
        {#if filteredItems.length === 0}
            <div
                class="flex flex-col items-center justify-center h-full text-center p-8"
            >
                <Package class="size-16 text-text-muted/30 mb-4" />
                {#if searchQuery || activeFilter !== "all"}
                    <h3 class="text-lg font-medium text-text-strong">
                        No items found
                    </h3>
                    <p class="text-sm text-text-muted mt-1">
                        Try a different search or filter
                    </p>
                {:else}
                    <h3 class="text-lg font-medium text-text-strong">
                        No items yet
                    </h3>
                    <p class="text-sm text-text-muted mt-1">
                        Add your first product or service to the catalog
                    </p>
                    <Button href="/items/new" class="mt-4">
                        <Plus class="mr-2 size-4" />
                        Add Item
                    </Button>
                {/if}
            </div>
        {:else}
            <div class="divide-y divide-border">
                {#each filteredItems as item}
                    <a
                        href="/items/{item.id}"
                        class="flex items-center gap-4 px-6 py-4 bg-surface-0 hover:bg-surface-2/50 transition-colors"
                    >
                        <!-- Icon -->
                        <div
                            class="size-12 rounded-full flex items-center justify-center shrink-0 {item.type ===
                            'product'
                                ? 'bg-blue-50 text-blue-600'
                                : 'bg-green-50 text-green-600'}"
                        >
                            {#if item.type === "product"}
                                <Package class="size-5" />
                            {:else}
                                <Briefcase class="size-5" />
                            {/if}
                        </div>

                        <!-- Info -->
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-2">
                                <h3
                                    class="font-semibold text-text-strong truncate"
                                >
                                    {item.name}
                                </h3>
                                <span
                                    class="px-2 py-0.5 text-xs rounded font-medium capitalize {item.type ===
                                    'product'
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'bg-green-100 text-green-700'}"
                                >
                                    {item.type}
                                </span>
                                {#if item.sku}
                                    <span
                                        class="px-2 py-0.5 text-xs rounded bg-surface-2 text-text-muted font-mono"
                                    >
                                        {item.sku}
                                    </span>
                                {/if}
                                {#if !item.is_active}
                                    <span
                                        class="px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-600"
                                    >
                                        Inactive
                                    </span>
                                {/if}
                            </div>
                            {#if item.description}
                                <p class="text-sm text-text-muted truncate">
                                    {item.description}
                                </p>
                            {/if}
                            <div
                                class="flex items-center gap-4 mt-1 text-xs text-text-muted"
                            >
                                {#if item.hsn_code}
                                    <span class="font-mono"
                                        >HSN: {item.hsn_code}</span
                                    >
                                {/if}
                                <span>GST: {item.gst_rate}%</span>
                            </div>
                        </div>

                        <!-- Rate -->
                        <div class="text-right shrink-0">
                            <p
                                class="text-xs text-text-muted uppercase tracking-wide"
                            >
                                Rate
                            </p>
                            <p class="font-mono font-semibold text-text-strong">
                                {formatINR(item.rate)}
                            </p>
                            <p class="text-xs text-text-muted">
                                per {item.unit}
                            </p>
                        </div>
                    </a>
                {/each}
            </div>
        {/if}
    </div>
</div>
