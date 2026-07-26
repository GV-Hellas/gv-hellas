<script lang="ts">
    import {enhance} from '$app/forms';
    import {goto} from '$app/navigation';
    import type {ActionResult} from '@sveltejs/kit';
    import {onDestroy} from 'svelte';

    import {t} from '$lib/i18n';

    import {Badge} from '$lib/components/ui/badge/index.js';
    import {Button, buttonVariants} from '$lib/components/ui/button/index.js';
    import {Input} from '$lib/components/ui/input/index.js';
    import {Label} from '$lib/components/ui/label/index.js';

    import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
    import FileImageIcon from '@lucide/svelte/icons/file-image';
    import ImageIcon from '@lucide/svelte/icons/image';
    import InfoIcon from '@lucide/svelte/icons/info';
    import Loader2Icon from '@lucide/svelte/icons/loader-2';
    import SaveIcon from '@lucide/svelte/icons/save';
    import TagsIcon from '@lucide/svelte/icons/tags';
    import VideoIcon from '@lucide/svelte/icons/video';

    import {toast} from 'svelte-sonner';

    import {cn} from '$lib/utils.js';

    type FormMode = 'create' | 'edit';

    type GalleryItem = {
        id: string;
        type: 'image' | 'video';
        src480: string;
        src960: string;
        videoSrc: string;
        alt: string;
        tags: string[];
        width: number | null;
        height: number | null;
    };

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
        existingTags?: string[];
        form?: ActionResponse | null;
    } = $props();

    const componentId = $props.id();

    let saving = $state(false);
    let customId = $state(initialItem?.id ?? '');
    let alt = $state(initialItem?.alt ?? '');
    let tagsText = $state((initialItem?.tags ?? []).join(', '));
    let selectedFileName = $state('');
    let objectUrl = $state('');
    let preview = $state(currentSource(initialItem));
    let previewType = $state<'image' | 'video' | ''>(initialItem?.type ?? '');

    const isEdit = $derived(mode === 'edit');
    const selectedTags = $derived(parseTags(tagsText));

    const controlClass =
        'h-10 rounded-xl border border-slate-300 bg-white shadow-sm focus-visible:border-primary focus-visible:ring-primary/25';

    function text(key: string, fallback: string) {
        const value = $t(key);
        return value === key ? fallback : value;
    }

    function currentSource(item: GalleryItem | null) {
        if (!item) return '';
        return item.type === 'video' ? item.videoSrc : item.src960 || item.src480;
    }

    function parseTags(value: string) {
        return value
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean);
    }

    function addTag(tag: string) {
        const tags = parseTags(tagsText);

        if (tags.some((existing) => existing.toLocaleLowerCase() === tag.toLocaleLowerCase())) {
            return;
        }

        tagsText = [...tags, tag].join(', ');
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
            preview = currentSource(initialItem);
            previewType = initialItem?.type ?? '';
            return;
        }

        objectUrl = URL.createObjectURL(file);
        selectedFileName = file.name;
        preview = objectUrl;
        previewType = file.type.startsWith('video/') ? 'video' : 'image';
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
                        description: savedId || alt || undefined
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
        class={cn(buttonVariants({variant: 'outline'}), 'rounded-xl')}
    >
        <ArrowLeftIcon class="mr-2 size-4" />
        {$t('admin.gallery.form.backToList')}
    </a>
</div>

{#if inlineError()}
    <div class="mb-5 flex gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        <InfoIcon class="mt-0.5 size-4 shrink-0" />
        <div>
            <p class="font-medium">{inlineError()}</p>

            {#if form?.message && form.message !== inlineError()}
                <p class="mt-1 text-xs opacity-80">{form.message}</p>
            {/if}
        </div>
    </div>
{/if}

<form
    method="POST"
    enctype="multipart/form-data"
    action="?/save"
    use:enhance={submitEnhance}
    class="grid gap-6"
>
    <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div class="mb-5 flex items-start justify-between gap-4">
                <div>
                    <h2 class="font-semibold text-slate-900">
                        {$t('admin.gallery.form.details')}
                    </h2>

                    <p class="mt-1 text-sm text-slate-500">
                        {$t('admin.gallery.form.detailsHelp')}
                    </p>
                </div>

                {#if initialItem}
                    <Badge variant="secondary" class="font-mono">
                        {initialItem.id}
                    </Badge>
                {/if}
            </div>

            <div class="grid gap-5">
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
                    <Label for={`${componentId}-alt`}>
                        {$t('admin.gallery.alt')}
                    </Label>

                    <Input
                        id={`${componentId}-alt`}
                        name="alt"
                        bind:value={alt}
                        placeholder={$t('admin.gallery.altPlaceholder')}
                        class={controlClass}
                    />

                    <p class="text-xs text-slate-500">
                        {$t('admin.gallery.form.altHelp')}
                    </p>
                </div>

                <div class="space-y-1.5">
                    <div class="flex items-center gap-2">
                        <TagsIcon class="size-4 text-slate-500" />
                        <Label for={`${componentId}-tags`}>
                            {$t('admin.gallery.tags')}
                        </Label>
                    </div>

                    <Input
                        id={`${componentId}-tags`}
                        name="tags"
                        bind:value={tagsText}
                        placeholder={$t('admin.gallery.tagsPlaceholder')}
                        class={controlClass}
                    />

                    <p class="text-xs text-slate-500">
                        {$t('admin.gallery.form.tagsHelp')}
                    </p>

                    {#if selectedTags.length}
                        <div class="flex flex-wrap gap-1.5 pt-1">
                            {#each selectedTags as tag (tag)}
                                <Badge variant="secondary">{tag}</Badge>
                            {/each}
                        </div>
                    {/if}

                    {#if existingTags.length}
                        <div class="rounded-xl border border-slate-200 bg-slate-50 p-3">
                            <p class="mb-2 text-xs font-medium text-slate-600">
                                {$t('admin.gallery.existingTags')}
                            </p>

                            <div class="flex flex-wrap gap-1.5">
                                {#each existingTags as tag (tag)}
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        class="h-7 rounded-full bg-white px-2.5 text-xs"
                                        onclick={() => addTag(tag)}
                                    >
                                        {tag}
                                    </Button>
                                {/each}
                            </div>
                        </div>
                    {/if}
                </div>
            </div>
        </section>

        <aside class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div class="flex items-start justify-between gap-3">
                <div>
                    <h2 class="font-semibold text-slate-900">
                        {$t('admin.gallery.form.media')}
                    </h2>

                    <p class="mt-1 text-sm text-slate-500">
                        {$t(isEdit ? 'admin.gallery.replaceMediaHelp' : 'admin.gallery.mediaUploadHelp')}
                    </p>
                </div>

                <Badge variant="secondary">
                    {mediaTypeLabel()}
                </Badge>
            </div>

            <div class="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
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
                            alt={alt || initialItem?.id || $t('admin.gallery.preview')}
                            class="aspect-square w-full bg-white object-contain p-3"
                        />
                    {/if}
                {:else}
                    <div class="flex aspect-square w-full flex-col items-center justify-center gap-3 px-6 text-center text-slate-400">
                        <div class="flex size-14 items-center justify-center rounded-2xl bg-white shadow-sm">
                            <FileImageIcon class="size-7" />
                        </div>

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
                    class="rounded-xl"
                    onchange={onFileChange}
                />

                {#if selectedFileName}
                    <p class="truncate text-xs text-slate-500">
                        {$t('admin.gallery.form.selectedFile')}: {selectedFileName}
                    </p>
                {/if}
            </div>

            {#if initialItem}
                <div class="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
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
            class={cn(buttonVariants({variant: 'outline'}), 'rounded-xl')}
        >
            {$t('common.cancel')}
        </a>

        <Button type="submit" class="rounded-xl" disabled={saving}>
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
