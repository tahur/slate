<script lang="ts">
    import { superForm } from "sveltekit-superforms";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import type { PageData } from "./$types";

    let { data, form }: { data: PageData; form: any } = $props();
    const { form: initialForm } = data;

    const {
        form: formData,
        errors,
        constraints,
        enhance,
        delayed,
    } = superForm(initialForm);
</script>

<svelte:head>
    <title>Login - Slate</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossorigin="anonymous"
    />
    <link
        href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&display=swap"
        rel="stylesheet"
    />
</svelte:head>

<div
    class="login-shell min-h-screen flex items-center justify-center p-6 relative overflow-hidden"
>
    <div class="ambient" aria-hidden="true"></div>

    <div class="w-full max-w-sm relative z-10 flex flex-col items-center">
        <!-- Logo -->
        <a href="/" class="flex items-center gap-2.5 mb-10 group">
            <img src="/logo.svg" alt="Slate" class="logo-mark transition-transform group-hover:scale-105" />
            <span class="wordmark">Slate</span>
        </a>

        <!-- Card -->
        <div class="panel w-full">
            <div class="text-center mb-8">
                <h2 class="panel-title">Welcome back</h2>
                <p class="panel-subtitle">Sign in to your account</p>
            </div>

            <form method="POST" use:enhance id="login-form" class="space-y-4">
                <div class="space-y-2">
                    <Label for="email" class="font-bold text-[var(--ink)]">Email</Label>
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="you@example.com"
                        bind:value={$formData.email}
                        required={$constraints.email?.required}
                        class="bg-[var(--surface)] border-[var(--line)] text-[var(--ink)] focus-visible:ring-[var(--ink)]"
                    />
                    {#if $errors.email}
                        <span class="text-xs text-destructive">{$errors.email}</span>
                    {/if}
                </div>

                <div class="space-y-2">
                    <div class="flex items-center justify-between">
                        <Label for="password" class="font-bold text-[var(--ink)]">Password</Label>
                        <a
                            href="/forgot-password"
                            class="text-xs text-[var(--muted)] hover:text-[var(--ink)] transition-colors font-semibold"
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
                        class="bg-[var(--surface)] border-[var(--line)] text-[var(--ink)] focus-visible:ring-[var(--ink)]"
                    />
                    {#if $errors.password}
                        <span class="text-xs text-destructive">{$errors.password}</span>
                    {/if}
                </div>

                {#if form?.error}
                    <div class="text-sm text-destructive font-medium text-center py-2 px-3 bg-red-50 rounded-lg border border-red-200">
                        {form.error}
                    </div>
                {/if}

                <button type="submit" class="btn-primary w-full mt-2" disabled={$delayed}>
                    {#if $delayed}Signing in...{:else}Sign in{/if}
                </button>
            </form>

            {#if data.registrationOpen}
                <div class="mt-8 text-center border-t border-[var(--line)] pt-5">
                    <span class="text-[0.85rem] text-[var(--muted)]">
                        Don't have an account?
                        <a href="/register" class="text-[var(--ink)] font-bold hover:underline">
                            Create workspace
                        </a>
                    </span>
                </div>
            {/if}
        </div>

        <p class="text-center text-xs font-semibold text-[var(--muted)] mt-8 uppercase tracking-[0.08em]">
            Open source · MIT licensed
        </p>
    </div>
</div>

<style>
    :global(body) {
        background: #f3f3f3;
    }

    .login-shell {
        --ink: #111111;
        --surface: #fcfcfc;
        --soft: #f4f4f4;
        --muted: #5f5f5f;
        --line: #d4d4d4;
        background: #f3f3f3;
        color: var(--ink);
        font-family: "Manrope", "Helvetica Neue", Helvetica, sans-serif;
    }

    .ambient {
        position: fixed;
        inset: 0;
        z-index: 0;
        pointer-events: none;
        background-image: radial-gradient(
                circle at 50% 10%,
                rgb(0 0 0 / 0.08) 0,
                transparent 45%
            ),
            linear-gradient(rgb(0 0 0 / 0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgb(0 0 0 / 0.06) 1px, transparent 1px);
        background-size:
            auto,
            56px 56px,
            56px 56px;
        mask-image: linear-gradient(
            to bottom,
            black 0%,
            rgb(0 0 0 / 0.85) 48%,
            transparent 100%
        );
    }

    .logo-mark {
        width: 2.2rem;
        height: 2.2rem;
        border-radius: 6px;
    }

    .wordmark {
        font-family: "Space Grotesk", "Manrope", sans-serif;
        font-weight: 700;
        font-size: 1.35rem;
        letter-spacing: -0.03em;
        color: var(--ink);
    }

    .panel {
        border: 1px solid var(--line);
        background: var(--surface);
        padding: 2rem 1.75rem;
        border-radius: var(--radius);
        box-shadow: 0 4px 24px -12px rgba(0, 0, 0, 0.08);
    }

    .panel-title {
        color: var(--ink);
        font-family: "Space Grotesk", "Manrope", sans-serif;
        font-size: 1.6rem;
        font-weight: 700;
        letter-spacing: -0.02em;
        line-height: 1.15;
    }

    .panel-subtitle {
        margin-top: 0.35rem;
        color: var(--muted);
        font-size: 0.95rem;
    }

    .btn-primary {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: 1px solid var(--color-primary);
        background: var(--color-primary);
        color: white;
        font-size: 0.86rem;
        font-weight: 700;
        padding: 0.62rem 1rem;
        transition: all 180ms ease;
        border-radius: var(--radius);
        cursor: pointer;
    }

    .btn-primary:hover:not(:disabled) {
        background: var(--color-brand-hover, #e04f0d);
        border-color: var(--color-brand-hover, #e04f0d);
        transform: translateY(-1px);
    }

    .btn-primary:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }
</style>
