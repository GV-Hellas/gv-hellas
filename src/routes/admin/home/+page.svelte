<script lang="ts">
    import {enhance} from '$app/forms';
    import type {ActionResult} from '@sveltejs/kit';

    import {t, locale} from '$lib/i18n';
    import type {HomepageLang, HomepageSlide} from '$lib/cms/home/types';

    import * as Table from '$lib/components/ui/table/index.js';
    import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
    import {Badge} from '$lib/components/ui/badge/index.js';
    import {Button, buttonVariants} from '$lib/components/ui/button/index.js';
    import {toast} from 'svelte-sonner';

    import ImageIcon from '@lucide/svelte/icons/image';
    import Loader2Icon from '@lucide/svelte/icons/loader-2';
    import PencilIcon from '@lucide/svelte/icons/pencil';
    import Trash2Icon from '@lucide/svelte/icons/trash-2';

    import {cn} from '$lib/utils.js';

    type ActionResponse = {
        ok?: boolean;
        id?: number;
        errorKey?: string;
        message?: string;
    };

    let {data}: {data: {slides: HomepageSlide[]}} = $props();

    let deleteDialogOpen = $state(false);
    let deleteTarget = $state<HomepageSlide | null>(null);
    let deleting = $state(false);

    const lang = $derived((($locale === 'de' ? 'de' : 'el') as HomepageLang));

    function text(key: string, fallback: string) {
        const value = $t(key);
        return value === key ? fallback : value;
    }

    function localized(value: HomepageSlide['title']) {
        return value[lang] || value.el || value.de || '';
    }

    function image(item: HomepageSlide) {
        return item.image480 || item.image960 || item.image1920 || item.imageFallback;
    }

    function formatDate(value?: string) {
        if (!value) return '—';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return value;

        return new Intl.DateTimeFormat(lang === 'de' ? 'de-CH' : 'el-GR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }).format(date);
    }

    function openDeleteDialog(item: HomepageSlide) {
        deleteTarget = item;
        deleteDialogOpen = true;
    }

    function actionMessage(data: unknown) {
        if (!data || typeof data !== 'object') return '';
        const response = data as ActionResponse;

        if (response.errorKey) {
            const translated = $t(response.errorKey);
            if (translated !== response.errorKey) return translated;
        }

        return response.message || '';
    }

    type EnhanceUpdate = (options?: {reset?: boolean; invalidateAll?: boolean}) => Promise<void>;
    type EnhanceResult = {result: ActionResult; update: EnhanceUpdate};

    const deleteEnhance = () => {
        deleting = true;

        return async ({result, update}: EnhanceResult) => {
            deleting = false;

            if (result.type === 'success') {
                const response = result.data as ActionResponse | undefined;
                deleteDialogOpen = false;
                deleteTarget = null;

                toast.success(text('admin.homepage.toast.deleted', 'Homepage slide deleted'), {
                    description: response?.id ? `ID: ${response.id}` : undefined
                });

                await update({reset: true, invalidateAll: true});
                return;
            }

            if (result.type === 'failure') {
                toast.error(text('admin.homepage.toast.deleteFailed', 'The homepage slide could not be deleted.'), {
                    description: actionMessage(result.data) || undefined
                });
                await update();
                return;
            }

            toast.error(text('admin.homepage.toast.deleteFailed', 'The homepage slide could not be deleted.'));
        };
    };
</script>

<svelte:head>
    <title>{$t('admin.homepage.title')} | Griechischer Verein Hellas</title>
</svelte:head>

<div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
    <div>
        <h1 class="text-2xl font-bold tracking-tight">{$t('admin.homepage.title')}</h1>
        <p class="mt-1 text-sm text-slate-500">{$t('admin.homepage.subtitle')}</p>
    </div>

    <a href="/admin/home/create" class={cn(buttonVariants(), 'rounded-lg')}>
        {$t('admin.homepage.createNew')}
    </a>
</div>

<div class="overflow-hidden border border-slate-200 bg-white shadow-sm">
    <div class="overflow-x-auto">
        <Table.Root class="w-full table-fixed">
            <Table.Header>
                <Table.Row>
                    <Table.Head class="w-32">{$t('admin.homepage.table.preview')}</Table.Head>
                    <Table.Head>{$t('admin.homepage.table.title')}</Table.Head>
                    <Table.Head class="w-24">{$t('admin.homepage.table.order')}</Table.Head>
                    <Table.Head class="w-28">{$t('admin.homepage.table.status')}</Table.Head>
                    <Table.Head class="w-32">{$t('admin.homepage.table.updated')}</Table.Head>
                    <Table.Head class="w-24 text-right">{$t('admin.homepage.table.actions')}</Table.Head>
                </Table.Row>
            </Table.Header>

            <Table.Body>
                {#if data.slides.length}
                    {#each data.slides as item (item.id)}
                        <Table.Row>
                            <Table.Cell>
                                {#if image(item)}
                                    <img
                                        src={image(item)}
                                        alt={localized(item.alt)}
                                        class="h-14 w-24 border border-slate-200 object-cover"
                                        loading="lazy"
                                    />
                                {:else}
                                    <div class="flex h-14 w-24 items-center justify-center border border-dashed border-slate-300 bg-slate-50 text-slate-400">
                                        <ImageIcon class="size-5" />
                                    </div>
                                {/if}
                            </Table.Cell>

                            <Table.Cell>
                                <div class="truncate font-semibold text-slate-900">{localized(item.title) || '—'}</div>
                                <div class="mt-1 truncate text-xs text-slate-500">{localized(item.description)}</div>
                            </Table.Cell>

                            <Table.Cell class="font-mono text-sm">{item.sortOrder}</Table.Cell>

                            <Table.Cell>
                                <Badge variant={item.enabled ? 'default' : 'secondary'} class="rounded-md">
                                    {$t(item.enabled ? 'admin.homepage.enabled' : 'admin.homepage.disabled')}
                                </Badge>
                            </Table.Cell>

                            <Table.Cell class="text-sm text-slate-600">{formatDate(item.updatedAt)}</Table.Cell>

                            <Table.Cell>
                                <div class="flex items-center justify-end gap-1.5">
                                    <a
                                        href={`/admin/home/${item.id}/edit`}
                                        class={cn(buttonVariants({variant: 'outline', size: 'icon'}), 'size-8 rounded-lg')}
                                        title={$t('admin.homepage.actions.edit')}
                                        aria-label={$t('admin.homepage.actions.edit')}
                                    >
                                        <PencilIcon class="size-4" />
                                    </a>

                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        class="size-8 rounded-lg"
                                        onclick={() => openDeleteDialog(item)}
                                        title={$t('common.delete')}
                                        aria-label={$t('common.delete')}
                                    >
                                        <Trash2Icon class="size-4" />
                                    </Button>
                                </div>
                            </Table.Cell>
                        </Table.Row>
                    {/each}
                {:else}
                    <Table.Row>
                        <Table.Cell colspan={6} class="h-36 text-center text-slate-500">
                            <ImageIcon class="mx-auto mb-3 size-7 text-slate-400" />
                            <p class="font-medium text-slate-700">{$t('admin.homepage.empty')}</p>
                            <p class="mt-1 text-sm">{$t('admin.homepage.emptyDescription')}</p>
                        </Table.Cell>
                    </Table.Row>
                {/if}
            </Table.Body>
        </Table.Root>
    </div>
</div>

<AlertDialog.Root bind:open={deleteDialogOpen}>
    <AlertDialog.Content>
        <AlertDialog.Header>
            <AlertDialog.Title>{$t('admin.homepage.deleteDialog.title')}</AlertDialog.Title>
            <AlertDialog.Description>
                {$t('admin.homepage.deleteDialog.description')}
                {#if deleteTarget}
                    <span class="mt-3 block border border-slate-200 bg-slate-50 px-3 py-2 font-medium text-slate-800">
                        {localized(deleteTarget.title) || `ID ${deleteTarget.id}`}
                    </span>
                {/if}
            </AlertDialog.Description>
        </AlertDialog.Header>

        <AlertDialog.Footer>
            <AlertDialog.Cancel disabled={deleting}>{$t('common.cancel')}</AlertDialog.Cancel>

            {#if deleteTarget}
                <form method="POST" action="?/delete" use:enhance={deleteEnhance}>
                    <input type="hidden" name="id" value={deleteTarget.id} />
                    <Button type="submit" variant="destructive" disabled={deleting}>
                        {#if deleting}
                            <Loader2Icon class="mr-2 size-4 animate-spin" />
                            {$t('admin.homepage.deleteDialog.deleting')}
                        {:else}
                            <Trash2Icon class="mr-2 size-4" />
                            {$t('admin.homepage.deleteDialog.confirm')}
                        {/if}
                    </Button>
                </form>
            {/if}
        </AlertDialog.Footer>
    </AlertDialog.Content>
</AlertDialog.Root>
