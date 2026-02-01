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
    import type { PageData } from "./$types";

    let { data }: { data: PageData } = $props();

    const { form, errors, constraints, enhance, delayed } = superForm(
        data.form,
    );
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-50">
    <Card class="w-full max-w-sm">
        <CardHeader>
            <CardTitle class="text-2xl">Login</CardTitle>
            <CardDescription
                >Enter your email below to login into OpenBill.</CardDescription
            >
        </CardHeader>
        <CardContent>
            <form method="POST" use:enhance id="login-form" class="grid gap-4">
                <div class="grid gap-2">
                    <Label for="email">Email</Label>
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="m@example.com"
                        bind:value={$form.email}
                        {...$constraints.email}
                    />
                    {#if $errors.email}<span class="text-sm text-destructive"
                            >{$errors.email}</span
                        >{/if}
                </div>
                <div class="grid gap-2">
                    <Label for="password">Password</Label>
                    <Input
                        id="password"
                        name="password"
                        type="password"
                        bind:value={$form.password}
                        {...$constraints.password}
                    />
                    {#if $errors.password}<span class="text-sm text-destructive"
                            >{$errors.password}</span
                        >{/if}
                </div>
                {#if data.error}
                    <div
                        class="text-sm text-destructive font-medium text-center"
                    >
                        {data.error}
                    </div>
                {/if}
            </form>
        </CardContent>
        <CardFooter>
            <Button
                type="submit"
                form="login-form"
                class="w-full"
                disabled={$delayed}
            >
                {#if $delayed}Logging in...{:else}Login{/if}
            </Button>
        </CardFooter>
    </Card>
</div>
