<!--suppress ES6UnusedImports -->
<script lang="ts">
    import {enhance} from '$app/forms';
    import type {ActionResult} from '@sveltejs/kit';

    import {t, locale} from '$lib/i18n';

    import * as Table from '$lib/components/ui/table/index.js';
    import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
    import {Button, buttonVariants} from '$lib/components/ui/button/index.js';
    import {Badge} from '$lib/components/ui/badge/index.js';

    import {toast} from 'svelte-sonner';

    import PencilIcon from '@lucide/svelte/icons/pencil';
    import Trash2Icon from '@lucide/svelte/icons/trash-2';
    import Loader2Icon from '@lucide/svelte/icons/loader-2';
    import ImageIcon from '@lucide/svelte/icons/image';
    import VideoIcon from '@lucide/svelte/icons/video';
    import TagsIcon from '@lucide/svelte/icons/tags';
    import FileImageIcon from '@lucide/svelte/icons/file-image';

    import {cn} from '$lib/utils.js';

    type Lang = 'el' | 'de';

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
        createdAt?: string;
        updatedAt?: string;
    };

    type PageData = {
        items: GalleryItem[];
    };

    type ActionResponse = {
        ok?: boolean;
        id?: string;
        errorKey?: string;
        message?: string;
    };

    let {data}: { data: PageData } = $props();

    let deleteDialogOpen = $state(false);
    let deleteTarget = $state<GalleryItem | null>(null);
    let deleting = $state(false);

    const lang = $derived(($locale || 'el') as Lang);

    function text(key: string, fallback: string) {
        const value = $t(key);
        return value === key ? fallback : value;
    }

    function previewSrc(item: GalleryItem) {
        return item.type === 'video' ? item.videoSrc : item.src480 || item.src960;
    }

    function itemLabel(item: GalleryItem) {
        return item.alt || item.id;
    }

    function itemTypeLabel(item: GalleryItem) {
        return $t(item.type === 'video' ? 'admin.gallery.video' : 'admin.gallery.image');
    }

    function sourceLabel(item: GalleryItem) {
        if (item.type === 'video') {
            return item.videoSrc ? 'WebM' : $t('admin.gallery.missingVideo');
        }

        const variants = [];

        if (item.src480) variants.push('480w');
        if (item.src960) variants.push('960w');

        return variants.length ? variants.join(' / ') : $t('admin.gallery.missingImage');
    }

    function dimensionsLabel(item: GalleryItem) {
        if (!item.width || !item.height) return '';

        return `${item.width}×${item.height}`;
    }

    function formatDateTime(value?: string) {
        if (!value) return '—';

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return value;
        }

        return new Intl.DateTimeFormat(lang === 'de' ? 'de-CH' : 'el-GR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }).format(date);
    }

    function editHref(id: string) {
        return `/admin/gallery/${encodeURIComponent(id)}/edit`;
    }

    function openDeleteDialog(item: GalleryItem) {
        deleteTarget = item;
        deleteDialogOpen = true;
    }

    function actionMessage(data: unknown) {
        if (!data || typeof data !== 'object') return '';

        const maybeData = data as ActionResponse;

        if (typeof maybeData.errorKey === 'string') {
            const translated = $t(maybeData.errorKey);

            if (translated !== maybeData.errorKey) {
                return translated;
            }
        }

        return typeof maybeData.message === 'string' ? maybeData.message : '';
    }

    type EnhanceUpdate = (options?: {
        reset?: boolean;
        invalidateAll?: boolean;
    }) => Promise<void>;

    type EnhanceResult = {
        result: ActionResult;
        update: EnhanceUpdate;
    };

    const deleteEnhance = () => {
        deleting = true;

        return async ({result, update}: EnhanceResult) => {
            deleting = false;

            if (result.type === 'success') {
                const resultData = result.data as ActionResponse | undefined;
                const deletedId = resultData?.id || deleteTarget?.id;

                deleteDialogOpen = false;
                deleteTarget = null;

                toast.success(text('admin.gallery.toast.deleted', 'Gallery item deleted'), {
                    description: deletedId
                });

                await update({
                    reset: true,
                    invalidateAll: true
                });

                return;
            }

            if (result.type === 'failure') {
                const message =
                    actionMessage(result.data) ||
                    text('admin.gallery.toast.deleteFailed', 'The gallery item could not be deleted.');

                toast.error(
                    text('admin.gallery.toast.deleteFailed', 'The gallery item could not be deleted.'),
                    {
                        description: message
                    }
                );

                await update();
                return;
            }

            if (result.type === 'error') {
                toast.error(text('admin.gallery.toast.deleteFailed', 'The gallery item could not be deleted.'));
                return;
            }

            await update();
        };
    };
</script>

<svelte:head>
    <title>{$t('nav.gallery')} | Griechischer Verein Hellas</title>
</svelte:head>

<div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
    <div>
        <h1 class="text-2xl font-bold tracking-tight">
            {$t('nav.gallery')}
        </h1>

        <p class="mt-1 text-sm text-slate-500">
            {$t('admin.gallery.subtitle')}
        </p>
    </div>

    <a href="/admin/gallery/create" class={cn(buttonVariants(), 'rounded-xl')}>
        {$t('admin.gallery.createNew')}
    </a>
</div>

<div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div class="overflow-x-auto">
        <Table.Root class="w-full table-fixed">
            <Table.Caption>
                {$t('admin.gallery.subtitle')}
            </Table.Caption>

            <Table.Header>
                <Table.Row>
                    <Table.Head class="w-28">
                        {$t('admin.gallery.table.preview')}
                    </Table.Head>

                    <Table.Head class="w-44">
                        {$t('admin.gallery.table.id')}
                    </Table.Head>

                    <Table.Head class="w-28">
                        {$t('admin.gallery.table.type')}
                    </Table.Head>

                    <Table.Head>
                        {$t('admin.gallery.table.alt')}
                    </Table.Head>

                    <Table.Head class="w-56">
                        {$t('admin.gallery.table.tags')}
                    </Table.Head>

                    <Table.Head class="w-40">
                        {$t('admin.gallery.table.files')}
                    </Table.Head>

                    <Table.Head class="w-28">
                        {$t('admin.gallery.table.updated')}
                    </Table.Head>

                    <Table.Head class="w-24 text-right">
                        {$t('admin.gallery.table.actions')}
                    </Table.Head>
                </Table.Row>
            </Table.Header>

            <Table.Body>
                {#if data.items.length > 0}
                    {#each data.items as item (item.id)}
                        <Table.Row>
                            <Table.Cell class="align-middle">
                                {#if item.type === 'image' && previewSrc(item)}
                                    <img
                                            src={previewSrc(item)}
                                            alt={itemLabel(item)}
                                            class="h-14 w-20 rounded-xl border border-slate-200 object-cover"
                                            loading="lazy"
                                    />
                                {:else if item.type === 'video' && previewSrc(item)}
                                    <div class="relative h-14 w-20 overflow-hidden rounded-xl border border-slate-200 bg-black">
                                        <video
                                                src={previewSrc(item)}
                                                class="h-full w-full object-cover"
                                                muted
                                                playsinline
                                                preload="metadata"
                                        />

                                        <div class="absolute inset-0 flex items-center justify-center bg-black/25 text-white">
                                            <VideoIcon class="size-5"/>
                                        </div>
                                    </div>
                                {:else}
                                    <div class="flex h-14 w-20 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-slate-400">
                                        <FileImageIcon class="size-5"/>
                                    </div>
                                {/if}
                            </Table.Cell>

                            <Table.Cell class="align-middle">
                                <Badge
                                        variant="secondary"
                                        class="block max-w-full truncate font-mono"
                                        title={item.id}
                                >
                                    {item.id}
                                </Badge>
                            </Table.Cell>

                            <Table.Cell class="align-middle">
                                <Badge variant={item.type === 'video' ? 'outline' : 'secondary'} class="gap-1.5">
                                    {#if item.type === 'video'}
                                        <VideoIcon class="size-3.5"/>
                                    {:else}
                                        <ImageIcon class="size-3.5"/>
                                    {/if}

                                    {itemTypeLabel(item)}
                                </Badge>
                            </Table.Cell>

                            <Table.Cell class="align-middle">
                                <div class="truncate font-medium" title={itemLabel(item)}>
                                    {item.alt || '—'}
                                </div>
                            </Table.Cell>

                            <Table.Cell class="align-middle">
                                {#if item.tags?.length}
                                    <div class="flex max-w-full flex-wrap gap-1">
                                        {#each item.tags.slice(0, 3) as tag}
                                            <Badge variant="outline" class="max-w-28 truncate" title={tag}>
                                                {tag}
                                            </Badge>
                                        {/each}

                                        {#if item.tags.length > 3}
                                            <Badge variant="secondary" title={item.tags.join(', ')}>
                                                +{item.tags.length - 3}
                                            </Badge>
                                        {/if}
                                    </div>
                                {:else}
                                    <div class="flex items-center gap-1.5 text-sm text-slate-400">
                                        <TagsIcon class="size-3.5"/>
                                        {$t('admin.gallery.noTags')}
                                    </div>
                                {/if}
                            </Table.Cell>

                            <Table.Cell class="align-middle">
                                <div class="text-xs text-slate-600">
                                    <div>{sourceLabel(item)}</div>

                                    {#if dimensionsLabel(item)}
                                        <div class="mt-0.5 text-slate-400">
                                            {dimensionsLabel(item)}
                                        </div>
                                    {/if}
                                </div>
                            </Table.Cell>

                            <Table.Cell class="whitespace-nowrap align-middle text-sm text-slate-600">
                                {formatDateTime(item.updatedAt || item.createdAt)}
                            </Table.Cell>

                            <Table.Cell class="align-middle">
                                <div class="flex items-center justify-end gap-1.5">
                                    <a
                                            href={editHref(item.id)}
                                            class={cn(
                                            buttonVariants({variant: 'outline', size: 'icon'}),
                                            'size-8 rounded-xl'
                                        )}
                                            title={$t('admin.gallery.actions.edit')}
                                            aria-label={$t('admin.gallery.actions.edit')}
                                    >
                                        <PencilIcon class="size-4"/>
                                    </a>

                                    <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            class="size-8 rounded-xl"
                                            title={$t('common.delete')}
                                            aria-label={$t('common.delete')}
                                            onclick={() => openDeleteDialog(item)}
                                    >
                                        <Trash2Icon class="size-4"/>
                                    </Button>
                                </div>
                            </Table.Cell>
                        </Table.Row>
                    {/each}
                {:else}
                    <Table.Row>
                        <Table.Cell colspan={8} class="h-32 text-center">
                            <div class="mx-auto flex max-w-sm flex-col items-center gap-3 text-slate-500">
                                <div class="flex size-12 items-center justify-center rounded-2xl bg-slate-100">
                                    <ImageIcon class="size-6"/>
                                </div>

                                <div>
                                    <p class="font-medium text-slate-700">
                                        {$t('admin.gallery.empty')}
                                    </p>

                                    <p class="mt-1 text-sm text-slate-500">
                                        {$t('admin.gallery.emptyDescription')}
                                    </p>
                                </div>

                                <a href="/admin/gallery/create" class={cn(buttonVariants({size: 'sm'}), 'rounded-xl')}>
                                    {$t('admin.gallery.createFirst')}
                                </a>
                            </div>
                        </Table.Cell>
                    </Table.Row>
                {/if}
            </Table.Body>
        </Table.Root>
    </div>
</div>

<AlertDialog.Root bind:open={deleteDialogOpen}>
    <AlertDialog.Content class="rounded-2xl">
        <AlertDialog.Header>
            <AlertDialog.Title>
                {$t('admin.gallery.deleteDialog.title')}
            </AlertDialog.Title>

            <AlertDialog.Description>
                {$t('admin.gallery.deleteDialog.description')}

                {#if deleteTarget}
                    <span class="mt-3 block rounded-lg bg-slate-100 px-3 py-2">
                        <span class="block truncate font-medium text-slate-800">
                            {itemLabel(deleteTarget)}
                        </span>

                        <span class="mt-1 block truncate font-mono text-xs text-slate-600">
                            {deleteTarget.id}
                        </span>
                    </span>
                {/if}
            </AlertDialog.Description>
        </AlertDialog.Header>

        <AlertDialog.Footer>
            <AlertDialog.Cancel disabled={deleting} class="rounded-xl">
                {$t('common.cancel')}
            </AlertDialog.Cancel>

            {#if deleteTarget}
                <form method="POST" action="?/delete" use:enhance={deleteEnhance}>
                    <input type="hidden" name="id" value={deleteTarget.id}/>

                    <Button
                            type="submit"
                            variant="destructive"
                            class="rounded-xl"
                            disabled={deleting}
                    >
                        {#if deleting}
                            <Loader2Icon class="mr-2 size-4 animate-spin"/>
                            {text('admin.gallery.deleteDialog.deleting', 'Deleting…')}
                        {:else}
                            <Trash2Icon class="mr-2 size-4"/>
                            {text('admin.gallery.deleteDialog.confirm', 'Delete gallery item')}
                        {/if}
                    </Button>
                </form>
            {/if}
        </AlertDialog.Footer>
    </AlertDialog.Content>
</AlertDialog.Root>