<!--suppress ES6UnusedImports -->
<script lang="ts">
    import {deserialize} from '$app/forms';
    import {goto} from '$app/navigation';

    import {t, locale} from '$lib/i18n';
    import type {
        EquipmentMedia,
        EquipmentPayload,
        EquipmentSection,
        Lang
    } from '$lib/cms/equipment/types';
    import {equipmentPayloadSchema} from '$lib/cms/equipment/schema';

    import LocalizedField from './LocalizedField.svelte';
    import EventSectionEditor from './EventSectionEditor.svelte';

    import {Button} from '$lib/components/ui/button/index.js';
    import {Input} from '$lib/components/ui/input/index.js';
    import {Label} from '$lib/components/ui/label/index.js';
    import {toast} from 'svelte-sonner';
    import {cn} from '$lib/utils.js';

    import type {ActionResult} from '@sveltejs/kit';
    import type {ZodIssue} from 'zod';

    type FormMode = 'create' | 'edit';

    type Props = {
        submitTo?: string;
        initialEquipment?: EquipmentPayload | null;
        mode?: FormMode;
    };

    type SaveActionData = {
        ok?: boolean;
        id?: number;
        slug?: string;
        errorKey?: string;
        message?: string;
    };

    let {
        submitTo = '?/create',
        initialEquipment = null,
        mode = 'create'
    }: Props = $props();

    const id = $props.id();

    let loading = $state(false);
    let error = $state('');
    let fieldErrors = $state<Record<string, string>>({});
    const files = new Map<string, File>();

    const controlClass =
        'h-10 rounded-lg border border-slate-300 bg-white font-semibold shadow-sm focus-visible:border-primary focus-visible:ring-primary/25';

    const invalidControlClass =
        'border-destructive focus-visible:border-destructive focus-visible:ring-destructive/25';

    function newSection(): EquipmentSection {
        return {
            id: crypto.randomUUID(),
            beforeHtml: {el: '', de: ''},
            media: [],
            afterHtml: {el: '', de: ''}
        };
    }

    function emptyEquipment(): EquipmentPayload {
        return {
            title: {el: '', de: ''},
            description: {el: '', de: ''},
            pricePerDay: 0,
            sections: [newSection()]
        };
    }

    function cloneEquipment(source: EquipmentPayload | null) {
        return structuredClone(source ?? emptyEquipment());
    }

    let equipment = $state<EquipmentPayload>(emptyEquipment());

    $effect(() => {
        equipment = cloneEquipment(initialEquipment);
        fieldErrors = {};
        error = '';
        files.clear();
    });

    const lang = $derived(($locale || 'el') as Lang);

    function addSection() {
        equipment.sections = [...equipment.sections, newSection()];
    }

    function removeSection(sectionId: string) {
        if (equipment.sections.length === 1) return;
        equipment.sections = equipment.sections.filter((section) => section.id !== sectionId);
    }

    function rememberFile(item: {media: EquipmentMedia; file: File}) {
        if (!item.media.uploadKey) return;
        files.set(item.media.uploadKey, item.file);
    }

    function issuePath(issue: ZodIssue) {
        return issue.path.join('.');
    }

    function mapIssues(issues: ZodIssue[]) {
        return issues.reduce<Record<string, string>>((acc, issue) => {
            const path = issuePath(issue);
            if (!acc[path]) acc[path] = issue.message;
            return acc;
        }, {});
    }

    function getIssueForPath(path: string, issues: ZodIssue[]) {
        return issues.find((issue) => issuePath(issue) === path);
    }

    function payloadForValidation(): EquipmentPayload {
        return {
            ...equipment,
            pricePerDay: Number(equipment.pricePerDay)
        };
    }

    function validateField(path: string) {
        if (!fieldErrors[path]) return;

        const result = equipmentPayloadSchema.safeParse(payloadForValidation());
        const nextErrors = {...fieldErrors};

        if (result.success) {
            delete nextErrors[path];
            fieldErrors = nextErrors;
            return;
        }

        const issue = getIssueForPath(path, result.error.issues);
        if (issue) nextErrors[path] = issue.message;
        else delete nextErrors[path];
        fieldErrors = nextErrors;
    }

    function validateClient() {
        const result = equipmentPayloadSchema.safeParse(payloadForValidation());

        if (!result.success) {
            fieldErrors = mapIssues(result.error.issues);
            error = $t('admin.equipment.form.validationFailed');
            return null;
        }

        fieldErrors = {};
        return result.data as EquipmentPayload;
    }

    function actionData(result: ActionResult): SaveActionData | undefined {
        if ('data' in result) return result.data as SaveActionData | undefined;
        return undefined;
    }

    function translatedActionMessage(data?: SaveActionData) {
        if (!data?.errorKey) return '';
        const translated = $t(data.errorKey);
        return translated === data.errorKey ? '' : translated;
    }

    function showSaveError(data?: SaveActionData, fallback?: string) {
        const title = $t('admin.equipment.toast.saveFailed');
        const message = fallback || translatedActionMessage(data) || data?.message || title;

        error = message;
        toast.error(title, {
            description: message !== title ? message : undefined
        });
    }

    async function showSaveSuccess(data?: SaveActionData) {
        const title = $t(
            mode === 'edit'
                ? 'admin.equipment.toast.updated'
                : 'admin.equipment.toast.created'
        );

        const equipmentTitle =
            equipment.title[lang]?.trim() ||
            equipment.title.el.trim() ||
            equipment.title.de.trim() ||
            data?.slug;

        toast.success(title, {
            description: equipmentTitle || undefined
        });

        await goto('/admin/equipment', {invalidateAll: true});
    }

    async function submit() {
        if (loading) return;

        loading = true;
        error = '';

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
                headers: {
                    accept: 'application/json',
                    'x-sveltekit-action': 'true'
                },
                body: formData
            });

            const result = deserialize(await response.text()) as ActionResult;

            if (result.type === 'success') {
                const data = actionData(result);

                if (!data?.ok) {
                    showSaveError(data);
                    return;
                }

                await showSaveSuccess(data);
                return;
            }

            if (result.type === 'failure') {
                showSaveError(actionData(result));
                return;
            }

            if (result.type === 'redirect') {
                await showSaveSuccess();
                return;
            }

            if (result.type === 'error') {
                showSaveError(undefined, result.error?.message);
                return;
            }

            showSaveError();
        } catch {
            showSaveError();
        } finally {
            loading = false;
        }
    }
</script>

<form
    class="mx-auto grid max-w-[980px] gap-4"
    novalidate
    onsubmit={(submitEvent) => {
        submitEvent.preventDefault();
        submit();
    }}
>
    <div class="flex items-start justify-between gap-4">
        <div>
            <h1 class="text-xl font-bold">
                {$t(mode === 'edit' ? 'admin.equipment.form.edit' : 'admin.equipment.form.create')}
            </h1>
            <p class="mt-1 text-sm text-slate-500">
                {$t('admin.equipment.form.languageHint')}
            </p>
        </div>

        <div class="inline-flex min-w-12 items-center justify-center rounded-lg bg-slate-100 px-3 py-2 font-extrabold text-primary">
            {lang.toUpperCase()}
        </div>
    </div>

    <section class="grid gap-4 border border-slate-200 bg-white p-5 shadow-sm">
        <LocalizedField
            label={$t('admin.equipment.form.title')}
            bind:value={equipment.title}
            {lang}
            required
            error={fieldErrors[`title.${lang}`] || fieldErrors['title.el']}
            onValueChange={() => validateField(`title.${lang}`)}
        />

        <LocalizedField
            label={$t('admin.equipment.form.description')}
            bind:value={equipment.description}
            {lang}
            textarea
            maxLength={500}
            error={fieldErrors[`description.${lang}`] || fieldErrors['description.el']}
            onValueChange={() => validateField(`description.${lang}`)}
        />

        <div class="grid gap-2 sm:max-w-xs">
            <Label for={`${id}-price`} class="px-1">
                {$t('admin.equipment.form.pricePerDay')}
            </Label>
            <div class="relative">
                <span class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm font-bold text-slate-500">CHF</span>
                <Input
                    id={`${id}-price`}
                    type="number"
                    min="0"
                    step="0.01"
                    bind:value={equipment.pricePerDay}
                    required
                    aria-invalid={!!fieldErrors.pricePerDay}
                    class={cn(controlClass, 'pl-12', fieldErrors.pricePerDay && invalidControlClass)}
                    oninput={() => validateField('pricePerDay')}
                />
            </div>
            <p class="text-xs text-slate-500">{$t('admin.equipment.form.priceHint')}</p>
            {#if fieldErrors.pricePerDay}
                <p class="text-sm text-destructive">{fieldErrors.pricePerDay}</p>
            {/if}
        </div>
    </section>

    <div class="grid gap-4">
        {#each equipment.sections as _, index (equipment.sections[index].id)}
            <EventSectionEditor
                bind:section={equipment.sections[index]}
                {index}
                {lang}
                onFiles={rememberFile}
                onRemove={() => removeSection(equipment.sections[index].id)}
            />
        {/each}
    </div>

    <Button
        type="button"
        variant="secondary"
        class="justify-self-start rounded-lg border border-slate-300 shadow-sm"
        onclick={addSection}
    >
        + {$t('admin.form.addSection')}
    </Button>

    {#if error}
        <p class="text-sm font-medium text-destructive" role="alert">{error}</p>
    {/if}

    <div class="flex justify-end gap-2 pt-2">
        <a
            href="/admin/equipment"
            class="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium shadow-sm hover:bg-slate-50"
        >
            {$t('common.cancel')}
        </a>

        <Button type="submit" disabled={loading} class="rounded-lg">
            {#if loading}
                {$t('admin.equipment.form.saving')}
            {:else if mode === 'edit'}
                {$t('admin.equipment.form.saveChanges')}
            {:else}
                {$t('admin.equipment.form.save')}
            {/if}
        </Button>
    </div>
</form>
