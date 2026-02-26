<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { Card } from "$lib/components/ui/card";
    import {
        Table,
        TableBody,
        TableCell,
        TableHead,
        TableHeader,
        TableRow,
    } from "$lib/components/ui/table";
    import { Plus } from "lucide-svelte";
    import { formatINR } from "$lib/utils/currency";
    import { formatDate } from "$lib/utils/date";

    let { data } = $props();
</script>

<div class="page-full-bleed">
    <header class="page-header">
        <div>
            <h1 class="text-xl font-bold tracking-tight text-text-strong">
                Supplier Payments
            </h1>
            <p class="text-sm text-text-muted">
                Track money paid to suppliers and bill adjustments
            </p>
        </div>
        <Button href="/vendor-payments/new">
            <Plus class="mr-2 size-4" />
            Pay Supplier
        </Button>
    </header>

    <div class="page-body">
        <div class="content-width-standard">
            <Card class="p-4">
                {#if data.payments.length === 0}
                    <div class="text-center py-10">
                        <p class="text-sm text-text-muted">No supplier payments yet.</p>
                        <Button href="/vendor-payments/new" class="mt-4">
                            <Plus class="mr-2 size-4" />
                            Pay Supplier
                        </Button>
                    </div>
                {:else}
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Payment #</TableHead>
                                <TableHead>Supplier</TableHead>
                                <TableHead>Method</TableHead>
                                <TableHead>Reference</TableHead>
                                <TableHead class="text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {#each data.payments as payment}
                                <TableRow>
                                    <TableCell class="text-text-muted">
                                        {formatDate(payment.payment_date)}
                                    </TableCell>
                                    <TableCell>
                                        <a
                                            href="/vendor-payments/{payment.id}"
                                            class="font-mono text-primary hover:underline"
                                        >
                                            {payment.supplier_payment_number}
                                        </a>
                                    </TableCell>
                                    <TableCell class="text-text-strong">
                                        {payment.vendor_display_name || payment.vendor_name || "—"}
                                    </TableCell>
                                    <TableCell class="text-text-subtle">
                                        {payment.method_label || payment.payment_mode}
                                    </TableCell>
                                    <TableCell class="text-text-muted">
                                        {payment.reference || "—"}
                                    </TableCell>
                                    <TableCell class="text-right font-mono text-red-600">
                                        {formatINR(payment.amount)}
                                    </TableCell>
                                </TableRow>
                            {/each}
                        </TableBody>
                    </Table>
                {/if}
            </Card>
        </div>
    </div>
</div>
