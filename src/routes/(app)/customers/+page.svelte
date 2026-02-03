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
    ): "success" | "secondary" | "outline" {
        switch (status) {
            case "active":
                return "success";
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
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Phone</th>
                            <th>GSTIN</th>
                            <th class="text-right">Balance</th>
                            <th class="text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each data.customers as customer}
                            <tr>
                                <td class="data-cell--primary">
                                    <a
                                        href="/customers/{customer.id}"
                                        class="hover:underline"
                                    >
                                        {customer.name}
                                        {#if customer.company_name}
                                            <span
                                                class="data-cell--muted text-[12px] block"
                                            >
                                                {customer.company_name}
                                            </span>
                                        {/if}
                                    </a>
                                </td>
                                <td class="data-cell--muted">
                                    {customer.phone || "—"}
                                </td>
                                <td class="font-mono text-sm">
                                    {customer.gstin || "—"}
                                </td>
                                <td class="data-cell--number">
                                    {formatCurrency(customer.balance)}
                                </td>
                                <td class="text-center">
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
