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
    import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
    import Loader2Icon from '@lucide/svelte/icons/loader-2';

    import {cn} from '$lib/utils.js';

    type Lang = 'el' | 'de';

    type AdminLink = {
        id: number;
        name: Partial<Record<Lang, string>>;
        url: string;
        logo?: string;
        logoVariants?: {
            webp?: string;
            jpg?: string;
        };
    };

    type PageData = {
        links: AdminLink[];
    };

    type ActionResponse = {
        ok?: boolean;
        id?: number;
        message?: string;
    };

    let {data}: { data: PageData } = $props();

    let deleteDialogOpen = $state(false);
    let deleteTarget = $state<AdminLink | null>(null);
    let deleting = $state(false);

    const lang = $derived(($locale || 'el') as Lang);
    const links = $derived(data.links ?? []);

    function text(key: string, fallback: string) {
        const value = $t(key);
        return value === key ? fallback : value;
    }

    function itemTitle(item: AdminLink) {
        return item.name?.[lang] || item.name?.el || item.name?.de || '—';
    }

    function logoSrc(item: AdminLink) {
        return item.logo || item.logoVariants?.webp || item.logoVariants?.jpg || '';
    }

    function editHref(id: number) {
        return `/admin/links/${id}/edit`;
    }

    function openDeleteDialog(item: AdminLink) {
        deleteTarget = item;
        deleteDialogOpen = true;
    }

    function actionMessage(data: unknown) {
        if (!data || typeof data !== 'object') return '';

        const maybeData = data as ActionResponse;

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

                toast.success(text('admin.links.toast.deleted', 'Link deleted'), {
                    description: deletedId ? `ID: ${deletedId}` : undefined
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
                    text('admin.links.toast.deleteFailed', 'The link could not be deleted.');

                toast.error(text('admin.links.toast.deleteFailed', 'The link could not be deleted.'), {
                    description: message
                });

                await update();
                return;
            }

            if (result.type === 'error') {
                toast.error(text('admin.links.toast.deleteFailed', 'The link could not be deleted.'));
                return;
            }

            await update();
        };
    };
</script>

<svelte:head>
    <title>{$t('admin.links.title')} | Griechischer Verein Hellas</title>
</svelte:head>

<div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
    <div>
        <h1 class="text-2xl font-bold tracking-tight">
            {$t('admin.links.title')}
        </h1>

        <p class="mt-1 text-sm text-slate-500">
            {$t('admin.links.subtitle')}
        </p>
    </div>

    <a href="/admin/links/create" class={cn(buttonVariants(), 'rounded-xl')}>
        {$t('admin.links.createNew')}
    </a>
</div>

<div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div class="overflow-x-auto">
        <Table.Root class="w-full table-fixed">
            <Table.Caption>
                {$t('admin.links.subtitle')}
            </Table.Caption>

            <Table.Header>
                <Table.Row>
                    <Table.Head class="w-20">
                        {$t('admin.links.table.logo')}
                    </Table.Head>

                    <Table.Head class="w-[16rem]">
                        {$t('admin.links.table.title')} - {lang.toUpperCase()}
                    </Table.Head>

                    <Table.Head>
                        {$t('admin.links.table.url')}
                    </Table.Head>

                    <Table.Head class="w-38 text-right">
                        {$t('admin.links.table.actions')}
                    </Table.Head>
                </Table.Row>
            </Table.Header>

            <Table.Body>
                {#if links.length > 0}
                    {#each links as item (item.id)}
                        <Table.Row>
                            <Table.Cell class="align-middle">
                                {#if logoSrc(item)}
                                    <img
                                            src={logoSrc(item)}
                                            alt={itemTitle(item)}
                                            class="size-10 rounded-xl border border-slate-200 bg-white object-cover"
                                    />
                                {:else}
                                    <div class="flex size-10 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-xs font-bold text-slate-400">
                                        —
                                    </div>
                                {/if}
                            </Table.Cell>

                            <Table.Cell class="align-middle">
                                <div class="truncate font-medium" title={itemTitle(item)}>
                                    {itemTitle(item)}
                                </div>

                                <Badge variant="secondary" class="mt-1 font-mono text-[0.7rem]">
                                    ID {item.id}
                                </Badge>
                            </Table.Cell>

                            <Table.Cell class="align-middle">
                                <a
                                        href={item.url}
                                        target="_blank"
                                        rel="noopener"
                                        class="flex min-w-0 items-center gap-1.5 text-primary-dark hover:underline"
                                        title={item.url}
                                >
                                    <span class="truncate">
                                        {item.url}
                                    </span>

                                    <ExternalLinkIcon class="size-3.5 shrink-0" />
                                </a>
                            </Table.Cell>

                            <Table.Cell class="align-middle">
                                <div class="flex items-center justify-end gap-1.5">
                                    <a
                                            href={editHref(item.id)}
                                            class={cn(
                                            buttonVariants({variant: 'outline', size: 'icon'}),
                                            'size-8 rounded-xl'
                                        )}
                                            title={$t('admin.links.actions.edit')}
                                            aria-label={$t('admin.links.actions.edit')}
                                    >
                                        <PencilIcon class="size-4" />
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
                                        <Trash2Icon class="size-4" />
                                    </Button>
                                </div>
                            </Table.Cell>
                        </Table.Row>
                    {/each}
                {:else}
                    <Table.Row>
                        <Table.Cell colspan={4} class="h-28 text-center text-slate-500">
                            {$t('admin.links.empty')}
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
                {$t('admin.links.deleteDialog.title')}
            </AlertDialog.Title>

            <AlertDialog.Description>
                {$t('admin.links.deleteDialog.description')}

                {#if deleteTarget}
                    <span class="mt-3 block rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700">
                        {itemTitle(deleteTarget)}
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
                    <input type="hidden" name="id" value={deleteTarget.id} />

                    <Button
                            type="submit"
                            variant="destructive"
                            class="rounded-xl"
                            disabled={deleting}
                    >
                        {#if deleting}
                            <Loader2Icon class="mr-2 size-4 animate-spin" />
                            {$t('admin.links.deleteDialog.deleting')}
                        {:else}
                            <Trash2Icon class="mr-2 size-4" />
                            {$t('admin.links.deleteDialog.confirm')}
                        {/if}
                    </Button>
                </form>
            {/if}
        </AlertDialog.Footer>
    </AlertDialog.Content>
</AlertDialog.Root>