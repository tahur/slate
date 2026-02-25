<script lang="ts">
    import { superForm } from "sveltekit-superforms";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import { authClient } from "$lib/auth-client";
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

    let googleLoading = $state(false);

    async function signInWithGoogle() {
        googleLoading = true;
        try {
            await authClient.signIn.social({
                provider: "google",
                callbackURL: "/auth/callback",
            });
        } catch {
            googleLoading = false;
        }
    }
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
            <img
                src="/logo.svg"
                alt="Slate"
                class="logo-mark transition-transform group-hover:scale-105"
            />
            <span class="wordmark">Slate</span>
        </a>

        <!-- Card -->
        <div class="panel w-full">
            <div class="text-center mb-8">
                <h2 class="panel-title">Welcome back</h2>
                <p class="panel-subtitle">Sign in to your account</p>
            </div>

            {#if data.googleEnabled}
                <button
                    type="button"
                    class="btn-google w-full"
                    onclick={signInWithGoogle}
                    disabled={googleLoading}
                >
                    <svg
                        class="google-icon"
                        viewBox="0 0 24 24"
                        width="18"
                        height="18"
                    >
                        <path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                            fill="#4285F4"
                        />
                        <path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            fill="#34A853"
                        />
                        <path
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            fill="#FBBC05"
                        />
                        <path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            fill="#EA4335"
                        />
                    </svg>
                    {#if googleLoading}Redirecting...{:else}Sign in with Google{/if}
                </button>

                <div class="divider-row">
                    <span class="divider-text">or</span>
                </div>
            {/if}

            <form method="POST" use:enhance id="login-form" class="space-y-4">
                <div class="space-y-2">
                    <Label for="email" class="font-bold text-[var(--ink)]"
                        >Email</Label
                    >
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
                        <span class="text-xs text-destructive"
                            >{$errors.email}</span
                        >
                    {/if}
                </div>

                <div class="space-y-2">
                    <div class="flex items-center justify-between">
                        <Label
                            for="password"
                            class="font-bold text-[var(--ink)]">Password</Label
                        >
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

                <button
                    type="submit"
                    class="btn-primary w-full mt-2"
                    disabled={$delayed}
                >
                    {#if $delayed}Signing in...{:else}Sign in{/if}
                </button>
            </form>

            <div class="mt-8 text-center border-t border-[var(--line)] pt-5">
                <span class="text-[0.85rem] text-[var(--muted)]">
                    Don't have an account?
                    <a
                        href="/register"
                        class="text-[var(--ink)] font-bold hover:underline"
                    >
                        Create workspace
                    </a>
                </span>
            </div>
        </div>

        <p
            class="text-center text-xs font-semibold text-[var(--muted)] mt-8 uppercase tracking-[0.08em]"
        >
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

    .btn-google {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.6rem;
        border: 1px solid var(--line);
        background: var(--surface);
        color: var(--ink);
        font-size: 0.86rem;
        font-weight: 600;
        padding: 0.62rem 1rem;
        transition: all 180ms ease;
        border-radius: var(--radius);
        cursor: pointer;
    }

    .btn-google:hover:not(:disabled) {
        background: var(--soft);
        border-color: #bbb;
        transform: translateY(-1px);
        box-shadow: 0 2px 8px -2px rgba(0, 0, 0, 0.1);
    }

    .btn-google:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }

    .google-icon {
        flex-shrink: 0;
    }

    .divider-row {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin: 1.25rem 0;
    }

    .divider-row::before,
    .divider-row::after {
        content: "";
        flex: 1;
        height: 1px;
        background: var(--line);
    }

    .divider-text {
        font-size: 0.78rem;
        font-weight: 600;
        color: var(--muted);
        text-transform: uppercase;
        letter-spacing: 0.06em;
    }
</style>
