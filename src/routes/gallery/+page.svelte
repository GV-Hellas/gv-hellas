<script lang="ts">
    import {t, locale} from '$lib/i18n';
    import MediaSkeleton from '$lib/components/MediaSkeleton.svelte';
    import Seo from '$lib/components/Seo.svelte';
    import {Switch} from '$lib/components/ui/switch/index.js';
    import * as Dialog from '$lib/components/ui/dialog/index.js';
    import type {GalleryItem, GalleryLang, GalleryLocalizedText, GalleryTag} from '$lib/cms/gallery/types';

    import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
    import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
    import PlayIcon from '@lucide/svelte/icons/play';
    import XIcon from '@lucide/svelte/icons/x';

    type YearGroup = {
        key: string;
        year: number | null;
        items: GalleryItem[];
    };

    let {data}: {data?: {items?: GalleryItem[]}} = $props();

    let lang = $derived((($locale === 'de' ? 'de' : 'el') as GalleryLang));
    const seoDescription = $derived(
        lang === 'de'
            ? 'Fotos und Videos aus Veranstaltungen und Aktivitäten des Griechischen Vereins Hellas.'
            : 'Φωτογραφίες και βίντεο από εκδηλώσεις και δράσεις του Ελληνικού Συλλόγου Hellas.'
    );

    function localized(value: GalleryLocalizedText | undefined) {
        if (!value) return '';
        return value[lang] || value.el || value.de || '';
    }

    function mediaSrc(item: GalleryItem) {
        if (item.type === 'video') return item.videoSrc;
        return item.src960 || item.src480;
    }

    function thumbSrc(item: GalleryItem) {
        if (item.type === 'video') return item.videoSrc;
        return item.src480 || item.src960;
    }

    function fullSrc(item: GalleryItem) {
        if (item.type === 'video') return item.videoSrc;
        return item.src960 || item.src480;
    }

    function imageSources(item: GalleryItem) {
        if (item.type !== 'image') return {};

        return {
            webp: [
                item.src480 ? {src: item.src480, width: 480} : null,
                item.src960 ? {src: item.src960, width: 960} : null
            ].filter(Boolean) as Array<{src: string; width: number}>
        };
    }

    function label(item: GalleryItem) {
        return localized(item.alt) || item.id;
    }

    function tagLabel(tag: GalleryTag) {
        return localized(tag.name);
    }

    function buildYearGroups(source: GalleryItem[]): YearGroup[] {
        const map = new Map<number | null, GalleryItem[]>();

        for (const item of source) {
            const key = Number.isInteger(item.year) ? item.year : null;
            const group = map.get(key) || [];
            group.push(item);
            map.set(key, group);
        }

        return [...map.entries()]
            .sort(([a], [b]) => {
                if (a === null) return 1;
                if (b === null) return -1;
                return b - a;
            })
            .map(([year, groupItems]) => ({
                key: year === null ? 'unknown' : String(year),
                year,
                items: groupItems
            }));
    }

    let items = $derived((data?.items ?? []).filter((item) => Boolean(mediaSrc(item))));

    let tags = $derived.by(() => {
        const tagMap = new Map<number, GalleryTag>();

        for (const item of items) {
            for (const tag of item.tags ?? []) {
                tagMap.set(tag.id, tag);
            }
        }

        return [...tagMap.values()].sort((a, b) =>
            tagLabel(a).localeCompare(tagLabel(b), lang === 'de' ? 'de' : 'el')
        );
    });

    let activeTagId = $state<number | 'all'>('all');
    let groupByYear = $state(true);

    let filtered = $derived(
        activeTagId === 'all'
            ? items
            : items.filter((item) => (item.tags ?? []).some((tag) => tag.id === activeTagId))
    );

    let yearGroups = $derived(buildYearGroups(filtered));

    let selected = $state<GalleryItem | null>(null);
    let lightboxOpen = $state(false);
    let fullReady = $state(false);
    let fullError = $state(false);

    function clearFilterIfMissing() {
        if (activeTagId !== 'all' && !tags.some((tag) => tag.id === activeTagId)) {
            activeTagId = 'all';
        }
    }

    function openItem(item: GalleryItem) {
        selected = item;
        lightboxOpen = true;
        fullError = false;

        if (item.type === 'video') {
            fullReady = true;
            return;
        }

        fullReady = false;

        const image = new Image();

        image.onload = () => {
            if (selected?.id === item.id) {
                fullReady = true;
            }
        };

        image.onerror = () => {
            if (selected?.id === item.id) {
                fullError = true;
                fullReady = true;
            }
        };

        image.src = fullSrc(item);
    }

    function closeLightbox() {
        lightboxOpen = false;
        selected = null;
        fullReady = false;
        fullError = false;
    }

    function nextItem() {
        if (!selected || filtered.length < 2) return;

        const index = filtered.findIndex((item) => item.id === selected?.id);
        const next = filtered[(index + 1) % filtered.length];

        if (next) openItem(next);
    }

    function previousItem() {
        if (!selected || filtered.length < 2) return;

        const index = filtered.findIndex((item) => item.id === selected?.id);
        const previous = filtered[(index - 1 + filtered.length) % filtered.length];

        if (previous) openItem(previous);
    }

    function onKeydown(event: KeyboardEvent) {
        if (!selected || !lightboxOpen) return;

        if (event.key === 'Escape') closeLightbox();
        if (event.key === 'ArrowRight') nextItem();
        if (event.key === 'ArrowLeft') previousItem();
    }

    $effect(clearFilterIfMissing);

    // Dialog.Root can close itself (Escape, overlay click). Keep the selected
    // item in sync so a closed lightbox never leaves stale modal state behind.
    $effect(() => {
        if (!lightboxOpen && selected) {
            selected = null;
            fullReady = false;
            fullError = false;
        }
    });
</script>

<svelte:window onkeydown={onKeydown} />

<Seo title={$t('gallery.headline')} description={seoDescription} />

{#snippet galleryCard(item: GalleryItem)}
    <article class="overflow-hidden border border-slate-200 bg-white shadow-sm">
        <button
            type="button"
            class="group block w-full text-left"
            onclick={() => openItem(item)}
            aria-label={`${$t('gallery.openItem')}: ${label(item)}`}
        >
            {#if item.type === 'video'}
                <div class="relative overflow-hidden bg-black">
                    <!-- svelte-ignore a11y_media_has_caption -->
                    <video
                        src={item.videoSrc}
                        class="h-64 w-full bg-black object-cover"
                        preload="metadata"
                        muted
                        playsinline
                    ></video>

                    <div class="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/25 transition group-hover:bg-black/35">
                        <span class="flex size-12 items-center justify-center rounded-full bg-black/65 text-white backdrop-blur">
                            <PlayIcon class="ml-0.5 size-5 fill-current" />
                        </span>
                    </div>
                </div>
            {:else}
                <MediaSkeleton
                    type="image"
                    src={thumbSrc(item)}
                    sources={imageSources(item)}
                    alt={label(item)}
                    containerClass="bg-slate-100"
                    mediaClass="h-64 object-cover transition duration-500 group-hover:scale-105"
                />
            {/if}
        </button>

        {#if localized(item.alt) || item.tags?.length || item.year}
            <div class="border-t border-slate-100 p-3">
                <div class="flex items-start justify-between gap-3">
                    {#if localized(item.alt)}
                        <p class="min-w-0 text-sm font-medium text-slate-800">
                            {localized(item.alt)}
                        </p>
                    {/if}

                    {#if item.year}
                        <span class="shrink-0 text-xs font-semibold tabular-nums text-slate-500">
                            {item.year}
                        </span>
                    {/if}
                </div>

                {#if item.tags?.length}
                    <div class="mt-2 flex flex-wrap gap-1.5">
                        {#each item.tags as tag (tag.id)}
                            <button
                                type="button"
                                class="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 transition hover:bg-slate-200 hover:text-slate-900"
                                onclick={() => (activeTagId = tag.id)}
                            >
                                {tagLabel(tag)}
                            </button>
                        {/each}
                    </div>
                {/if}
            </div>
        {/if}
    </article>
{/snippet}

<section class="mx-auto max-w-6xl">
    <header class="mb-6 border-b border-slate-200 pb-5">
        <h1 class="text-3xl font-bold">
            {$t('gallery.headline')}
        </h1>

        {#if items.length}
            <p class="mt-2 text-sm text-slate-500">
                {items.length}
                {$t(items.length === 1 ? 'gallery.itemSingular' : 'gallery.itemPlural')}
            </p>
        {/if}
    </header>

    <div class="mb-7 flex flex-col gap-4 border-b border-slate-100 pb-5 lg:flex-row lg:items-center lg:justify-between">
        {#if tags.length}
            <div class="flex flex-wrap gap-2">
                <button
                    type="button"
                    class={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                        activeTagId === 'all'
                            ? 'bg-primary text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                    onclick={() => (activeTagId = 'all')}
                >
                    {$t('gallery.all')}
                </button>

                {#each tags as tag (tag.id)}
                    <button
                        type="button"
                        class={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                            activeTagId === tag.id
                                ? 'bg-primary text-white'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                        onclick={() => (activeTagId = tag.id)}
                    >
                        {tagLabel(tag)}
                    </button>
                {/each}
            </div>
        {:else}
            <div></div>
        {/if}

        <label class="flex shrink-0 cursor-pointer items-center gap-3 text-sm font-medium text-slate-700">
            <Switch bind:checked={groupByYear} aria-label={$t('gallery.groupByYear')} />
            <span>{$t('gallery.groupByYear')}</span>
        </label>
    </div>

    {#if filtered.length}
        {#if groupByYear}
            <div class="space-y-10">
                {#each yearGroups as group (group.key)}
                    <section aria-labelledby={`gallery-year-${group.key}`}>
                        <div class="mb-4 flex items-baseline gap-3 border-b border-slate-200 pb-2">
                            <h2
                                id={`gallery-year-${group.key}`}
                                class="text-xl font-bold tracking-tight text-slate-900"
                            >
                                {group.year ?? $t('gallery.unknownYear')}
                            </h2>
                            <span class="text-xs text-slate-500">
                                {group.items.length}
                                {$t(group.items.length === 1 ? 'gallery.itemSingular' : 'gallery.itemPlural')}
                            </span>
                        </div>

                        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {#each group.items as item (item.id)}
                                {@render galleryCard(item)}
                            {/each}
                        </div>
                    </section>
                {/each}
            </div>
        {:else}
            <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {#each filtered as item (item.id)}
                    {@render galleryCard(item)}
                {/each}
            </div>
        {/if}
    {:else}
        <div class="border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
            <p class="text-slate-600">
                {$t(activeTagId === 'all' ? 'gallery.empty' : 'gallery.emptyFilter')}
            </p>

            {#if activeTagId !== 'all'}
                <button
                    type="button"
                    class="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"
                    onclick={() => (activeTagId = 'all')}
                >
                    {$t('gallery.clearFilter')}
                </button>
            {/if}
        </div>
    {/if}
</section>

<Dialog.Root bind:open={lightboxOpen}>
    {#if selected}
        <Dialog.Content
            showCloseButton={false}
            class="block h-[calc(100dvh-2rem)] max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-[96rem] overflow-hidden rounded-lg border border-white/10 bg-black p-0 text-white shadow-2xl sm:max-w-[96rem]"
        >
            <Dialog.Title class="sr-only">{label(selected)}</Dialog.Title>
            <Dialog.Description class="sr-only">
                {localized(selected.alt) || $t('gallery.openItem')}
            </Dialog.Description>

            <button
                type="button"
                class="absolute right-3 top-3 z-30 flex size-11 items-center justify-center rounded-full bg-black/60 text-white shadow-lg backdrop-blur transition hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                onclick={closeLightbox}
                aria-label={$t('gallery.close')}
            >
                <XIcon class="size-5" />
            </button>

            {#if filtered.length > 1}
                <button
                    type="button"
                    class="absolute left-3 top-1/2 z-30 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white shadow-lg backdrop-blur transition hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:left-5"
                    onclick={previousItem}
                    aria-label={$t('gallery.previous')}
                >
                    <ChevronLeftIcon class="size-6" />
                </button>

                <button
                    type="button"
                    class="absolute right-3 top-1/2 z-30 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white shadow-lg backdrop-blur transition hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:right-5"
                    onclick={nextItem}
                    aria-label={$t('gallery.next')}
                >
                    <ChevronRightIcon class="size-6" />
                </button>
            {/if}

            <div class="flex h-full w-full items-center justify-center p-3 pb-14 sm:p-8 sm:pb-16">
                {#if selected.type === 'image'}
                    {#if !fullReady}
                        <div class="flex flex-col items-center gap-3">
                            <div class="size-10 animate-spin rounded-full border-4 border-white/30 border-t-white"></div>
                            <p class="text-sm text-white/80">
                                {$t('gallery.loadingImage')}
                            </p>
                        </div>
                    {:else if fullError}
                        <div class="border border-white/15 bg-white/5 p-6 text-center">
                            <p class="font-semibold">
                                {$t('gallery.imageLoadFailed')}
                            </p>
                        </div>
                    {:else}
                        <img
                            src={fullSrc(selected)}
                            alt={label(selected)}
                            class="max-h-full max-w-full object-contain"
                        />
                    {/if}
                {:else}
                    <!-- svelte-ignore a11y_media_has_caption -->
                    <video
                        src={selected.videoSrc}
                        class="max-h-full max-w-full bg-black"
                        controls
                        autoplay
                        playsinline
                    ></video>
                {/if}
            </div>

            {#if localized(selected.alt)}
                <div class="pointer-events-none absolute bottom-0 left-0 right-0 z-20 bg-linear-to-t from-black via-black/85 to-transparent px-5 pb-4 pt-10 text-center">
                    <p class="text-sm text-white/90">
                        {localized(selected.alt)}
                    </p>
                </div>
            {/if}
        </Dialog.Content>
    {/if}
</Dialog.Root>
