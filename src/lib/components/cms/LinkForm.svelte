<!--suppress ES6UnusedImports -->
<script lang="ts">
    import {enhance} from '$app/forms';
    import {goto} from '$app/navigation';
    import type {ActionResult} from '@sveltejs/kit';

    import {t, locale} from '$lib/i18n';

    import LocalizedField from './LocalizedField.svelte';

    import {Button, buttonVariants} from '$lib/components/ui/button/index.js';
    import {Input} from '$lib/components/ui/input/index.js';
    import {Label} from '$lib/components/ui/label/index.js';
    import {Badge} from '$lib/components/ui/badge/index.js';

    import {toast} from 'svelte-sonner';

    import SaveIcon from '@lucide/svelte/icons/save';
    import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
    import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
    import Loader2Icon from '@lucide/svelte/icons/loader-2';
    import ImageIcon from '@lucide/svelte/icons/image';
    import LanguagesIcon from '@lucide/svelte/icons/languages';
    import LinkIcon from '@lucide/svelte/icons/link';

    import {cn} from '$lib/utils.js';

    type Lang = 'el' | 'de';
    type FormMode = 'create' | 'edit';

    type LinkPayload = {
        name: Record<Lang, string>;
        descriptionHtml: Record<Lang, string>;
        url: string;
        logo: string;
        logoVariants: {
            webp: string;
            jpg: string;
        };
    };

    type LinkItem = LinkPayload & {
        id?: number;
        createdAt?: string;
        updatedAt?: string;
    };

    type ActionResponse = {
        ok?: boolean;
        id?: number;
        errorKey?: string;
        message?: string;
    };

    let {
        mode = 'create',
        submitTo = '?/save',
        initialItem = null
    }: {
        mode?: FormMode;
        submitTo?: string;
        initialItem?: LinkItem | null;
    } = $props();

    const id = $props.id();

    let saving = $state(false);
    let logoPreview = $state('');
    let logoFileName = $state('');

    let link = $state<LinkPayload>({
        name: {
            el: '',
            de: ''
        },
        descriptionHtml: {
            el: '',
            de: ''
        },
        url: '',
        logo: '',
        logoVariants: {
            webp: '',
            jpg: ''
        }
    });

    const lang = $derived(($locale || 'el') as Lang);

    const controlClass =
        'h-10 rounded-xl border border-slate-300 bg-white shadow-sm focus-visible:border-primary focus-visible:ring-primary/25';

    function text(key: string, fallback: string) {
        const value = $t(key);
        return value === key ? fallback : value;
    }

    function cloneInitial(source: LinkItem | null): LinkPayload {
        return {
            name: {
                el: source?.name?.el || '',
                de: source?.name?.de || ''
            },
            descriptionHtml: {
                el: source?.descriptionHtml?.el || '',
                de: source?.descriptionHtml?.de || ''
            },
            url: source?.url || '',
            logo: source?.logo || '',
            logoVariants: {
                webp: source?.logoVariants?.webp || '',
                jpg: source?.logoVariants?.jpg || ''
            }
        };
    }

    function currentLogo() {
        return logoPreview || link.logoVariants.webp || link.logo || link.logoVariants.jpg || '';
    }

    function visibleName() {
        return link.name[lang] || link.name.el || link.name.de || '';
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

    function onLogoChange(event: Event) {
        const input = event.currentTarget as HTMLInputElement;
        const file = input.files?.[0];

        if (logoPreview && logoPreview.startsWith('blob:')) {
            URL.revokeObjectURL(logoPreview);
        }

        logoPreview = file ? URL.createObjectURL(file) : '';
        logoFileName = file?.name || '';
    }

    function payload() {
        return {
            ...link,
            name: {
                el: link.name.el.trim(),
                de: link.name.de.trim()
            },
            descriptionHtml: {
                el: link.descriptionHtml.el,
                de: link.descriptionHtml.de
            },
            url: link.url.trim()
        };
    }

    type EnhanceUpdate = (options?: {
        reset?: boolean;
        invalidateAll?: boolean;
    }) => Promise<void>;

    type EnhanceResult = {
        result: ActionResult;
        update: EnhanceUpdate;
    };

    const submitEnhance = ({formData}: {formData: FormData}) => {
        saving = true;

        formData.set('payload', JSON.stringify(payload()));

        return async ({result, update}: EnhanceResult) => {
            saving = false;

            if (result.type === 'success') {
                const resultData = result.data as ActionResponse | undefined;

                toast.success(
                    text(
                        mode === 'edit'
                            ? 'admin.links.toast.updated'
                            : 'admin.links.toast.created',
                        mode === 'edit' ? 'Link updated' : 'Link created'
                    ),
                    {
                        description: resultData?.id ? `ID: ${resultData.id}` : visibleName()
                    }
                );

                await update({
                    reset: false,
                    invalidateAll: true
                });

                await goto('/admin/links');
                return;
            }

            if (result.type === 'failure') {
                const message =
                    actionMessage(result.data) ||
                    text('admin.links.toast.saveFailed', 'The link could not be saved.');

                toast.error(text('admin.links.toast.saveFailed', 'The link could not be saved.'), {
                    description: message
                });

                await update({
                    reset: false
                });

                return;
            }

            if (result.type === 'error') {
                toast.error(text('admin.links.toast.saveFailed', 'The link could not be saved.'));
                return;
            }

            await update({
                reset: false
            });
        };
    };

    $effect(() => {
        link = cloneInitial(initialItem);
        logoPreview = '';
        logoFileName = '';
    });
</script>

<div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
    <div>
        <h1 class="text-2xl font-bold tracking-tight">
            {$t(mode === 'edit' ? 'admin.links.editTitle' : 'admin.links.createTitle')}
        </h1>

        <p class="mt-1 text-sm text-slate-500">
            {$t('admin.links.form.subtitle')}
        </p>
    </div>

    <a href="/admin/links" class={cn(buttonVariants({variant: 'outline'}), 'rounded-xl')}>
        <ArrowLeftIcon class="mr-2 size-4" />
        {$t('admin.links.backToList')}
    </a>
</div>

<form
    method="POST"
    enctype="multipart/form-data"
    action={submitTo}
    use:enhance={submitEnhance}
    class="grid gap-6"
>
    <input type="hidden" name="name_el" value={link.name.el} />
    <input type="hidden" name="name_de" value={link.name.de} />
    <input type="hidden" name="description_html_el" value={link.descriptionHtml.el} />
    <input type="hidden" name="description_html_de" value={link.descriptionHtml.de} />

    <div class="grid gap-6 lg:grid-cols-[1fr_18rem]">
        <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div class="mb-5 flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h2 class="flex items-center gap-2 font-semibold text-slate-900">
                        <LanguagesIcon class="size-4 text-primary" />
                        {$t('admin.links.form.content')}
                    </h2>

                    <p class="mt-1 text-sm text-slate-500">
                        {$t('admin.links.form.languageHint')}
                    </p>
                </div>

                <Badge variant="secondary" class="w-fit">
                    {lang.toUpperCase()}
                </Badge>
            </div>

            <div class="grid gap-5">
                <LocalizedField
                    label={$t('admin.links.form.name')}
                    bind:value={link.name}
                    {lang}
                    required={lang === 'el'}
                    maxLength={160}
                    placeholder={$t('admin.links.form.namePlaceholder')}
                />

                <LocalizedField
                    label={$t('admin.links.form.description')}
                    bind:value={link.descriptionHtml}
                    {lang}
                    textarea
                    maxLength={1600}
                    placeholder={$t('admin.links.form.descriptionPlaceholder')}
                />

                <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div class="space-y-1.5">
                        <Label for={`${id}-url`} class="flex items-center gap-2">
                            <LinkIcon class="size-4 text-primary" />
                            {$t('admin.links.form.url')}
                        </Label>

                        <div class="flex gap-2">
                            <Input
                                id={`${id}-url`}
                                name="url"
                                type="url"
                                bind:value={link.url}
                                class={controlClass}
                                placeholder="https://example.com"
                                required
                            />

                            {#if link.url}
                                <a
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    class={cn(buttonVariants({variant: 'outline', size: 'icon'}), 'size-10 rounded-xl')}
                                    title={$t('admin.links.form.openUrl')}
                                    aria-label={$t('admin.links.form.openUrl')}
                                >
                                    <ExternalLinkIcon class="size-4" />
                                </a>
                            {/if}
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <aside class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 class="font-semibold text-slate-900">
                {$t('admin.links.form.logo')}
            </h2>

            <p class="mt-1 text-sm text-slate-500">
                {$t('admin.links.form.logoHelp')}
            </p>

            <div class="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4">
                {#if currentLogo()}
                    <img
                        src={currentLogo()}
                        alt={visibleName() || $t('admin.links.form.logo')}
                        class="mx-auto size-32 rounded-xl bg-white object-contain p-2 shadow-sm"
                    />
                {:else}
                    <div class="mx-auto flex size-32 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm">
                        <ImageIcon class="size-8" />
                    </div>
                {/if}
            </div>

            {#if logoFileName}
                <p class="mt-2 truncate text-xs text-slate-500">
                    {logoFileName}
                </p>
            {/if}

            <div class="mt-4 space-y-1.5">
                <Label for={`${id}-logo`}>
                    {$t(mode === 'edit' ? 'admin.links.form.replaceLogo' : 'admin.links.form.uploadLogo')}
                </Label>

                <Input
                    id={`${id}-logo`}
                    name="logo"
                    type="file"
                    accept="image/*"
                    class="rounded-xl"
                    onchange={onLogoChange}
                />

                <p class="text-xs text-slate-500">
                    {$t('admin.links.form.logoStorageHelp')}
                </p>
            </div>
        </aside>
    </div>

    <div class="flex flex-wrap items-center justify-end gap-3">
        <a href="/admin/links" class={cn(buttonVariants({variant: 'outline'}), 'rounded-xl')}>
            {$t('common.cancel')}
        </a>

        <Button type="submit" class="rounded-xl" disabled={saving}>
            {#if saving}
                <Loader2Icon class="mr-2 size-4 animate-spin" />
                {$t('admin.links.form.saving')}
            {:else}
                <SaveIcon class="mr-2 size-4" />
                {$t('admin.links.form.save')}
            {/if}
        </Button>
    </div>
</form>
