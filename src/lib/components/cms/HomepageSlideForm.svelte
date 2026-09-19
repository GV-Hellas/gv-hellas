<script lang="ts">
    import {enhance} from '$app/forms';
    import {goto} from '$app/navigation';
    import type {ActionResult} from '@sveltejs/kit';
    import {onDestroy} from 'svelte';

    import {t, locale} from '$lib/i18n';
    import type {HomepageLang, HomepageLocalizedText, HomepageSlide} from '$lib/cms/home/types';
    import LocalizedField from '$lib/components/cms/LocalizedField.svelte';
    import {Badge} from '$lib/components/ui/badge/index.js';
    import {Button, buttonVariants} from '$lib/components/ui/button/index.js';
    import {Input} from '$lib/components/ui/input/index.js';
    import {Label} from '$lib/components/ui/label/index.js';
    import {toast} from 'svelte-sonner';

    import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
    import ImageIcon from '@lucide/svelte/icons/image';
    import LanguagesIcon from '@lucide/svelte/icons/languages';
    import Loader2Icon from '@lucide/svelte/icons/loader-2';
    import SaveIcon from '@lucide/svelte/icons/save';

    import {cn} from '$lib/utils.js';

    type FormMode = 'create' | 'edit';

    type ActionResponse = {
        ok?: boolean;
        id?: number;
        errorKey?: string;
        message?: string;
    };

    let {
        mode = 'create',
        initialItem = null,
        form = undefined
    }: {
        mode?: FormMode;
        initialItem?: HomepageSlide | null;
        form?: ActionResponse | null;
    } = $props();

    const componentId = $props.id();
    const isEdit = $derived(mode === 'edit');
    const lang = $derived((($locale === 'de' ? 'de' : 'el') as HomepageLang));

    let saving = $state(false);
    let title = $state<HomepageLocalizedText>({
        el: initialItem?.title.el ?? '',
        de: initialItem?.title.de ?? ''
    });
    let description = $state<HomepageLocalizedText>({
        el: initialItem?.description.el ?? '',
        de: initialItem?.description.de ?? ''
    });
    let alt = $state<HomepageLocalizedText>({
        el: initialItem?.alt.el ?? '',
        de: initialItem?.alt.de ?? ''
    });
    let sortOrder = $state(String(initialItem?.sortOrder ?? 10));
    let enabled = $state(initialItem?.enabled ?? true);
    let selectedFileName = $state('');
    let objectUrl = $state('');
    let preview = $state(currentImage(initialItem));

    const controlClass =
        'h-10 rounded-lg border border-slate-300 bg-white shadow-sm focus-visible:border-primary focus-visible:ring-primary/25';

    function text(key: string, fallback: string) {
        const value = $t(key);
        return value === key ? fallback : value;
    }

    function localized(value: HomepageLocalizedText) {
        return value[lang] || value.el || value.de || '';
    }

    function currentImage(item: HomepageSlide | null) {
        if (!item) return '';
        return item.image1920 || item.image960 || item.image480 || item.imageFallback || '';
    }

    function revokeObjectUrl() {
        if (objectUrl) {
            URL.revokeObjectURL(objectUrl);
            objectUrl = '';
        }
    }

    function onFileChange(event: Event) {
        const input = event.currentTarget as HTMLInputElement;
        const file = input.files?.[0];

        revokeObjectUrl();

        if (!file) {
            selectedFileName = '';
            preview = currentImage(initialItem);
            return;
        }

        objectUrl = URL.createObjectURL(file);
        selectedFileName = file.name;
        preview = objectUrl;
    }

    function actionMessage(data: unknown) {
        if (!data || typeof data !== 'object') return '';

        const actionData = data as ActionResponse;

        if (typeof actionData.errorKey === 'string') {
            const translated = $t(actionData.errorKey);
            if (translated !== actionData.errorKey) return translated;
        }

        return typeof actionData.message === 'string' ? actionData.message : '';
    }

    function inlineError() {
        return actionMessage(form);
    }

    type EnhanceUpdate = (options?: {
        reset?: boolean;
        invalidateAll?: boolean;
    }) => Promise<void>;

    type EnhanceResult = {
        result: ActionResult;
        update: EnhanceUpdate;
    };

    const submitEnhance = () => {
        saving = true;

        return async ({result, update}: EnhanceResult) => {
            saving = false;

            if (result.type === 'success') {
                const resultData = result.data as ActionResponse | undefined;

                toast.success(
                    text(
                        isEdit ? 'admin.homepage.toast.updated' : 'admin.homepage.toast.created',
                        isEdit ? 'Homepage slide updated' : 'Homepage slide created'
                    ),
                    {
                        description: localized(title) || (resultData?.id ? `ID: ${resultData.id}` : undefined)
                    }
                );

                await update({reset: false, invalidateAll: true});
                await goto('/admin/home');
                return;
            }

            if (result.type === 'failure') {
                const message =
                    actionMessage(result.data) ||
                    text('admin.homepage.toast.saveFailed', 'The homepage slide could not be saved.');

                toast.error(
                    text('admin.homepage.toast.saveFailed', 'The homepage slide could not be saved.'),
                    {description: message}
                );

                await update({reset: false});
                return;
            }

            if (result.type === 'error') {
                toast.error(text('admin.homepage.toast.saveFailed', 'The homepage slide could not be saved.'));
                return;
            }

            await update({reset: false});
        };
    };

    onDestroy(revokeObjectUrl);
</script>

<div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
    <div>
        <h1 class="text-2xl font-bold tracking-tight">
            {$t(isEdit ? 'admin.homepage.editTitle' : 'admin.homepage.createTitle')}
        </h1>
        <p class="mt-1 text-sm text-slate-500">{$t('admin.homepage.form.subtitle')}</p>
    </div>

    <a href="/admin/home" class={cn(buttonVariants({variant: 'outline'}), 'rounded-lg')}>
        <ArrowLeftIcon class="mr-2 size-4" />
        {$t('admin.homepage.form.backToList')}
    </a>
</div>

{#if inlineError()}
    <div class="mb-5 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        {inlineError()}
    </div>
{/if}

<form
    method="POST"
    enctype="multipart/form-data"
    action="?/save"
    use:enhance={submitEnhance}
    class="grid gap-6"
>
    <input type="hidden" name="title_el" value={title.el} />
    <input type="hidden" name="title_de" value={title.de} />
    <input type="hidden" name="description_el" value={description.el} />
    <input type="hidden" name="description_de" value={description.de} />
    <input type="hidden" name="alt_el" value={alt.el} />
    <input type="hidden" name="alt_de" value={alt.de} />

    <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <section class="border border-slate-200 bg-white p-5 shadow-sm">
            <div class="mb-5 flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                    <h2 class="font-semibold text-slate-900">{$t('admin.homepage.form.content')}</h2>
                    <p class="mt-1 text-sm text-slate-500">{$t('admin.homepage.form.languageHint')}</p>
                </div>

                <Badge variant="secondary" class="rounded-md">
                    <LanguagesIcon class="mr-1 size-3" />
                    {lang.toUpperCase()}
                </Badge>
            </div>

            <div class="grid gap-5">
                <LocalizedField
                    label={$t('admin.homepage.form.title')}
                    bind:value={title}
                    {lang}
                    required={lang === 'el'}
                    maxLength={160}
                    placeholder={$t('admin.homepage.form.titlePlaceholder')}
                />

                <LocalizedField
                    label={$t('admin.homepage.form.description')}
                    bind:value={description}
                    {lang}
                    textarea
                    maxLength={500}
                    placeholder={$t('admin.homepage.form.descriptionPlaceholder')}
                />

                <LocalizedField
                    label={$t('admin.homepage.form.alt')}
                    bind:value={alt}
                    {lang}
                    maxLength={220}
                    placeholder={$t('admin.homepage.form.altPlaceholder')}
                />

                <div class="grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2">
                    <div class="space-y-1.5">
                        <Label for={`${componentId}-order`}>{$t('admin.homepage.form.sortOrder')}</Label>
                        <Input
                            id={`${componentId}-order`}
                            name="sort_order"
                            type="number"
                            step="1"
                            bind:value={sortOrder}
                            class={controlClass}
                        />
                        <p class="text-xs text-slate-500">{$t('admin.homepage.form.sortOrderHelp')}</p>
                    </div>

                    <div class="space-y-2">
                        <Label for={`${componentId}-enabled`}>{$t('admin.homepage.form.visibility')}</Label>
                        <label class="flex h-10 items-center gap-3 border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700">
                            <input
                                id={`${componentId}-enabled`}
                                name="enabled"
                                type="checkbox"
                                bind:checked={enabled}
                                class="size-4 accent-primary"
                            />
                            {$t('admin.homepage.form.enabled')}
                        </label>
                    </div>
                </div>
            </div>
        </section>

        <aside class="border border-slate-200 bg-white p-5 shadow-sm">
            <div class="flex items-center gap-2">
                <ImageIcon class="size-4 text-primary" />
                <h2 class="font-semibold text-slate-900">{$t('admin.homepage.form.image')}</h2>
            </div>
            <p class="mt-1 text-sm text-slate-500">{$t('admin.homepage.form.imageHelp')}</p>

            <div class="mt-4 aspect-[16/7] overflow-hidden border border-slate-200 bg-slate-100">
                {#if preview}
                    <img
                        src={preview}
                        alt={localized(alt) || localized(title)}
                        class="h-full w-full object-cover"
                    />
                {:else}
                    <div class="flex h-full items-center justify-center text-slate-400">
                        <ImageIcon class="size-9" />
                    </div>
                {/if}
            </div>

            {#if selectedFileName}
                <p class="mt-2 truncate text-xs text-slate-500">{selectedFileName}</p>
            {/if}

            <div class="mt-4 space-y-1.5">
                <Label for={`${componentId}-image`}>
                    {$t(isEdit ? 'admin.homepage.form.replaceImage' : 'admin.homepage.form.uploadImage')}
                </Label>
                <Input
                    id={`${componentId}-image`}
                    name="image"
                    type="file"
                    accept="image/*"
                    required={!isEdit}
                    class="rounded-lg"
                    onchange={onFileChange}
                />
                <p class="text-xs leading-5 text-slate-500">{$t('admin.homepage.form.imageOptimizationHelp')}</p>
            </div>
        </aside>
    </div>

    <div class="flex flex-wrap items-center justify-end gap-3">
        <a href="/admin/home" class={cn(buttonVariants({variant: 'outline'}), 'rounded-lg')}>
            {$t('common.cancel')}
        </a>

        <Button type="submit" class="rounded-lg" disabled={saving}>
            {#if saving}
                <Loader2Icon class="mr-2 size-4 animate-spin" />
                {$t('admin.homepage.form.saving')}
            {:else}
                <SaveIcon class="mr-2 size-4" />
                {$t('admin.homepage.form.save')}
            {/if}
        </Button>
    </div>
</form>
