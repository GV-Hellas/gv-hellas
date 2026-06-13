<script lang="ts">
    import {enhance} from '$app/forms';
    import type {ActionResult} from '@sveltejs/kit';

    import {t, locale} from '$lib/i18n';

    import * as Table from '$lib/components/ui/table/index.js';
    import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
    import {Button, buttonVariants} from '$lib/components/ui/button/index.js';
    import {Badge} from '$lib/components/ui/badge/index.js';

    import {toast} from 'svelte-sonner';
    // noinspection ES6UnusedImports
    import PencilIcon from '@lucide/svelte/icons/pencil';
    // noinspection ES6UnusedImports
    import Trash2Icon from '@lucide/svelte/icons/trash-2';
    import Loader2Icon from '@lucide/svelte/icons/loader-2';

    import {cn} from '$lib/utils.js';

    type Lang = 'el' | 'de';

    type AdminEvent = {
        slug: string;
        date?: string;
        title?: Partial<Record<Lang, string>>;
    };

    type PageData = {
        events: AdminEvent[];
    };

    type ActionResponse = {
        ok?: boolean;
        slug?: string;
        message?: string;
    };

    let {data}: { data: PageData } = $props();

    let deleteDialogOpen = $state(false);
    let deleteTarget = $state<AdminEvent | null>(null);
    let deleting = $state(false);

    const lang = $derived(($locale || 'el') as Lang);

    function text(key: string, fallback: string) {
        const value = $t(key);
        return value === key ? fallback : value;
    }

    function eventTitle(event: AdminEvent) {
        return event.title?.[lang] || event.title?.el || '—';
    }

    function formatDate(value?: string) {
        if (!value) return '—';

        const date = new Date(`${value}T00:00:00`);

        if (Number.isNaN(date.getTime())) {
            return value;
        }

        return new Intl.DateTimeFormat(lang === 'de' ? 'de-CH' : 'el-GR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }).format(date);
    }

    function openDeleteDialog(event: AdminEvent) {
        deleteTarget = event;
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
                const deletedSlug = resultData?.slug || deleteTarget?.slug;

                deleteDialogOpen = false;
                deleteTarget = null;

                toast.success(
                    text('admin.events.toast.deleted', 'Event deleted'),
                    {
                        description: deletedSlug
                    }
                );

                await update({
                    reset: true,
                    invalidateAll: true
                });

                return;
            }

            if (result.type === 'failure') {
                const message =
                    actionMessage(result.data) ||
                    text('admin.events.toast.deleteFailed', 'The event could not be deleted.');

                toast.error(text('admin.events.toast.deleteFailed', 'The event could not be deleted.'), {
                    description: message
                });

                await update();
                return;
            }

            if (result.type === 'error') {
                toast.error(text('admin.events.toast.deleteFailed', 'The event could not be deleted.'));
                return;
            }

            await update();
        };
    };

    function editHref(slug: string) {
        return `/admin/events/${encodeURIComponent(slug)}`;
    }
</script>

<svelte:head>
    <title>{$t('admin.events.title')} | GV Hellas</title>
</svelte:head>

<div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
    <div>
        <h1 class="text-2xl font-bold tracking-tight">
            {$t('admin.events.title')}
        </h1>

        <p class="mt-1 text-sm text-slate-500">
            {$t('admin.events.subtitle')}
        </p>
    </div>

    <a href="/admin/events/create" class={cn(buttonVariants(), 'rounded-xl')}>
        {$t('admin.events.newEvent')}
    </a>
</div>

<div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div class="overflow-x-auto">
        <Table.Root class="w-full table-fixed">
            <Table.Caption>
                {$t('admin.events.subtitle')}
            </Table.Caption>

            <Table.Header>
                <Table.Row>
                    <Table.Head class="w-44">
                        Slug
                    </Table.Head>

                    <Table.Head class="w-34">
                        {$t('admin.events.table.date')}
                    </Table.Head>

                    <Table.Head>
                        {$t('admin.events.table.title')} - {lang.toUpperCase()}
                    </Table.Head>

                    <Table.Head class="w-38 text-right">
                        {$t('admin.events.table.actions')}
                    </Table.Head>
                </Table.Row>
            </Table.Header>

            <Table.Body>
                {#if data.events.length > 0}
                    {#each data.events as event (event.slug)}
                        <Table.Row>
                            <Table.Cell class="align-middle">
                                <Badge
                                        variant="secondary"
                                        class="block max-w-full truncate font-mono"
                                        title={event.slug}
                                >
                                    {event.slug}
                                </Badge>
                            </Table.Cell>

                            <Table.Cell class="whitespace-nowrap align-middle text-slate-600">
                                {formatDate(event.date)}
                            </Table.Cell>

                            <Table.Cell class="align-middle">
                                <div class="truncate font-medium" title={eventTitle(event)}>
                                    {eventTitle(event)}
                                </div>
                            </Table.Cell>

                            <Table.Cell class="align-middle">
                                <div class="flex items-center justify-end gap-1.5">
                                    <a
                                            href={editHref(event.slug)}
                                            class={cn(
                                                buttonVariants({variant: 'outline', size: 'icon'}),
                                                'size-8 rounded-xl'
                                            )}
                                            title={$t('admin.events.actions.edit')}
                                            aria-label={$t('admin.events.actions.edit')}
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
                                            onclick={() => openDeleteDialog(event)}
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
                            {$t('admin.events.empty')}
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
                {$t('admin.events.deleteDialog.title')}
            </AlertDialog.Title>

            <AlertDialog.Description>
                {$t('admin.events.deleteDialog.description')}

                {#if deleteTarget}
                    <span class="mt-3 block rounded-lg bg-slate-100 px-3 py-2 font-mono text-xs text-slate-700">
                        {deleteTarget.slug}
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
                    <input type="hidden" name="slug" value={deleteTarget.slug} />

                    <Button
                            type="submit"
                            variant="destructive"
                            class="rounded-xl"
                            disabled={deleting}
                    >
                        {#if deleting}
                            <Loader2Icon class="mr-2 size-4 animate-spin" />
                            {text('admin.events.deleteDialog.deleting', 'Deleting…')}
                        {:else}
                            <Trash2Icon class="mr-2 size-4" />
                            {text('admin.events.deleteDialog.confirm', 'Delete event')}
                        {/if}
                    </Button>
                </form>
            {/if}
        </AlertDialog.Footer>
    </AlertDialog.Content>
</AlertDialog.Root>