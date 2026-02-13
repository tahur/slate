<script lang="ts">
    import { Search, Package, Pencil } from "lucide-svelte";
    import { formatINR } from "$lib/utils/currency";

    interface CatalogItem {
        id: string;
        name: string;
        description?: string | null;
        hsn_code?: string | null;
        rate: number;
        unit?: string | null;
        gst_rate: number;
        type?: string;
    }

    interface LineItemValue {
        description: string;
        hsn_code: string;
        rate: number;
        unit: string;
        gst_rate: number;
        item_id?: string;
    }

    interface Props {
        catalogItems: CatalogItem[];
        value: LineItemValue;
        onSelect: (item: LineItemValue) => void;
        placeholder?: string;
        name?: string;
    }

    let {
        catalogItems = [],
        value = $bindable(),
        onSelect,
        placeholder = "Search or enter item...",
        name = "",
    }: Props = $props();

    let inputRef: HTMLInputElement | null = $state(null);
    let wrapperRef: HTMLDivElement | null = $state(null);
    let isOpen = $state(false);
    let searchQuery = $state("");
    let highlightedIndex = $state(-1);
    let dropdownRef: HTMLDivElement | null = $state(null);

    // Position for fixed dropdown
    let dropdownPosition = $state({ top: 0, left: 0, width: 320 });

    // Sync input with value description
    $effect(() => {
        searchQuery = value.description;
    });

    let filteredItems = $derived.by(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return catalogItems.slice(0, 10); // Show first 10 when empty
        return catalogItems
            .filter((item) => {
                const haystack = [item.name, item.description, item.hsn_code]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();
                return haystack.includes(query);
            })
            .slice(0, 10);
    });

    // Total items = filtered catalog items + 1 for ad-hoc option (if query exists)
    let totalOptions = $derived(
        searchQuery.trim() ? filteredItems.length + 1 : filteredItems.length,
    );

    function updateDropdownPosition() {
        if (wrapperRef) {
            const rect = wrapperRef.getBoundingClientRect();
            dropdownPosition = {
                top: rect.bottom + 4,
                left: rect.left,
                width: Math.max(rect.width, 320),
            };
        }
    }

    function handleFocus() {
        updateDropdownPosition();
        isOpen = true;
        highlightedIndex = -1;
    }

    function handleBlur(e: FocusEvent) {
        // Delay closing to allow click on dropdown items
        setTimeout(() => {
            const relatedTarget = e.relatedTarget as HTMLElement;
            if (dropdownRef && dropdownRef.contains(relatedTarget)) {
                return;
            }
            isOpen = false;
            // If no selection was made, treat current text as ad-hoc
            if (searchQuery.trim() && searchQuery !== value.description) {
                selectAdHoc();
            }
        }, 150);
    }

    function handleInput(e: Event) {
        const target = e.target as HTMLInputElement;
        searchQuery = target.value;
        updateDropdownPosition();
        isOpen = true;
        highlightedIndex = -1;

        // Clear item_id if user is typing (making it ad-hoc)
        if (value.item_id && searchQuery !== value.description) {
            value = { ...value, item_id: "" };
        }
    }

    function handleKeydown(e: KeyboardEvent) {
        if (!isOpen) {
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                updateDropdownPosition();
                isOpen = true;
                e.preventDefault();
            }
            return;
        }

        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                highlightedIndex = Math.min(
                    highlightedIndex + 1,
                    totalOptions - 1,
                );
                scrollToHighlighted();
                break;
            case "ArrowUp":
                e.preventDefault();
                highlightedIndex = Math.max(highlightedIndex - 1, -1);
                scrollToHighlighted();
                break;
            case "Enter":
                e.preventDefault();
                if (highlightedIndex >= 0) {
                    if (highlightedIndex < filteredItems.length) {
                        selectCatalogItem(filteredItems[highlightedIndex]);
                    } else {
                        selectAdHoc();
                    }
                } else if (searchQuery.trim()) {
                    selectAdHoc();
                }
                break;
            case "Escape":
                e.preventDefault();
                isOpen = false;
                highlightedIndex = -1;
                break;
            case "Tab":
                // Let tab work normally, blur handler will handle ad-hoc
                isOpen = false;
                break;
        }
    }

    function scrollToHighlighted() {
        if (dropdownRef && highlightedIndex >= 0) {
            const items = dropdownRef.querySelectorAll("[data-option]");
            if (items[highlightedIndex]) {
                items[highlightedIndex].scrollIntoView({ block: "nearest" });
            }
        }
    }

    function selectCatalogItem(item: CatalogItem) {
        const newValue: LineItemValue = {
            description: item.name,
            hsn_code: item.hsn_code || "",
            rate: item.rate,
            unit: item.unit || "nos",
            gst_rate: item.gst_rate,
            item_id: item.id,
        };
        value = newValue;
        searchQuery = item.name;
        onSelect?.(newValue);
        isOpen = false;
        highlightedIndex = -1;
    }

    function selectAdHoc() {
        const newValue: LineItemValue = {
            ...value,
            description: searchQuery.trim(),
            item_id: "", // Clear item_id for ad-hoc
        };
        value = newValue;
        onSelect?.(newValue);
        isOpen = false;
        highlightedIndex = -1;
    }

    function handleClickOutside(e: MouseEvent) {
        const target = e.target as HTMLElement;
        if (
            inputRef &&
            !inputRef.contains(target) &&
            dropdownRef &&
            !dropdownRef.contains(target)
        ) {
            isOpen = false;
        }
    }

    // Listen for clicks outside and scroll events (to reposition)
    $effect(() => {
        if (isOpen) {
            document.addEventListener("click", handleClickOutside);
            window.addEventListener("scroll", updateDropdownPosition, true);
            window.addEventListener("resize", updateDropdownPosition);
            return () => {
                document.removeEventListener("click", handleClickOutside);
                window.removeEventListener(
                    "scroll",
                    updateDropdownPosition,
                    true,
                );
                window.removeEventListener("resize", updateDropdownPosition);
            };
        }
    });
</script>

<div bind:this={wrapperRef} class="relative flex-1 w-full min-w-[120px]">
    <div class="relative">
        <Search
            class="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-text-muted pointer-events-none"
        />
        <input
            bind:this={inputRef}
            type="text"
            {name}
            value={searchQuery}
            oninput={handleInput}
            onfocus={handleFocus}
            onblur={handleBlur}
            onkeydown={handleKeydown}
            {placeholder}
            autocomplete="off"
            class="h-9 w-full pl-7 pr-2 border-transparent hover:border-border focus:border-primary bg-transparent text-sm font-medium placeholder:text-text-placeholder rounded-md transition-colors focus:outline-none focus:ring-1 focus:ring-primary/20"
        />
    </div>
</div>

<!-- Portal: Fixed positioned dropdown rendered at body level -->
{#if isOpen && (filteredItems.length > 0 || searchQuery.trim())}
    <div
        bind:this={dropdownRef}
        class="fixed z-[9999] bg-surface-0 rounded-lg border border-border shadow-xl overflow-hidden"
        style="top: {dropdownPosition.top}px; left: {dropdownPosition.left}px; width: {dropdownPosition.width}px;"
    >
        {#if filteredItems.length > 0}
            <div class="px-2 pt-2 pb-1">
                <span
                    class="text-[10px] uppercase tracking-wide text-text-muted font-semibold"
                >
                    Catalog Items
                </span>
            </div>
            <div class="max-h-48 overflow-y-auto">
                {#each filteredItems as item, index}
                    <button
                        type="button"
                        data-option
                        class="w-full text-left px-3 py-2 transition-colors flex items-center gap-3 {highlightedIndex ===
                        index
                            ? 'bg-primary/10'
                            : 'hover:bg-surface-2'}"
                        onmouseenter={() => (highlightedIndex = index)}
                        onclick={() => selectCatalogItem(item)}
                    >
                        <Package class="size-4 text-text-muted shrink-0" />
                        <div class="flex-1 min-w-0">
                            <div
                                class="text-sm font-medium text-text-strong truncate"
                            >
                                {item.name}
                            </div>
                            <div
                                class="flex items-center gap-2 text-[10px] text-text-muted"
                            >
                                <span class="capitalize"
                                    >{item.type || "goods"}</span
                                >
                                {#if item.hsn_code}
                                    <span class="font-mono"
                                        >HSN: {item.hsn_code}</span
                                    >
                                {/if}
                                <span>{item.gst_rate}%</span>
                            </div>
                        </div>
                        <div class="text-right shrink-0">
                            <div class="text-sm font-mono font-medium">
                                {formatINR(item.rate)}
                            </div>
                            <div class="text-[10px] text-text-muted">
                                /{item.unit || "nos"}
                            </div>
                        </div>
                    </button>
                {/each}
            </div>
        {/if}

        {#if searchQuery.trim()}
            <div class="border-t border-border">
                <button
                    type="button"
                    data-option
                    class="w-full text-left px-3 py-2.5 transition-colors flex items-center gap-3 {highlightedIndex ===
                    filteredItems.length
                        ? 'bg-primary/10'
                        : 'hover:bg-surface-2'}"
                    onmouseenter={() =>
                        (highlightedIndex = filteredItems.length)}
                    onclick={selectAdHoc}
                >
                    <Pencil class="size-4 text-text-muted shrink-0" />
                    <div class="flex-1 min-w-0">
                        <div class="text-sm text-text-strong">
                            Use "<span class="font-medium"
                                >{searchQuery.trim()}</span
                            >" as custom item
                        </div>
                        <div class="text-[10px] text-text-muted">
                            Enter details manually
                        </div>
                    </div>
                </button>
            </div>
        {/if}

        {#if filteredItems.length === 0 && !searchQuery.trim()}
            <div class="px-3 py-4 text-xs text-text-muted text-center">
                Start typing to search catalog or enter custom item
            </div>
        {/if}
    </div>
{/if}
