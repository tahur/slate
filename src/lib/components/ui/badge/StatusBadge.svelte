<script lang="ts">
    import Badge from "$lib/components/ui/badge/badge.svelte";
    import {
        CheckCircle2,
        Clock,
        AlertTriangle,
        AlertCircle,
    } from "lucide-svelte";
    import type { ComponentType } from "svelte";

    export let status: string;
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
            case "pending":
            case "sent":
                variant = "warning";
                Icon = Clock;
                break;
            case "overdue":
                variant = "destructive";
                Icon = AlertCircle;
                break;
            case "draft":
                variant = "secondary";
                Icon = AlertTriangle; // Using Triangle as a placeholder for draft/work in progress
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
