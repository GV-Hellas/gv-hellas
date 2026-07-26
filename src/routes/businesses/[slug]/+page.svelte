<script lang="ts">
    import {locale, t} from '$lib/i18n';
    import type {BusinessMedia, BusinessSection, Lang, StoredBusiness} from '$lib/cms/business/types';

    import Building2Icon from '@lucide/svelte/icons/building-2';
    import Globe2Icon from '@lucide/svelte/icons/globe-2';
    import MailIcon from '@lucide/svelte/icons/mail';
    import PhoneIcon from '@lucide/svelte/icons/phone';
    import UserRoundIcon from '@lucide/svelte/icons/user-round';
    import InfoIcon from '@lucide/svelte/icons/info';

    type PageData = {
        business: StoredBusiness;
    };

    let {data}: {data: PageData} = $props();

    const lang = $derived(($locale || 'el') as Lang);
    const business = $derived(data.business);
    const businessName = $derived(
        business?.name?.trim() || business?.slug?.trim() || $t('businesses.detail.unnamed')
    );
    const sections = $derived(
        (business?.sections ?? []).filter((section) => sectionHasContent(section))
    );

    function text(key: string, fallback: string) {
        const value = $t(key);
        return value === key ? fallback : value;
    }

    function html(value?: Partial<Record<Lang, string>> | null) {
        return value?.[lang] || value?.el || value?.de || '';
    }

    function sponsorLabel(type?: string) {
        return text(
            `admin.businesses.sponsorTypes.${type || 'listed'}`,
            text('admin.businesses.sponsorTypes.listed', 'Listed business')
        );
    }

    function isImage(media: BusinessMedia) {
        return media?.mimeType?.startsWith('image/') || media?.type === 'image';
    }

    function isVideo(media: BusinessMedia) {
        return media?.mimeType?.startsWith('video/') || media?.type === 'video';
    }

    function mediaItems(section: BusinessSection) {
        return (section?.media ?? []).filter((media) => Boolean(media?.url));
    }

    function sectionHasContent(section: BusinessSection) {
        return Boolean(
            html(section?.beforeHtml) ||
            html(section?.afterHtml) ||
            mediaItems(section).length
        );
    }

    function plainText(value: string) {
        return value
            .replace(/<[^>]*>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function initial(value: string) {
        return value.trim().slice(0, 1).toUpperCase() || '—';
    }

    function websiteLabel(value: string) {
        try {
            return new URL(value).hostname.replace(/^www\./, '');
        } catch {
            return value;
        }
    }

    const hasContactDetails = $derived(
        Boolean(business?.url || business?.email || business?.telephone || business?.contactPerson)
    );
</script>

<svelte:head>
    <title>{businessName} | Griechischer Verein Hellas</title>
    <meta
        name="description"
        content={plainText(html(business?.description)) || text('businesses.detail.defaultDescription', businessName)}
    />
</svelte:head>

<article class="mx-auto max-w-5xl py-10">
    <header class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div class="grid gap-8 p-6 md:grid-cols-[10rem_1fr] md:p-8">
            <div class="flex size-40 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                {#if business?.logo}
                    <img
                        src={business.logo}
                        alt={businessName}
                        class="max-h-full max-w-full rounded-xl object-contain p-2"
                    />
                {:else}
                    <div class="flex size-full flex-col items-center justify-center gap-2 text-slate-300">
                        <Building2Icon class="size-9" />
                        <span class="text-4xl font-black">
                            {initial(businessName)}
                        </span>
                    </div>
                {/if}
            </div>

            <div class="min-w-0">
                <div class="mb-3 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-600">
                    {sponsorLabel(business?.sponsorType)}
                </div>

                <h1 class="break-words text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
                    {businessName}
                </h1>

                {#if html(business?.description)}
                    <div class="prose prose-slate mt-4 max-w-none">
                        {@html html(business.description)}
                    </div>
                {:else}
                    <div class="mt-4 flex max-w-2xl items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
                        <InfoIcon class="mt-0.5 size-4 shrink-0 text-primary" />
                        <p>
                            {$t('businesses.detail.defaultDescription')}
                        </p>
                    </div>
                {/if}
            </div>
        </div>
    </header>

    <section class="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div class="mb-5">
            <h2 class="text-xl font-bold text-slate-950">
                {$t('businesses.detail.contactTitle')}
            </h2>
            <p class="mt-1 text-sm text-slate-500">
                {$t('businesses.detail.contactSubtitle')}
            </p>
        </div>

        {#if hasContactDetails}
            <dl class="grid gap-4 sm:grid-cols-2">
                {#if business?.url}
                    <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <dt class="flex items-center gap-2 text-sm font-bold text-slate-900">
                            <Globe2Icon class="size-4 text-primary" />
                            {$t('businesses.detail.website')}
                        </dt>
                        <dd class="mt-2 min-w-0">
                            <a
                                href={business.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                class="block truncate text-sm font-medium text-primary hover:underline"
                                title={business.url}
                            >
                                {websiteLabel(business.url)}
                            </a>
                        </dd>
                    </div>
                {/if}

                {#if business?.email}
                    <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <dt class="flex items-center gap-2 text-sm font-bold text-slate-900">
                            <MailIcon class="size-4 text-primary" />
                            {$t('businesses.detail.email')}
                        </dt>
                        <dd class="mt-2 min-w-0">
                            <a
                                href={`mailto:${business.email}`}
                                class="block truncate text-sm font-medium text-primary hover:underline"
                                title={business.email}
                            >
                                {business.email}
                            </a>
                        </dd>
                    </div>
                {/if}

                {#if business?.telephone}
                    <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <dt class="flex items-center gap-2 text-sm font-bold text-slate-900">
                            <PhoneIcon class="size-4 text-primary" />
                            {$t('businesses.detail.telephone')}
                        </dt>
                        <dd class="mt-2">
                            <a
                                href={`tel:${business.telephone}`}
                                class="text-sm font-medium text-primary hover:underline"
                            >
                                {business.telephone}
                            </a>
                        </dd>
                    </div>
                {/if}

                {#if business?.contactPerson}
                    <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <dt class="flex items-center gap-2 text-sm font-bold text-slate-900">
                            <UserRoundIcon class="size-4 text-primary" />
                            {$t('businesses.detail.contactPerson')}
                        </dt>
                        <dd class="mt-2 text-sm text-slate-700">
                            {business.contactPerson}
                        </dd>
                    </div>
                {/if}
            </dl>
        {:else}
            <div class="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
                {$t('businesses.detail.noContactDetails')}
            </div>
        {/if}
    </section>

    {#if sections.length > 0}
        <div class="mt-8 grid gap-8">
            {#each sections as section, sectionIndex (section.id || sectionIndex)}
                <section class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
                    {#if html(section?.beforeHtml)}
                        <div class="prose prose-slate max-w-none">
                            {@html html(section.beforeHtml)}
                        </div>
                    {/if}

                    {#if mediaItems(section).length > 0}
                        <div class="my-6 grid gap-4 md:grid-cols-2">
                            {#each mediaItems(section) as media, mediaIndex (media.id || mediaIndex)}
                                <figure class="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                                    {#if isImage(media)}
                                        <img
                                            src={media.url}
                                            alt={html(media.alt) || businessName}
                                            class="h-full w-full object-cover"
                                            loading="lazy"
                                        />
                                    {:else if isVideo(media)}
                                        <!-- svelte-ignore a11y_media_has_caption -->
                                        <video
                                            src={media.url}
                                            controls
                                            class="h-full w-full bg-black"
                                        ></video>
                                    {/if}

                                    {#if media.caption && html(media.caption)}
                                        <figcaption class="px-4 py-3 text-sm text-slate-600">
                                            {@html html(media.caption)}
                                        </figcaption>
                                    {/if}
                                </figure>
                            {/each}
                        </div>
                    {/if}

                    {#if html(section?.afterHtml)}
                        <div class="prose prose-slate max-w-none">
                            {@html html(section.afterHtml)}
                        </div>
                    {/if}
                </section>
            {/each}
        </div>
    {/if}
</article>
