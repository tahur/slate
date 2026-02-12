<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { formatINR } from "$lib/utils/currency";
    import { ArrowLeft, Printer, Lock } from "lucide-svelte";
    import * as ButtonGroup from "$lib/components/ui/button-group";
    import StatusBadge from "$lib/components/ui/badge/StatusBadge.svelte";
    import { formatDate } from "$lib/utils/date";
    import WhatsAppShareButton from "$lib/components/ui/WhatsAppShareButton.svelte";
    import { getCreditNoteWhatsAppUrl } from "$lib/utils/whatsapp";

    let { data } = $props();
    const { creditNote, customer, org } = data;

    const whatsappUrl = getCreditNoteWhatsAppUrl({
        creditNoteNumber: creditNote.credit_note_number,
        customerName: customer?.name || "Customer",
        customerPhone: customer?.phone,
        total: creditNote.total,
        date: creditNote.credit_note_date,
        orgName: org?.name || "Our Company",
        reason: creditNote.reason,
    });
</script>

<div class="page-full-bleed">
    <!-- Header (hidden in print) -->
    <header
        class="print-hide flex items-center justify-between gap-4 px-6 py-4 border-b border-border bg-surface-0 z-20"
    >
        <div class="flex items-center gap-4">
            <Button
                variant="ghost"
                href="/credit-notes"
                size="icon"
                class="h-8 w-8"
            >
                <ArrowLeft class="size-4" />
            </Button>
            <div>
                <div class="flex items-center gap-3">
                    <h1
                        class="text-xl font-bold tracking-tight text-text-strong font-mono"
                    >
                        {data.creditNote.credit_note_number}
                    </h1>
                    <StatusBadge status={data.creditNote.status} />
                    <span
                        class="text-text-muted"
                        title="This credit note is posted and cannot be modified"
                    >
                        <Lock class="size-4" />
                    </span>
                </div>
                <p class="text-xs text-text-muted mt-0.5">
                    Issued on {formatDate(data.creditNote.credit_note_date)}
                </p>
            </div>
        </div>
        <ButtonGroup.Root>
            <Button variant="outline" size="sm" onclick={() => window.print()}>
                <Printer class="size-4 mr-2" />
                Print
            </Button>
            <WhatsAppShareButton url={whatsappUrl} />
        </ButtonGroup.Root>
    </header>

    <!-- Content: Paper View -->
    <div class="flex-1 overflow-y-auto px-6 py-8 pb-32 bg-surface-2/30 print-bg-white">
        <div class="mx-auto max-w-4xl">
            <div
                class="bg-surface-0 border border-border rounded-xl shadow-sm p-8 space-y-8 min-h-[600px] print-sheet"
            >
                <!-- Top Header: Logo + Org Details -->
                <div class="flex justify-between items-start">
                    <div class="space-y-4">
                        {#if data.org && data.org.logo_url}
                            <img
                                src={data.org.logo_url}
                                alt={data.org.name}
                                class="h-12 w-auto object-contain"
                            />
                        {/if}
                        <div>
                            <h2 class="text-2xl font-bold text-text-strong">
                                Credit Note
                            </h2>
                            <p class="text-sm text-text-subtle font-mono">
                                # {data.creditNote.credit_note_number}
                            </p>
                        </div>
                    </div>
                    <div class="text-right space-y-1">
                        <h3 class="font-semibold text-text-strong">
                            {data.org?.name}
                        </h3>
                        {#if data.org?.address}
                            <div
                                class="text-sm text-text-subtle whitespace-pre-line max-w-xs ml-auto"
                            >
                                {data.org.address}{data.org.state_code ? `, ${data.org.state_code}` : ""}{data.org.pincode ? ` - ${data.org.pincode}` : ""}
                            </div>
                        {/if}
                        {#if data.org?.gstin}
                            <p class="text-xs text-text-muted font-mono">
                                GSTIN: {data.org.gstin}
                            </p>
                        {/if}
                    </div>
                </div>

                <hr class="border-border" />

                <!-- Credit To + Date -->
                <div class="flex justify-between items-start">
                    <div class="space-y-2">
                        <p
                            class="text-xs font-bold uppercase tracking-wider text-text-muted"
                        >
                            Credit To
                        </p>
                        <h3 class="font-semibold text-text-strong">
                            {data.customer?.name}
                        </h3>
                        {#if data.customer?.company_name}
                            <p class="text-sm text-text-subtle">
                                {data.customer.company_name}
                            </p>
                        {/if}
                        {#if data.customer?.billing_address}
                            <p
                                class="text-sm text-text-subtle whitespace-pre-line max-w-xs"
                            >
                                {data.customer.billing_address}
                            </p>
                        {/if}
                        {#if data.customer?.gstin}
                            <p class="text-xs text-text-muted font-mono">
                                GSTIN: {data.customer.gstin}
                            </p>
                        {/if}
                    </div>
                    <div class="text-right space-y-1">
                        <p
                            class="text-[10px] font-bold uppercase tracking-wider text-text-muted"
                        >
                            Date
                        </p>
                        <p class="font-mono text-text-strong">
                            {formatDate(data.creditNote.credit_note_date)}
                        </p>
                    </div>
                </div>

                <!-- Details Table -->
                <div class="border rounded-md overflow-hidden">
                    <table class="w-full text-sm">
                        <thead class="bg-surface-2/50 border-b border-border">
                            <tr>
                                <th
                                    class="px-4 py-3 text-left font-medium text-text-subtle text-[10px] uppercase tracking-wide"
                                    >Description</th
                                >
                                <th
                                    class="px-4 py-3 text-right font-medium text-text-subtle text-[10px] uppercase tracking-wide"
                                    >Amount</th
                                >
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td class="px-4 py-4 text-text-strong">
                                    <p class="font-medium">
                                        {data.creditNote.reason}
                                    </p>
                                    {#if data.creditNote.notes}
                                        <p class="text-text-subtle mt-1">
                                            {data.creditNote.notes}
                                        </p>
                                    {/if}
                                </td>
                                <td
                                    class="px-4 py-4 text-right font-mono text-text-strong"
                                >
                                    {formatINR(data.creditNote.total)}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Totals -->
                <div class="flex justify-end pt-4">
                    <div class="w-64 space-y-3">
                        <div
                            class="flex justify-between items-center pt-3 border-t border-dashed border-border"
                        >
                            <span class="font-bold text-text-strong"
                                >Total Credit</span
                            >
                            <span
                                class="font-bold font-mono text-xl text-primary"
                            >
                                {formatINR(data.creditNote.total)}
                            </span>
                        </div>
                        <div
                            class="flex justify-between items-center text-sm text-text-subtle"
                        >
                            <span>Credits Remaining</span>
                            <span class="font-mono"
                                >{formatINR(data.creditNote.balance)}</span
                            >
                        </div>
                    </div>
                </div>

                <!-- Footer / Signature line -->
                <div
                    class="border-t border-border pt-8 mt-8 flex justify-between items-end"
                >
                    <div class="text-xs text-text-muted">
                        This is a computer-generated credit note.
                    </div>
                    <div class="text-center">
                        <div
                            class="w-48 border-b border-text-muted mb-1"
                        ></div>
                        <p class="text-xs text-text-muted">
                            Authorised Signatory
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
