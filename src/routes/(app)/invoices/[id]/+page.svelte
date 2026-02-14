<script lang="ts">
    import { Button } from "$lib/components/ui/button";
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
    const defaultPaymentMode = data.paymentModes.find((m: any) => m.is_default) || data.paymentModes[0];
    let paymentMode = $state(defaultPaymentMode?.mode_key || "bank");
    let paymentDate = $state(localDateStr());
    let paymentReference = $state("");

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
    <header
        class="print-hide flex items-center justify-between px-6 py-4 border-b border-border bg-surface-0 z-20"
    >
        <div class="flex items-center gap-4">
            <Button
                variant="ghost"
                href="/invoices"
                size="icon"
                class="h-8 w-8"
            >
                <ArrowLeft class="size-4" />
            </Button>
            <div class="flex flex-col">
                <div class="flex items-center gap-3">
                    <h1
                        class="text-xl font-bold tracking-tight text-text-strong font-mono"
                    >
                        {data.invoice.invoice_number}
                    </h1>
                    <StatusBadge status={data.invoice.status} />
                    {#if data.invoice.status !== "draft"}
                        <span
                            class="text-text-muted"
                            title="This invoice is posted and cannot be modified"
                        >
                            <Lock class="size-4" />
                        </span>
                    {/if}
                </div>
                {#if data.invoice.issued_at}
                    <p class="text-xs text-text-muted mt-0.5">
                        Issued on {formatDate(data.invoice.issued_at)}
                    </p>
                {/if}
            </div>
        </div>

        <div class="flex items-center gap-2">
            {#if data.invoice.status === "draft"}
                <form method="POST" action="?/issue" use:enhance>
                    <Button type="submit" size="sm">
                        <Send class="mr-2 size-3" /> Issue Invoice
                    </Button>
                </form>

                <!-- Actions -->
                <ButtonGroup.Root>
                    <Button
                        variant="outline"
                        size="sm"
                        href="/invoices/{data.invoice.id}/edit"
                    >
                        <Pencil class="size-4 mr-2" />
                        Edit
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onclick={downloadPdf}
                        disabled={isDownloading}
                    >
                        <Download class="size-4 mr-2" />
                        {isDownloading ? "..." : "PDF"}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onclick={() => window.print()}
                    >
                        <Printer class="size-4 mr-2" />
                        Print
                    </Button>
                </ButtonGroup.Root>

                <!-- Delete with AlertDialog -->
                <AlertDialog.Root>
                    <AlertDialog.Trigger>
                        <Button variant="destructive" size="icon-sm">
                            <Trash2 class="size-4" />
                        </Button>
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
                            <form method="POST" action="?/delete" use:enhance>
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
            {:else}
                <ButtonGroup.Root>
                    <Button
                        variant="outline"
                        size="sm"
                        onclick={downloadPdf}
                        disabled={isDownloading}
                    >
                        <Download class="mr-2 size-3" />
                        {isDownloading ? "Generating..." : "PDF"}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onclick={() => window.print()}
                    >
                        <Printer class="mr-2 size-3" /> Print
                    </Button>
                    <WhatsAppShareButton url={whatsappUrl} />
                </ButtonGroup.Root>
            {/if}
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
            class="mx-6 mt-4 p-3 rounded-lg bg-primary/5 text-text-strong text-sm border border-primary/20"
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

    <!-- Content: Paper View (PDF-like) -->
    <main
        class="flex-1 overflow-y-auto px-6 py-8 bg-surface-1 print-bg-white"
    >
        <div class="mx-auto max-w-4xl">
            <!-- Main Paper Sheet -->
            <div
                class="bg-surface-0 border border-border-strong rounded-lg shadow-sm print-sheet"
            >
                <!-- ═══ Header: Company Info + TAX INVOICE ═══ -->
                <div class="p-6 pb-0">
                    <div class="flex justify-between items-start">
                        <div class="space-y-1">
                            {#if data.org?.logo_url}
                                <img
                                    src={data.org.logo_url}
                                    alt={data.org.name}
                                    class="h-14 w-auto object-contain mb-2"
                                />
                            {/if}
                            <h2 class="text-base font-bold text-text-strong uppercase tracking-wide">
                                {data.org?.name || "COMPANY NAME"}
                            </h2>
                            {#if data.org?.address}
                                <p class="text-xs text-text-muted uppercase">{data.org.address}</p>
                            {/if}
                            {#if data.org?.city || data.org?.pincode}
                                <p class="text-xs text-text-muted uppercase">
                                    {[data.org?.city, data.org?.pincode].filter(Boolean).join(" - ")}
                                </p>
                            {/if}
                            {#if data.org?.state_code}
                                <p class="text-xs text-text-muted">
                                    State: {stateName(data.org.state_code)}
                                </p>
                            {/if}
                            {#if data.org?.gstin}
                                <p class="text-xs font-semibold text-text-strong font-mono">GSTIN: {data.org.gstin}</p>
                            {/if}
                            {#if data.org?.email}
                                <p class="text-xs text-text-muted">Email: {data.org.email}</p>
                            {/if}
                            {#if data.org?.phone}
                                <p class="text-xs text-text-muted">Phone: {data.org.phone}</p>
                            {/if}
                        </div>
                        <div class="text-right space-y-1">
                            <h1 class="text-2xl font-bold text-text-strong tracking-tight">TAX INVOICE</h1>
                            {#if data.invoice.balance_due <= 0.01 && data.invoice.amount_paid && data.invoice.amount_paid > 0}
                                <span class="inline-block text-sm font-bold text-green-600 border border-green-300 bg-green-50 px-3 py-0.5 rounded">PAID</span>
                            {/if}
                            {#if data.invoice.prices_include_gst}
                                <div>
                                    <span class="text-[10px] font-semibold uppercase tracking-wide bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded">
                                        Prices include GST
                                    </span>
                                </div>
                            {/if}
                        </div>
                    </div>
                </div>

                <!-- ═══ Separator ═══ -->
                <div class="mx-6 my-4 border-t border-border-strong"></div>

                <!-- ═══ Bill To + Invoice Meta ═══ -->
                <div class="px-6 pb-4">
                    <div class="flex justify-between items-start gap-8">
                        <!-- Bill To -->
                        <div class="space-y-1 flex-1">
                            <p class="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">Bill To</p>
                            <h3 class="text-sm font-bold text-text-strong uppercase">
                                {data.customer?.name || "UNKNOWN"}
                            </h3>
                            {#if data.customer?.company_name}
                                <p class="text-xs text-text-muted uppercase">{data.customer.company_name}</p>
                            {/if}
                            {#if data.customer?.billing_address}
                                <p class="text-xs text-text-muted uppercase">{data.customer.billing_address}</p>
                            {/if}
                            {#if data.customer?.city || data.customer?.pincode}
                                <p class="text-xs text-text-muted uppercase">
                                    {[data.customer?.city, data.customer?.pincode].filter(Boolean).join(" - ")}
                                </p>
                            {/if}
                            {#if data.customer?.state_code}
                                <p class="text-xs text-text-muted">
                                    State: {stateName(data.customer.state_code)}
                                </p>
                            {/if}
                            {#if data.customer?.gstin}
                                <p class="text-xs font-semibold text-text-strong font-mono mt-1">GSTIN: {data.customer.gstin}</p>
                            {/if}
                        </div>

                        <!-- Invoice Details -->
                        <div class="text-right space-y-2">
                            <div>
                                <span class="text-xs text-text-muted">Invoice No: </span>
                                <span class="text-sm font-bold font-mono text-text-strong">{data.invoice.invoice_number}</span>
                            </div>
                            <div>
                                <span class="text-xs text-text-muted">Date: </span>
                                <span class="text-xs font-semibold text-text-strong">{formatDate(data.invoice.invoice_date)}</span>
                            </div>
                            <div>
                                <span class="text-xs text-text-muted">Due Date: </span>
                                <span class="text-xs font-semibold text-text-strong">{formatDate(data.invoice.due_date)}</span>
                            </div>
                            {#if data.customer?.state_code}
                                <div>
                                    <span class="text-xs text-text-muted">Place of Supply: </span>
                                    <span class="text-xs font-semibold text-text-strong">{stateName(data.customer.state_code)}</span>
                                </div>
                            {/if}
                            {#if data.invoice.order_number}
                                <div>
                                    <span class="text-xs text-text-muted">Order No: </span>
                                    <span class="text-xs font-mono text-text-strong">{data.invoice.order_number}</span>
                                </div>
                            {/if}
                        </div>
                    </div>
                </div>

                <!-- ═══ Separator ═══ -->
                <div class="mx-6 border-t border-border"></div>

                <!-- ═══ Items Table ═══ -->
                <div class="px-6 py-4">
                    <div class="border border-border rounded overflow-hidden">
                        <table class="w-full text-sm">
                            <thead>
                                <tr class="bg-surface-2/60 border-b border-border text-[10px] uppercase tracking-wider font-bold text-text-muted">
                                    <th class="px-3 py-2.5 text-center w-8">#</th>
                                    <th class="px-3 py-2.5 text-left">Description</th>
                                    <th class="px-3 py-2.5 text-center">HSN/SAC</th>
                                    <th class="px-3 py-2.5 text-center">Qty</th>
                                    <th class="px-3 py-2.5 text-right">Rate</th>
                                    {#if data.invoice.is_inter_state}
                                        <th class="px-3 py-2.5 text-right">IGST</th>
                                    {:else}
                                        <th class="px-3 py-2.5 text-right">CGST</th>
                                        <th class="px-3 py-2.5 text-right">SGST</th>
                                    {/if}
                                    <th class="px-3 py-2.5 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-border/50">
                                {#each data.items as item, i}
                                    {@const halfRate = (item.gst_rate || 0) / 2}
                                    {@const taxOnAmount = (item.amount * (item.gst_rate || 0)) / 100}
                                    <tr class="hover:bg-surface-2/30">
                                        <td class="px-3 py-2.5 text-center text-xs text-text-muted">{i + 1}</td>
                                        <td class="px-3 py-2.5">
                                            <div class="font-medium text-text-strong text-xs">{item.description}</div>
                                        </td>
                                        <td class="px-3 py-2.5 text-center font-mono text-xs text-text-muted">{item.hsn_code || "—"}</td>
                                        <td class="px-3 py-2.5 text-center font-mono text-xs text-text-muted">{item.quantity} {item.unit || ""}</td>
                                        <td class="px-3 py-2.5 text-right font-mono text-xs text-text-muted">{formatINR(item.rate)}</td>
                                        {#if data.invoice.is_inter_state}
                                            <td class="px-3 py-2.5 text-right">
                                                <div class="text-[10px] text-text-muted">{item.gst_rate}%</div>
                                                <div class="font-mono text-xs">{formatINR(taxOnAmount)}</div>
                                            </td>
                                        {:else}
                                            <td class="px-3 py-2.5 text-right">
                                                <div class="text-[10px] text-text-muted">{halfRate}%</div>
                                                <div class="font-mono text-xs">{formatINR(taxOnAmount / 2)}</div>
                                            </td>
                                            <td class="px-3 py-2.5 text-right">
                                                <div class="text-[10px] text-text-muted">{halfRate}%</div>
                                                <div class="font-mono text-xs">{formatINR(taxOnAmount / 2)}</div>
                                            </td>
                                        {/if}
                                        <td class="px-3 py-2.5 text-right font-mono text-xs font-bold text-text-strong">{formatINR(item.amount)}</td>
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
                            <!-- Total in words -->
                            <div>
                                <p class="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">Total In Words</p>
                                <p class="text-xs font-semibold italic text-text-strong">{numberToWords(data.invoice.total || 0)}</p>
                            </div>

                            <!-- Bank details -->
                            {#if data.org?.bank_name || data.org?.account_number}
                                <div>
                                    <p class="text-xs font-bold text-text-strong mb-1">Bank Details</p>
                                    <div class="text-xs text-text-muted space-y-0.5 leading-relaxed">
                                        {#if data.org?.bank_name}<p>Bank: {data.org.bank_name}</p>{/if}
                                        {#if data.org?.account_number}<p>A/c No: <span class="font-mono">{data.org.account_number}</span></p>{/if}
                                        {#if data.org?.ifsc}<p>IFSC: <span class="font-mono">{data.org.ifsc}</span></p>{/if}
                                        {#if data.org?.branch}<p>Branch: {data.org.branch}</p>{/if}
                                    </div>
                                </div>
                            {/if}

                            <!-- Notes -->
                            {#if data.invoice.notes}
                                <div>
                                    <p class="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">Notes</p>
                                    <p class="text-xs text-text-subtle whitespace-pre-wrap">{data.invoice.notes}</p>
                                </div>
                            {/if}

                            <!-- Terms -->
                            {#if data.invoice.terms}
                                <div>
                                    <p class="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">Terms & Conditions</p>
                                    <p class="text-xs text-text-subtle whitespace-pre-wrap leading-relaxed">{data.invoice.terms}</p>
                                </div>
                            {/if}
                        </div>

                        <!-- Right column: Tax summary + Signature -->
                        <div class="w-full md:w-72 space-y-4">
                            <!-- Tax Summary -->
                            <div class="space-y-2 text-sm">
                                <div class="flex justify-between text-text-muted">
                                    <span class="text-xs">Sub Total</span>
                                    <span class="font-mono text-xs text-text-strong">{formatINR(data.invoice.subtotal)}</span>
                                </div>

                                {#if data.invoice.is_inter_state}
                                    <div class="flex justify-between text-text-muted">
                                        <span class="text-xs">IGST</span>
                                        <span class="font-mono text-xs text-text-strong">{formatINR(data.invoice.igst)}</span>
                                    </div>
                                {:else}
                                    <div class="flex justify-between text-text-muted">
                                        <span class="text-xs">CGST</span>
                                        <span class="font-mono text-xs text-text-strong">{formatINR(data.invoice.cgst)}</span>
                                    </div>
                                    <div class="flex justify-between text-text-muted">
                                        <span class="text-xs">SGST</span>
                                        <span class="font-mono text-xs text-text-strong">{formatINR(data.invoice.sgst)}</span>
                                    </div>
                                {/if}

                                <div class="border-t border-border-strong pt-2 flex justify-between items-center bg-surface-2/50 -mx-2 px-2 py-1.5 rounded">
                                    <span class="font-bold text-sm text-text-strong">TOTAL</span>
                                    <span class="font-mono text-base font-bold text-text-strong">{formatINR(data.invoice.total)}</span>
                                </div>

                                {#if data.paymentHistory && data.paymentHistory.length > 0}
                                    <div class="space-y-1.5 border-t border-dashed border-border pt-2">
                                        {#each data.paymentHistory as txn}
                                            <div class="flex justify-between text-xs">
                                                <span class="text-text-muted">
                                                    {#if txn.type === "credit_note"}
                                                        <span class="text-blue-600">Adjusted</span>
                                                        <span class="font-mono text-[10px]">({txn.reference})</span>
                                                    {:else if txn.type === "advance"}
                                                        <span class="text-purple-600">Advance</span>
                                                        <span class="font-mono text-[10px]">({txn.reference})</span>
                                                    {:else}
                                                        <span class="text-green-600">Payment</span>
                                                        <span class="font-mono text-[10px]">({txn.reference})</span>
                                                    {/if}
                                                </span>
                                                <span class="font-mono text-green-600">(-) {formatINR(txn.amount)}</span>
                                            </div>
                                        {/each}
                                    </div>
                                {/if}

                                {#if data.invoice.balance_due > 0.01}
                                    <div class="flex justify-between font-bold text-sm pt-2 border-t border-border-strong">
                                        <span class="text-red-600">BALANCE DUE</span>
                                        <span class="font-mono text-red-600">{formatINR(data.invoice.balance_due)}</span>
                                    </div>
                                {/if}
                            </div>

                            <!-- Signature Block -->
                            <div class="pt-8 text-center">
                                <div class="border-t border-border-strong w-40 mx-auto"></div>
                                <p class="text-xs font-bold text-text-strong mt-2 uppercase">
                                    For {data.org?.name || "Company"}
                                </p>
                                <p class="text-[10px] text-text-muted mt-0.5">Authorized Signatory</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Computer-generated disclaimer -->
            <p class="text-center text-[10px] text-text-muted mt-3">
                This is a computer-generated invoice and does not require a physical signature.
            </p>
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
                            class="text-[10px] uppercase tracking-wide text-text-muted font-semibold"
                            >Balance Due</span
                        >
                        <span
                            class="font-mono text-lg font-bold text-text-strong"
                            >{formatINR(data.invoice.balance_due)}</span
                        >
                    </div>
                </div>
                <Button onclick={openSettleModal}>
                    {data.invoice.amount_paid && data.invoice.amount_paid > 0
                        ? "Record Payment"
                        : "Settle & Close"}
                </Button>
            </div>
        </div>
    {/if}
</div>

<!-- Settle Invoice Modal (Unified) -->
{#if showSettleModal}
    <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    >
        <div
            class="bg-surface-1 rounded-xl shadow-2xl w-full max-w-lg border border-border overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        >
            <div
                class="p-4 border-b border-border flex justify-between items-center bg-surface-2"
            >
                <div>
                    <h3 class="font-bold text-lg text-text-strong">
                        Settle Invoice
                    </h3>
                    <p class="text-xs text-text-muted">
                        Apply credits or record payment to close this invoice.
                    </p>
                </div>
                <button
                    onclick={() => (showSettleModal = false)}
                    class="text-text-muted hover:text-text-strong"
                >
                    <XCircle class="size-5" />
                </button>
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
                <div class="p-5 space-y-6 max-h-[70vh] overflow-y-auto">
                    <!-- Top Summary -->
                    <div
                        class="bg-surface-2/50 p-4 rounded-lg flex justify-between items-center border border-border"
                    >
                        <span class="text-sm font-medium text-text-subtle"
                            >Amount Due</span
                        >
                        <span
                            class="text-2xl font-bold font-mono text-text-strong"
                        >
                            {formatINR(data.invoice.balance_due)}
                        </span>
                    </div>

                    <!-- 1. Available Credits -->
                    {#if data.availableCredits && data.availableCredits.length > 0}
                        <div class="space-y-3">
                            <div class="flex items-center justify-between">
                                <Label
                                    class="text-xs font-bold uppercase tracking-wide text-text-subtle"
                                >
                                    Apply Credits
                                </Label>
                                {#if selectedCreditsTotal > 0}
                                    <span
                                        class="text-xs font-mono font-medium text-info"
                                    >
                                        -{formatINR(selectedCreditsTotal)} applied
                                    </span>
                                {/if}
                            </div>

                            <div class="space-y-2">
                                {#each data.availableCredits as credit}
                                    <label
                                        class="block relative group cursor-pointer"
                                    >
                                        <input
                                            type="checkbox"
                                            bind:group={selectedCredits}
                                            value={credit}
                                            class="peer sr-only"
                                        />
                                        <div
                                            class="flex items-center justify-between p-3 rounded-lg border border-border bg-surface-0 hover:bg-surface-2 transition-all peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:shadow-sm"
                                        >
                                            <div>
                                                <div
                                                    class="font-medium text-sm text-text-strong"
                                                >
                                                    {credit.type ===
                                                    "credit_note"
                                                        ? "Credit Note"
                                                        : "Advance"}
                                                    <span
                                                        class="text-text-muted"
                                                        >#{credit.number}</span
                                                    >
                                                </div>
                                                <div
                                                    class="text-[10px] text-text-muted"
                                                >
                                                    {formatDate(credit.date)}
                                                </div>
                                            </div>
                                            <div
                                                class="font-mono font-bold text-sm text-text-strong"
                                            >
                                                {formatINR(credit.amount)}
                                            </div>
                                        </div>
                                    </label>
                                {/each}
                            </div>
                        </div>
                    {/if}

                    <!-- 2. Payment Details -->
                    <div class="space-y-4 pt-4 border-t border-border-dashed">
                        <div class="flex items-center justify-between">
                            <Label
                                class="text-xs font-bold uppercase tracking-wide text-text-subtle"
                            >
                                Remaining Payment
                            </Label>
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <div class="space-y-1.5">
                                <Label for="payment_amount" variant="form"
                                    >Amount</Label
                                >
                                <Input
                                    id="payment_amount"
                                    name="payment_amount"
                                    type="number"
                                    step="0.01"
                                    bind:value={paymentAmount}
                                    class="text-right font-mono font-bold bg-surface-0"
                                />
                            </div>
                            <div class="space-y-1.5">
                                <Label for="payment_date" variant="form"
                                    >Date</Label
                                >
                                <Input
                                    id="payment_date"
                                    name="payment_date"
                                    type="date"
                                    bind:value={paymentDate}
                                    class="bg-surface-0"
                                />
                            </div>
                        </div>

                        <!-- Payment Mode Toggle Chips -->
                        <div class="space-y-1.5">
                            <Label variant="form">Mode</Label>
                            <input type="hidden" name="payment_mode" value={paymentMode} />
                            <div class="flex flex-wrap gap-1.5">
                                {#each data.paymentModes as mode}
                                    <button
                                        type="button"
                                        onclick={() => { paymentMode = mode.mode_key; }}
                                        class="px-3 py-1.5 rounded-md text-xs font-medium border transition-all {paymentMode === mode.mode_key
                                            ? 'bg-primary text-white border-primary shadow-sm'
                                            : 'bg-surface-0 text-text-strong border-border-strong hover:border-primary/50'}"
                                    >
                                        {mode.label}
                                    </button>
                                {/each}
                            </div>
                        </div>

                        <!-- Reference -->
                        <div class="space-y-1.5">
                            <Label
                                for="payment_reference"
                                variant="form">Reference (Optional)</Label
                            >
                            <Input
                                id="payment_reference"
                                name="payment_reference"
                                bind:value={paymentReference}
                                placeholder="UTR / Txn ID"
                                class="bg-surface-0"
                            />
                        </div>
                    </div>
                </div>

                <!-- Footer Summary & Action -->
                <div
                    class="p-4 bg-surface-2 border-t border-border flex justify-between items-center"
                >
                    <div class="text-xs text-text-muted">
                        {#if netPayable <= 0.01}
                            <span class="text-green-600 font-medium"
                                >Fully Settled</span
                            >
                        {:else}
                            Remaining Due: <span class="font-mono"
                                >{formatINR(
                                    Math.max(0, netPayable - paymentAmount),
                                )}</span
                            >
                        {/if}
                    </div>
                    <div class="flex gap-3">
                        <input
                            type="hidden"
                            name="credits"
                            value={JSON.stringify(selectedCredits)}
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            onclick={() => (showSettleModal = false)}
                            >Cancel</Button
                        >
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Processing..." : "Settle Invoice"}
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    </div>
{/if}
