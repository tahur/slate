<script lang="ts">
    import { enhance } from "$app/forms";
    import { Button } from "$lib/components/ui/button";
    import StatusBadge from "$lib/components/ui/badge/StatusBadge.svelte";
    import {
        ArrowLeft,
        Send,
        CheckCircle,
        XCircle,
        FileText,
        Trash2,
        Printer,
    } from "lucide-svelte";
    import { formatINR, numberToWords } from "$lib/utils/currency";
    import { formatDate } from "$lib/utils/date";
    import { INDIAN_STATES } from "../../customers/new/schema";

    let { data, form } = $props();

    function stateName(code: string | null | undefined): string {
        if (!code) return "";
        const state = INDIAN_STATES.find((s) => s.code === code);
        return state ? `${state.name} (${code})` : code;
    }

    function daysUntilExpiry(): number | null {
        if (!data.quotation.valid_until) return null;
        const valid = new Date(data.quotation.valid_until);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        valid.setHours(0, 0, 0, 0);
        return Math.ceil(
            (valid.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
        );
    }

    let expiryDays = $derived(daysUntilExpiry());
    let isExpired = $derived(
        expiryDays !== null &&
            expiryDays < 0 &&
            data.quotation.status !== "expired" &&
            data.quotation.status !== "invoiced" &&
            data.quotation.status !== "declined",
    );
</script>

<div class="page-full-bleed">
    <!-- Header -->
    <header class="print-hide border-b border-border bg-surface-0 z-20">
        <!-- Header row: back + quotation info + actions -->
        <div
            class="flex flex-wrap sm:flex-nowrap items-start sm:items-center gap-3 px-4 md:px-6 py-3"
        >
            <Button
                variant="ghost"
                href="/quotations"
                size="icon"
                class="h-8 w-8 shrink-0"
            >
                <ArrowLeft class="size-4" />
            </Button>
            <div class="flex flex-col min-w-0 flex-1">
                <div class="flex items-center gap-2">
                    <h1
                        class="text-sm md:text-xl font-bold tracking-tight text-text-strong font-mono truncate"
                    >
                        {data.quotation.quotation_number}
                    </h1>
                    <StatusBadge status={data.quotation.status} />
                </div>
                {#if data.quotation.sent_at}
                    <p class="text-xs text-text-muted mt-0.5">
                        Sent on {formatDate(data.quotation.sent_at)}
                    </p>
                {/if}
                {#if expiryDays !== null && data.quotation.status !== "invoiced" && data.quotation.status !== "declined"}
                    <p
                        class="text-xs mt-0.5 {expiryDays < 0
                            ? 'text-red-600 font-semibold'
                            : expiryDays <= 7
                              ? 'text-amber-600'
                              : 'text-text-muted'}"
                    >
                        {#if expiryDays < 0}Expired {Math.abs(expiryDays)} days ago
                        {:else if expiryDays === 0}Expires today
                        {:else}{expiryDays} days until expiry
                        {/if}
                    </p>
                {/if}
            </div>

            <div
                class="flex w-full items-center justify-end gap-2 flex-wrap sm:w-auto sm:flex-nowrap sm:ml-auto"
            >
                {#if data.quotation.status === "draft"}
                    <form method="POST" action="?/send" use:enhance>
                        <Button type="submit" size="sm">
                            <Send class="mr-1 size-3.5" /> Send
                        </Button>
                    </form>
                    <Button
                        variant="outline"
                        size="sm"
                        href="/quotations/{data.quotation.id}/edit">Edit</Button
                    >
                    <form method="POST" action="?/delete" use:enhance>
                        <Button type="submit" variant="destructive" size="sm">
                            <Trash2 class="mr-1 size-3.5" /> Delete
                        </Button>
                    </form>
                {/if}

                {#if data.quotation.status === "sent"}
                    <form method="POST" action="?/accept" use:enhance>
                        <Button type="submit" size="sm" variant="default">
                            <CheckCircle class="mr-1 size-3.5" /> Accept
                        </Button>
                    </form>
                    <form method="POST" action="?/decline" use:enhance>
                        <Button type="submit" size="sm" variant="outline">
                            <XCircle class="mr-1 size-3.5" /> Decline
                        </Button>
                    </form>
                {/if}

                {#if data.quotation.status === "accepted"}
                    <form method="POST" action="?/convert" use:enhance>
                        <Button type="submit" size="sm">
                            <FileText class="mr-1 size-3.5" /> Convert to Invoice
                        </Button>
                    </form>
                {/if}

                {#if data.quotation.converted_invoice_id}
                    <Button
                        variant="outline"
                        size="sm"
                        href="/invoices/{data.quotation.converted_invoice_id}"
                    >
                        <FileText class="mr-1 size-3.5" /> View Invoice
                    </Button>
                {/if}

                <div class="flex items-center gap-2">
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
            Action completed successfully
        </div>
    {/if}

    <!-- Content: Paper View (PDF-like) -->
    <main
        class="flex-1 overflow-y-auto px-4 md:px-6 py-5 md:py-6 bg-surface-1 print-bg-white"
    >
        <div class="mx-auto max-w-4xl">
            <!-- Main Paper Sheet -->
            <div
                class="bg-surface-0 border border-border-strong rounded-lg shadow-sm print-sheet"
            >
                <!-- ═══ Compact Header: Company + Customer + Quote Meta ═══ -->
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
                                class="text-sm md:text-base print:text-[13px] font-bold text-text-strong uppercase tracking-wide"
                            >
                                {data.org?.name || "COMPANY NAME"}
                            </h2>
                            <p class="text-[11px] print:text-[10px] text-text-muted leading-tight">
                                {[
                                    data.org?.address,
                                    data.org?.city,
                                    data.org?.pincode,
                                ]
                                    .filter(Boolean)
                                    .join(", ")}
                            </p>
                            <div
                                class="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] print:text-[10px] text-text-muted"
                            >
                                {#if data.org?.state_code}
                                    <span>State: {stateName(data.org.state_code)}</span>
                                {/if}
                                {#if data.org?.gstin}
                                    <span class="font-mono text-text-strong"
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
                                class="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-muted"
                            >
                                Document Type
                            </p>
                            <h1
                                class="text-xl md:text-2xl font-bold text-text-strong tracking-tight"
                            >
                                TAX QUOTATION
                            </h1>
                            {#if data.quotation.prices_include_gst}
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
                        <div class="border border-border rounded-sm p-2 print:p-1.5">
                            <p
                                class="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-0.5"
                            >
                                Customer Details
                            </p>
                            <div class="grid grid-cols-[auto,1fr] gap-x-2 gap-y-0.5 text-[10px]">
                                <span class="text-text-muted">Name</span>
                                <span class="text-text-strong font-medium truncate">
                                    {data.customer?.name || "UNKNOWN"}{#if data
                                        .customer
                                        ?.company_name}
                                        · {data.customer.company_name}{/if}
                                </span>

                                <span class="text-text-muted">Address</span>
                                <span class="text-text-subtle truncate">
                                    {[
                                        data.customer?.billing_address,
                                        data.customer?.city,
                                        data.customer?.pincode,
                                    ]
                                        .filter(Boolean)
                                        .join(", ")}
                                </span>

                                {#if data.customer?.state_code}
                                    <span class="text-text-muted">State</span>
                                    <span class="text-text-subtle truncate">
                                        {stateName(data.customer.state_code)}
                                    </span>
                                {/if}

                                {#if data.customer?.gstin}
                                    <span class="text-text-muted">GSTIN</span>
                                    <span class="font-mono text-text-strong truncate">
                                        {data.customer.gstin}
                                    </span>
                                {/if}

                                {#if data.customer?.phone || data.customer?.email}
                                    <span class="text-text-muted">Contact</span>
                                    <span class="text-text-subtle truncate">
                                        {[data.customer?.phone, data.customer?.email]
                                            .filter(Boolean)
                                            .join(" · ")}
                                    </span>
                                {/if}
                            </div>
                        </div>

                        <div class="border border-border rounded-sm p-2 print:p-1.5">
                            <p
                                class="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-0.5"
                            >
                                Quotation Details
                            </p>
                            <div class="grid grid-cols-[auto,1fr] gap-x-2 gap-y-0.5 text-[10px]">
                                <span class="text-text-muted">Quotation No</span>
                                <span
                                    class="text-right font-mono font-semibold text-text-strong"
                                    >{data.quotation.quotation_number}</span
                                >

                                <span class="text-text-muted">Date</span>
                                <span class="text-right text-text-strong"
                                    >{formatDate(data.quotation.quotation_date)}</span
                                >

                                <span class="text-text-muted">Valid Till</span>
                                <span
                                    class="text-right font-semibold {isExpired
                                        ? 'text-red-600'
                                        : 'text-text-strong'}"
                                    >{formatDate(data.quotation.valid_until)}</span
                                >

                                {#if data.customer?.state_code}
                                    <span class="text-text-muted"
                                        >Place of Supply</span
                                    >
                                    <span class="text-right text-text-strong"
                                        >{stateName(
                                            data.customer.state_code,
                                        )}</span
                                    >
                                {/if}

                                {#if data.quotation.reference_number}
                                    <span class="text-text-muted">Reference</span>
                                    <span
                                        class="text-right font-mono text-text-strong"
                                        >{data.quotation.reference_number}</span
                                    >
                                {/if}

                                <span class="text-text-muted">Supply Type</span>
                                <span class="text-right text-text-strong">
                                    {data.quotation.is_inter_state
                                        ? "Inter-State (IGST)"
                                        : "Intra-State (CGST+SGST)"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {#if data.quotation.subject}
                        <div class="mt-1 border border-border rounded-sm p-2 print:p-1.5">
                            <p
                                class="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-0.5"
                            >
                                Subject
                            </p>
                            <p
                                class="text-xs font-semibold text-text-strong truncate"
                                title={data.quotation.subject}
                            >
                                {data.quotation.subject}
                            </p>
                        </div>
                    {/if}
                </div>

                <!-- ═══ Separator ═══ -->
                <div class="mx-6 border-t border-border"></div>

                <!-- ═══ Line Items Table ═══ -->
                <div class="px-4 py-3 md:px-6 md:py-4">
                    <div
                        class="border border-border-strong rounded-sm overflow-hidden"
                    >
                        <table class="w-full table-fixed border-collapse text-[11px]">
                            <thead>
                                <tr
                                    class="bg-surface-2/60 text-[10px] uppercase tracking-wider font-bold text-text-muted"
                                >
                                    <th
                                        class="border border-border px-2 py-1.5 text-center w-8"
                                    >
                                        >#</th
                                    >
                                    <th class="border border-border px-2 py-1.5 text-left"
                                        >Description</th
                                    >
                                    <th class="border border-border px-2 py-1.5 text-center w-20"
                                        >HSN/SAC</th
                                    >
                                    <th class="border border-border px-2 py-1.5 text-center w-14">Qty</th>
                                    <th class="border border-border px-2 py-1.5 text-right w-24">Rate</th>
                                    {#if data.quotation.is_inter_state}
                                        <th class="border border-border px-2 py-1.5 text-right w-24"
                                            >IGST</th
                                        >
                                    {:else}
                                        <th class="border border-border px-2 py-1.5 text-right w-24"
                                            >CGST</th
                                        >
                                        <th class="border border-border px-2 py-1.5 text-right w-24"
                                            >SGST</th
                                        >
                                    {/if}
                                    <th class="border border-border px-2 py-1.5 text-right w-24"
                                        >Line Total</th
                                    >
                                </tr>
                            </thead>
                            <tbody>
                                {#each data.items as item, index}
                                    {@const halfRate = (item.gst_rate || 0) / 2}
                                    {@const lineCgst = item.cgst || 0}
                                    {@const lineSgst = item.sgst || 0}
                                    {@const lineIgst = item.igst || 0}
                                    <tr>
                                        <td
                                            class="border border-border px-2 py-1.5 text-center text-[11px] text-text-muted align-top"
                                            >{index + 1}</td
                                        >
                                        <td class="border border-border px-2 py-1.5 align-top">
                                            <div
                                                class="font-medium text-text-strong text-[11px] leading-tight"
                                            >
                                                {item.description}
                                            </div>
                                            {#if item.unit && item.unit !== "nos"}
                                                <div
                                                    class="text-[10px] text-text-muted mt-0.5"
                                                >
                                                    Unit: {item.unit}
                                                </div>
                                            {/if}
                                        </td>
                                        <td
                                            class="border border-border px-2 py-1.5 text-center font-mono text-[11px] text-text-muted align-top"
                                            >{item.hsn_code || "—"}</td
                                        >
                                        <td
                                            class="border border-border px-2 py-1.5 text-center font-mono text-[11px] text-text-muted align-top"
                                            >{item.quantity}</td
                                        >
                                        <td
                                            class="border border-border px-2 py-1.5 text-right font-mono text-[11px] text-text-muted align-top"
                                            >{formatINR(item.rate)}</td
                                        >
                                        {#if data.quotation.is_inter_state}
                                            <td class="border border-border px-2 py-1.5 text-right align-top">
                                                <div class="font-mono text-[11px]">
                                                    <span class="text-text-muted"
                                                        >{item.gst_rate}% · </span
                                                    >
                                                    {formatINR(lineIgst)}
                                                </div>
                                            </td>
                                        {:else}
                                            <td class="border border-border px-2 py-1.5 text-right align-top">
                                                <div class="font-mono text-[11px]">
                                                    <span class="text-text-muted"
                                                        >{halfRate}% · </span
                                                    >
                                                    {formatINR(lineCgst)}
                                                </div>
                                            </td>
                                            <td class="border border-border px-2 py-1.5 text-right align-top">
                                                <div class="font-mono text-[11px]">
                                                    <span class="text-text-muted"
                                                        >{halfRate}% · </span
                                                    >
                                                    {formatINR(lineSgst)}
                                                </div>
                                            </td>
                                        {/if}
                                        <td
                                            class="border border-border px-2 py-1.5 text-right font-mono text-[11px] font-bold text-text-strong align-top"
                                            >{formatINR(item.total)}</td
                                        >
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- ═══ Footer: Words + Notes | Summary + Signature ═══ -->
                <div class="px-6 pb-6">
                    <div class="flex flex-col md:flex-row gap-6">
                        <div class="flex-1 space-y-4">
                            <div>
                                <p
                                    class="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1"
                                >
                                    Total In Words
                                </p>
                                <p
                                    class="text-xs font-semibold italic text-text-strong"
                                >
                                    {numberToWords(data.quotation.total || 0)}
                                </p>
                            </div>

                            <div>
                                <p
                                    class="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1"
                                >
                                    Quotation Validity
                                </p>
                                <p class="text-xs text-text-subtle">
                                    This quotation is valid up to
                                    <span
                                        class="font-semibold {isExpired
                                            ? 'text-red-600'
                                            : 'text-text-strong'}"
                                    >
                                        {formatDate(data.quotation.valid_until)}
                                    </span>.
                                    {#if expiryDays !== null && expiryDays >= 0}
                                        <span class="text-text-muted">
                                            ({expiryDays} days remaining)</span
                                        >
                                    {/if}
                                </p>
                            </div>

                            {#if data.org?.bank_name || data.org?.account_number || data.org?.upi_id}
                                <div>
                                    <p
                                        class="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1"
                                    >
                                        Bank Details
                                    </p>
                                    <div
                                        class="text-xs text-text-subtle space-y-0.5 leading-relaxed"
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
                                        {#if data.org?.upi_id}<p>
                                                UPI: <span class="font-mono"
                                                    >{data.org.upi_id}</span
                                                >
                                            </p>{/if}
                                    </div>
                                </div>
                            {/if}

                            {#if data.quotation.notes}
                                <div>
                                    <p
                                        class="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1"
                                    >
                                        Notes
                                    </p>
                                    <p
                                        class="text-xs text-text-subtle whitespace-pre-wrap"
                                    >
                                        {data.quotation.notes}
                                    </p>
                                </div>
                            {/if}

                            {#if data.quotation.terms}
                                <div>
                                    <p
                                        class="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1"
                                    >
                                        Terms & Conditions
                                    </p>
                                    <p
                                        class="text-xs text-text-subtle whitespace-pre-wrap leading-relaxed"
                                    >
                                        {data.quotation.terms}
                                    </p>
                                </div>
                            {/if}
                        </div>

                        <div class="w-full md:w-72 space-y-4">
                            <div class="space-y-2 text-sm">
                                <div class="flex justify-between text-text-muted">
                                    <span class="text-xs">Sub Total</span>
                                    <span
                                        class="font-mono text-xs text-text-strong"
                                        >{formatINR(data.quotation.subtotal)}</span
                                    >
                                </div>

                                {#if (data.quotation.discount_amount || 0) > 0}
                                    <div
                                        class="flex justify-between text-text-muted"
                                    >
                                        <span class="text-xs">Discount</span>
                                        <span
                                            class="font-mono text-xs text-text-strong"
                                            >(-) {formatINR(
                                                data.quotation.discount_amount ||
                                                    0,
                                            )}</span
                                        >
                                    </div>
                                {/if}

                                <div class="flex justify-between text-text-muted">
                                    <span class="text-xs">Taxable Value</span>
                                    <span
                                        class="font-mono text-xs text-text-strong"
                                        >{formatINR(
                                            data.quotation.taxable_amount || 0,
                                        )}</span
                                    >
                                </div>

                                {#if data.quotation.is_inter_state}
                                    <div
                                        class="flex justify-between text-text-muted"
                                    >
                                        <span class="text-xs">IGST</span>
                                        <span
                                            class="font-mono text-xs text-text-strong"
                                            >{formatINR(
                                                data.quotation.igst || 0,
                                            )}</span
                                        >
                                    </div>
                                {:else}
                                    <div
                                        class="flex justify-between text-text-muted"
                                    >
                                        <span class="text-xs">CGST</span>
                                        <span
                                            class="font-mono text-xs text-text-strong"
                                            >{formatINR(
                                                data.quotation.cgst || 0,
                                            )}</span
                                        >
                                    </div>
                                    <div
                                        class="flex justify-between text-text-muted"
                                    >
                                        <span class="text-xs">SGST</span>
                                        <span
                                            class="font-mono text-xs text-text-strong"
                                            >{formatINR(
                                                data.quotation.sgst || 0,
                                            )}</span
                                        >
                                    </div>
                                {/if}

                                <div
                                    class="border-t border-border-strong pt-2 flex justify-between items-center bg-surface-2/50 -mx-2 px-2 py-1.5 rounded"
                                >
                                    <span
                                        class="font-bold text-sm text-text-strong"
                                        >GRAND TOTAL</span
                                    >
                                    <span
                                        class="font-mono text-base font-bold text-text-strong"
                                        >{formatINR(data.quotation.total)}</span
                                    >
                                </div>
                            </div>

                            <div class="pt-8 text-center">
                                {#if data.org?.signature_url}
                                    <img
                                        src={data.org.signature_url}
                                        alt="Authorised Signatory"
                                        class="h-16 w-auto object-contain mx-auto mb-2"
                                    />
                                {/if}
                                <div
                                    class="border-t border-border-strong w-40 mx-auto"
                                ></div>
                                <p
                                    class="text-xs font-bold text-text-strong mt-2 uppercase"
                                >
                                    For {data.org?.name || "Company"}
                                </p>
                                <p class="text-[10px] text-text-muted mt-0.5">
                                    Authorised Signatory
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <p class="text-center text-[10px] text-text-muted mt-3">
                This is a computer-generated quotation and does not require a
                physical signature.
            </p>
        </div>
    </main>
</div>
