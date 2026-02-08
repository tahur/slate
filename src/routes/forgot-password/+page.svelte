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

    const {
        form: formData,
        errors,
        constraints,
        enhance,
        delayed,
    } = superForm(data.form);

    const success = $derived(actionData?.success);
    const errorMessage = $derived(
        (actionData as { error?: string } | undefined)?.error,
    );
    const successMessage = $derived(actionData?.message);
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
                <span class="material-icons-round text-brand text-3xl"
                    >pie_chart</span
                >
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
                    >Reset Password</CardTitle
                >
                <CardDescription
                    class="text-center text-slate-500 dark:text-slate-400"
                >
                    Enter your email address and we'll send you a link to reset
                    your password
                </CardDescription>
            </CardHeader>
            <CardContent>
                {#if success}
                    <div class="text-center py-4">
                        <div
                            class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4"
                        >
                            <span
                                class="material-icons-round text-green-600 dark:text-green-400 text-3xl mb-2"
                                >mark_email_read</span
                            >
                            <p
                                class="text-green-700 dark:text-green-300 text-sm"
                            >
                                {successMessage}
                            </p>
                        </div>
                        <p class="text-sm text-slate-500 dark:text-slate-400">
                            Check your inbox and spam folder.
                        </p>
                    </div>
                {:else if !data.emailConfigured}
                    <div class="text-center py-4">
                        <div
                            class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4"
                        >
                            <span
                                class="material-icons-round text-amber-600 dark:text-amber-400 text-3xl mb-2"
                                >warning</span
                            >
                            <p
                                class="text-amber-700 dark:text-amber-300 text-sm font-medium mb-2"
                            >
                                Email Not Configured
                            </p>
                            <p
                                class="text-amber-600 dark:text-amber-400 text-xs"
                            >
                                Password reset requires email to be set up.
                                Please contact your administrator.
                            </p>
                        </div>
                    </div>
                {:else}
                    <form
                        method="POST"
                        use:enhance
                        id="forgot-password-form"
                        class="grid gap-4"
                    >
                        <div class="grid gap-2">
                            <Label
                                for="email"
                                class="text-slate-700 dark:text-slate-300"
                                >Email</Label
                            >
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="m@example.com"
                                bind:value={$formData.email}
                                required={$constraints.email?.required}
                                class="bg-white dark:bg-slate-800 border-bord-light dark:border-bord-dark focus-visible:ring-brand"
                            />
                            {#if $errors.email}
                                <span class="text-sm text-destructive"
                                    >{$errors.email}</span
                                >
                            {/if}
                        </div>
                        {#if errorMessage}
                            <div
                                class="text-sm text-destructive font-medium text-center"
                            >
                                {errorMessage}
                            </div>
                        {/if}
                    </form>
                {/if}
            </CardContent>
            <CardFooter class="flex flex-col gap-3">
                {#if !success && data.emailConfigured}
                    <Button
                        type="submit"
                        form="forgot-password-form"
                        class="w-full bg-brand hover:bg-brand-hover text-white shadow-glow transition-all hover:scale-[1.02]"
                        disabled={$delayed}
                    >
                        {#if $delayed}Sending...{:else}Send Reset Link{/if}
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
