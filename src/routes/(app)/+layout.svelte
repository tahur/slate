<script lang="ts">
    import Sidebar from "$lib/components/layout/sidebar.svelte";
    import Header from "$lib/components/layout/header.svelte";
    import type { Snippet } from "svelte";

    let { children }: { children: Snippet } = $props();
</script>

<div class="flex h-screen w-full flex-col md:flex-row bg-background">
    <Sidebar />
    <div class="flex flex-1 flex-col overflow-hidden app-surface">
        <Header />
        <main class="flex-1 overflow-auto p-4 md:p-5 space-y-5">
            {@render children()}
        </main>
    </div>
</div>
