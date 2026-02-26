<script lang="ts">
    import Sidebar from "$lib/components/layout/sidebar.svelte";
    import Header from "$lib/components/layout/header.svelte";
    import type { Snippet } from "svelte";

    let { children, data }: { children: Snippet; data: any } = $props();
</script>

<div class="flex h-screen w-full flex-col bg-background text-foreground md:flex-row">
    <Sidebar />
    <div class="app-surface flex flex-1 flex-col overflow-hidden">
        <Header {data} />
        <main class="app-main space-y-5">
            {@render children()}
        </main>
    </div>
</div>
