<script lang="ts">
    import {t} from '$lib/i18n';
    import MediaSkeleton from '$lib/components/MediaSkeleton.svelte';
    import type {Lang, StoredEvent, EventMedia} from '$lib/cms/events/types';

    let {event, lang = 'el'}: { event: StoredEvent; lang?: Lang } = $props();

    function localized(value?: { el?: string; de?: string }) {
        return value?.[lang] || value?.el || value?.de || '';
    }

    function firstImage(event: StoredEvent): EventMedia | null {
        for (const section of event.sections || []) {
            for (const media of section.media || []) {
                if (media.type === 'image' && media.url) return media;
            }
        }

        return null;
    }

    function formatDate(event: StoredEvent) {
        if (!event.date) return '';

        const date = new Date(`${event.date}T${event.time || '00:00'}`);

        if (Number.isNaN(date.getTime())) return event.date;

        return new Intl.DateTimeFormat(lang === 'de' ? 'de-CH' : 'el-GR', {
            dateStyle: 'medium',
            timeStyle: event.time ? 'short' : undefined
        }).format(date);
    }

    let title = $derived(localized(event.title));
    let description = $derived(localized(event.description));
    let image = $derived(firstImage(event));
    let formattedDate = $derived(formatDate(event));
</script>

<a
        href={`/events/${event.slug}`}
        class="group block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
>
    {#if image?.url}
        <MediaSkeleton
                src={image.url}
                alt={localized(image.alt) || title}
                mediaClass="h-52 object-cover"
                containerClass="h-52"
        />
    {:else}
        <div class="flex h-52 items-center justify-center bg-slate-100 text-sm font-semibold text-slate-500">
            GV Hellas
        </div>
    {/if}

    <div class="p-5">
        {#if event.category}
            <p class="text-xs font-semibold uppercase tracking-wide text-primary-dark">
                {event.category}
            </p>
        {/if}

        {#if formattedDate}
            <p class="mt-1 text-xs font-medium text-slate-500">
                {formattedDate}
            </p>
        {/if}

        <h3 class="mt-2 text-lg font-semibold text-slate-900">
            {title}
        </h3>

        {#if description}
            <p class="mt-2 line-clamp-3 text-sm text-slate-600">
                {description}
            </p>
        {/if}

        <div class="mt-4 text-sm font-semibold text-primary-dark group-hover:underline">
            {$t('events.readMore')} →
        </div>
    </div>
</a>