<script lang="ts">
    import Badge from "$lib/components/ui/badge/badge.svelte";
    import {
        CheckCircle2,
        Clock,
        AlertTriangle,
        AlertCircle,
    } from "lucide-svelte";
    import type { ComponentType } from "svelte";

    export let status: string | null | undefined = undefined;
    export let className: string = "";

    const normalizedStatus = status?.toLowerCase() || "unknown";

    let variant:
        | "default"
        | "secondary"
        | "destructive"
        | "outline"
        | "success"
        | "warning"
        | "info";
    let Icon: ComponentType | null;

    $: {
        switch (normalizedStatus) {
            case "paid":
                variant = "success";
                Icon = CheckCircle2;
                break;
            case "partially_paid":
                variant = "warning";
                Icon = Clock; // Or a specific icon like PieChart
                break;
            case "pending":
            case "sent":
            case "issued":
                variant = "info";
                Icon = Clock;
                break;
            case "overdue":
                variant = "destructive";
                Icon = AlertCircle;
                break;
            case "draft":
                variant = "secondary";
                Icon = AlertTriangle;
                break;
            case "cancelled":
            case "void":
                variant = "outline";
                Icon = AlertCircle;
                break;
            default:
                variant = "outline";
                Icon = null;
        }
    }
</script>

<Badge {variant} class="gap-1.5 pl-1.5 pr-2.5 {className}">
    {#if Icon}
        <svelte:component this={Icon} class="size-3.5" />
    {/if}
    {status}
</Badge>
