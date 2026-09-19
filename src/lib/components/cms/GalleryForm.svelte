<script lang="ts">
    import {enhance} from '$app/forms';
    import {goto} from '$app/navigation';
    import type {ActionResult} from '@sveltejs/kit';
    import {onDestroy} from 'svelte';

    import {t, locale} from '$lib/i18n';
    import type {
        GalleryItem,
        GalleryLang,
        GalleryLocalizedText,
        GalleryTag
    } from '$lib/cms/gallery/types';

    import LocalizedField from '$lib/components/cms/LocalizedField.svelte';
    import {Badge} from '$lib/components/ui/badge/index.js';
    import {Button, buttonVariants} from '$lib/components/ui/button/index.js';
    import {Input} from '$lib/components/ui/input/index.js';
    import {Label} from '$lib/components/ui/label/index.js';

    import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
    import CalendarIcon from '@lucide/svelte/icons/calendar-days';
    import FileImageIcon from '@lucide/svelte/icons/file-image';
    import ImageIcon from '@lucide/svelte/icons/image';
    import InfoIcon from '@lucide/svelte/icons/info';
    import LanguagesIcon from '@lucide/svelte/icons/languages';
    import Loader2Icon from '@lucide/svelte/icons/loader-2';
    import SaveIcon from '@lucide/svelte/icons/save';
    import TagsIcon from '@lucide/svelte/icons/tags';
    import VideoIcon from '@lucide/svelte/icons/video';

    import {toast} from 'svelte-sonner';

    import {cn} from '$lib/utils.js';

    type FormMode = 'create' | 'edit';

    type ActionResponse = {
        ok?: boolean;
        id?: string;
        errorKey?: string;
        message?: string;
    };

    let {
        mode = 'create',
        initialItem = null,
        existingTags = [],
        form = undefined
    }: {
        mode?: FormMode;
        initialItem?: GalleryItem | null;
        existingTags?: GalleryTag[];
        form?: ActionResponse | null;
    } = $props();

    const componentId = $props.id();

    let saving = $state(false);
    let customId = $state(initialItem?.id ?? '');
    let year = $state(initialItem?.year ? String(initialItem.year) : '');
    let alt = $state<GalleryLocalizedText>({
        el: initialItem?.alt?.el ?? '',
        de: initialItem?.alt?.de ?? ''
    });
    let tagsText = $state<GalleryLocalizedText>({
        el: (initialItem?.tags ?? []).map((tag) => tag.name.el).filter(Boolean).join(', '),
        de: (initialItem?.tags ?? []).map((tag) => tag.name.de).filter(Boolean).join(', ')
    });
    let selectedFileName = $state('');
    let objectUrl = $state('');
    let preview = $state(currentSource(initialItem));
    let previewType = $state<'image' | 'video' | ''>(initialItem?.type ?? '');

    const lang = $derived((($locale === 'de' ? 'de' : 'el') as GalleryLang));
    const isEdit = $derived(mode === 'edit');
    const selectedTags = $derived(tagPairsFromText());

    const controlClass =
        'h-10 rounded-lg border border-slate-300 bg-white shadow-sm focus-visible:border-primary focus-visible:ring-primary/25';

    function text(key: string, fallback: string) {
        const value = $t(key);
        return value === key ? fallback : value;
    }

    function localized(value: GalleryLocalizedText | undefined) {
        if (!value) return '';
        return value[lang] || value.el || value.de || '';
    }

    function currentSource(item: GalleryItem | null) {
        if (!item) return '';
        return item.type === 'video' ? item.videoSrc : item.src960 || item.src480;
    }

    function parseTagList(value: string) {
        return value
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean);
    }

    function tagPairsFromText(): GalleryTag[] {
        const greek = parseTagList(tagsText.el);
        const german = parseTagList(tagsText.de);
        const count = Math.max(greek.length, german.length);

        return Array.from({length: count}, (_, index) => ({
            id: 0,
            name: {
                el: greek[index] || german[index] || '',
                de: german[index] || greek[index] || ''
            }
        })).filter((tag) => tag.name.el || tag.name.de);
    }

    function addTag(tag: GalleryTag) {
        const pairs = tagPairsFromText();
        const targetEl = tag.name.el || tag.name.de;
        const targetDe = tag.name.de || tag.name.el;

        if (
            pairs.some(
                (current) =>
                    current.name.el.toLocaleLowerCase() === targetEl.toLocaleLowerCase() &&
                    current.name.de.toLocaleLowerCase() === targetDe.toLocaleLowerCase()
            )
        ) {
            return;
        }

        tagsText = {
            el: [...parseTagList(tagsText.el), targetEl].filter(Boolean).join(', '),
            de: [...parseTagList(tagsText.de), targetDe].filter(Boolean).join(', ')
        };
    }

    function revokeObjectUrl() {
        if (objectUrl) {
            URL.revokeObjectURL(objectUrl);
            objectUrl = '';
        }
    }

    function extractYearFromMetadataText(textValue: string) {
        const patterns = [
            /DateTimeOriginal[^0-9]{0,96}((?:19|20)\d{2})[-:]/i,
            /DateTimeDigitized[^0-9]{0,96}((?:19|20)\d{2})[-:]/i,
            /CreateDate[^0-9]{0,96}((?:19|20)\d{2})[-:]/i,
            /DateCreated[^0-9]{0,96}((?:19|20)\d{2})[-:]/i,
            /ModifyDate[^0-9]{0,96}((?:19|20)\d{2})[-:]/i,
            /\b((?:19|20)\d{2})[-:](?:0[1-9]|1[0-2])[-:](?:0[1-9]|[12]\d|3[01])/
        ];

        for (const pattern of patterns) {
            const match = textValue.match(pattern);
            if (match?.[1]) return Number(match[1]);
        }

        return null;
    }

    async function detectImageYear(file: File) {
        if (!file.type.startsWith('image/')) return null;

        try {
            // EXIF/XMP metadata is normally near the beginning of the file. Keeping
            // this bounded avoids reading a very large upload into browser memory.
            const bytes = await file.slice(0, Math.min(file.size, 2 * 1024 * 1024)).arrayBuffer();
            const metadataText = new TextDecoder('iso-8859-1').decode(bytes);
            return extractYearFromMetadataText(metadataText);
        } catch {
            return null;
        }
    }

    async function onFileChange(event: Event) {
        const input = event.currentTarget as HTMLInputElement;
        const file = input.files?.[0];

        revokeObjectUrl();

        if (!file) {
            selectedFileName = '';
            preview = currentSource(initialItem);
            previewType = initialItem?.type ?? '';
            return;
        }

        objectUrl = URL.createObjectURL(file);
        selectedFileName = file.name;
        preview = objectUrl;
        previewType = file.type.startsWith('video/') ? 'video' : 'image';

        if (!year.trim() && file.type.startsWith('image/')) {
            const detectedYear = await detectImageYear(file);
            if (detectedYear) year = String(detectedYear);
        }
    }

    function actionMessage(data: unknown) {
        if (!data || typeof data !== 'object') return '';

        const actionData = data as ActionResponse;

        if (typeof actionData.errorKey === 'string') {
            const translated = $t(actionData.errorKey);

            if (translated !== actionData.errorKey) {
                return translated;
            }
        }

        return typeof actionData.message === 'string' ? actionData.message : '';
    }

    function inlineError() {
        return actionMessage(form);
    }

    function mediaTypeLabel() {
        if (previewType === 'video') return $t('admin.gallery.video');
        if (previewType === 'image') return $t('admin.gallery.image');
        return $t('admin.gallery.missing');
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
                const savedId = resultData?.id || initialItem?.id || customId;

                toast.success(
                    text(
                        isEdit
                            ? 'admin.gallery.toast.updated'
                            : 'admin.gallery.toast.created',
                        isEdit ? 'Gallery item updated' : 'Gallery item created'
                    ),
                    {
                        description: savedId || localized(alt) || undefined
                    }
                );

                await update({
                    reset: false,
                    invalidateAll: true
                });

                await goto('/admin/gallery');
                return;
            }

            if (result.type === 'failure') {
                const message =
                    actionMessage(result.data) ||
                    text('admin.gallery.toast.saveFailed', 'The gallery item could not be saved.');

                toast.error(
                    text('admin.gallery.toast.saveFailed', 'The gallery item could not be saved.'),
                    {
                        description: message
                    }
                );

                await update({reset: false});
                return;
            }

            if (result.type === 'error') {
                toast.error(
                    text('admin.gallery.toast.saveFailed', 'The gallery item could not be saved.')
                );
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
            {$t(isEdit ? 'admin.gallery.editTitle' : 'admin.gallery.createTitle')}
        </h1>

        <p class="mt-1 text-sm text-slate-500">
            {$t('admin.gallery.form.subtitle')}
        </p>
    </div>

    <a
        href="/admin/gallery"
        class={cn(buttonVariants({variant: 'outline'}), 'rounded-lg')}
    >
        <ArrowLeftIcon class="mr-2 size-4" />
        {$t('admin.gallery.form.backToList')}
    </a>
</div>

{#if inlineError()}
    <div class="mb-5 flex items-start gap-3 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        <InfoIcon class="mt-0.5 size-4 shrink-0" />
        <span>{inlineError()}</span>
    </div>
{/if}

<form
    method="POST"
    enctype="multipart/form-data"
    action="?/save"
    use:enhance={submitEnhance}
    class="grid gap-6"
>
    <input type="hidden" name="alt_el" value={alt.el} />
    <input type="hidden" name="alt_de" value={alt.de} />
    <input type="hidden" name="tags_el" value={tagsText.el} />
    <input type="hidden" name="tags_de" value={tagsText.de} />

    <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section class="border border-slate-200 bg-white p-5 shadow-sm">
            <div class="mb-5 flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                    <h2 class="font-semibold text-slate-900">
                        {$t('admin.gallery.form.details')}
                    </h2>
                    <p class="mt-1 text-sm text-slate-500">
                        {$t('admin.gallery.form.detailsHelp')}
                    </p>
                </div>

                <Badge variant="secondary" class="rounded-md">
                    <LanguagesIcon class="mr-1 size-3" />
                    {lang.toUpperCase()}
                </Badge>
            </div>

            <div class="grid gap-5">
                <div class="grid gap-4 sm:grid-cols-[minmax(0,1fr)_10rem]">
                    <div class="space-y-1.5">
                        <Label for={`${componentId}-id`}>
                            {$t(isEdit ? 'admin.gallery.id' : 'admin.gallery.idOptional')}
                        </Label>

                        <Input
                            id={`${componentId}-id`}
                            name={isEdit ? undefined : 'id'}
                            bind:value={customId}
                            placeholder="g-example"
                            readonly={isEdit}
                            class={cn(controlClass, isEdit && 'bg-slate-50 text-slate-500')}
                        />

                        <p class="text-xs text-slate-500">
                            {$t(isEdit ? 'admin.gallery.idReadonlyHelp' : 'admin.gallery.idHelp')}
                        </p>
                    </div>

                    <div class="space-y-1.5">
                        <div class="flex items-center gap-2">
                            <CalendarIcon class="size-4 text-slate-500" />
                            <Label for={`${componentId}-year`}>
                                {$t('admin.gallery.year')}
                            </Label>
                        </div>

                        <Input
                            id={`${componentId}-year`}
                            name="year"
                            type="number"
                            min="1800"
                            max="2200"
                            inputmode="numeric"
                            bind:value={year}
                            placeholder="2026"
                            class={controlClass}
                        />

                        <p class="text-xs text-slate-500">
                            {$t('admin.gallery.form.yearHelp')}
                        </p>
                    </div>
                </div>

                <LocalizedField
                    label={$t('admin.gallery.alt')}
                    bind:value={alt}
                    {lang}
                    placeholder={$t('admin.gallery.altPlaceholder')}
                    maxLength={240}
                />

                <p class="-mt-3 text-xs text-slate-500">
                    {$t('admin.gallery.form.altHelp')}
                </p>

                <div class="border-t border-slate-100 pt-5">
                    <div class="mb-3 flex items-center gap-2">
                        <TagsIcon class="size-4 text-slate-500" />
                        <h3 class="text-sm font-semibold text-slate-800">
                            {$t('admin.gallery.tags')}
                        </h3>
                    </div>

                    <LocalizedField
                        label={$t('admin.gallery.form.tagNames')}
                        bind:value={tagsText}
                        {lang}
                        placeholder={$t('admin.gallery.tagsPlaceholder')}
                    />

                    <p class="mt-2 text-xs text-slate-500">
                        {$t('admin.gallery.form.tagsHelp')}
                    </p>

                    {#if selectedTags.length}
                        <div class="mt-3 flex flex-wrap gap-1.5">
                            {#each selectedTags as tag, index (`${tag.name.el}-${tag.name.de}-${index}`)}
                                <Badge variant="secondary" class="rounded-md">
                                    {localized(tag.name)}
                                </Badge>
                            {/each}
                        </div>
                    {/if}

                    {#if existingTags.length}
                        <div class="mt-4 border-t border-slate-100 pt-3">
                            <p class="mb-2 text-xs font-medium text-slate-600">
                                {$t('admin.gallery.existingTags')}
                            </p>

                            <div class="flex flex-wrap gap-1.5">
                                {#each existingTags as tag (tag.id)}
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        class="h-7 rounded-md bg-white px-2.5 text-xs"
                                        onclick={() => addTag(tag)}
                                    >
                                        {localized(tag.name)}
                                    </Button>
                                {/each}
                            </div>
                        </div>
                    {/if}
                </div>

                <div class="flex items-start gap-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
                    <InfoIcon class="mt-0.5 size-3.5 shrink-0" />
                    <span>{$t('admin.gallery.form.languageHint')}</span>
                </div>
            </div>
        </section>

        <aside class="border border-slate-200 bg-white p-5 shadow-sm">
            <div class="flex items-start justify-between gap-3">
                <div>
                    <h2 class="font-semibold text-slate-900">
                        {$t('admin.gallery.form.media')}
                    </h2>

                    <p class="mt-1 text-sm text-slate-500">
                        {$t(isEdit ? 'admin.gallery.replaceMediaHelp' : 'admin.gallery.mediaUploadHelp')}
                    </p>
                </div>

                <Badge variant="secondary" class="rounded-md">
                    {mediaTypeLabel()}
                </Badge>
            </div>

            <div class="mt-4 overflow-hidden border border-slate-200 bg-slate-50">
                {#if preview}
                    {#if previewType === 'video'}
                        <video
                            src={preview}
                            class="aspect-square w-full bg-black object-contain"
                            controls
                            muted
                            playsinline
                        ></video>
                    {:else}
                        <img
                            src={preview}
                            alt={localized(alt) || initialItem?.id || $t('admin.gallery.preview')}
                            class="aspect-square w-full bg-white object-contain p-3"
                        />
                    {/if}
                {:else}
                    <div class="flex aspect-square w-full flex-col items-center justify-center gap-3 px-6 text-center text-slate-400">
                        <FileImageIcon class="size-9" />
                        <p class="text-sm">
                            {$t('admin.gallery.form.noPreview')}
                        </p>
                    </div>
                {/if}
            </div>

            <div class="mt-4 space-y-1.5">
                <Label for={`${componentId}-media`}>
                    {$t(isEdit ? 'admin.gallery.replaceMedia' : 'admin.gallery.mediaUpload')}
                </Label>

                <Input
                    id={`${componentId}-media`}
                    name="media"
                    type="file"
                    accept="image/*,video/*"
                    required={!isEdit}
                    class="rounded-lg"
                    onchange={onFileChange}
                />

                {#if selectedFileName}
                    <p class="truncate text-xs text-slate-500">
                        {$t('admin.gallery.form.selectedFile')}: {selectedFileName}
                    </p>
                {/if}
            </div>

            {#if initialItem}
                <div class="mt-4 border-t border-slate-100 pt-4 text-xs text-slate-600">
                    <div class="flex items-center gap-2 font-medium text-slate-700">
                        {#if initialItem.type === 'video'}
                            <VideoIcon class="size-4" />
                        {:else}
                            <ImageIcon class="size-4" />
                        {/if}

                        {$t('admin.gallery.currentType')}:
                        {$t(initialItem.type === 'video' ? 'admin.gallery.video' : 'admin.gallery.image')}
                    </div>

                    {#if initialItem.type === 'image'}
                        <p class="mt-2">
                            480w: {initialItem.src480 ? $t('admin.gallery.yes') : $t('admin.gallery.no')}
                            · 960w: {initialItem.src960 ? $t('admin.gallery.yes') : $t('admin.gallery.no')}
                        </p>

                        {#if initialItem.width && initialItem.height}
                            <p class="mt-1">
                                {initialItem.width}×{initialItem.height}
                            </p>
                        {/if}
                    {:else}
                        <p class="mt-2">WebM</p>
                    {/if}
                </div>
            {/if}
        </aside>
    </div>

    <div class="flex flex-wrap items-center justify-end gap-3">
        <a
            href="/admin/gallery"
            class={cn(buttonVariants({variant: 'outline'}), 'rounded-lg')}
        >
            {$t('common.cancel')}
        </a>

        <Button type="submit" class="rounded-lg" disabled={saving}>
            {#if saving}
                <Loader2Icon class="mr-2 size-4 animate-spin" />
                {$t('admin.gallery.form.saving')}
            {:else}
                <SaveIcon class="mr-2 size-4" />
                {$t('admin.gallery.form.save')}
            {/if}
        </Button>
    </div>
</form>
