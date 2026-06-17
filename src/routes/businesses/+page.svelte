<script lang="ts">
    import {locale, t} from '$lib/i18n';
    import type {Lang, SponsorType, StoredBusiness} from '$lib/cms/business/types';

    type PageData = {
        businesses: StoredBusiness[];
    };

    let {data}: { data: PageData } = $props();

    const lang = $derived(($locale || 'el') as Lang);
    const businesses = $derived(data.businesses ?? []);

    const sponsorOrder: SponsorType[] = ['gold', 'silver', 'bronze', 'listed'];

    const sponsorFallbacks: Record<SponsorType, string> = {
        gold: 'Gold sponsor',
        silver: 'Silver sponsor',
        bronze: 'Bronze sponsor',
        listed: 'Listed business'
    };

    const groupedBusinesses = $derived(
        sponsorOrder
            .map((type) => ({
                type,
                items: businesses.filter((business) => business.sponsorType === type)
            }))
            .filter((group) => group.items.length > 0)
    );

    function localizedHtml(value?: Partial<Record<Lang, string>> | null) {
        return value?.[lang] || value?.el || '';
    }

    function businessHref(slug: string) {
        return `/business/${encodeURIComponent(slug)}`;
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
</script>

<svelte:head>
    <title>{$t('businesses.headline')} - Griechischer Verein Hellas</title>
    <meta
            name="description"
            content={$t('businesses.subtitle')}
    />
</svelte:head>

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

{#if groupedBusinesses.length > 0}
    <div class="grid gap-10">
        {#each groupedBusinesses as group (group.type)}
            <section>
                <div class="mb-4 flex items-center gap-3">
                    <h2 class="text-xl font-bold text-slate-950">
                        {sponsorLabel(group.type)}
                    </h2>

                    <span class={`rounded-full border px-3 py-1 text-xs font-bold ${sponsorClass(group.type)}`}>
                        {group.items.length}
                    </span>
                </div>

                <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {#each group.items as business (business.id)}
                        <article class="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                            <a href={businessHref(business.slug)} class="block p-5">
                                <div class="flex items-start gap-4">
                                    <div class="flex size-20 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
                                        {#if business.logo}
                                            <img
                                                    src={business.logo}
                                                    alt={business.name}
                                                    class="max-h-full max-w-full rounded-xl object-contain"
                                                    loading="lazy"
                                            />
                                        {:else}
                                            <span class="text-3xl font-black text-slate-300">
                                                {business.name.slice(0, 1)}
                                            </span>
                                        {/if}
                                    </div>

                                    <div class="min-w-0">
                                        <div class={`mb-2 inline-flex rounded-full border px-2.5 py-1 text-[0.7rem] font-bold uppercase tracking-wide ${sponsorClass(business.sponsorType)}`}>
                                            {sponsorLabel(business.sponsorType)}
                                        </div>

                                        <h3 class="truncate text-lg font-bold text-slate-950 group-hover:text-primary">
                                            {business.name}
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
        {/each}
    </div>
{:else}
    <div class="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
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