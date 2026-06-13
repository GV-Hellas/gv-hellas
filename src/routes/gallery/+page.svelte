<script lang="ts">
    import {t, locale} from '$lib/i18n';
    import MediaSkeleton from '$lib/components/MediaSkeleton.svelte';

    type GalleryItem = {
        id?: string;
        type?: 'image' | 'video' | 'audio';
        src?: string;
        poster?: string;
        srcVariants?: unknown;
        alt?: string | { el?: string; de?: string };
        tags?: string[];
    };

    type Lang = 'el' | 'de';

    let {data}: { data?: { items?: GalleryItem[] } } = $props();

    let lang = $derived((($locale === 'de' ? 'de' : 'el') as Lang));
    let items = $derived((data?.items ?? []).filter((item) => Boolean(item?.src)));

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

    function label(value: GalleryItem['alt']) {
        if (!value) return '';
        if (typeof value === 'string') return value;
        const key: Lang = lang === 'de' ? 'de' : 'el';
        return value[key] || value.el || value.de || '';
    }

    function typeOf(item: GalleryItem) {
        return item.type || 'image';
    }

    function clearFilterIfMissing() {
        if (activeTag !== 'all' && !tags.includes(activeTag)) {
            activeTag = 'all';
        }
    }

    $effect(clearFilterIfMissing);
</script>

<svelte:head>
    <title>{$t('gallery.headline')} - GV Hellas</title>
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
            {#each filtered as item (item.id || item.src)}
                <article class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    {#if typeOf(item) === 'video'}
                        <MediaSkeleton
                                type="video"
                                src={item.src}
                                poster={item.poster || ''}
                                containerClass="bg-black"
                                mediaClass="aspect-video bg-black object-contain"
                        />
                    {:else if typeOf(item) === 'audio'}
                        <MediaSkeleton
                                type="audio"
                                src={item.src}
                                containerClass="bg-white"
                        />
                    {:else}
                        <MediaSkeleton
                                type="image"
                                src={item.src}
                                sources={item.srcVariants as any}
                                alt={label(item.alt)}
                                containerClass="bg-slate-100"
                                mediaClass="h-64 object-cover"
                        />
                    {/if}

                    {#if label(item.alt) || item.tags?.length}
                        <div class="p-3">
                            {#if label(item.alt)}
                                <p class="text-sm font-medium text-slate-800">
                                    {label(item.alt)}
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