<script lang="ts">
    import { enhance } from "$app/forms";
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import { ArrowLeft, Check } from "lucide-svelte";
    import { toast } from "svelte-sonner";
    import { formatINR } from "$lib/utils/currency";

    let { data } = $props();
    let isSubmitting = $state(false);

    let amount = $state(0);
</script>

<div class="page-full-bleed">
    <!-- Header -->
    <header
        class="flex items-center gap-4 px-6 py-4 border-b border-border bg-surface-0 z-20"
    >
        <Button
            variant="ghost"
            href="/credit-notes"
            size="icon"
            class="h-8 w-8"
        >
            <ArrowLeft class="size-4" />
        </Button>
        <div>
            <h1 class="text-xl font-bold tracking-tight text-text-strong">
                New Credit Note
            </h1>
            <p class="text-sm text-text-subtle">Issue a credit to a customer</p>
        </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 overflow-hidden">
        <form
            id="credit-note-form"
            method="POST"
            use:enhance={() => {
                isSubmitting = true;
                return async ({ update, result }) => {
                    await update();
                    isSubmitting = false;
                    if (result.type === "failure" && result.data?.error) {
                        toast.error(result.data.error as string);
                    }
                };
            }}
            class="h-full flex flex-col md:flex-row"
        >
            <!-- Idempotency key to prevent duplicate submissions -->
            <input
                type="hidden"
                name="idempotency_key"
                value={data.idempotencyKey}
            />

            <!-- LEFT COLUMN: Main Details -->
            <div
                class="flex-1 overflow-y-auto p-6 md:p-8 border-b md:border-b-0 md:border-r border-border bg-surface-1"
            >
                <div class="max-w-xl ml-auto mr-0 md:mr-8 space-y-6">
                    <!-- Customer -->
                    <div class="space-y-2">
                        <Label for="customer_id" variant="form"
                            >Customer <span class="text-destructive">*</span
                            ></Label
                        >
                        <select
                            name="customer_id"
                            id="customer_id"
                            required
                            class="w-full h-9 rounded-md border border-border-strong bg-surface-0 px-3 py-1.5 text-sm text-text-strong focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring/50"
                        >
                            <option value="">Select Customer</option>
                            {#each data.customers as customer}
                                <option value={customer.id}
                                    >{customer.name}</option
                                >
                            {/each}
                        </select>
                    </div>

                    <div class="grid gap-4 grid-cols-2">
                        <!-- Date -->
                        <div class="space-y-2">
                            <Label for="date" variant="form"
                                >Date <span class="text-destructive">*</span
                                ></Label
                            >
                            <Input
                                type="date"
                                name="date"
                                required
                                value={data.today}
                            />
                        </div>

                        <!-- Number -->
                        <div class="space-y-2">
                            <Label for="number" variant="form"
                                >Credit Note #</Label
                            >
                            <Input
                                name="number"
                                value={data.autoNumber}
                                readonly
                                class="bg-surface-2/50 text-text-subtle font-mono"
                            />
                        </div>
                    </div>

                    <!-- Reason -->
                    <div class="space-y-2">
                        <Label for="reason" variant="form"
                            >Reason <span class="text-destructive">*</span
                            ></Label
                        >
                        <select
                            name="reason"
                            id="reason"
                            required
                            class="w-full h-9 rounded-md border border-border-strong bg-surface-0 px-3 py-1.5 text-sm text-text-strong focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring/50"
                        >
                            <option value="Return">Return of Goods</option>
                            <option value="Damaged">Damaged Goods</option>
                            <option value="Discount">Discount Error</option>
                            <option value="Writeoff">Write Off</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <!-- Notes -->
                    <div class="space-y-2">
                        <Label for="notes" variant="form">Notes</Label>
                        <textarea
                            name="notes"
                            rows="3"
                            class="w-full rounded-md border border-border-strong bg-surface-0 px-3 py-2 text-sm text-text-strong resize-none placeholder:text-text-placeholder focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring/50"
                            placeholder="Additional details..."
                        ></textarea>
                    </div>
                </div>
            </div>

            <!-- RIGHT COLUMN: Financials -->
            <div
                class="w-full md:w-96 bg-surface-0 p-6 md:p-8 overflow-y-auto"
            >
                <div class="space-y-6">
                    <h3
                        class="text-sm font-bold uppercase tracking-wide text-text-subtle"
                    >
                        Financials
                    </h3>

                    <!-- Amount -->
                    <div class="space-y-2">
                        <Label for="amount" variant="form"
                            >Credit Amount <span class="text-destructive"
                                >*</span
                            ></Label
                        >
                        <Input
                            type="number"
                            name="amount"
                            bind:value={amount}
                            min="0.01"
                            step="0.01"
                            required
                            placeholder="0.00"
                            class="h-12 text-text-strong bg-surface-1 text-xl font-bold font-mono text-right"
                        />
                    </div>

                    <!-- Summary -->
                    <div
                        class="space-y-3 pt-4 border-t border-dashed border-border"
                    >
                        <div class="flex justify-between items-baseline pt-3">
                            <span class="font-semibold text-text-strong"
                                >Total Credit</span
                            >
                            <span
                                class="font-mono text-2xl font-bold text-primary"
                            >
                                {formatINR(amount)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </form>
    </main>

    <!-- Bottom Action Bar -->
    <div class="action-bar">
        <div class="action-bar-group">
            <Button
                type="submit"
                form="credit-note-form"
                disabled={isSubmitting || amount <= 0}
            >
                <Check class="mr-2 size-4" />
                {isSubmitting ? "Saving..." : "Save Credit Note"}
            </Button>
            <Button variant="ghost" href="/credit-notes">Cancel</Button>
        </div>
    </div>
</div>
