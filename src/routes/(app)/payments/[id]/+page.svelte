<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { ArrowLeft, Printer, Lock } from "lucide-svelte";
    import WhatsAppShareButton from "$lib/components/ui/WhatsAppShareButton.svelte";
    import { getPaymentWhatsAppUrl } from "$lib/utils/whatsapp";

    let { data } = $props();

    const whatsappUrl = getPaymentWhatsAppUrl({
        paymentNumber: data.payment.payment_number,
        customerName: data.customer?.name || "Customer",
        customerPhone: data.customer?.phone,
        amount: data.payment.amount,
        date: data.payment.payment_date,
        orgName: data.org?.name || "Our Company",
        mode: data.payment.payment_mode,
    });

    function formatCurrency(amount: number | null): string {
        if (amount === null || amount === undefined) return "₹0.00";
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 2,
        }).format(amount);
    }

    function formatDate(dateStr: string | null): string {
        if (!dateStr) return "—";
        return new Date(dateStr).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    }

    function getModeLabel(mode: string): string {
        const labels: Record<string, string> = {
            cash: "Cash",
            bank: "Bank Transfer",
            upi: "UPI",
            cheque: "Cheque",
        };
        return labels[mode] || mode;
    }

    const totalAllocated = $derived(
        data.allocations.reduce((s: number, a: any) => s + a.amount, 0),
    );
    const excess = $derived(data.payment.amount - totalAllocated);
</script>

<div class="page-full-bleed">
    <!-- Header (hidden in print) -->
    <header
        class="print-hide flex items-center justify-between gap-4 px-6 py-4 border-b border-border bg-surface-0 z-20"
    >
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
                        class="text-text-muted"
                        title="This payment is posted and cannot be modified"
                    >
                        <Lock class="size-4" />
                    </span>
                </div>
                <p class="text-xs text-text-muted mt-0.5">
                    Received on {formatDate(data.payment.payment_date)}
                </p>
            </div>
        </div>
        <div class="flex items-center gap-2">
            <Button variant="outline" size="sm" onclick={() => window.print()}>
                <Printer class="size-4 mr-2" />
                Print Receipt
            </Button>
            <WhatsAppShareButton url={whatsappUrl} />
        </div>
    </header>

    <!-- Content: Paper View -->
    <div class="flex-1 overflow-y-auto px-6 py-8 pb-32 bg-surface-2/30 print-bg-white">
        <div class="mx-auto max-w-4xl">
            <div
                class="bg-surface-0 border border-border rounded-xl shadow-sm p-8 space-y-8 print-sheet"
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
                                Payment Receipt
                            </h2>
                            <p class="text-sm text-text-secondary font-mono">
                                # {data.payment.payment_number}
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

                <!-- Received From + Payment Meta -->
                <div class="flex justify-between items-start">
                    <div class="space-y-2">
                        <p
                            class="text-xs font-bold uppercase tracking-wider text-text-muted"
                        >
                            Received From
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
                    <div class="text-right space-y-4">
                        <div class="space-y-1">
                            <p
                                class="text-[10px] font-bold uppercase tracking-wider text-text-muted"
                            >
                                Payment Date
                            </p>
                            <p class="font-mono text-text-strong">
                                {formatDate(data.payment.payment_date)}
                            </p>
                        </div>
                        <div class="space-y-1">
                            <p
                                class="text-[10px] font-bold uppercase tracking-wider text-text-muted"
                            >
                                Payment Mode
                            </p>
                            <p class="text-text-strong">
                                {getModeLabel(data.payment.payment_mode)}
                            </p>
                        </div>
                        {#if data.payment.reference}
                            <div class="space-y-1">
                                <p
                                    class="text-[10px] font-bold uppercase tracking-wider text-text-muted"
                                >
                                    Reference
                                </p>
                                <p class="font-mono text-text-strong">
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
                        class="text-xs font-bold uppercase tracking-wider text-positive mb-2"
                    >
                        Amount Received
                    </p>
                    <p class="text-3xl font-bold font-mono text-text-strong">
                        {formatCurrency(data.payment.amount)}
                    </p>
                </div>

                <!-- Invoice Allocations Table -->
                {#if data.allocations.length > 0}
                    <div>
                        <p
                            class="text-xs font-bold uppercase tracking-wider text-text-muted mb-3"
                        >
                            Applied to Invoices
                        </p>
                        <div class="border rounded-md overflow-hidden">
                            <table class="w-full text-sm">
                                <thead
                                    class="bg-surface-2/50 border-b border-border"
                                >
                                    <tr>
                                        <th
                                            class="px-4 py-3 text-left font-medium text-text-secondary text-[10px] uppercase tracking-wide"
                                            >Invoice #</th
                                        >
                                        <th
                                            class="px-4 py-3 text-left font-medium text-text-secondary text-[10px] uppercase tracking-wide"
                                            >Invoice Date</th
                                        >
                                        <th
                                            class="px-4 py-3 text-right font-medium text-text-secondary text-[10px] uppercase tracking-wide"
                                            >Invoice Total</th
                                        >
                                        <th
                                            class="px-4 py-3 text-right font-medium text-text-secondary text-[10px] uppercase tracking-wide"
                                            >Amount Applied</th
                                        >
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-border-subtle">
                                    {#each data.allocations as alloc}
                                        <tr>
                                            <td class="px-4 py-3">
                                                <a
                                                    href="/invoices/{alloc.invoice_id}"
                                                    class="font-mono text-primary hover:underline print-no-link"
                                                >
                                                    {alloc.invoice_number}
                                                </a>
                                            </td>
                                            <td
                                                class="px-4 py-3 text-text-subtle"
                                            >
                                                {formatDate(alloc.invoice_date)}
                                            </td>
                                            <td
                                                class="px-4 py-3 text-right font-mono text-text-subtle"
                                            >
                                                {formatCurrency(
                                                    alloc.invoice_total,
                                                )}
                                            </td>
                                            <td
                                                class="px-4 py-3 text-right font-mono font-medium text-positive"
                                            >
                                                {formatCurrency(alloc.amount)}
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
                                class="flex justify-between items-center text-sm text-text-secondary"
                            >
                                <span>Total Applied</span>
                                <span class="font-mono font-medium text-text-strong">
                                    {formatCurrency(totalAllocated)}
                                </span>
                            </div>
                            {#if excess > 0.01}
                                <div
                                    class="flex justify-between items-center text-sm pt-2 border-t border-dashed border-border"
                                >
                                    <span class="font-medium text-warning"
                                        >Advance / Excess</span
                                    >
                                    <span
                                        class="font-mono font-bold text-warning"
                                    >
                                        {formatCurrency(excess)}
                                    </span>
                                </div>
                            {/if}
                        </div>
                    </div>
                {/if}

                <!-- Notes -->
                {#if data.payment.notes}
                    <div class="border-t border-border-subtle pt-6">
                        <p
                            class="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2"
                        >
                            Notes
                        </p>
                        <p class="text-sm text-text-subtle whitespace-pre-wrap">
                            {data.payment.notes}
                        </p>
                    </div>
                {/if}

                <!-- Footer / Signature line -->
                <div
                    class="border-t border-border pt-8 mt-8 flex justify-between items-end"
                >
                    <div class="text-xs text-text-muted">
                        This is a computer-generated receipt.
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
