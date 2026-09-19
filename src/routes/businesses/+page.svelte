<script lang="ts">
    import {locale, t} from '$lib/i18n';
    import type {Lang, StoredBusiness} from '$lib/cms/business/types';
    import Seo from '$lib/components/Seo.svelte';

    type PageData = {
        businesses: StoredBusiness[];
    };

    let {data}: { data: PageData } = $props();

    const lang = $derived(($locale || 'el') as Lang);
    const businesses = $derived(data.businesses ?? []);
    const mainSponsor = $derived(businesses.find((business) => business.sponsorType === 'main') ?? null);
    const sponsors = $derived(businesses.filter((business) => business.sponsorType === 'sponsor'));

    function localizedHtml(value?: Partial<Record<Lang, string>> | null) {
        return value?.[lang] || value?.el || '';
    }

    function businessHref(slug: string) {
        return `/businesses/${encodeURIComponent(slug)}`;
    }

    function businessName(business: StoredBusiness) {
        return business?.name?.trim() || business?.slug?.trim() || $t('businesses.detail.unnamed');
    }

    function businessInitial(business: StoredBusiness) {
        return businessName(business).slice(0, 1).toUpperCase() || '—';
    }
</script>

<Seo title={$t('businesses.headline')} description={$t('businesses.subtitle')} />

<div class="mb-10 max-w-3xl">
    <p class="text-sm font-bold uppercase tracking-[0.18em] text-primary">
        {$t('businesses.eyebrow')}
    </p>

    <h1 class="mb-4 text-3xl font-bold">
        {$t('businesses.headline')}
    </h1>

    <p class="mt-3 text-lg text-slate-600">
        {$t('businesses.subtitle')}
    </p>
</div>

{#if mainSponsor || sponsors.length > 0}
    <div class="grid gap-12">
        {#if mainSponsor}
            <section>
                <div class="mb-4 border-b border-primary/25 pb-2">
                    <h2 class="text-xl font-bold text-slate-950">
                        {$t('admin.businesses.sponsorTypes.main')}
                    </h2>
                </div>

                <article class="group border-y border-primary/25 bg-primary/[0.025] transition hover:bg-primary/[0.05]">
                    <a href={businessHref(mainSponsor.slug)} class="grid gap-6 px-4 py-7 md:grid-cols-[14rem_minmax(0,1fr)] md:items-center md:px-7">
                        <div class="flex h-36 items-center justify-center">
                            {#if mainSponsor.logo}
                                <img
                                    src={mainSponsor.logo}
                                    alt={businessName(mainSponsor)}
                                    class="max-h-full max-w-full object-contain"
                                    loading="lazy"
                                />
                            {:else}
                                <span class="text-6xl font-black text-slate-300">
                                    {businessInitial(mainSponsor)}
                                </span>
                            {/if}
                        </div>

                        <div class="min-w-0">
                            <h3 class="text-2xl font-black text-slate-950 group-hover:text-primary">
                                {businessName(mainSponsor)}
                            </h3>

                            {#if mainSponsor.url}
                                <p class="mt-1 truncate text-sm text-slate-500">
                                    {mainSponsor.url}
                                </p>
                            {/if}

                            {#if localizedHtml(mainSponsor.description)}
                                <div class="description-preview mt-4 max-w-3xl text-sm leading-6 text-slate-600">
                                    {@html localizedHtml(mainSponsor.description)}
                                </div>
                            {/if}

                            <div class="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                                <span>{$t('businesses.viewProfile')}</span>
                                <span class="transition group-hover:translate-x-1">→</span>
                            </div>
                        </div>
                    </a>
                </article>
            </section>
        {/if}

        {#if sponsors.length > 0}
            <section>
                <div class="mb-4 border-b border-slate-200 pb-2">
                    <h2 class="text-xl font-bold text-slate-950">
                        {$t('admin.businesses.sponsorTypes.sponsor')}
                    </h2>
                </div>

                <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {#each sponsors as business (business.id)}
                        <article class="group overflow-hidden border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                            <a href={businessHref(business.slug)} class="block p-5">
                                <div class="flex items-start gap-4">
                                    <div class="flex size-20 shrink-0 items-center justify-center">
                                        {#if business.logo}
                                            <img
                                                src={business.logo}
                                                alt={businessName(business)}
                                                class="max-h-full max-w-full object-contain"
                                                loading="lazy"
                                            />
                                        {:else}
                                            <span class="text-3xl font-black text-slate-300">
                                                {businessInitial(business)}
                                            </span>
                                        {/if}
                                    </div>

                                    <div class="min-w-0">
                                        <h3 class="truncate text-lg font-bold text-slate-950 group-hover:text-primary">
                                            {businessName(business)}
                                        </h3>

                                        {#if business.url}
                                            <p class="mt-1 truncate text-sm text-slate-500">
                                                {business.url}
                                            </p>
                                        {/if}
                                    </div>
                                </div>

                                {#if localizedHtml(business.description)}
                                    <div class="description-preview mt-4 text-sm leading-6 text-slate-600">
                                        {@html localizedHtml(business.description)}
                                    </div>
                                {/if}

                                <div class="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                                    <span class="text-sm font-semibold text-primary">
                                        {$t('businesses.viewProfile')}
                                    </span>

                                    <span class="text-primary transition group-hover:translate-x-1">
                                        →
                                    </span>
                                </div>
                            </a>
                        </article>
                    {/each}
                </div>
            </section>
        {/if}
    </div>
{:else}
    <div class="border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
        {$t('businesses.empty')}
    </div>
{/if}

<style>
    .description-preview {
        display: -webkit-box;
        overflow: hidden;
        -webkit-line-clamp: 4;
        -webkit-box-orient: vertical;
    }

    .description-preview :global(p) {
        margin: 0;
    }

    .description-preview :global(p + p) {
        margin-top: .5rem;
    }

    .description-preview :global(a) {
        color: hsl(var(--primary));
        font-weight: 600;
    }
</style>
