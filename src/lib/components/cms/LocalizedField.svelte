<script lang="ts">
    import {Label} from '$lib/components/ui/label/index.js';
    import {Input} from '$lib/components/ui/input/index.js';
    import {Textarea} from '$lib/components/ui/textarea/index.js';
    import {cn} from '$lib/utils.js';

    import type {Lang, LocalizedText} from '$lib/cms/events/types';

    type Props = {
        label: string;
        value: LocalizedText;
        lang: Lang;
        placeholder?: string;
        textarea?: boolean;
        maxLength?: number;
        required?: boolean;
        error?: string;
        onValueChange?: () => void;
    };

    const id = $props.id();
    const errorId = `${id}-error`;

    let {
        label,
        value = $bindable(),
        lang,
        placeholder = '',
        textarea = false,
        maxLength,
        required = false,
        error = '',
        onValueChange
    }: Props = $props();

    let inputValue = $state('');

    const localizedLabel = $derived(`${label} - ${lang.toUpperCase()}`);
    const currentLength = $derived(inputValue.length);

    const controlClass =
        'rounded-xl border border-slate-300 bg-white shadow-sm focus-visible:border-primary focus-visible:ring-primary/25';

    const invalidControlClass =
        'border-destructive focus-visible:border-destructive focus-visible:ring-destructive/25';

    $effect(() => {
        inputValue = value?.[lang] ?? '';
    });

    function update(v: string) {
        inputValue = v;

        value = {
            ...value,
            [lang]: v
        };

        queueMicrotask(() => {
            onValueChange?.();
        });
    }
</script>

<div class="field">
    <div class="field-top">
        <Label for={id} class="px-1">
            {localizedLabel}
        </Label>

        {#if maxLength}
            <small>{currentLength}/{maxLength}</small>
        {/if}
    </div>

    {#if textarea}
        <Textarea
                id={id}
                bind:value={inputValue}
                placeholder={placeholder}
                maxlength={maxLength}
                required={required}
                rows={4}
                class={cn(controlClass, error && invalidControlClass)}
                aria-invalid={!!error}
                aria-describedby={error ? errorId : undefined}
                oninput={(event) => update(event.currentTarget.value)}
        />
    {:else}
        <Input
                id={id}
                bind:value={inputValue}
                placeholder={placeholder}
                required={required}
                class={cn('h-10', controlClass, error && invalidControlClass)}
                aria-invalid={!!error}
                aria-describedby={error ? errorId : undefined}
                oninput={(event) => update(event.currentTarget.value)}
        />
    {/if}

    {#if error}
        <p id={errorId} class="field-error">
            {error}
        </p>
    {/if}
</div>

<style>
    .field {
        display: grid;
        gap: .45rem;
    }

    .field-top {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        align-items: center;
    }

    small {
        color: #667085;
        font-weight: 400;
    }

    .field-error {
        margin: 0;
        color: hsl(var(--destructive));
        font-size: 0.8125rem;
        line-height: 1.25rem;
    }
</style>