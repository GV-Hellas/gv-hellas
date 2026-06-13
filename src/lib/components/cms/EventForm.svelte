<script lang="ts">
    import {t, locale} from '$lib/i18n';
    import type {EventPayload, EventMedia, EventSection, Lang} from '$lib/cms/events/types';
    import {EVENT_CATEGORIES} from '$lib/cms/events/schema';
    import {eventPayloadSchema} from '$lib/cms/events/validation';

    import LocalizedField from './LocalizedField.svelte';
    import EventSectionEditor from './EventSectionEditor.svelte';

    import {Button, buttonVariants} from '$lib/components/ui/button/index.js';
    import {Input} from '$lib/components/ui/input/index.js';
    import {Label} from '$lib/components/ui/label/index.js';
    import * as Select from '$lib/components/ui/select/index.js';
    import * as Popover from '$lib/components/ui/popover/index.js';
    import {Calendar} from '$lib/components/ui/calendar/index.js';

    // noinspection ES6UnusedImports
    import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
    import {cn} from '$lib/utils.js';

    import {
        getLocalTimeZone,
        parseDate,
        type CalendarDate
    } from '@internationalized/date';

    import type {ZodIssue} from 'zod';

    type FormMode = 'create' | 'edit';

    type Props = {
        submitTo?: string;
        initialEvent?: EventPayload | null;
        mode?: FormMode;
    };

    let {
        submitTo = '?/create',
        initialEvent = null,
        mode = 'create'
    }: Props = $props();

    const id = $props.id();

    let loading = $state(false);
    let error = $state('');
    let success = $state('');
    let fieldErrors = $state<Record<string, string>>({});
    let datePickerOpen = $state(false);

    const files = new Map<string, File>();

    const controlClass =
        'h-10 rounded-xl border border-slate-300 bg-white shadow-sm focus-visible:border-primary focus-visible:ring-primary/25';

    const invalidControlClass =
        'border-destructive focus-visible:border-destructive focus-visible:ring-destructive/25';

    function emptyEvent(): EventPayload {
        return {
            title: {el: '', de: ''},
            description: {el: '', de: ''},
            date: '',
            time: '',
            location: '',
            category: 'general',
            priceMembers: null,
            pricePublic: null,
            sections: [newSection()]
        };
    }

    function cloneEvent(source: EventPayload | null) {
        return structuredClone(source ?? emptyEvent());
    }

    function parseEventDate(value: string) {
        if (!value) return undefined;

        try {
            return parseDate(value);
        } catch {
            return undefined;
        }
    }

    let event = $state<EventPayload>(emptyEvent());
    let selectedDate = $state<CalendarDate | undefined>(undefined);

    $effect(() => {
        const nextEvent = cloneEvent(initialEvent);

        event = nextEvent;
        selectedDate = parseEventDate(nextEvent.date);

        fieldErrors = {};
        error = '';
        success = '';
        files.clear();
    });

    const lang = $derived(($locale || 'el') as Lang);
    const dateLocale = $derived(lang === 'de' ? 'de-CH' : 'el-GR');

    const formattedDate = $derived(
        selectedDate
            ? selectedDate.toDate(getLocalTimeZone()).toLocaleDateString(dateLocale)
            : $t('admin.form.pickDate')
    );

    $effect(() => {
        event.date = selectedDate?.toString() ?? '';
    });

    function newSection(): EventSection {
        return {
            id: crypto.randomUUID(),
            beforeHtml: {el: '', de: ''},
            media: [],
            afterHtml: {el: '', de: ''}
        };
    }

    function addSection() {
        event.sections = [...event.sections, newSection()];
    }

    function removeSection(id: string) {
        if (event.sections.length === 1) return;

        event.sections = event.sections.filter((section) => section.id !== id);
    }

    function rememberFile(item: { media: EventMedia; file: File }) {
        if (!item.media.uploadKey) return;

        files.set(item.media.uploadKey, item.file);
    }

    function nullableNumber(value: unknown) {
        if (value === null || value === '') return null;

        const n = Number(value);

        return Number.isFinite(n) ? n : null;
    }

    function issuePath(issue: ZodIssue) {
        return issue.path.join('.');
    }

    function mapIssues(issues: ZodIssue[]) {
        return issues.reduce<Record<string, string>>((acc, issue) => {
            const path = issuePath(issue);

            if (!acc[path]) {
                acc[path] = issue.message;
            }

            return acc;
        }, {});
    }

    function getIssueForPath(path: string, issues: ZodIssue[]) {
        return issues.find((issue) => issuePath(issue) === path);
    }

    function validateField(path: string) {
        // Only live-validate fields that are already showing an error.
        // This prevents the form from showing errors before the first submit.
        if (!fieldErrors[path]) return;

        const payload = getPayloadForValidation();
        const result = eventPayloadSchema.safeParse(payload);
        const nextErrors = {...fieldErrors};

        if (result.success) {
            delete nextErrors[path];
            fieldErrors = nextErrors;
            return;
        }

        const issue = getIssueForPath(path, result.error.issues);

        if (issue) {
            nextErrors[path] = issue.message;
        } else {
            delete nextErrors[path];
        }

        fieldErrors = nextErrors;
    }

    function getPayloadForValidation(): EventPayload {
        return {
            ...event,
            priceMembers: nullableNumber(event.priceMembers),
            pricePublic: nullableNumber(event.pricePublic)
        };
    }

    function validateClient() {
        const payload = getPayloadForValidation();
        const result = eventPayloadSchema.safeParse(payload);

        if (!result.success) {
            fieldErrors = mapIssues(result.error.issues);
            error = $t('admin.form.validationFailed');
            return null;
        }

        fieldErrors = {};
        return result.data;
    }

    async function submit() {
        loading = true;
        error = '';
        success = '';

        const payload = validateClient();

        if (!payload) {
            loading = false;
            return;
        }

        const formData = new FormData();
        formData.append('payload', JSON.stringify(payload));

        for (const [key, file] of files.entries()) {
            formData.append(key, file);
        }

        try {
            const response = await fetch(submitTo, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (!response.ok || !result.ok) {
                error = result.message || $t('admin.form.couldNotSave');
                return;
            }

            success = `${$t('admin.form.saved')}: ${result.slug}`;
        } catch {
            error = $t('admin.form.couldNotSave');
        } finally {
            loading = false;
        }
    }
</script>

<form
        class="form"
        novalidate
        onsubmit={(submitEvent) => {
        submitEvent.preventDefault();
        submit();
    }}
>
    <div class="topbar">
        <div>
            <h1 class="text-xl font-bold">
                {mode === 'edit' ? $t('admin.form.editEvent') : $t('admin.form.createEvent')}
            </h1>

            <p>
                {$t('admin.form.languageHint')}
            </p>
        </div>

        <div class="lang-indicator" aria-label="Current language">
            {lang.toUpperCase()}
        </div>
    </div>

    <div class="card">
        <LocalizedField
                label={$t('admin.form.title')}
                bind:value={event.title}
                {lang}
                required
                error={fieldErrors[`title.${lang}`] || fieldErrors['title.el']}
                onValueChange={() => validateField(`title.${lang}`)}
        />

        <LocalizedField
                label={$t('admin.form.description')}
                bind:value={event.description}
                {lang}
                textarea
                maxLength={360}
                error={fieldErrors[`description.${lang}`] || fieldErrors['description.el']}
                onValueChange={() => validateField(`description.${lang}`)}
        />

        <div class="grid">
            <div class="field">
                <Label for={`${id}-date`} class="px-1">
                    {$t('admin.form.date')}
                </Label>

                <Popover.Root bind:open={datePickerOpen}>
                    <Popover.Trigger
                            id={`${id}-date`}
                            type="button"
                            aria-invalid={!!fieldErrors.date}
                            class={cn(
                            buttonVariants({variant: 'outline'}),
                            controlClass,
                            'w-full justify-between px-3 font-normal',
                            fieldErrors.date && invalidControlClass
                        )}
                    >
                        <span class:placeholder={!selectedDate}>
                            {formattedDate}
                        </span>

                        <ChevronDownIcon class="size-4 opacity-60" />
                    </Popover.Trigger>

                    <Popover.Content
                            class="z-9999 w-auto overflow-hidden rounded-xl border border-slate-300 bg-white p-0 text-slate-950 shadow-xl"
                            align="start"
                            sideOffset={6}
                    >
                        <Calendar
                                type="single"
                                bind:value={selectedDate}
                                captionLayout="dropdown"
                                onValueChange={() => {
                                    validateField('date');
                                    datePickerOpen = false;
                                }}
                        />
                    </Popover.Content>
                </Popover.Root>

                {#if fieldErrors.date}
                    <p class="field-error">{fieldErrors.date}</p>
                {/if}
            </div>

            <div class="field">
                <Label for={`${id}-time`} class="px-1">
                    {$t('admin.form.time')}
                </Label>

                <Input
                        id={`${id}-time`}
                        type="time"
                        step="60"
                        bind:value={event.time}
                        required
                        aria-invalid={!!fieldErrors.time}
                        class={cn(controlClass, fieldErrors.time && invalidControlClass)}
                        oninput={() => validateField('time')}
                />

                {#if fieldErrors.time}
                    <p class="field-error">{fieldErrors.time}</p>
                {/if}
            </div>

            <div class="field">
                <Label for={`${id}-location`} class="px-1">
                    {$t('admin.form.location')}
                </Label>

                <Input
                        id={`${id}-location`}
                        bind:value={event.location}
                        required
                        aria-invalid={!!fieldErrors.location}
                        class={cn(controlClass, fieldErrors.location && invalidControlClass)}
                        oninput={() => validateField('location')}
                />

                {#if fieldErrors.location}
                    <p class="field-error">{fieldErrors.location}</p>
                {/if}
            </div>

            <div class="field">
                <Label for={`${id}-category`} class="px-1">
                    {$t('admin.form.category')}
                </Label>

                <Select.Root type="single" bind:value={event.category}>
                    <Select.Trigger
                            id={`${id}-category`}
                            aria-invalid={!!fieldErrors.category}
                            class={cn(
                            controlClass,
                            'w-full justify-between px-3',
                            fieldErrors.category && invalidControlClass
                        )}
                    >
                        {event.category}
                    </Select.Trigger>

                    <Select.Content class="z-9999 rounded-xl border border-slate-300 bg-white shadow-xl">
                        {#each EVENT_CATEGORIES as category}
                            <Select.Item value={category} label={category}>
                                {category}
                            </Select.Item>
                        {/each}
                    </Select.Content>
                </Select.Root>

                {#if fieldErrors.category}
                    <p class="field-error">{fieldErrors.category}</p>
                {/if}
            </div>

            <div class="field">
                <Label for={`${id}-price-members`} class="px-1">
                    {$t('admin.form.priceMembers')}
                </Label>

                <Input
                        id={`${id}-price-members`}
                        type="number"
                        min="0"
                        step="0.01"
                        bind:value={event.priceMembers}
                        aria-invalid={!!fieldErrors.priceMembers}
                        class={cn(controlClass, fieldErrors.priceMembers && invalidControlClass)}
                        oninput={() => validateField('priceMembers')}
                />

                {#if fieldErrors.priceMembers}
                    <p class="field-error">{fieldErrors.priceMembers}</p>
                {/if}
            </div>

            <div class="field">
                <Label for={`${id}-price-public`} class="px-1">
                    {$t('admin.form.pricePublic')}
                </Label>

                <Input
                        id={`${id}-price-public`}
                        type="number"
                        min="0"
                        step="0.01"
                        bind:value={event.pricePublic}
                        aria-invalid={!!fieldErrors.pricePublic}
                        class={cn(controlClass, fieldErrors.pricePublic && invalidControlClass)}
                        oninput={() => validateField('pricePublic')}
                />

                {#if fieldErrors.pricePublic}
                    <p class="field-error">{fieldErrors.pricePublic}</p>
                {/if}
            </div>
        </div>
    </div>

    <div class="sections">
        {#each event.sections as _, index (event.sections[index].id)}
            <EventSectionEditor
                    bind:section={event.sections[index]}
                    {index}
                    {lang}
                    onFiles={rememberFile}
                    onRemove={() => removeSection(event.sections[index].id)}
            />
        {/each}
    </div>

    <Button
            type="button"
            variant="secondary"
            class="justify-self-start rounded-xl border border-slate-300 shadow-sm"
            onclick={addSection}
    >
        + {$t('admin.form.addSection')}
    </Button>

    {#if error}
        <p class="error">{error}</p>
    {/if}

    {#if success}
        <p class="success">{success}</p>
    {/if}

    <div class="flex justify-end gap-2 pt-2">
        <a
                href="/admin/events"
                class="inline-flex h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium shadow-sm hover:bg-slate-50"
        >
            {$t('common.cancel')}
        </a>

        <Button type="submit" disabled={loading} class="rounded-xl">
            {#if loading}
                {$t('admin.form.saving')}
            {:else if mode === 'edit'}
                {$t('admin.form.saveChanges')}
            {:else}
                {$t('admin.form.saveEvent')}
            {/if}
        </Button>
    </div>
</form>

<style>
    .form {
        max-width: 980px;
        margin: 0 auto;
        display: grid;
        gap: 1rem;
    }

    .topbar {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        align-items: start;
    }

    h1 {
        margin: 0;
    }

    p {
        margin: .25rem 0 0;
        color: #667085;
    }

    .lang-indicator {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 3rem;
        border-radius: .8rem;
        background: #f2f4f7;
        padding: .5rem .75rem;
        font-weight: 800;
        color: #004680;
    }

    .card {
        display: grid;
        gap: 1rem;
        border: 1px solid #eaecf0;
        border-radius: 1rem;
        background: #fff;
        padding: 1rem;
    }

    .grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 1rem;
    }

    .field {
        display: flex;
        flex-direction: column;
        gap: .5rem;
    }

    .placeholder {
        color: #667085;
    }

    .sections {
        display: grid;
        gap: 1rem;
    }

    .field-error,
    .error {
        margin: 0;
        color: hsl(var(--destructive));
    }

    .field-error {
        font-size: 0.8125rem;
        line-height: 1.25rem;
    }

    .success {
        margin: 0;
        color: #027a48;
    }

    @media (max-width: 720px) {
        .topbar,
        .grid {
            grid-template-columns: 1fr;
            display: grid;
        }
    }
</style>