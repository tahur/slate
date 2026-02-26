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
    <header class="print-hide page-header items-center">
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
                        class="text-slate-700"
                        title="This credit note is posted and cannot be modified"
                    >
                        <Lock class="size-4" />
                    </span>
                </div>
                <p class="text-xs text-slate-700 mt-0.5">
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
    <main class="page-body pb-32 print-bg-white">
        <div class="content-width-standard">
        <div class="mx-auto w-full max-w-[210mm]">
            <div
                class="invoice-a4-sheet bg-white border border-slate-300 shadow-sm p-8 space-y-8 min-h-[600px] print-sheet"
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
                            <h2 class="text-2xl font-bold text-[#111]">
                                Credit Note
                            </h2>
                            <p class="text-sm text-slate-700 font-mono">
                                # {data.creditNote.credit_note_number}
                            </p>
                        </div>
                    </div>
                    <div class="text-right space-y-1">
                        <h3 class="font-semibold text-[#111]">
                            {data.org?.name}
                        </h3>
                        <div
                            class="text-sm text-slate-700 whitespace-pre-line max-w-xs ml-auto"
                        >
                            {[data.org?.address, data.org?.city, data.org?.pincode]
                                .filter(Boolean)
                                .join(", ") || "Address not set in Settings"}
                        </div>
                        <p class="text-xs text-slate-700 font-mono">
                            State: {data.org?.state_code || "-"} · GSTIN: {data
                                .org?.gstin || "UNREGISTERED"}
                        </p>
                    </div>
                </div>

                <hr class="border-slate-300" />

                <!-- Credit To + Date -->
                <div class="flex justify-between items-start">
                    <div class="space-y-2">
                        <p
                            class="text-xs font-bold uppercase tracking-wide text-slate-700"
                        >
                            Credit To
                        </p>
                        <h3 class="font-semibold text-[#111]">
                            {data.customer?.name}
                        </h3>
                        {#if data.customer?.company_name}
                            <p class="text-sm text-slate-800">
                                {data.customer.company_name}
                            </p>
                        {/if}
                        {#if data.customer?.billing_address}
                            <p
                                class="text-sm text-slate-800 whitespace-pre-line max-w-xs"
                            >
                                {data.customer.billing_address}
                            </p>
                        {/if}
                        {#if data.customer?.gstin}
                            <p class="text-xs text-slate-700 font-mono">
                                GSTIN: {data.customer.gstin}
                            </p>
                        {/if}
                    </div>
                    <div class="text-right space-y-1">
                        <p
                            class="text-[10px] font-bold uppercase tracking-wide text-slate-700"
                        >
                            Date
                        </p>
                        <p class="font-mono text-[#111]">
                            {formatDate(data.creditNote.credit_note_date)}
                        </p>
                    </div>
                </div>

                <!-- Details Table -->
                <div class="border border-slate-300 overflow-hidden">
                    <table class="w-full text-sm">
                        <thead class="bg-slate-100/60 border-b border-slate-300">
                            <tr>
                                <th
                                    class="px-4 py-3 text-left font-medium text-slate-700 text-[10px] uppercase tracking-wide"
                                    >Description</th
                                >
                                <th
                                    class="px-4 py-3 text-right font-medium text-slate-700 text-[10px] uppercase tracking-wide"
                                    >Amount</th
                                >
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td class="px-4 py-4 text-[#111]">
                                    <p class="font-medium">
                                        {data.creditNote.reason}
                                    </p>
                                    {#if data.creditNote.notes}
                                        <p class="text-slate-800 mt-1">
                                            {data.creditNote.notes}
                                        </p>
                                    {/if}
                                </td>
                                <td
                                    class="px-4 py-4 text-right font-mono text-[#111]"
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
                            class="flex justify-between items-center pt-3 border-t border-dashed border-slate-300"
                        >
                            <span class="font-bold text-[#111]"
                                >Total Credit</span
                            >
                            <span
                                class="font-bold font-mono text-xl text-[#111]"
                            >
                                {formatINR(data.creditNote.total)}
                            </span>
                        </div>
                        <div
                            class="flex justify-between items-center text-sm text-slate-700"
                        >
                            <span>Credits Remaining</span>
                            <span class="font-mono text-[#111]"
                                >{formatINR(data.creditNote.balance)}</span
                            >
                        </div>
                    </div>
                </div>

                <!-- Footer / Signature line -->
                <div
                    class="border-t border-slate-300 pt-8 mt-8 flex justify-between items-end"
                >
                    <div class="text-xs text-slate-700">
                        This is a computer-generated credit note.
                    </div>
                    <div class="text-center">
                        <div
                            class="w-48 border-b border-slate-400 mb-1"
                        ></div>
                        <p class="text-xs text-slate-700">
                            Authorised Signatory
                        </p>
                    </div>
                </div>
            </div>
        </div>
        </div>
    </main>
</div>
