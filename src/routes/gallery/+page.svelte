<script lang="ts">
    import {t, locale} from '$lib/i18n';
    import MediaSkeleton from '$lib/components/MediaSkeleton.svelte';

    type GalleryItem = {
        id: string;
        type: 'image' | 'video';
        src480: string;
        src960: string;
        videoSrc: string;
        alt: string;
        tags: string[];
        width: number | null;
        height: number | null;
    };

    type Lang = 'el' | 'de';

    let {data}: { data?: { items?: GalleryItem[] } } = $props();

    let lang = $derived((($locale === 'de' ? 'de' : 'el') as Lang));

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
            ].filter(Boolean) as Array<{ src: string; width: number }>
        };
    }

    let items = $derived((data?.items ?? []).filter((item) => Boolean(mediaSrc(item))));

    let tags = $derived(
        Array.from(new Set(items.flatMap((item) => item.tags ?? [])))
            .filter(Boolean)
            .sort((a, b) => a.localeCompare(b))
    );

    let activeTag = $state('all');

    let filtered = $derived(
        activeTag === 'all'
            ? items
            : items.filter((item) => (item.tags ?? []).includes(activeTag))
    );

    let selected = $state<GalleryItem | null>(null);
    let fullReady = $state(false);
    let fullError = $state(false);

    function label(item: GalleryItem) {
        return item.alt || item.id;
    }

    function clearFilterIfMissing() {
        if (activeTag !== 'all' && !tags.includes(activeTag)) {
            activeTag = 'all';
        }
    }

    function openItem(item: GalleryItem) {
        selected = item;
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
        if (!selected) return;

        if (event.key === 'Escape') {
            closeLightbox();
        }

        if (event.key === 'ArrowRight') {
            nextItem();
        }

        if (event.key === 'ArrowLeft') {
            previousItem();
        }
    }

    $effect(clearFilterIfMissing);

    $effect(() => {
        if (selected) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
    });
</script>

<svelte:window onkeydown={onKeydown}/>

<svelte:head>
    <title>{$t('gallery.headline')} - Griechischer Verein Hellas</title>
</svelte:head>

<section class="mx-auto max-w-6xl">
    <header class="mb-6">
        <h1 class="text-3xl font-bold">
            {$t('gallery.headline')}
        </h1>

        {#if items.length}
            <p class="mt-2 text-sm text-slate-500">
                {items.length} media item{items.length === 1 ? '' : 's'}
            </p>
        {/if}
    </header>

    {#if tags.length}
        <div class="mb-6 flex flex-wrap gap-2">
            <button
                    type="button"
                    class={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                    activeTag === 'all'
                        ? 'bg-primary text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
                    onclick={() => (activeTag = 'all')}
            >
                {lang === 'de' ? 'Alle' : 'Όλα'}
            </button>

            {#each tags as tag}
                <button
                        type="button"
                        class={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                        activeTag === tag
                            ? 'bg-primary text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                        onclick={() => (activeTag = tag)}
                >
                    {tag}
                </button>
            {/each}
        </div>
    {/if}

    {#if filtered.length}
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {#each filtered as item (item.id)}
                <article class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <button
                            type="button"
                            class="group block w-full text-left"
                            onclick={() => openItem(item)}
                            aria-label={`Open ${label(item)}`}
                    >
                        {#if item.type === 'video'}
                            <div class="relative">
                                <MediaSkeleton
                                        type="video"
                                        src={item.videoSrc}
                                        containerClass="bg-black"
                                        mediaClass="aspect-video bg-black object-contain"
                                />

                                <div class="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20 text-white opacity-100 transition group-hover:bg-black/30">
                                    <span class="rounded-full bg-black/60 px-3 py-1 text-sm font-semibold">
                                        Video
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

                    {#if label(item) || item.tags?.length}
                        <div class="p-3">
                            {#if label(item)}
                                <p class="text-sm font-medium text-slate-800">
                                    {label(item)}
                                </p>
                            {/if}

                            {#if item.tags?.length}
                                <div class="mt-2 flex flex-wrap gap-1.5">
                                    {#each item.tags as tag}
                                        <button
                                                type="button"
                                                class="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-200"
                                                onclick={() => (activeTag = tag)}
                                        >
                                            {tag}
                                        </button>
                                    {/each}
                                </div>
                            {/if}
                        </div>
                    {/if}
                </article>
            {/each}
        </div>
    {:else}
        <div class="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
            <p class="text-slate-600">
                {activeTag === 'all'
                    ? lang === 'de'
                        ? 'Noch keine Medien vorhanden.'
                        : 'Δεν υπάρχει ακόμα υλικό.'
                    : lang === 'de'
                        ? 'Keine Medien für diesen Filter.'
                        : 'Δεν υπάρχει υλικό για αυτό το φίλτρο.'}
            </p>

            {#if activeTag !== 'all'}
                <button
                        type="button"
                        class="mt-4 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white"
                        onclick={() => (activeTag = 'all')}
                >
                    {lang === 'de' ? 'Filter zurücksetzen' : 'Καθαρισμός φίλτρου'}
                </button>
            {/if}
        </div>
    {/if}
</section>

{#if selected}
    <div
            class="fixed inset-0 z-9999 bg-black text-white"
            role="dialog"
            aria-modal="true"
            aria-label={label(selected)}
    >
        {#if selected.type === 'image'}
            <div
                    class="absolute inset-0 bg-cover bg-center opacity-35 blur-2xl scale-110"
                    style={`background-image: url('${fullSrc(selected)}')`}
                    aria-hidden="true"
            ></div>
        {/if}

        <div class="absolute inset-0 bg-black/70" aria-hidden="true"></div>

        <button
                type="button"
                class="absolute right-4 top-4 z-30 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur hover:bg-white/20"
                onclick={closeLightbox}
        >
            {lang === 'de' ? 'Schliessen' : 'Κλείσιμο'}
        </button>

        {#if filtered.length > 1}
            <button
                    type="button"
                    class="absolute left-4 top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-2xl backdrop-blur hover:bg-white/20"
                    onclick={previousItem}
                    aria-label="Previous image"
            >
                ‹
            </button>

            <button
                    type="button"
                    class="absolute right-4 top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-2xl backdrop-blur hover:bg-white/20"
                    onclick={nextItem}
                    aria-label="Next image"
            >
                ›
            </button>
        {/if}

        <div class="relative z-20 flex h-full w-full items-center justify-center p-4 sm:p-8">
            {#if selected.type === 'image'}
                {#if !fullReady}
                    <div class="flex flex-col items-center gap-3">
                        <div class="h-10 w-10 animate-spin rounded-full border-4 border-white/30 border-t-white"></div>
                        <p class="text-sm text-white/80">
                            {lang === 'de' ? 'Bild wird geladen…' : 'Φόρτωση εικόνας…'}
                        </p>
                    </div>
                {:else if fullError}
                    <div class="rounded-xl bg-white/10 p-6 text-center backdrop-blur">
                        <p class="font-semibold">
                            {lang === 'de'
                                ? 'Bild konnte nicht geladen werden.'
                                : 'Δεν ήταν δυνατή η φόρτωση της εικόνας.'}
                        </p>
                    </div>
                {:else}
                    <img
                            src={fullSrc(selected)}
                            alt={label(selected)}
                            class="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
                    />
                {/if}
            {:else}
                <!-- svelte-ignore a11y_media_has_caption -->
                <video
                        src={selected.videoSrc}
                        class="max-h-full max-w-full rounded-lg bg-black shadow-2xl"
                        controls
                        autoplay
                        playsinline
                />
            {/if}
        </div>

        {#if label(selected)}
            <div class="absolute bottom-0 left-0 right-0 z-30 bg-linear-to-t from-black/90 to-transparent p-4 text-center">
                <p class="text-sm text-white/90">
                    {label(selected)}
                </p>
            </div>
        {/if}
    </div>
{/if}