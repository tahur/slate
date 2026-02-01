<script lang="ts">
    import { superForm } from "sveltekit-superforms";
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import { Textarea } from "$lib/components/ui/textarea";
    import {
        Select,
        SelectContent,
        SelectItem,
        SelectTrigger,
        SelectValue,
    } from "$lib/components/ui/select";
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

    // Indian States for Dropdown
    const states = [
        { code: "37", name: "Andhra Pradesh" },
        { code: "12", name: "Arunachal Pradesh" },
        { code: "18", name: "Assam" },
        { code: "10", name: "Bihar" },
        { code: "22", name: "Chhattisgarh" },
        { code: "30", name: "Goa" },
        { code: "24", name: "Gujarat" },
        { code: "06", name: "Haryana" },
        { code: "02", name: "Himachal Pradesh" },
        { code: "20", name: "Jharkhand" },
        { code: "29", name: "Karnataka" },
        { code: "32", name: "Kerala" },
        { code: "23", name: "Madhya Pradesh" },
        { code: "27", name: "Maharashtra" },
        { code: "14", name: "Manipur" },
        { code: "17", name: "Meghalaya" },
        { code: "15", name: "Mizoram" },
        { code: "13", name: "Nagaland" },
        { code: "21", name: "Odisha" },
        { code: "03", name: "Punjab" },
        { code: "08", name: "Rajasthan" },
        { code: "11", name: "Sikkim" },
        { code: "33", name: "Tamil Nadu" },
        { code: "36", name: "Telangana" },
        { code: "16", name: "Tripura" },
        { code: "09", name: "Uttar Pradesh" },
        { code: "05", name: "Uttarakhand" },
        { code: "19", name: "West Bengal" },
        { code: "35", name: "Andaman and Nicobar Islands" },
        { code: "04", name: "Chandigarh" },
        { code: "26", name: "Dadra and Nagar Haveli and Daman and Diu" },
        { code: "07", name: "Delhi" },
        { code: "01", name: "Jammu and Kashmir" },
        { code: "31", name: "Lakshadweep" },
        { code: "34", name: "Puducherry" },
        { code: "38", name: "Ladakh" },
    ].sort((a, b) => a.name.localeCompare(b.name));
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-50 p-4">
    <Card class="w-full max-w-lg">
        <CardHeader>
            <CardTitle class="text-2xl">Setup Organization</CardTitle>
            <CardDescription
                >Tell us about your business to get started.</CardDescription
            >
        </CardHeader>
        <CardContent>
            <form method="POST" use:enhance id="setup-form" class="grid gap-4">
                <div class="grid gap-2">
                    <Label for="name"
                        >Business Name <span class="text-destructive">*</span
                        ></Label
                    >
                    <Input
                        id="name"
                        name="name"
                        placeholder="Acme Enterprises"
                        bind:value={$form.name}
                        {...$constraints.name}
                    />
                    {#if $errors.name}<span class="text-sm text-destructive"
                            >{$errors.name}</span
                        >{/if}
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div class="grid gap-2">
                        <Label for="email">Email (Optional)</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            bind:value={$form.email}
                            {...$constraints.email}
                        />
                        {#if $errors.email}<span
                                class="text-sm text-destructive"
                                >{$errors.email}</span
                            >{/if}
                    </div>
                    <div class="grid gap-2">
                        <Label for="phone">Phone (Optional)</Label>
                        <Input
                            id="phone"
                            name="phone"
                            bind:value={$form.phone}
                            {...$constraints.phone}
                        />
                        {#if $errors.phone}<span
                                class="text-sm text-destructive"
                                >{$errors.phone}</span
                            >{/if}
                    </div>
                </div>

                <div class="grid gap-2">
                    <Label for="address"
                        >Address <span class="text-destructive">*</span></Label
                    >
                    <Textarea
                        id="address"
                        name="address"
                        placeholder="Street Name, Area"
                        bind:value={$form.address}
                        {...$constraints.address}
                    />
                    {#if $errors.address}<span class="text-sm text-destructive"
                            >{$errors.address}</span
                        >{/if}
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div class="grid gap-2">
                        <Label for="state_code"
                            >State <span class="text-destructive">*</span
                            ></Label
                        >
                        <Select
                            type="single"
                            bind:value={$form.state_code}
                            name="state_code"
                        >
                            <SelectTrigger>
                                {#if $form.state_code}
                                    {states.find(
                                        (s) => s.code === $form.state_code,
                                    )?.name}
                                {:else}
                                    <SelectValue placeholder="Select state" />
                                {/if}
                            </SelectTrigger>
                            <SelectContent class="max-h-[200px]">
                                {#each states as state}
                                    <SelectItem value={state.code}
                                        >{state.name}</SelectItem
                                    >
                                {/each}
                            </SelectContent>
                        </Select>
                        <input
                            type="hidden"
                            name="state_code"
                            value={$form.state_code}
                        />
                        {#if $errors.state_code}<span
                                class="text-sm text-destructive"
                                >{$errors.state_code}</span
                            >{/if}
                    </div>
                    <div class="grid gap-2">
                        <Label for="pincode"
                            >Pincode <span class="text-destructive">*</span
                            ></Label
                        >
                        <Input
                            id="pincode"
                            name="pincode"
                            bind:value={$form.pincode}
                            {...$constraints.pincode}
                        />
                        {#if $errors.pincode}<span
                                class="text-sm text-destructive"
                                >{$errors.pincode}</span
                            >{/if}
                    </div>
                </div>

                <div class="grid gap-2">
                    <Label for="gstin">GSTIN (Optional)</Label>
                    <Input
                        id="gstin"
                        name="gstin"
                        placeholder="29ABCDE1234F1Z5"
                        bind:value={$form.gstin}
                        {...$constraints.gstin}
                    />
                    {#if $errors.gstin}<span class="text-sm text-destructive"
                            >{$errors.gstin}</span
                        >{/if}
                </div>

                {#if data.error}
                    <div
                        class="text-center text-sm font-medium text-destructive"
                    >
                        {data.error}
                    </div>
                {/if}
            </form>
        </CardContent>
        <CardFooter>
            <Button
                type="submit"
                form="setup-form"
                class="w-full"
                disabled={$delayed}
            >
                {#if $delayed}Setting up...{:else}Complete Setup{/if}
            </Button>
        </CardFooter>
    </Card>
</div>
