<script lang="ts">
    import { Checkbox } from "bits-ui";
    import { cn } from "$lib/utils";

    const CheckboxPrimitive = Checkbox as any;

    let {
        ref = $bindable(null),
        checked = $bindable(false),
        class: className = undefined,
        ...restProps
    }: {
        ref?: HTMLElement | null;
        checked?: boolean;
        class?: string;
        [key: string]: any;
    } = $props();
</script>

<CheckboxPrimitive.Root
    bind:ref
    bind:checked
    class={cn(
        "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
        className,
    )}
    {...restProps}
>
    <CheckboxPrimitive.Indicator
        class={cn("flex items-center justify-center text-current")}
    >
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="h-4 w-4"><path d="M20 6 9 17l-5-5" /></svg
        >
    </CheckboxPrimitive.Indicator>
</CheckboxPrimitive.Root>
