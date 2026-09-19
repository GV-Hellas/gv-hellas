<script lang="ts">
    import {t, locale} from '$lib/i18n';
    import Seo from '$lib/components/Seo.svelte';
    import EquipmentInquiryDialog from '$lib/components/EquipmentInquiryDialog.svelte';
    import PackageIcon from '@lucide/svelte/icons/package';
    import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
    import type {Lang, StoredEquipment} from '$lib/cms/equipment/types';

    let {data}: {data: {equipment: StoredEquipment[]}} = $props();

    const lang = $derived(($locale || 'el') as Lang);

    function titleOf(item: StoredEquipment) {
        return item.title?.[lang] || item.title?.el || item.title?.de || '';
    }

    function descriptionOf(item: StoredEquipment) {
        return item.description?.[lang] || item.description?.el || item.description?.de || '';
    }

    function firstImage(item: StoredEquipment) {
        for (const section of item.sections || []) {
            const image = section.media?.find((media) => media.type === 'image' && media.url);
            if (image?.url) return image.url;
        }
        return '';
    }

    function formatPrice(value: number) {
        return new Intl.NumberFormat(lang === 'de' ? 'de-CH' : 'el-GR', {
            style: 'currency',
            currency: 'CHF',
            minimumFractionDigits: Number.isInteger(Number(value)) ? 0 : 2,
            maximumFractionDigits: 2
        }).format(Number(value || 0));
    }

    const seoDescription = $derived($t('equipment.description'));
</script>

<Seo title={$t('equipment.headline')} description={seoDescription} />

<header class="border-b-2 border-primary/30 pb-8 pt-3 md:pb-10 md:pt-6">
    <p class="text-sm font-bold uppercase tracking-[0.18em] text-primary">{$t('equipment.eyebrow')}</p>
    <h1 class="mt-3 text-4xl font-black tracking-tight text-slate-950 md:text-5xl">{$t('equipment.headline')}</h1>
    <p class="mt-4 max-w-3xl text-lg leading-8 text-slate-600">{$t('equipment.description')}</p>
</header>

{#if data.equipment.length > 0}
    <div class="divide-y divide-slate-200">
        {#each data.equipment as item (item.id)}
            <article class="grid gap-6 py-8 md:grid-cols-[15rem_1fr] md:items-center">
                <a href={`/equipment/${encodeURIComponent(item.slug)}`} class="block overflow-hidden bg-slate-100">
                    {#if firstImage(item)}
                        <img
                            src={firstImage(item)}
                            alt={titleOf(item)}
                            class="aspect-[4/3] w-full object-cover transition duration-300 hover:scale-[1.02]"
                            loading="lazy"
                        />
                    {:else}
                        <div class="flex aspect-[4/3] items-center justify-center text-slate-400">
                            <PackageIcon class="size-12" />
                        </div>
                    {/if}
                </a>

                <div class="min-w-0">
                    <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div class="min-w-0">
                            <h2 class="text-2xl font-bold text-slate-950">
                                <a href={`/equipment/${encodeURIComponent(item.slug)}`} class="hover:text-primary">
                                    {titleOf(item)}
                                </a>
                            </h2>

                            {#if descriptionOf(item)}
                                <p class="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{descriptionOf(item)}</p>
                            {/if}
                        </div>

                        <div class="shrink-0 border-l-2 border-primary/30 pl-4">
                            <div class="text-xl font-black text-primary">{formatPrice(item.pricePerDay)}</div>
                            <div class="text-xs font-semibold text-slate-500">{$t('equipment.perDay')}</div>
                        </div>
                    </div>

                    <div class="mt-5 flex flex-wrap items-center gap-3">
                        <a
                            href={`/equipment/${encodeURIComponent(item.slug)}`}
                            class="inline-flex h-10 items-center gap-2 border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                        >
                            {$t('equipment.details')}
                            <ArrowRightIcon class="size-4" />
                        </a>

                        <EquipmentInquiryDialog
                            equipmentSlug={item.slug}
                            equipmentTitle={titleOf(item)}
                            buttonClass="rounded-md"
                        />
                    </div>
                </div>
            </article>
        {/each}
    </div>
{:else}
    <div class="py-16 text-center">
        <PackageIcon class="mx-auto size-10 text-slate-300" />
        <p class="mt-4 font-semibold text-slate-700">{$t('equipment.empty')}</p>
    </div>
{/if}
