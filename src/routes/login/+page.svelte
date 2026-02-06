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
    import { Separator } from "$lib/components/ui/separator";
    import type { PageData } from "./$types";

    let { data, form }: { data: PageData; form: any } = $props();

    const {
        form: formData,
        errors,
        constraints,
        enhance,
        delayed,
    } = superForm(data.form);
</script>

<div
    class="flex min-h-screen items-center justify-center bg-bg-light dark:bg-bg-dark relative overflow-hidden font-sans"
>
    <div
        class="absolute inset-0 bg-grid -z-10 [mask-image:linear-gradient(to_bottom,white,transparent)]"
    ></div>

    <div class="w-full max-w-sm z-10">
        <div class="flex flex-col items-center mb-8">
            <div class="bg-brand/10 p-4 rounded-xl mb-4">
                <img src="/logo.svg" alt="Slate Logo" class="w-12 h-12" />
            </div>
            <h1
                class="font-display text-3xl font-bold text-slate-900 dark:text-white"
            >
                Slate
            </h1>
        </div>

        <Card
            class="w-full border-bord-light dark:border-bord-dark bg-surf-light dark:bg-surf-dark shadow-2xl"
        >
            <CardHeader class="space-y-1">
                <CardTitle
                    class="text-2xl text-center text-slate-900 dark:text-white"
                    >Welcome back</CardTitle
                >
                <CardDescription
                    class="text-center text-slate-500 dark:text-slate-400"
                >
                    Enter your email below to login into your account
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form
                    method="POST"
                    use:enhance
                    id="login-form"
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
                            {...$constraints.email}
                            class="bg-white dark:bg-slate-800 border-bord-light dark:border-bord-dark focus-visible:ring-brand"
                        />
                        {#if $errors.email}<span
                                class="text-sm text-destructive"
                                >{$errors.email}</span
                            >{/if}
                    </div>
                    <div class="grid gap-2">
                        <div class="flex items-center justify-between">
                            <Label
                                for="password"
                                class="text-slate-700 dark:text-slate-300"
                                >Password</Label
                            >
                            <a
                                href="/forgot-password"
                                class="text-xs text-slate-500 dark:text-slate-400 hover:text-brand underline-offset-4 hover:underline"
                            >
                                Forgot password?
                            </a>
                        </div>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            bind:value={$formData.password}
                            {...$constraints.password}
                            class="bg-white dark:bg-slate-800 border-bord-light dark:border-bord-dark focus-visible:ring-brand"
                        />
                        {#if $errors.password}<span
                                class="text-sm text-destructive"
                                >{$errors.password}</span
                            >{/if}
                    </div>
                    {#if form?.error}
                        <div
                            class="text-sm text-destructive font-medium text-center"
                        >
                            {form.error}
                        </div>
                    {/if}
                </form>
            </CardContent>
            <CardFooter>
                <Button
                    type="submit"
                    form="login-form"
                    class="w-full bg-brand hover:bg-brand-hover text-white shadow-glow transition-all hover:scale-[1.02]"
                    disabled={$delayed}
                >
                    {#if $delayed}Logging in...{:else}Login{/if}
                </Button>
            </CardFooter>
        </Card>

        <p
            class="px-8 text-center text-sm text-slate-500 dark:text-slate-400 mt-6"
        >
            <a
                href="/register"
                class="hover:text-brand underline underline-offset-4 pointer-events-auto"
            >
                Don't have an account? Sign Up
            </a>
        </p>
    </div>
</div>
