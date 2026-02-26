<script lang="ts">
    import { Button, buttonVariants } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import { Badge } from "$lib/components/ui/badge";
    import StatusBadge from "$lib/components/ui/badge/StatusBadge.svelte";
    import {
        ArrowLeft,
        Printer,
        Send,
        Download,
        XCircle,
        Lock,
        Pencil,
        Trash2,
    } from "lucide-svelte";
    import PaymentOptionChips from "$lib/components/PaymentOptionChips.svelte";
    import { enhance } from "$app/forms";
    import { toast } from "svelte-sonner";
    import * as AlertDialog from "$lib/components/ui/alert-dialog";
    import * as ButtonGroup from "$lib/components/ui/button-group";
    import WhatsAppShareButton from "$lib/components/ui/WhatsAppShareButton.svelte";
    import { getInvoiceWhatsAppUrl } from "$lib/utils/whatsapp";
    import { page } from "$app/stores";
    import { formatINR, numberToWords } from "$lib/utils/currency";
    import { formatDate, localDateStr } from "$lib/utils/date";
    import { INDIAN_STATES } from "../../customers/new/schema";

    function stateName(code: string | null | undefined): string {
        if (!code) return "";
        const state = INDIAN_STATES.find((s) => s.code === code);
        return state ? `${state.name} (${code})` : code;
    }

    let { data, form } = $props();

    // Generate WhatsApp share URL
    const whatsappUrl = $derived(
        getInvoiceWhatsAppUrl({
            invoiceNumber: data.invoice.invoice_number,
            customerName: data.customer?.name || "Customer",
            customerPhone: data.customer?.phone,
            total: data.invoice.total,
            balanceDue: data.invoice.balance_due,
            dueDate: data.invoice.due_date,
            orgName: data.org?.name || "Our Company",
            pdfUrl: `${$page.url.origin}/api/invoices/${data.invoice.id}/pdf`,
        }),
    );
    let isSubmitting = $state(false);
    let isDownloading = $state(false);
    let showSettleModal = $state(false);

    // Settlement State
    let selectedCredits = $state<any[]>([]);

    // Computed totals
    let selectedCreditsTotal = $derived(
        selectedCredits.reduce((sum, c) => sum + c.amount, 0),
    );

    let netPayable = $derived(
        Math.max(0, data.invoice.balance_due - selectedCreditsTotal),
    );

    // Payment Form State
    let paymentAmount = $state(0);
    const defaultPaymentOption =
        data.paymentOptions.find((o: any) => o.isDefault) ||
        data.paymentOptions[0];
    let selectedOptionKey = $state(
        defaultPaymentOption
            ? `${defaultPaymentOption.methodKey}::${defaultPaymentOption.accountId}`
            : "",
    );
    let paymentMode = $state(defaultPaymentOption?.methodKey || "");
    let depositTo = $state(defaultPaymentOption?.accountId || "");
    let paymentDate = $state(localDateStr());
    let paymentReference = $state("");

    function selectPaymentOption(option: any) {
        selectedOptionKey = `${option.methodKey}::${option.accountId}`;
        paymentMode = option.methodKey;
        depositTo = option.accountId;
    }

    // Auto-update payment amount when credits change
    $effect(() => {
        paymentAmount = netPayable;
    });

    function openSettleModal() {
        if (data.invoice.balance_due <= 0.01) {
            toast.info("Invoice is already fully paid");
            return;
        }
        selectedCredits = [];
        paymentAmount = data.invoice.balance_due;
        paymentMode = defaultPaymentOption?.methodKey || "";
        depositTo = defaultPaymentOption?.accountId || "";
        selectedOptionKey = defaultPaymentOption
            ? `${defaultPaymentOption.methodKey}::${defaultPaymentOption.accountId}`
            : "";
        paymentDate = localDateStr();
        paymentReference = "";
        showSettleModal = true;
    }

    async function downloadPdf() {
        isDownloading = true;
        try {
            const res = await fetch(`/api/invoices/${data.invoice.id}/pdf`);
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || "Failed to generate PDF");
            }
            const blob = new Blob([await res.arrayBuffer()], {
                type: "application/pdf",
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${data.invoice.invoice_number}.pdf`;
            a.style.display = "none";
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 5000);
        } catch (e) {
            console.error("PDF download failed:", e);
            toast.error("Failed to generate PDF");
        } finally {
            isDownloading = false;
        }
    }
</script>

<div class="page-full-bleed">
    <!-- Header -->
    <header class="print-hide page-header p-0">
        <!-- Header row: back + invoice info + actions -->
        <div
            class="flex w-full flex-wrap sm:flex-nowrap items-start sm:items-center gap-3 px-4 md:px-6 py-3"
        >
            <Button
                variant="ghost"
                href="/invoices"
                size="icon"
                class="h-8 w-8 shrink-0"
            >
                <ArrowLeft class="size-4" />
            </Button>
            <div class="flex flex-col min-w-0 flex-1">
                <div class="flex items-center gap-2">
                    <h1
                        class="text-sm md:text-xl font-bold tracking-tight text-[#111] font-mono truncate"
                    >
                        {data.invoice.invoice_number}
                    </h1>
                    <StatusBadge status={data.invoice.status} />
                    {#if data.invoice.status !== "draft"}
                        <span
                            class="text-slate-400 shrink-0"
                            title="This invoice is posted and cannot be modified"
                        >
                            <Lock class="size-3.5" />
                        </span>
                    {/if}
                </div>
                {#if data.invoice.issued_at}
                    <p class="text-xs text-slate-400 mt-0.5">
                        Issued on {formatDate(data.invoice.issued_at)}
                    </p>
                {/if}
            </div>

            <div
                class="flex w-full items-center justify-end gap-2 flex-wrap sm:w-auto sm:flex-nowrap sm:ml-auto"
            >
                {#if data.invoice.status === "draft"}
                    <form method="POST" action="?/issue" use:enhance>
                        <Button type="submit" size="sm">
                            <Send class="mr-1.5 size-3" /> Issue
                        </Button>
                    </form>

                    <Button
                        variant="outline"
                        size="sm"
                        href="/invoices/{data.invoice.id}/edit"
                    >
                        <Pencil class="size-3.5 mr-1.5" />
                        Edit
                    </Button>

                    <!-- Delete with AlertDialog -->
                    <AlertDialog.Root>
                        <AlertDialog.Trigger
                            class={buttonVariants({
                                variant: "destructive",
                                size: "icon-sm",
                            })}
                            aria-label="Delete draft invoice"
                        >
                            <Trash2 class="size-4" />
                        </AlertDialog.Trigger>
                        <AlertDialog.Content>
                            <AlertDialog.Header>
                                <AlertDialog.Title
                                    >Delete draft invoice?</AlertDialog.Title
                                >
                                <AlertDialog.Description>
                                    This action cannot be undone. This will
                                    permanently delete the draft invoice
                                    <span
                                        class="font-mono text-xs bg-slate-100 px-1 py-0.5 rounded text-slate-900"
                                        >{data.invoice.invoice_number}</span
                                    >
                                    from the database.
                                </AlertDialog.Description>
                            </AlertDialog.Header>
                            <AlertDialog.Footer>
                                <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
                                <form
                                    method="POST"
                                    action="?/delete"
                                    use:enhance
                                >
                                    <AlertDialog.Action
                                        type="submit"
                                        variant="destructive"
                                    >
                                        Delete
                                    </AlertDialog.Action>
                                </form>
                            </AlertDialog.Footer>
                        </AlertDialog.Content>
                    </AlertDialog.Root>
                {/if}

                {#if data.invoice.status !== "draft"}
                    <WhatsAppShareButton url={whatsappUrl} />
                {/if}

                <div class="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onclick={downloadPdf}
                        disabled={isDownloading}
                    >
                        <Download class="mr-1.5 size-3" />
                        {isDownloading ? "..." : "PDF"}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onclick={() => window.print()}
                    >
                        <Printer class="mr-1.5 size-3" /> Print
                    </Button>
                </div>
            </div>
        </div>
    </header>

    <!-- Alerts -->
    {#if form?.error}
        <div
            class="mx-6 mt-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20 flex items-center gap-2"
        >
            <XCircle class="size-4 flex-shrink-0" />
            {form.error}
        </div>
    {/if}

    {#if form?.success}
        <div
            class="mx-6 mt-4 p-3 rounded-lg bg-green-50 text-green-700 text-sm border border-green-200"
        >
            {#if form.invoiceNumber}
                Invoice issued successfully as <span
                    class="font-mono font-medium">{form.invoiceNumber}</span
                >
            {:else}
                Action completed successfully
            {/if}
        </div>
    {/if}

    {#if data.justRecordedPayment}
        <div
            class="mx-6 mt-4 p-3 rounded-lg bg-slate-50 text-[#111] text-sm border border-slate-200"
        >
            Payment recorded: <span class="font-mono font-medium"
                >{formatINR(data.invoice.amount_paid || 0)}</span
            >
            · Balance due
            <span class="font-mono font-medium"
                >{formatINR(data.invoice.balance_due)}</span
            >
        </div>
    {/if}

    <!-- Content: Paper View (Tally-style) -->
    <main
        class="page-body print-bg-white"
    >
        <div class="content-width-standard">
        <div class="mx-auto max-w-4xl">
            <!-- Main Paper Sheet -->
            <div
                class="bg-white border border-slate-300 rounded-lg shadow-sm print-sheet"
            >
                <!-- ═══ Compact Header: Company + Customer + Invoice Meta ═══ -->
                <div
                    class="quotation-meta-block px-4 pt-3 pb-2 md:px-6 md:pt-4 md:pb-3 break-inside-avoid"
                >
                    <div class="flex justify-between items-start gap-3 print:gap-2">
                        <div class="space-y-1 min-w-0">
                            {#if data.org?.logo_url}
                                <img
                                    src={data.org.logo_url}
                                    alt={data.org.name}
                                    class="h-9 md:h-11 w-auto object-contain print:h-8"
                                />
                            {/if}
                            <h2
                                class="text-sm md:text-base print:text-[13px] font-bold text-[#111] uppercase tracking-wide"
                            >
                                {data.org?.name || "COMPANY NAME"}
                            </h2>
                            <p class="text-[11px] print:text-[10px] text-slate-400 leading-tight">
                                {[
                                    data.org?.address,
                                    data.org?.city,
                                    data.org?.pincode,
                                ]
                                    .filter(Boolean)
                                    .join(", ")}
                            </p>
                            <div
                                class="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] print:text-[10px] text-slate-400"
                            >
                                {#if data.org?.state_code}
                                    <span>State: {stateName(data.org.state_code)}</span>
                                {/if}
                                {#if data.org?.gstin}
                                    <span class="font-mono text-[#111]"
                                        >GSTIN: {data.org.gstin}</span
                                    >
                                {/if}
                                {#if data.org?.phone}
                                    <span>Phone: {data.org.phone}</span>
                                {/if}
                            </div>
                        </div>

                        <div class="text-right space-y-1 shrink-0">
                            <p
                                class="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400"
                            >
                                Document Type
                            </p>
                            <h1
                                class="text-xl md:text-2xl font-bold text-[#111] tracking-tight"
                            >
                                TAX INVOICE
                            </h1>
                            {#if data.invoice.balance_due <= 0.01 && data.invoice.amount_paid && data.invoice.amount_paid > 0}
                                <span
                                    class="inline-block text-sm font-bold text-green-600 border border-green-300 bg-green-50 px-3 py-0.5 rounded"
                                    >PAID</span
                                >
                            {/if}
                            {#if data.invoice.prices_include_gst}
                                <span
                                    class="inline-block text-[10px] font-semibold uppercase tracking-wide bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded"
                                >
                                    Prices include GST
                                </span>
                            {/if}
                        </div>
                    </div>

                    <div
                        class="quotation-meta-grid mt-2 grid grid-cols-1 md:grid-cols-[1.35fr_1fr] print:grid-cols-[1.35fr_1fr] gap-2 print:gap-1.5"
                    >
                        <div class="border border-slate-200 rounded-sm p-2 print:p-1.5">
                            <p
                                class="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5"
                            >
                                Customer Details
                            </p>
                            <div class="grid grid-cols-[auto,1fr] gap-x-2 gap-y-0.5 text-[10px]">
                                <span class="text-slate-400">Name</span>
                                <span class="text-[#111] font-medium truncate">
                                    {data.customer?.name || "UNKNOWN"}{#if data
                                        .customer
                                        ?.company_name}
                                        · {data.customer.company_name}{/if}
                                </span>

                                <span class="text-slate-400">Address</span>
                                <span class="text-slate-500 truncate">
                                    {[
                                        data.customer?.billing_address,
                                        data.customer?.city,
                                        data.customer?.pincode,
                                    ]
                                        .filter(Boolean)
                                        .join(", ")}
                                </span>

                                {#if data.customer?.state_code}
                                    <span class="text-slate-400">State</span>
                                    <span class="text-slate-500 truncate">
                                        {stateName(data.customer.state_code)}
                                    </span>
                                {/if}

                                {#if data.customer?.gstin}
                                    <span class="text-slate-400">GSTIN</span>
                                    <span class="font-mono text-[#111] truncate">
                                        {data.customer.gstin}
                                    </span>
                                {/if}
                            </div>
                        </div>

                        <div class="border border-slate-200 rounded-sm p-2 print:p-1.5">
                            <p
                                class="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5"
                            >
                                Invoice Details
                            </p>
                            <div class="grid grid-cols-[auto,1fr] gap-x-2 gap-y-0.5 text-[10px]">
                                <span class="text-slate-400">Invoice No</span>
                                <span
                                    class="text-right font-mono font-semibold text-[#111]"
                                    >{data.invoice.invoice_number}</span
                                >

                                <span class="text-slate-400">Date</span>
                                <span class="text-right text-[#111]"
                                    >{formatDate(data.invoice.invoice_date)}</span
                                >

                                <span class="text-slate-400">Due Date</span>
                                <span class="text-right font-semibold text-[#111]"
                                    >{formatDate(data.invoice.due_date)}</span
                                >

                                {#if data.customer?.state_code}
                                    <span class="text-slate-400"
                                        >Place of Supply</span
                                    >
                                    <span class="text-right text-[#111]"
                                        >{stateName(
                                            data.customer.state_code,
                                        )}</span
                                    >
                                {/if}

                                {#if data.invoice.order_number}
                                    <span class="text-slate-400">Order No</span>
                                    <span
                                        class="text-right font-mono text-[#111]"
                                        >{data.invoice.order_number}</span
                                    >
                                {/if}

                                <span class="text-slate-400">Supply Type</span>
                                <span class="text-right text-[#111]">
                                    {data.invoice.is_inter_state
                                        ? "Inter-State (IGST)"
                                        : "Intra-State (CGST+SGST)"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- ═══ Separator ═══ -->
                <div class="mx-6 border-t border-slate-200"></div>

                <!-- ═══ Items Table ═══ -->
                <div class="px-4 py-3 md:px-6 md:py-4">
                    <div
                        class="border border-slate-300 rounded-sm overflow-hidden"
                    >
                        <table class="w-full table-fixed border-collapse text-[11px]">
                            <thead>
                                <tr
                                    class="bg-slate-100/60 text-[10px] uppercase tracking-wider font-bold text-slate-400"
                                >
                                    <th
                                        class="border border-slate-200 px-2 py-1.5 text-center w-8"
                                        >#</th
                                    >
                                    <th class="border border-slate-200 px-2 py-1.5 text-left"
                                        >Description</th
                                    >
                                    <th class="border border-slate-200 px-2 py-1.5 text-center w-20"
                                        >HSN/SAC</th
                                    >
                                    <th class="border border-slate-200 px-2 py-1.5 text-center w-14">Qty</th>
                                    <th class="border border-slate-200 px-2 py-1.5 text-right w-24">Rate</th>
                                    {#if data.invoice.is_inter_state}
                                        <th class="border border-slate-200 px-2 py-1.5 text-right w-24"
                                            >IGST</th
                                        >
                                    {:else}
                                        <th class="border border-slate-200 px-2 py-1.5 text-right w-24"
                                            >CGST</th
                                        >
                                        <th class="border border-slate-200 px-2 py-1.5 text-right w-24"
                                            >SGST</th
                                        >
                                    {/if}
                                    <th class="border border-slate-200 px-2 py-1.5 text-right w-24"
                                        >Amount</th
                                    >
                                </tr>
                            </thead>
                            <tbody>
                                {#each data.items as item, i}
                                    {@const halfRate = (item.gst_rate || 0) / 2}
                                    {@const lineCgst = item.cgst || 0}
                                    {@const lineSgst = item.sgst || 0}
                                    {@const lineIgst = item.igst || 0}
                                    {@const descLines = item.description.split("\n")}
                                    <tr>
                                        <td
                                            class="border border-slate-200 px-2 py-1.5 text-center text-[11px] text-slate-400 align-top"
                                            >{i + 1}</td
                                        >
                                        <td class="border border-slate-200 px-2 py-1.5 align-top">
                                            <div
                                                class="font-medium text-[#111] text-[11px] leading-tight"
                                            >
                                                {descLines[0]}
                                            </div>
                                            {#if descLines.length > 1}
                                                <div class="text-[10px] text-slate-400 mt-0.5 whitespace-pre-wrap">
                                                    {descLines.slice(1).join("\n")}
                                                </div>
                                            {/if}
                                            {#if item.unit && item.unit !== "nos"}
                                                <div
                                                    class="text-[10px] text-slate-400 mt-0.5"
                                                >
                                                    Unit: {item.unit}
                                                </div>
                                            {/if}
                                        </td>
                                        <td
                                            class="border border-slate-200 px-2 py-1.5 text-center font-mono text-[11px] text-slate-400 align-top"
                                            >{item.hsn_code || "—"}</td
                                        >
                                        <td
                                            class="border border-slate-200 px-2 py-1.5 text-center font-mono text-[11px] text-slate-400 align-top"
                                            >{item.quantity}</td
                                        >
                                        <td
                                            class="border border-slate-200 px-2 py-1.5 text-right font-mono text-[11px] text-slate-400 align-top"
                                            >{formatINR(item.rate)}</td
                                        >
                                        {#if data.invoice.is_inter_state}
                                            <td class="border border-slate-200 px-2 py-1.5 text-right align-top">
                                                <div class="font-mono text-[11px]">
                                                    <span class="text-slate-400"
                                                        >{item.gst_rate}% · </span
                                                    >
                                                    {formatINR(lineIgst)}
                                                </div>
                                            </td>
                                        {:else}
                                            <td class="border border-slate-200 px-2 py-1.5 text-right align-top">
                                                <div class="font-mono text-[11px]">
                                                    <span class="text-slate-400"
                                                        >{halfRate}% · </span
                                                    >
                                                    {formatINR(lineCgst)}
                                                </div>
                                            </td>
                                            <td class="border border-slate-200 px-2 py-1.5 text-right align-top">
                                                <div class="font-mono text-[11px]">
                                                    <span class="text-slate-400"
                                                        >{halfRate}% · </span
                                                    >
                                                    {formatINR(lineSgst)}
                                                </div>
                                            </td>
                                        {/if}
                                        <td
                                            class="border border-slate-200 px-2 py-1.5 text-right font-mono text-[11px] font-bold text-[#111] align-top"
                                            >{formatINR(item.amount)}</td
                                        >
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- ═══ Footer: Words + Bank + Notes | Summary + Signature ═══ -->
                <div class="px-6 pb-6">
                    <div class="flex flex-col md:flex-row gap-6">
                        <!-- Left column: Total in words, Bank, Notes, Terms -->
                        <div class="flex-1 space-y-4">
                            <div>
                                <p
                                    class="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1"
                                >
                                    Total In Words
                                </p>
                                <p
                                    class="text-xs font-semibold italic text-[#111]"
                                >
                                    {numberToWords(data.invoice.total || 0)}
                                </p>
                            </div>

                            {#if data.org?.bank_name || data.org?.account_number}
                                <div>
                                    <p
                                        class="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1"
                                    >
                                        Bank Details
                                    </p>
                                    <div
                                        class="text-xs text-slate-500 space-y-0.5 leading-relaxed"
                                    >
                                        {#if data.org?.bank_name}<p>
                                                Bank: {data.org.bank_name}
                                            </p>{/if}
                                        {#if data.org?.account_number}<p>
                                                A/c No: <span class="font-mono"
                                                    >{data.org
                                                        .account_number}</span
                                                >
                                            </p>{/if}
                                        {#if data.org?.ifsc}<p>
                                                IFSC: <span class="font-mono"
                                                    >{data.org.ifsc}</span
                                                >
                                            </p>{/if}
                                        {#if data.org?.branch}<p>
                                                Branch: {data.org.branch}
                                            </p>{/if}
                                    </div>
                                </div>
                            {/if}

                            {#if data.invoice.notes}
                                <div>
                                    <p
                                        class="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1"
                                    >
                                        Notes
                                    </p>
                                    <p
                                        class="text-xs text-slate-500 whitespace-pre-wrap"
                                    >
                                        {data.invoice.notes}
                                    </p>
                                </div>
                            {/if}

                            {#if data.invoice.terms}
                                <div>
                                    <p
                                        class="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1"
                                    >
                                        Terms & Conditions
                                    </p>
                                    <p
                                        class="text-xs text-slate-500 whitespace-pre-wrap leading-relaxed"
                                    >
                                        {data.invoice.terms}
                                    </p>
                                </div>
                            {/if}
                        </div>

                        <!-- Right column: Tax summary + Signature -->
                        <div class="w-full md:w-72 space-y-4">
                            <div class="space-y-2 text-sm">
                                <div
                                    class="flex justify-between text-slate-400"
                                >
                                    <span class="text-xs">Sub Total</span>
                                    <span
                                        class="font-mono text-xs text-[#111]"
                                        >{formatINR(
                                            data.invoice.subtotal,
                                        )}</span
                                    >
                                </div>

                                {#if data.invoice.is_inter_state}
                                    <div
                                        class="flex justify-between text-slate-400"
                                    >
                                        <span class="text-xs">IGST</span>
                                        <span
                                            class="font-mono text-xs text-[#111]"
                                            >{formatINR(
                                                data.invoice.igst,
                                            )}</span
                                        >
                                    </div>
                                {:else}
                                    <div
                                        class="flex justify-between text-slate-400"
                                    >
                                        <span class="text-xs">CGST</span>
                                        <span
                                            class="font-mono text-xs text-[#111]"
                                            >{formatINR(
                                                data.invoice.cgst,
                                            )}</span
                                        >
                                    </div>
                                    <div
                                        class="flex justify-between text-slate-400"
                                    >
                                        <span class="text-xs">SGST</span>
                                        <span
                                            class="font-mono text-xs text-[#111]"
                                            >{formatINR(
                                                data.invoice.sgst,
                                            )}</span
                                        >
                                    </div>
                                {/if}

                                <div
                                    class="border-t border-slate-300 pt-2 flex justify-between items-center bg-slate-100/50 -mx-2 px-2 py-1.5 rounded"
                                >
                                    <span
                                        class="font-bold text-sm text-[#111]"
                                        >GRAND TOTAL</span
                                    >
                                    <span
                                        class="font-mono text-base font-bold text-[#111]"
                                        >{formatINR(data.invoice.total)}</span
                                    >
                                </div>

                                {#if data.paymentHistory && data.paymentHistory.length > 0}
                                    <div
                                        class="space-y-1.5 border-t border-dashed border-slate-200 pt-2"
                                    >
                                        {#each data.paymentHistory as txn}
                                            <div
                                                class="flex justify-between text-xs"
                                            >
                                                <span class="text-slate-400">
                                                    {#if txn.type === "credit_note"}
                                                        <span
                                                            class="text-blue-600"
                                                            >Adjusted</span
                                                        >
                                                        <span
                                                            class="font-mono text-[10px]"
                                                            >({txn.reference})</span
                                                        >
                                                    {:else if txn.type === "advance"}
                                                        <span
                                                            class="text-purple-600"
                                                            >Advance</span
                                                        >
                                                        <span
                                                            class="font-mono text-[10px]"
                                                            >({txn.reference})</span
                                                        >
                                                    {:else}
                                                        <span
                                                            class="text-green-600"
                                                            >Payment</span
                                                        >
                                                        <span
                                                            class="font-mono text-[10px]"
                                                            >({txn.reference})</span
                                                        >
                                                    {/if}
                                                </span>
                                                <span
                                                    class="font-mono text-green-600"
                                                    >(-) {formatINR(
                                                        txn.amount,
                                                    )}</span
                                                >
                                            </div>
                                        {/each}
                                    </div>
                                {/if}

                                {#if data.invoice.balance_due > 0.01}
                                    <div
                                        class="flex justify-between font-bold text-sm pt-2 border-t border-slate-300"
                                    >
                                        <span class="text-red-600"
                                            >BALANCE DUE</span
                                        >
                                        <span class="font-mono text-red-600"
                                            >{formatINR(
                                                data.invoice.balance_due,
                                            )}</span
                                        >
                                    </div>
                                {/if}
                            </div>

                            <!-- Signature Block -->
                            <div class="pt-8 text-center">
                                <div
                                    class="border-t border-slate-300 w-40 mx-auto"
                                ></div>
                                <p
                                    class="text-xs font-bold text-[#111] mt-2 uppercase"
                                >
                                    For {data.org?.name || "Company"}
                                </p>
                                <p class="text-[10px] text-slate-400 mt-0.5">
                                    Authorized Signatory
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <p class="text-center text-[10px] text-slate-400 mt-3">
                This is a computer-generated invoice and does not require a
                physical signature.
            </p>
        </div>
        </div>
    </main>

    <!-- Bottom Action Bar -->
    {#if data.invoice.status !== "draft" && data.invoice.status !== "cancelled" && data.invoice.balance_due > 0.01}
        <div class="action-bar">
            <!-- Amount + Button grouped on right for better UX -->
            <div class="flex items-center gap-4 ml-auto">
                <div class="flex items-center gap-3">
                    {#if data.invoice.amount_paid && data.invoice.amount_paid > 0}
                        <span
                            class="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded"
                            >Partially Paid</span
                        >
                    {/if}
                    <div class="flex flex-col items-end">
                        <span
                            class="text-[10px] uppercase tracking-wide text-slate-400 font-semibold"
                            >Pending</span
                        >
                        <span
                            class="font-mono text-lg font-bold text-[#111]"
                            >{formatINR(data.invoice.balance_due)}</span
                        >
                    </div>
                </div>
                <Button onclick={openSettleModal}>
                    {data.invoice.amount_paid && data.invoice.amount_paid > 0
                        ? "Receive Payment"
                        : "Settle & Close"}
                </Button>
            </div>
        </div>
    {/if}
</div>

<!-- Settle Invoice Modal -->
{#if showSettleModal}
    <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
    >
        <div
            class="bg-white rounded-xl shadow-xl w-full max-w-md border border-slate-200 overflow-hidden"
        >
            <div
                class="px-5 py-4 border-b border-slate-200 flex items-center justify-between"
            >
                <div>
                    <h3 class="text-base font-semibold text-[#111]">
                        Receive payment
                    </h3>
                    <p class="text-xs text-slate-400 mt-0.5">
                        Adjust credits or receive amount to settle this bill.
                    </p>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    class="h-8 w-8"
                    onclick={() => (showSettleModal = false)}
                    aria-label="Close"
                >
                    <XCircle class="size-4" />
                </Button>
            </div>

            <form
                method="POST"
                action="?/settle"
                use:enhance={() => {
                    isSubmitting = true;
                    return async ({ result, update }) => {
                        isSubmitting = false;
                        if (result.type === "success") {
                            showSettleModal = false;
                            toast.success("Invoice settled successfully");
                            await update();
                        } else if (result.type === "failure") {
                            const errorMsg =
                                (result.data as { error?: string })?.error ||
                                "Settlement failed";
                            toast.error(errorMsg);
                        }
                    };
                }}
            >
                <div class="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
                    <!-- Amount due -->
                    <div class="flex items-center justify-between py-2">
                        <span class="text-sm text-slate-400"
                            >Pending amount</span
                        >
                        <span
                            class="text-xl font-bold font-mono text-[#111]"
                            >{formatINR(data.invoice.balance_due)}</span
                        >
                    </div>

                    <!-- Credits (if any) -->
                    {#if data.availableCredits && data.availableCredits.length > 0}
                        <div class="space-y-2">
                            <div class="flex items-center justify-between">
                                <Label
                                    class="text-xs font-semibold uppercase tracking-wider text-slate-400"
                                    >Apply credits</Label
                                >
                                {#if selectedCreditsTotal > 0}
                                    <span class="text-xs font-mono text-[#111]"
                                        >−{formatINR(
                                            selectedCreditsTotal,
                                        )}</span
                                    >
                                {/if}
                            </div>
                            <div class="space-y-1.5">
                                {#each data.availableCredits as credit}
                                    <label
                                        class="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-slate-200 bg-[#FAFAFA] cursor-pointer hover:bg-slate-100 has-[:checked]:border-slate-400 has-[:checked]:bg-slate-50"
                                    >
                                        <input
                                            type="checkbox"
                                            bind:group={selectedCredits}
                                            value={credit}
                                            class="sr-only peer"
                                        />
                                        <span class="text-sm text-[#111]"
                                            >{credit.type === "credit_note"
                                                ? "Credit note"
                                                : "Advance"} #{credit.number}</span
                                        >
                                        <span
                                            class="text-sm font-mono text-slate-500"
                                            >{formatINR(credit.amount)}</span
                                        >
                                    </label>
                                {/each}
                            </div>
                        </div>
                    {/if}

                    <!-- Payment -->
                    <div class="space-y-3 pt-2 border-t border-slate-200">
                        <Label
                            class="text-xs font-semibold uppercase tracking-wider text-slate-400"
                            >Receipt</Label
                        >
                        <div class="grid grid-cols-2 gap-3">
                            <div class="space-y-1">
                                <Label
                                    for="payment_amount"
                                    variant="form"
                                    class="text-xs">Amount</Label
                                >
                                <Input
                                    id="payment_amount"
                                    name="payment_amount"
                                    type="number"
                                    step="0.01"
                                    bind:value={paymentAmount}
                                    class="font-mono"
                                />
                            </div>
                            <div class="space-y-1">
                                <Label
                                    for="payment_date"
                                    variant="form"
                                    class="text-xs">Receipt Date</Label
                                >
                                <Input
                                    id="payment_date"
                                    name="payment_date"
                                    type="date"
                                    bind:value={paymentDate}
                                />
                            </div>
                        </div>
                        <div class="space-y-1.5">
                            <Label variant="form" class="text-xs"
                                >Received In</Label
                            >
                            <input
                                type="hidden"
                                name="payment_mode"
                                value={paymentMode}
                            />
                            <input
                                type="hidden"
                                name="deposit_to"
                                value={depositTo}
                            />
                            <PaymentOptionChips
                                options={data.paymentOptions}
                                {selectedOptionKey}
                                onSelect={selectPaymentOption}
                                compact={true}
                            />
                        </div>
                        <div class="space-y-1">
                            <Label
                                for="payment_reference"
                                variant="form"
                                class="text-xs">Reference (optional)</Label
                            >
                            <Input
                                id="payment_reference"
                                name="payment_reference"
                                bind:value={paymentReference}
                                placeholder="UTR / Cheque no."
                            />
                        </div>
                    </div>
                </div>

                <div
                    class="px-5 py-4 border-t border-slate-200 bg-[#FAFAFA] flex items-center justify-between gap-4"
                >
                    <span class="text-xs text-slate-400">
                        {#if netPayable <= 0.01}
                            <span class="font-medium text-green-600"
                                >Fully settled</span
                            >
                        {:else}
                            After this: <span class="font-mono font-medium"
                                >{formatINR(
                                    Math.max(0, netPayable - paymentAmount),
                                )}</span
                            > pending
                        {/if}
                    </span>
                    <div class="flex gap-2">
                        <input
                            type="hidden"
                            name="credits"
                            value={JSON.stringify(selectedCredits)}
                        />
                        <Button
                            type="button"
                            variant="outline"
                            onclick={() => (showSettleModal = false)}
                            >Cancel</Button
                        >
                        <Button type="submit" disabled={isSubmitting}
                            >{isSubmitting ? "Processing…" : "Settle"}</Button
                        >
                    </div>
                </div>
            </form>
        </div>
    </div>
{/if}
