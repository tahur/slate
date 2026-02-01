<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { Badge } from "$lib/components/ui/badge";
    import { Card } from "$lib/components/ui/card";
    import { Plus, Users } from "lucide-svelte";

    let { data } = $props();

    function formatCurrency(amount: number | null): string {
        if (amount === null || amount === undefined) return "₹0.00";
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 2,
        }).format(amount);
    }

    function getStatusVariant(
        status: string | null,
    ): "default" | "secondary" | "destructive" | "outline" {
        switch (status) {
            case "active":
                return "default";
            case "inactive":
                return "secondary";
            default:
                return "outline";
        }
    }
</script>

<div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
        <div>
            <h1 class="text-xl font-semibold">Customers</h1>
            <p class="text-sm text-muted-foreground">
                Manage your customers and their details
            </p>
        </div>
        <Button href="/customers/new">
            <Plus class="mr-2 size-4" />
            New Customer
        </Button>
    </div>

    <!-- Customer Table or Empty State -->
    {#if data.customers.length === 0}
        <Card class="flex flex-col items-center justify-center py-12">
            <Users class="size-12 text-muted-foreground/50 mb-4" />
            <h3 class="text-lg font-medium">No customers yet</h3>
            <p class="text-sm text-muted-foreground mb-4">
                Get started by adding your first customer
            </p>
            <Button href="/customers/new">
                <Plus class="mr-2 size-4" />
                Add Customer
            </Button>
        </Card>
    {:else}
        <Card class="overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead>
                        <tr class="border-b bg-muted/50">
                            <th
                                class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground"
                            >
                                Name
                            </th>
                            <th
                                class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground"
                            >
                                Phone
                            </th>
                            <th
                                class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground"
                            >
                                GSTIN
                            </th>
                            <th
                                class="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground"
                            >
                                Balance
                            </th>
                            <th
                                class="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground"
                            >
                                Status
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each data.customers as customer}
                            <tr
                                class="border-b hover:bg-muted/30 transition-colors"
                            >
                                <td class="px-4 py-3">
                                    <a
                                        href="/customers/{customer.id}"
                                        class="font-medium hover:underline"
                                    >
                                        {customer.name}
                                        {#if customer.company_name}
                                            <span
                                                class="text-muted-foreground text-sm block"
                                            >
                                                {customer.company_name}
                                            </span>
                                        {/if}
                                    </a>
                                </td>
                                <td class="px-4 py-3 text-sm">
                                    {customer.phone || "—"}
                                </td>
                                <td class="px-4 py-3 text-sm font-mono">
                                    {customer.gstin || "—"}
                                </td>
                                <td
                                    class="px-4 py-3 text-right font-mono text-sm"
                                >
                                    {formatCurrency(customer.balance)}
                                </td>
                                <td class="px-4 py-3 text-center">
                                    <Badge
                                        variant={getStatusVariant(
                                            customer.status,
                                        )}
                                    >
                                        {customer.status || "active"}
                                    </Badge>
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        </Card>
    {/if}
</div>
