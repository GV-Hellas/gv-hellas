<!--suppress ES6UnusedImports -->
<script lang="ts">
    import {enhance} from '$app/forms';
    import type {ActionResult} from '@sveltejs/kit';

    import {t} from '$lib/i18n';

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

    type SponsorType = 'listed' | 'bronze' | 'silver' | 'gold';

    type AdminBusiness = {
        id: number;
        sponsorType?: SponsorType;
        sponsor_type?: SponsorType;
        name: string;
        slug?: string;
        logo?: string;
        url?: string;
        email?: string;
        telephone?: string;
        contactPerson?: string;
        contact_person?: string;
    };

    type PageData = {
        businesses: AdminBusiness[];
    };

    type ActionResponse = {
        ok?: boolean;
        id?: number;
        message?: string;
    };

    let {data}: { data: PageData } = $props();

    let deleteDialogOpen = $state(false);
    let deleteTarget = $state<AdminBusiness | null>(null);
    let deleting = $state(false);

    const businesses = $derived(data.businesses ?? []);

    function sponsorType(item: AdminBusiness): SponsorType {
        return item.sponsorType || item.sponsor_type || 'listed';
    }

    function sponsorLabel(type: SponsorType) {
        return $t(`admin.businesses.sponsorTypes.${type}`);
    }

    function sponsorClass(type: SponsorType) {
        if (type === 'gold') return 'border-amber-200 bg-amber-50 text-amber-800';
        if (type === 'silver') return 'border-slate-300 bg-slate-100 text-slate-700';
        if (type === 'bronze') return 'border-orange-200 bg-orange-50 text-orange-800';

        return 'border-slate-200 bg-slate-50 text-slate-600';
    }

    function businessTitle(item: AdminBusiness) {
        return item.name || '—';
    }

    function contactText(item: AdminBusiness) {
        return item.contactPerson || item.contact_person || item.email || item.telephone || '—';
    }

    function editHref(id: number) {
        return `/admin/businesses/${id}/edit`;
    }

    function publicHref(item: AdminBusiness) {
        return item.slug ? `/business/${encodeURIComponent(item.slug)}` : '';
    }

    function openDeleteDialog(item: AdminBusiness) {
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

                toast.success($t('admin.businesses.toast.deleted'), {
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
                    $t('admin.businesses.toast.deleteFailed');

                toast.error($t('admin.businesses.toast.deleteFailed'), {
                    description: message
                });

                await update();
                return;
            }

            if (result.type === 'error') {
                toast.error($t('admin.businesses.toast.deleteFailed'));
                return;
            }

            await update();
        };
    };
</script>

<svelte:head>
    <title>{$t('admin.businesses.title')} | GV Hellas</title>
</svelte:head>

<div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
    <div>
        <h1 class="text-2xl font-bold tracking-tight">
            {$t('admin.businesses.title')}
        </h1>

        <p class="mt-1 text-sm text-slate-500">
            {$t('admin.businesses.subtitle')}
        </p>
    </div>

    <a href="/admin/businesses/create" class={cn(buttonVariants(), 'rounded-xl')}>
        {$t('admin.businesses.createNew')}
    </a>
</div>

<div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div class="overflow-x-auto">
        <Table.Root class="w-full table-fixed">
            <Table.Caption>
                {$t('admin.businesses.subtitle')}
            </Table.Caption>

            <Table.Header>
                <Table.Row>
                    <Table.Head class="w-20">
                        {$t('admin.businesses.table.logo')}
                    </Table.Head>

                    <Table.Head class="w-[16rem]">
                        {$t('admin.businesses.table.name')}
                    </Table.Head>

                    <Table.Head class="w-38">
                        {$t('admin.businesses.table.sponsorType')}
                    </Table.Head>

                    <Table.Head>
                        {$t('admin.businesses.table.url')}
                    </Table.Head>

                    <Table.Head class="hidden w-48 xl:table-cell">
                        {$t('admin.businesses.table.contact')}
                    </Table.Head>

                    <Table.Head class="w-44 text-right">
                        {$t('admin.businesses.table.actions')}
                    </Table.Head>
                </Table.Row>
            </Table.Header>

            <Table.Body>
                {#if businesses.length > 0}
                    {#each businesses as item (item.id)}
                        <Table.Row>
                            <Table.Cell class="align-middle">
                                {#if item.logo}
                                    <img
                                            src={item.logo}
                                            alt={businessTitle(item)}
                                            class="size-10 rounded-xl border border-slate-200 bg-white object-cover"
                                    />
                                {:else}
                                    <div class="flex size-10 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-xs font-bold text-slate-400">
                                        —
                                    </div>
                                {/if}
                            </Table.Cell>

                            <Table.Cell class="align-middle">
                                <div class="truncate font-medium" title={businessTitle(item)}>
                                    {businessTitle(item)}
                                </div>

                                <div class="mt-1 flex items-center gap-1.5">
                                    <Badge variant="secondary" class="font-mono text-[0.7rem]">
                                        ID {item.id}
                                    </Badge>

                                    {#if item.slug}
                                        <Badge variant="outline" class="max-w-36 truncate font-mono text-[0.7rem]">
                                            {item.slug}
                                        </Badge>
                                    {/if}
                                </div>
                            </Table.Cell>

                            <Table.Cell class="align-middle">
                                <Badge
                                        variant="outline"
                                        class={cn('rounded-full border font-semibold', sponsorClass(sponsorType(item)))}
                                >
                                    {sponsorLabel(sponsorType(item))}
                                </Badge>
                            </Table.Cell>

                            <Table.Cell class="align-middle">
                                {#if item.url}
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

                                        <ExternalLinkIcon class="size-3.5 shrink-0"/>
                                    </a>
                                {:else}
                                    <span class="text-slate-400">—</span>
                                {/if}
                            </Table.Cell>

                            <Table.Cell class="hidden align-middle xl:table-cell">
                                <div class="truncate text-sm text-slate-600" title={contactText(item)}>
                                    {contactText(item)}
                                </div>
                            </Table.Cell>

                            <Table.Cell class="align-middle">
                                <div class="flex items-center justify-end gap-1.5">
                                    {#if publicHref(item)}
                                        <a
                                                href={publicHref(item)}
                                                class={cn(
                                                buttonVariants({variant: 'outline', size: 'icon'}),
                                                'size-8 rounded-xl'
                                            )}
                                                title={$t('admin.businesses.actions.view')}
                                                aria-label={$t('admin.businesses.actions.view')}
                                        >
                                            <ExternalLinkIcon class="size-4"/>
                                        </a>
                                    {/if}

                                    <a
                                            href={editHref(item.id)}
                                            class={cn(
                                            buttonVariants({variant: 'outline', size: 'icon'}),
                                            'size-8 rounded-xl'
                                        )}
                                            title={$t('admin.businesses.actions.edit')}
                                            aria-label={$t('admin.businesses.actions.edit')}
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
                        <Table.Cell colspan={6} class="h-28 text-center text-slate-500">
                            {$t('admin.businesses.empty')}
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
                {$t('admin.businesses.deleteDialog.title')}
            </AlertDialog.Title>

            <AlertDialog.Description>
                {$t('admin.businesses.deleteDialog.description')}

                {#if deleteTarget}
                    <span class="mt-3 block rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700">
                        {businessTitle(deleteTarget)}
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
                            {$t('admin.businesses.deleteDialog.deleting')}
                        {:else}
                            <Trash2Icon class="mr-2 size-4"/>
                            {$t('admin.businesses.deleteDialog.confirm')}
                        {/if}
                    </Button>
                </form>
            {/if}
        </AlertDialog.Footer>
    </AlertDialog.Content>
</AlertDialog.Root>