<script lang="ts">
    import { enhance } from "$app/forms";
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import { ArrowLeft, Check } from "lucide-svelte";
    import { addToast } from "$lib/stores/toast";

    let { data } = $props();
    let isSubmitting = $state(false);

    let amount = $state(0);
</script>

<div class="flex flex-col h-[calc(100vh-3.5rem)] -mx-4 md:-mx-5 -my-4 md:-my-5">
    <!-- Header -->
    <header
        class="flex items-center justify-between gap-4 px-6 py-4 border-b border-border bg-surface-0 z-20"
    >
        <div class="flex items-center gap-4">
            <Button
                variant="ghost"
                href="/credit-notes"
                size="icon"
                class="h-8 w-8 text-text-muted hover:text-text-strong"
            >
                <ArrowLeft class="size-4" />
            </Button>
            <div>
                <h1 class="text-xl font-bold tracking-tight text-text-strong">
                    New Credit Note
                </h1>
            </div>
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
                        addToast({
                            type: "error",
                            message: result.data.error as string,
                        });
                    }
                };
            }}
            class="h-full flex flex-col md:flex-row"
        >
            <!-- LEFT COLUMN: Main Details -->
            <div
                class="flex-1 overflow-y-auto p-6 md:p-8 border-b md:border-b-0 md:border-r border-border bg-surface-1"
            >
                <div class="max-w-xl ml-auto mr-0 md:mr-8 space-y-8">
                    <!-- Customer -->
                    <div class="space-y-2">
                        <Label
                            for="customer_id"
                            class="text-xs uppercase tracking-wider text-text-muted font-bold"
                            >Customer *</Label
                        >
                        <select
                            name="customer_id"
                            id="customer_id"
                            required
                            class="w-full h-11 rounded-md border border-border-strong bg-surface-0 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                        >
                            <option value="">Select Customer</option>
                            {#each data.customers as customer}
                                <option value={customer.id}
                                    >{customer.name}</option
                                >
                            {/each}
                        </select>
                    </div>

                    <div class="grid gap-6 grid-cols-2">
                        <!-- Date -->
                        <div class="space-y-2">
                            <Label
                                for="date"
                                class="text-xs uppercase tracking-wider text-text-muted font-bold"
                                >Date *</Label
                            >
                            <Input
                                type="date"
                                name="date"
                                required
                                value={data.today}
                                class="h-11 border-border-strong bg-surface-0"
                            />
                        </div>

                        <!-- Number -->
                        <div class="space-y-2">
                            <Label
                                for="number"
                                class="text-xs uppercase tracking-wider text-text-muted font-bold"
                                >Credit Note #</Label
                            >
                            <Input
                                name="number"
                                value={data.autoNumber}
                                readonly
                                class="h-11 bg-surface-2/50 text-text-muted border-border font-mono text-sm"
                            />
                        </div>
                    </div>

                    <!-- Reason -->
                    <div class="space-y-2">
                        <Label
                            for="reason"
                            class="text-xs uppercase tracking-wider text-text-muted font-bold"
                            >Reason *</Label
                        >
                        <select
                            name="reason"
                            id="reason"
                            required
                            class="w-full h-11 rounded-md border border-border-strong bg-surface-0 px-3 py-2 text-sm focus:border-primary focus:outline-none"
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
                        <Label
                            for="notes"
                            class="text-xs uppercase tracking-wider text-text-muted font-bold"
                            >Notes</Label
                        >
                        <textarea
                            name="notes"
                            rows="4"
                            class="w-full rounded-md border border-border-strong bg-surface-0 px-3 py-2 text-sm resize-none focus:border-primary focus:outline-none"
                            placeholder="Additional details..."
                        ></textarea>
                    </div>
                </div>
            </div>

            <!-- RIGHT COLUMN: Financials -->
            <div
                class="w-full md:w-[400px] bg-surface-0 p-6 md:p-8 overflow-y-auto"
            >
                <div class="space-y-8">
                    <h3
                        class="text-sm font-bold uppercase tracking-wider text-text-muted"
                    >
                        Financials
                    </h3>

                    <!-- Amount -->
                    <div class="space-y-2">
                        <Label
                            for="amount"
                            class="text-xs uppercase tracking-wider text-text-muted font-bold"
                            >Credit Amount *</Label
                        >
                        <Input
                            type="number"
                            name="amount"
                            bind:value={amount}
                            min="0.01"
                            step="0.01"
                            required
                            placeholder="0.00"
                            class="h-12 border-border-strong text-text-strong bg-surface-1 text-xl font-bold font-mono text-right"
                        />
                    </div>

                    <!-- Summary -->
                    <div class="space-y-3 pt-4 border-t border-border-dashed">
                        <div class="flex justify-between items-baseline pt-2">
                            <span class="font-bold text-text-strong"
                                >Total Credit</span
                            >
                            <span
                                class="font-mono text-2xl font-bold text-primary"
                            >
                                {new Intl.NumberFormat("en-IN", {
                                    style: "currency",
                                    currency: "INR",
                                }).format(amount)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </form>
    </main>

    <!-- Bottom Action Bar -->
    <div
        class="flex-none bg-surface-1 border-t border-border shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] px-6 py-4 flex items-center justify-between z-20"
    >
        <div class="flex items-center gap-3">
            <Button
                type="submit"
                form="credit-note-form"
                disabled={isSubmitting || amount <= 0}
                class="bg-primary text-primary-foreground font-semibold tracking-wide shadow-sm hover:bg-primary/90"
            >
                <Check class="mr-2 size-4" />
                {isSubmitting ? "Saving..." : "Save Credit Note"}
            </Button>
            <Button
                href="/credit-notes"
                variant="ghost"
                type="button"
                class="text-text-muted hover:text-destructive"
            >
                Cancel
            </Button>
        </div>
    </div>
</div>
