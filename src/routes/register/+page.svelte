<script lang="ts">
    import { superForm } from "sveltekit-superforms";
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import { Card } from "$lib/components/ui/card";
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
    class="min-h-screen flex items-center justify-center bg-surface-1 p-6 relative overflow-hidden"
>
    <!-- Subtle background grid -->
    <div
        class="absolute inset-0 bg-grid -z-10 [mask-image:linear-gradient(to_bottom,white,transparent)]"
    ></div>

    <div class="w-full max-w-sm relative z-10">
        <!-- Logo -->
        <div class="flex flex-col items-center mb-8">
            <div class="bg-primary/10 p-3 rounded-xl mb-3">
                <img src="/logo.svg" alt="Slate Logo" class="w-10 h-10" />
            </div>
            <h1 class="font-display text-2xl font-bold text-text-strong">
                Slate
            </h1>
        </div>

        <!-- Card -->
        <Card class="p-6 bg-surface-0 border-border shadow-lg">
            <div class="text-center mb-6">
                <h2 class="text-xl font-bold text-text-strong mb-1">
                    Create your account
                </h2>
                <p class="text-sm text-text-muted">Get started with Slate</p>
            </div>

            <form
                method="POST"
                use:enhance
                id="register-form"
                class="space-y-4"
            >
                <div class="space-y-2">
                    <Label for="name" class="text-text-subtle">Your name</Label>
                    <Input
                        id="name"
                        name="name"
                        placeholder="John Doe"
                        bind:value={$formData.name}
                        {...$constraints.name}
                        class="bg-surface-0 border-border focus-visible:ring-primary"
                    />
                    {#if $errors.name}
                        <span class="text-xs text-destructive"
                            >{$errors.name}</span
                        >
                    {/if}
                </div>

                <div class="space-y-2">
                    <Label for="email" class="text-text-subtle">Email</Label>
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="you@example.com"
                        bind:value={$formData.email}
                        {...$constraints.email}
                        class="bg-surface-0 border-border focus-visible:ring-primary"
                    />
                    {#if $errors.email}
                        <span class="text-xs text-destructive"
                            >{$errors.email}</span
                        >
                    {/if}
                </div>

                <div class="space-y-2">
                    <Label for="password" class="text-text-subtle"
                        >Password</Label
                    >
                    <Input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="Min. 8 characters"
                        bind:value={$formData.password}
                        {...$constraints.password}
                        class="bg-surface-0 border-border focus-visible:ring-primary"
                    />
                    {#if $errors.password}
                        <span class="text-xs text-destructive"
                            >{$errors.password}</span
                        >
                    {/if}
                </div>

                {#if form?.error}
                    <div
                        class="text-sm text-destructive font-medium text-center py-2 px-3 bg-red-50 rounded-lg border border-red-200"
                    >
                        {form.error}
                    </div>
                {/if}

                <Button type="submit" class="w-full" disabled={$delayed}>
                    {#if $delayed}Creating account...{:else}Create account{/if}
                </Button>
            </form>

            <div class="mt-6 text-center">
                <span class="text-sm text-text-muted">
                    Already have an account?
                    <a
                        href="/login"
                        class="text-primary font-medium hover:underline"
                    >
                        Sign in
                    </a>
                </span>
            </div>
        </Card>

        <!-- Subtle branding at bottom -->
        <p class="text-center text-xs text-text-muted mt-6">
            Open source · MIT licensed
        </p>
    </div>
</div>
