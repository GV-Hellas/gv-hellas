<script lang="ts">
    import {locale, t} from '$lib/i18n';
    import type {BusinessMedia, Lang, StoredBusiness} from '$lib/cms/business/types';

    type PageData = {
        business: StoredBusiness;
    };

    let {data}: {data: PageData} = $props();

    const lang = $derived(($locale || 'el') as Lang);
    const business = $derived(data.business);

    function html(value: Record<Lang, string>) {
        return value?.[lang] || value?.el || '';
    }

    function sponsorLabel(type: string) {
        return $t(`admin.businesses.sponsorTypes.${type}`);
    }

    function isImage(media: BusinessMedia) {
        return media.mimeType?.startsWith('image/') || media.type === 'image';
    }

    function isVideo(media: BusinessMedia) {
        return media.mimeType?.startsWith('video/') || media.type === 'video';
    }
</script>

<svelte:head>
    <title>{business.name} | Griechischer Verein Hellas</title>
    <meta name="description" content={business.name} />
</svelte:head>

<article class="mx-auto max-w-5xl py-10">
    <header class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div class="grid gap-8 p-6 md:grid-cols-[10rem_1fr] md:p-8">
            <div class="flex size-40 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
                {#if business.logo}
                    <img
                            src={business.logo}
                            alt={business.name}
                            class="max-h-full max-w-full rounded-xl object-contain"
                    />
                {:else}
                    <span class="text-4xl font-black text-slate-300">
                        {business.name.slice(0, 1)}
                    </span>
                {/if}
            </div>

            <div>
                <div class="mb-3 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-600">
                    {sponsorLabel(business.sponsorType)}
                </div>

                <h1 class="text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
                    {business.name}
                </h1>

                {#if html(business.description)}
                    <div class="prose prose-slate mt-4 max-w-none">
                        {@html html(business.description)}
                    </div>
                {/if}

                <dl class="mt-6 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                    {#if business.url}
                        <div>
                            <dt class="font-bold text-slate-900">Website</dt>
                            <dd>
                                <a
                                        href={business.url}
                                        target="_blank"
                                        rel="noopener"
                                        class="text-primary-dark hover:underline"
                                >
                                    {business.url}
                                </a>
                            </dd>
                        </div>
                    {/if}

                    {#if business.email}
                        <div>
                            <dt class="font-bold text-slate-900">Email</dt>
                            <dd>
                                <a
                                        href={`mailto:${business.email}`}
                                        class="text-primary-dark hover:underline"
                                >
                                    {business.email}
                                </a>
                            </dd>
                        </div>
                    {/if}

                    {#if business.telephone}
                        <div>
                            <dt class="font-bold text-slate-900">Telephone</dt>
                            <dd>
                                <a
                                        href={`tel:${business.telephone}`}
                                        class="text-primary-dark hover:underline"
                                >
                                    {business.telephone}
                                </a>
                            </dd>
                        </div>
                    {/if}

                    {#if business.contactPerson}
                        <div>
                            <dt class="font-bold text-slate-900">Contact</dt>
                            <dd>{business.contactPerson}</dd>
                        </div>
                    {/if}
                </dl>
            </div>
        </div>
    </header>

    {#if business.sections.length > 0}
        <div class="mt-8 grid gap-8">
            {#each business.sections as section}
                <section class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
                    {#if html(section.beforeHtml)}
                        <div class="prose prose-slate max-w-none">
                            {@html html(section.beforeHtml)}
                        </div>
                    {/if}

                    {#if section.media.length > 0}
                        <div class="my-6 grid gap-4 md:grid-cols-2">
                            {#each section.media as media}
                                {#if media.url}
                                    <figure class="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                                        {#if isImage(media)}
                                            <img
                                                    src={media.url}
                                                    alt={html(media.alt ?? {el: business.name, de: business.name})}
                                                    class="h-full w-full object-cover"
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
                                {/if}
                            {/each}
                        </div>
                    {/if}

                    {#if html(section.afterHtml)}
                        <div class="prose prose-slate max-w-none">
                            {@html html(section.afterHtml)}
                        </div>
                    {/if}
                </section>
            {/each}
        </div>
    {/if}
</article>