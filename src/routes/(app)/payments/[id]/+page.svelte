<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { ArrowLeft, Printer, Lock } from "lucide-svelte";
    import * as ButtonGroup from "$lib/components/ui/button-group";
    import WhatsAppShareButton from "$lib/components/ui/WhatsAppShareButton.svelte";
    import { getPaymentWhatsAppUrl } from "$lib/utils/whatsapp";
    import { formatINR } from "$lib/utils/currency";
    import { formatDate } from "$lib/utils/date";

    let { data } = $props();
    const { payment, customer, org } = data;

    const whatsappUrl = getPaymentWhatsAppUrl({
        paymentNumber: payment.payment_number,
        customerName: customer?.name || "Customer",
        customerPhone: customer?.phone,
        amount: payment.amount,
        date: payment.payment_date,
        orgName: org?.name || "Our Company",
        mode: payment.payment_mode,
    });

    const FALLBACK_LABELS: Record<string, string> = {
        cash: "Cash",
        bank: "Bank Transfer",
        upi: "UPI",
        cheque: "Cheque",
    };

    function getModeLabel(mode: string): string {
        const found = data.paymentModes.find((m: any) => m.mode_key === mode);
        return found?.label || FALLBACK_LABELS[mode] || mode;
    }

    const totalAllocated = $derived(
        data.allocations.reduce((s: number, a: any) => s + a.amount, 0),
    );
    const excess = $derived(data.payment.amount - totalAllocated);
</script>

<div class="page-full-bleed">
    <!-- Header (hidden in print) -->
    <header class="print-hide page-header items-center">
        <div class="flex items-center gap-4">
            <Button
                variant="ghost"
                href="/payments"
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
                        {data.payment.payment_number}
                    </h1>
                    <span
                        class="text-slate-700"
                        title="This receipt is posted and cannot be modified"
                    >
                        <Lock class="size-4" />
                    </span>
                </div>
                <p class="text-xs text-slate-700 mt-0.5">
                    Receipt date {formatDate(data.payment.payment_date)}
                </p>
            </div>
        </div>
        <ButtonGroup.Root>
            <Button variant="outline" size="sm" onclick={() => window.print()}>
                <Printer class="size-4 mr-2" />
                Print Receipt
            </Button>
            <WhatsAppShareButton url={whatsappUrl} />
        </ButtonGroup.Root>
    </header>

    <!-- Content: Paper View -->
    <div class="page-body pb-32 print-bg-white">
        <div class="content-width-standard">
        <div class="mx-auto w-full max-w-[210mm]">
            <div
                class="invoice-a4-sheet bg-white border border-slate-300 shadow-sm p-8 space-y-8 print-sheet"
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
                                Receipt Voucher
                            </h2>
                            <p class="text-sm text-slate-700 font-mono">
                                # {data.payment.payment_number}
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

                <!-- Received From + Payment Meta -->
                <div class="flex justify-between items-start">
                    <div class="space-y-2">
                        <p
                            class="text-xs font-bold uppercase tracking-wide text-slate-700"
                        >
                            Received From
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
                    <div class="text-right space-y-4">
                        <div class="space-y-1">
                            <p
                                class="text-[10px] font-bold uppercase tracking-wide text-slate-700"
                            >
                                Receipt Date
                            </p>
                            <p class="font-mono text-[#111]">
                                {formatDate(data.payment.payment_date)}
                            </p>
                        </div>
                        <div class="space-y-1">
                            <p
                                class="text-[10px] font-bold uppercase tracking-wide text-slate-700"
                            >
                                Payment Method
                            </p>
                            <p class="text-[#111]">
                                {getModeLabel(data.payment.payment_mode)}
                            </p>
                        </div>
                        {#if data.payment.reference}
                            <div class="space-y-1">
                                <p
                                    class="text-[10px] font-bold uppercase tracking-wide text-slate-700"
                                >
                                    Reference
                                </p>
                                <p class="font-mono text-[#111]">
                                    {data.payment.reference}
                                </p>
                            </div>
                        {/if}
                    </div>
                </div>

                <!-- Amount Received (Hero) -->
                <div
                    class="bg-positive/5 border border-positive/20 rounded-lg p-6 text-center"
                >
                    <p
                        class="text-xs font-bold uppercase tracking-wide text-positive mb-2"
                    >
                        Amount Received
                    </p>
                    <p class="text-3xl font-bold font-mono text-[#111]">
                        {formatINR(data.payment.amount)}
                    </p>
                </div>

                <!-- Invoice Allocations Table -->
                {#if data.allocations.length > 0}
                    <div>
                        <p
                            class="text-xs font-bold uppercase tracking-wide text-slate-700 mb-3"
                        >
                            Adjusted Against Bills
                        </p>
                        <div class="border border-slate-300 overflow-hidden">
                            <table class="w-full text-sm">
                                <thead
                                    class="bg-slate-100/60 border-b border-slate-300"
                                >
                                    <tr>
                                        <th
                                            class="px-4 py-3 text-left font-medium text-slate-700 text-[10px] uppercase tracking-wide"
                                            >Bill #</th
                                        >
                                        <th
                                            class="px-4 py-3 text-left font-medium text-slate-700 text-[10px] uppercase tracking-wide"
                                            >Bill Date</th
                                        >
                                        <th
                                            class="px-4 py-3 text-right font-medium text-slate-700 text-[10px] uppercase tracking-wide"
                                            >Bill Total</th
                                        >
                                        <th
                                            class="px-4 py-3 text-right font-medium text-slate-700 text-[10px] uppercase tracking-wide"
                                            >Adjusted Amount</th
                                        >
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-slate-200">
                                    {#each data.allocations as alloc}
                                        <tr>
                                            <td class="px-4 py-3">
                                                <a
                                                    href="/invoices/{alloc.invoice_id}"
                                                    class="font-mono text-[#111] hover:underline print-no-link"
                                                >
                                                    {alloc.invoice_number}
                                                </a>
                                            </td>
                                            <td
                                                class="px-4 py-3 text-slate-800"
                                            >
                                                {formatDate(alloc.invoice_date)}
                                            </td>
                                            <td
                                                class="px-4 py-3 text-right font-mono text-slate-800"
                                            >
                                                {formatINR(
                                                    alloc.invoice_total,
                                                )}
                                            </td>
                                            <td
                                                class="px-4 py-3 text-right font-mono font-medium text-positive"
                                            >
                                                {formatINR(alloc.amount)}
                                            </td>
                                        </tr>
                                    {/each}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Summary -->
                    <div class="flex justify-end">
                        <div class="w-64 space-y-3">
                            <div
                                class="flex justify-between items-center text-sm text-slate-700"
                            >
                                <span>Total Adjusted</span>
                                <span class="font-mono font-medium text-[#111]">
                                    {formatINR(totalAllocated)}
                                </span>
                            </div>
                            {#if excess > 0.01}
                                <div
                                    class="flex justify-between items-center text-sm pt-2 border-t border-dashed border-slate-300"
                                >
                                    <span class="font-medium text-warning"
                                        >Advance Balance</span
                                    >
                                    <span
                                        class="font-mono font-bold text-warning"
                                    >
                                        {formatINR(excess)}
                                    </span>
                                </div>
                            {/if}
                        </div>
                    </div>
                {/if}

                <!-- Notes -->
                {#if data.payment.notes}
                    <div class="border-t border-slate-300 pt-6">
                        <p
                            class="text-[10px] font-bold uppercase tracking-wide text-slate-700 mb-2"
                        >
                            Notes
                        </p>
                        <p class="text-sm text-slate-800 whitespace-pre-wrap">
                            {data.payment.notes}
                        </p>
                    </div>
                {/if}

                <!-- Footer / Signature line -->
                <div
                    class="border-t border-slate-300 pt-8 mt-8 flex justify-between items-end"
                >
                    <div class="text-xs text-slate-700">
                        This is a computer-generated receipt.
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
    </div>
</div>
