<script lang="ts">
    import "../app.css";
    import { Toaster } from "$lib/components/ui/sonner";
    import { toast } from "svelte-sonner";

    let { children, data } = $props();

    // Handle server-side flash messages
    let flashApplied = $state(false);
    $effect(() => {
        if (data.flash && !flashApplied) {
            if (data.flash.type === "success") {
                toast.success(data.flash.message);
            } else if (data.flash.type === "error") {
                toast.error(data.flash.message);
            } else {
                toast.info(data.flash.message);
            }
            flashApplied = true;
        }
    });
</script>

<Toaster position="top-right" richColors closeButton />

{@render children()}
