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

    let { data, form: actionData }: { data: PageData; form: ActionData } = $props();
    const { form: initialForm } = data;

    const {
        form: formData,
        errors,
        constraints,
        enhance,
        delayed,
    } = superForm(initialForm);

    const success = $derived(actionData?.success);
    const errorMessage = $derived((actionData as { error?: string } | undefined)?.error || data.error);
    const isValidToken = $derived(data.valid);
</script>

<div class="flex min-h-screen items-center justify-center bg-[#F8F8F8] p-6">
    <div class="w-full max-w-sm">
        <div class="flex flex-col items-center mb-8">
            <img src="/logo.svg" alt="Slate" class="h-8 w-8 rounded-md mb-3" />
            <h1 class="text-lg font-semibold tracking-tight text-[#111]">Slate</h1>
        </div>

        <Card class="w-full shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
            <CardHeader class="space-y-1">
                <CardTitle class="text-xl text-center text-[#111]">
                    {#if success}Password Reset{:else}Create New Password{/if}
                </CardTitle>
                {#if !success && isValidToken}
                    <CardDescription class="text-center text-slate-500">
                        Enter your new password below
                    </CardDescription>
                {/if}
            </CardHeader>
            <CardContent>
                {#if success}
                    <div class="text-center py-4">
                        <div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                            <p class="text-green-700 text-sm font-medium">
                                Your password has been reset successfully!
                            </p>
                        </div>
                        <p class="text-sm text-slate-500">You can now login with your new password.</p>
                    </div>
                {:else if !isValidToken}
                    <div class="text-center py-4">
                        <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                            <p class="text-red-700 text-sm font-medium mb-2">Invalid Reset Link</p>
                            <p class="text-red-600 text-xs">{errorMessage}</p>
                        </div>
                    </div>
                {:else}
                    <form method="POST" use:enhance id="reset-password-form" class="grid gap-4">
                        <div class="grid gap-2">
                            <Label for="password" class="text-sm font-medium text-[#111]">New Password</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="At least 8 characters"
                                bind:value={$formData.password}
                                {...$constraints.password}
                            />
                            {#if $errors.password}
                                <span class="text-sm text-red-600">{$errors.password}</span>
                            {/if}
                        </div>
                        <div class="grid gap-2">
                            <Label for="confirmPassword" class="text-sm font-medium text-[#111]">Confirm Password</Label>
                            <Input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                placeholder="Repeat your password"
                                bind:value={$formData.confirmPassword}
                            />
                            {#if $errors.confirmPassword}
                                <span class="text-sm text-red-600">{$errors.confirmPassword}</span>
                            {/if}
                        </div>
                        {#if errorMessage}
                            <div class="text-sm text-red-600 font-medium text-center">{errorMessage}</div>
                        {/if}
                    </form>
                {/if}
            </CardContent>
            <CardFooter class="flex flex-col gap-3">
                {#if success}
                    <Button href="/login" class="w-full">Go to Login</Button>
                {:else if isValidToken}
                    <Button type="submit" form="reset-password-form" class="w-full" disabled={$delayed}>
                        {#if $delayed}Resetting...{:else}Reset Password{/if}
                    </Button>
                {:else}
                    <Button href="/forgot-password" class="w-full">Request New Link</Button>
                {/if}
                <a href="/login" class="text-sm text-slate-500 hover:text-[#111] underline underline-offset-4">
                    Back to Login
                </a>
            </CardFooter>
        </Card>
    </div>
</div>
