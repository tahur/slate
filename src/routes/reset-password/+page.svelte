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

<div
    class="flex min-h-screen items-center justify-center bg-bg-light dark:bg-bg-dark relative overflow-hidden font-sans"
>
    <div
        class="absolute inset-0 bg-grid -z-10 [mask-image:linear-gradient(to_bottom,white,transparent)]"
    ></div>

    <div class="w-full max-w-sm z-10">
        <div class="flex flex-col items-center mb-8">
            <div class="bg-brand/10 p-3 rounded-xl mb-4">
                <span class="material-icons-round text-brand text-3xl">pie_chart</span>
            </div>
            <h1 class="text-2xl font-bold text-slate-900 dark:text-white">
                Slate
            </h1>
        </div>

        <Card
            class="w-full border-bord-light dark:border-bord-dark bg-surf-light dark:bg-surf-dark shadow-2xl"
        >
            <CardHeader class="space-y-1">
                <CardTitle
                    class="text-2xl text-center text-slate-900 dark:text-white"
                >
                    {#if success}
                        Password Reset
                    {:else}
                        Create New Password
                    {/if}
                </CardTitle>
                {#if !success && isValidToken}
                    <CardDescription
                        class="text-center text-slate-500 dark:text-slate-400"
                    >
                        Enter your new password below
                    </CardDescription>
                {/if}
            </CardHeader>
            <CardContent>
                {#if success}
                    <div class="text-center py-4">
                        <div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
                            <span class="material-icons-round text-green-600 dark:text-green-400 text-3xl mb-2">check_circle</span>
                            <p class="text-green-700 dark:text-green-300 text-sm font-medium">
                                Your password has been reset successfully!
                            </p>
                        </div>
                        <p class="text-sm text-slate-500 dark:text-slate-400">
                            You can now login with your new password.
                        </p>
                    </div>
                {:else if !isValidToken}
                    <div class="text-center py-4">
                        <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                            <span class="material-icons-round text-red-600 dark:text-red-400 text-3xl mb-2">error</span>
                            <p class="text-red-700 dark:text-red-300 text-sm font-medium mb-2">
                                Invalid Reset Link
                            </p>
                            <p class="text-red-600 dark:text-red-400 text-xs">
                                {errorMessage}
                            </p>
                        </div>
                    </div>
                {:else}
                    <form
                        method="POST"
                        use:enhance
                        id="reset-password-form"
                        class="grid gap-4"
                    >
                        <div class="grid gap-2">
                            <Label
                                for="password"
                                class="text-slate-700 dark:text-slate-300"
                            >New Password</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="At least 8 characters"
                                bind:value={$formData.password}
                                {...$constraints.password}
                                class="bg-white dark:bg-slate-800 border-bord-light dark:border-bord-dark focus-visible:ring-brand"
                            />
                            {#if $errors.password}
                                <span class="text-sm text-destructive">{$errors.password}</span>
                            {/if}
                        </div>
                        <div class="grid gap-2">
                            <Label
                                for="confirmPassword"
                                class="text-slate-700 dark:text-slate-300"
                            >Confirm Password</Label>
                            <Input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                placeholder="Repeat your password"
                                bind:value={$formData.confirmPassword}
                                class="bg-white dark:bg-slate-800 border-bord-light dark:border-bord-dark focus-visible:ring-brand"
                            />
                            {#if $errors.confirmPassword}
                                <span class="text-sm text-destructive">{$errors.confirmPassword}</span>
                            {/if}
                        </div>
                        {#if errorMessage}
                            <div class="text-sm text-destructive font-medium text-center">
                                {errorMessage}
                            </div>
                        {/if}
                    </form>
                {/if}
            </CardContent>
            <CardFooter class="flex flex-col gap-3">
                {#if success}
                    <Button
                        href="/login"
                        class="w-full shadow-glow transition-all hover:scale-[1.02]"
                    >
                        Go to Login
                    </Button>
                {:else if isValidToken}
                    <Button
                        type="submit"
                        form="reset-password-form"
                        class="w-full shadow-glow transition-all hover:scale-[1.02]"
                        disabled={$delayed}
                    >
                        {#if $delayed}Resetting...{:else}Reset Password{/if}
                    </Button>
                {:else}
                    <Button
                        href="/forgot-password"
                        class="w-full shadow-glow transition-all hover:scale-[1.02]"
                    >
                        Request New Link
                    </Button>
                {/if}
                <a
                    href="/login"
                    class="text-sm text-slate-500 dark:text-slate-400 hover:text-brand underline underline-offset-4"
                >
                    Back to Login
                </a>
            </CardFooter>
        </Card>
    </div>
</div>
