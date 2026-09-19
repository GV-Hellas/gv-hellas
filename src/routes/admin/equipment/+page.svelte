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
    import PackageIcon from '@lucide/svelte/icons/package';

    import {cn} from '$lib/utils.js';

    type Lang = 'el' | 'de';

    type AdminEquipment = {
        id: number;
        slug: string;
        title: Partial<Record<Lang, string>>;
        pricePerDay: number;
        updatedAt?: string;
    };

    type PageData = {
        equipment: AdminEquipment[];
    };

    type ActionResponse = {
        ok?: boolean;
        id?: number | null;
        errorKey?: string;
        message?: string;
    };

    let {data}: {data: PageData} = $props();

    let deleteDialogOpen = $state(false);
    let deleteTarget = $state<AdminEquipment | null>(null);
    let deleting = $state(false);

    const lang = $derived(($locale || 'el') as Lang);

    function text(key: string, fallback: string) {
        const value = $t(key);
        return value === key ? fallback : value;
    }

    function itemTitle(item: AdminEquipment) {
        return item.title?.[lang] || item.title?.el || item.title?.de || '—';
    }

    function formatPrice(value: number) {
        return new Intl.NumberFormat(lang === 'de' ? 'de-CH' : 'el-GR', {
            style: 'currency',
            currency: 'CHF',
            minimumFractionDigits: Number.isInteger(Number(value)) ? 0 : 2,
            maximumFractionDigits: 2
        }).format(Number(value || 0));
    }

    function formatDateTime(value?: string) {
        if (!value) return '—';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return value;

        return new Intl.DateTimeFormat(lang === 'de' ? 'de-CH' : 'el-GR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }).format(date);
    }

    function openDeleteDialog(item: AdminEquipment) {
        deleteTarget = item;
        deleteDialogOpen = true;
    }

    function actionMessage(value: unknown) {
        if (!value || typeof value !== 'object') return '';
        const response = value as ActionResponse;

        if (response.errorKey) {
            const translated = $t(response.errorKey);
            if (translated !== response.errorKey) return translated;
        }

        return response.message || '';
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
                deleteDialogOpen = false;
                deleteTarget = null;

                toast.success(text('admin.equipment.toast.deleted', 'Equipment deleted'));

                await update({
                    reset: true,
                    invalidateAll: true
                });
                return;
            }

            if (result.type === 'failure') {
                const message =
                    actionMessage(result.data) ||
                    text('admin.equipment.toast.deleteFailed', 'The equipment could not be deleted.');

                toast.error(text('admin.equipment.toast.deleteFailed', 'The equipment could not be deleted.'), {
                    description: message
                });

                await update();
                return;
            }

            if (result.type === 'error') {
                toast.error(text('admin.equipment.toast.deleteFailed', 'The equipment could not be deleted.'));
                return;
            }

            await update();
        };
    };
</script>

<svelte:head>
    <title>{$t('admin.equipment.title')} | Griechischer Verein Hellas</title>
</svelte:head>

<div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
    <div>
        <h1 class="text-2xl font-bold tracking-tight">{$t('admin.equipment.title')}</h1>
        <p class="mt-1 text-sm text-slate-500">{$t('admin.equipment.subtitle')}</p>
    </div>

    <a href="/admin/equipment/create" class={cn(buttonVariants(), 'rounded-lg')}>
        {$t('admin.equipment.createNew')}
    </a>
</div>

<div class="overflow-hidden border border-slate-200 bg-white shadow-sm">
    <div class="overflow-x-auto">
        <Table.Root class="w-full table-fixed">
            <Table.Caption>{$t('admin.equipment.subtitle')}</Table.Caption>

            <Table.Header>
                <Table.Row>
                    <Table.Head class="w-48">Slug</Table.Head>
                    <Table.Head>{$t('admin.equipment.table.title')} - {lang.toUpperCase()}</Table.Head>
                    <Table.Head class="w-40">{$t('admin.equipment.table.price')}</Table.Head>
                    <Table.Head class="w-36">{$t('admin.equipment.table.updated')}</Table.Head>
                    <Table.Head class="w-28 text-right">{$t('admin.equipment.table.actions')}</Table.Head>
                </Table.Row>
            </Table.Header>

            <Table.Body>
                {#if data.equipment.length > 0}
                    {#each data.equipment as item (item.id)}
                        <Table.Row>
                            <Table.Cell class="align-middle">
                                <Badge variant="secondary" class="block max-w-full truncate font-mono" title={item.slug}>
                                    {item.slug}
                                </Badge>
                            </Table.Cell>

                            <Table.Cell class="align-middle">
                                <div class="truncate font-medium" title={itemTitle(item)}>{itemTitle(item)}</div>
                            </Table.Cell>

                            <Table.Cell class="whitespace-nowrap align-middle font-semibold text-slate-700">
                                {formatPrice(item.pricePerDay)}
                            </Table.Cell>

                            <Table.Cell class="whitespace-nowrap align-middle text-sm text-slate-600">
                                {formatDateTime(item.updatedAt)}
                            </Table.Cell>

                            <Table.Cell class="align-middle">
                                <div class="flex items-center justify-end gap-1.5">
                                    <a
                                        href={`/admin/equipment/${item.id}/edit`}
                                        class={cn(buttonVariants({variant: 'outline', size: 'icon'}), 'size-8 rounded-lg')}
                                        title={$t('admin.equipment.actions.edit')}
                                        aria-label={$t('admin.equipment.actions.edit')}
                                    >
                                        <PencilIcon class="size-4" />
                                    </a>

                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        class="size-8 rounded-lg"
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
                        <Table.Cell colspan={5} class="h-36 text-center">
                            <div class="mx-auto flex max-w-sm flex-col items-center gap-3 text-slate-500">
                                <PackageIcon class="size-8 text-slate-400" />
                                <div>
                                    <p class="font-medium text-slate-700">{$t('admin.equipment.empty')}</p>
                                    <p class="mt-1 text-sm">{$t('admin.equipment.emptyDescription')}</p>
                                </div>
                                <a href="/admin/equipment/create" class={cn(buttonVariants({size: 'sm'}), 'rounded-lg')}>
                                    {$t('admin.equipment.createFirst')}
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
    <AlertDialog.Content class="rounded-lg">
        <AlertDialog.Header>
            <AlertDialog.Title>{$t('admin.equipment.deleteDialog.title')}</AlertDialog.Title>
            <AlertDialog.Description>
                {$t('admin.equipment.deleteDialog.description')}

                {#if deleteTarget}
                    <span class="mt-3 block border-l-2 border-primary/30 bg-slate-50 px-3 py-2">
                        <span class="block font-medium text-slate-800">{itemTitle(deleteTarget)}</span>
                        <span class="block truncate font-mono text-xs text-slate-500">{deleteTarget.slug}</span>
                    </span>
                {/if}
            </AlertDialog.Description>
        </AlertDialog.Header>

        <AlertDialog.Footer>
            <AlertDialog.Cancel disabled={deleting} class="rounded-lg">
                {$t('common.cancel')}
            </AlertDialog.Cancel>

            {#if deleteTarget}
                <form method="POST" action="?/delete" use:enhance={deleteEnhance}>
                    <input type="hidden" name="id" value={deleteTarget.id} />
                    <Button type="submit" variant="destructive" class="rounded-lg" disabled={deleting}>
                        {#if deleting}
                            <Loader2Icon class="mr-2 size-4 animate-spin" />
                            {$t('admin.equipment.deleteDialog.deleting')}
                        {:else}
                            <Trash2Icon class="mr-2 size-4" />
                            {$t('admin.equipment.deleteDialog.confirm')}
                        {/if}
                    </Button>
                </form>
            {/if}
        </AlertDialog.Footer>
    </AlertDialog.Content>
</AlertDialog.Root>
