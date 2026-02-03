<script lang="ts">
    import "../app.css";
    import ToastHost from "$lib/components/ui/toast/toast-host.svelte";

    let { children, data } = $props();
</script>

<ToastHost flash={data.flash} />

{@render children()}
