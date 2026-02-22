<script lang="ts">
    import {
        Banknote,
        Building2,
        CreditCard,
        FileText,
        Smartphone,
        Wallet,
    } from "lucide-svelte";

    type PaymentOption = {
        methodKey: string;
        accountId: string;
        displayLabel: string;
        isDefault?: boolean;
    };

    type IconComponent = typeof Banknote;

    const METHOD_ICONS: Record<string, IconComponent> = {
        cash: Banknote,
        upi: Smartphone,
        card: CreditCard,
        netbanking: Building2,
        cheque: FileText
    };

    function getIcon(methodKey: string): IconComponent {
        const key = (methodKey || "").toLowerCase();
        return METHOD_ICONS[key] ?? Wallet;
    }

    interface Props {
        options: PaymentOption[];
        selectedOptionKey: string;
        onSelect: (option: PaymentOption) => void;
        /** Compact chips (e.g. in modals). Default false = normal size. */
        compact?: boolean;
    }

    let { options, selectedOptionKey, onSelect, compact = false }: Props = $props();
</script>

{#if options.length === 0}
    <p class="text-xs text-text-muted">No payment methods configured. Add them in Settings → Payments.</p>
{:else}
    <div class="flex flex-wrap gap-2">
        {#each options as option}
            {@const optKey = `${option.methodKey}::${option.accountId}`}
            {@const Icon = getIcon(option.methodKey)}
            <button
                type="button"
                onclick={() => onSelect(option)}
                class="inline-flex items-center gap-2 rounded-lg border font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 {compact
                    ? 'px-3 py-1.5 text-xs'
                    : 'px-4 py-2 text-sm'} {selectedOptionKey === optKey
                    ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                    : 'border-border bg-surface-0 text-text-strong hover:border-primary/50 hover:bg-surface-1'}"
            >
                <Icon class="size-3.5 shrink-0" />
                <span>{option.displayLabel}</span>
            </button>
        {/each}
    </div>
{/if}
