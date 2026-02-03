<script lang="ts">
    import { page } from "$app/stores";
    import { Button } from "$lib/components/ui/button";

    const status = $page.status;
    const message = $page.error?.message ?? "Something went wrong.";
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-50 p-4">
    <div class="w-full max-w-lg rounded-lg border bg-white p-6 shadow-sm">
        <div class="text-sm font-semibold text-muted-foreground">
            Error {status}
        </div>
        <h1 class="mt-2 text-2xl font-semibold">We hit a snag</h1>
        <p class="mt-2 text-sm text-muted-foreground">{message}</p>
        <div class="mt-6 flex gap-2">
            <Button href="/dashboard">Back to Dashboard</Button>
            <Button variant="outline" onclick={() => history.back()}>
                Go Back
            </Button>
        </div>
    </div>
</div>
