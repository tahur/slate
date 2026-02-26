<script lang="ts">
    import { superForm } from "sveltekit-superforms";
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import {
        Card,
        CardContent,
        CardDescription,
        CardFooter,
        CardHeader,
        CardTitle,
    } from "$lib/components/ui/card";
    import type { PageData, ActionData } from "./$types";

    let { data, form: actionData }: { data: PageData; form: ActionData } =
        $props();
    const { form: initialForm } = data;

    const {
        form: formData,
        errors,
        constraints,
        enhance,
        delayed,
    } = superForm(initialForm);

    const success = $derived(actionData?.success);
    const errorMessage = $derived(
        (actionData as { error?: string } | undefined)?.error,
    );
    const successMessage = $derived(actionData?.message);
</script>

<div class="flex min-h-screen items-center justify-center bg-[#F8F8F8] p-6">
    <div class="w-full max-w-sm">
        <div class="flex flex-col items-center mb-8">
            <img src="/logo.svg" alt="Slate" class="h-8 w-8 rounded-md mb-3" />
            <h1 class="text-lg font-semibold tracking-tight text-[#111]">Slate</h1>
        </div>

        <Card class="w-full shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
            <CardHeader class="space-y-1">
                <CardTitle class="text-xl text-center text-[#111]">Reset Password</CardTitle>
                <CardDescription class="text-center text-slate-500">
                    Enter your email address and we'll send you a link to reset your password
                </CardDescription>
            </CardHeader>
            <CardContent>
                {#if success}
                    <div class="text-center py-4">
                        <div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                            <p class="text-green-700 text-sm">{successMessage}</p>
                        </div>
                        <p class="text-sm text-slate-500">Check your inbox and spam folder.</p>
                    </div>
                {:else if !data.emailConfigured}
                    <div class="text-center py-4">
                        <div class="bg-amber-50 border border-amber-200 rounded-lg p-4">
                            <p class="text-amber-700 text-sm font-medium mb-2">Email Not Configured</p>
                            <p class="text-amber-600 text-xs">
                                Password reset requires email to be set up. Please contact your administrator.
                            </p>
                        </div>
                    </div>
                {:else}
                    <form method="POST" use:enhance id="forgot-password-form" class="grid gap-4">
                        <div class="grid gap-2">
                            <Label for="email" class="text-sm font-medium text-[#111]">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="you@example.com"
                                bind:value={$formData.email}
                                required={$constraints.email?.required}
                            />
                            {#if $errors.email}
                                <span class="text-sm text-red-600">{$errors.email}</span>
                            {/if}
                        </div>
                        {#if errorMessage}
                            <div class="text-sm text-red-600 font-medium text-center">{errorMessage}</div>
                        {/if}
                    </form>
                {/if}
            </CardContent>
            <CardFooter class="flex flex-col gap-3">
                {#if !success && data.emailConfigured}
                    <Button type="submit" form="forgot-password-form" class="w-full" disabled={$delayed}>
                        {#if $delayed}Sending...{:else}Send Reset Link{/if}
                    </Button>
                {/if}
                <a href="/login" class="text-sm text-slate-500 hover:text-[#111] underline underline-offset-4">
                    Back to Login
                </a>
            </CardFooter>
        </Card>
    </div>
</div>
