<script lang="ts">
    import {t, locale} from '$lib/i18n';
    import Seo from '$lib/components/Seo.svelte';
    import EquipmentContent from '$lib/components/EquipmentContent.svelte';
    import EquipmentInquiryDialog from '$lib/components/EquipmentInquiryDialog.svelte';
    import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
    import type {Lang, StoredEquipment} from '$lib/cms/equipment/types';

    let {data}: {data: {item: StoredEquipment}} = $props();

    const lang = $derived(($locale || 'el') as Lang);
    const item = $derived(data.item);

    function titleOf() {
        return item.title?.[lang] || item.title?.el || item.title?.de || '';
    }

    function descriptionOf() {
        return item.description?.[lang] || item.description?.el || item.description?.de || '';
    }

    function formatPrice(value: number) {
        return new Intl.NumberFormat(lang === 'de' ? 'de-CH' : 'el-GR', {
            style: 'currency',
            currency: 'CHF',
            minimumFractionDigits: Number.isInteger(Number(value)) ? 0 : 2,
            maximumFractionDigits: 2
        }).format(Number(value || 0));
    }

    const pageTitle = $derived(titleOf() || $t('equipment.headline'));
    const pageDescription = $derived(descriptionOf() || $t('equipment.description'));
</script>

<Seo title={pageTitle} description={pageDescription} />

<article class="mx-auto max-w-5xl">
    <a href="/equipment" class="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
        <ArrowLeftIcon class="size-4" />
        {$t('equipment.back')}
    </a>

    <header class="mt-6 grid gap-6 border-b border-slate-300 pb-8 md:grid-cols-[1fr_auto] md:items-end">
        <div>
            <p class="text-sm font-bold uppercase tracking-[0.18em] text-primary">{$t('equipment.eyebrow')}</p>
            <h1 class="mt-3 text-4xl font-black tracking-tight text-slate-950 md:text-5xl">{titleOf()}</h1>
            {#if descriptionOf()}
                <p class="mt-4 max-w-3xl text-lg leading-8 text-slate-600">{descriptionOf()}</p>
            {/if}
        </div>

        <div class="border-l-2 border-primary/35 pl-5">
            <div class="text-3xl font-black text-primary">{formatPrice(item.pricePerDay)}</div>
            <div class="mt-1 text-sm font-semibold text-slate-500">{$t('equipment.perDay')}</div>
            <div class="mt-4">
                <EquipmentInquiryDialog
                    equipmentSlug={item.slug}
                    equipmentTitle={titleOf()}
                    buttonClass="rounded-md"
                />
            </div>
        </div>
    </header>

    <div class="py-8">
        <EquipmentContent sections={item.sections} {lang} fallbackAlt={titleOf()} />
    </div>
</article>
