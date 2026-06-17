<script lang="ts">
    import {t} from '$lib/i18n';
    import type {Lang, StoredEvent, EventMedia} from '$lib/cms/events/types';

    let {event, lang = 'el'} = $props<{
        event: StoredEvent;
        lang?: Lang;
    }>();

    function firstMedia(event: StoredEvent): EventMedia | null {
        const media: EventMedia[] = [];

        for (const section of event.sections || []) {
            for (const item of section.media || []) {
                if (item?.url) {
                    media.push(item);
                }
            }
        }

        return (
            media.find((item) => item.type === 'image') ??
            media.find((item) => item.type === 'video') ??
            null
        );
    }

    function localized(value: Partial<Record<Lang, string>> | undefined) {
        return value?.[lang] || value?.el || value?.de || '';
    }

    let cardMedia = $derived(firstMedia(event));
    let title = $derived(localized(event.title));
    let description = $derived(localized(event.description));
    let mediaAlt = $derived(
        localized(cardMedia?.alt) ||
        localized(cardMedia?.caption) ||
        title ||
        'Griechischer Verein Hellas'
    );
</script>

<a
        href={`/events/${event.slug}`}
        class="group block overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
>
    <div class="relative aspect-4/3 overflow-hidden bg-muted">
        {#if cardMedia?.type === 'image' && cardMedia.url}
            <img
                    src={cardMedia.url}
                    alt={mediaAlt}
                    loading="lazy"
                    class="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
        {:else if cardMedia?.type === 'video' && cardMedia.url}
            <video
                    class="h-full w-full object-cover"
                    muted
                    playsinline
                    preload="metadata"
            >
                <source src={cardMedia.url} type={cardMedia.mimeType || 'video/webm'} />
            </video>
        {:else}
            <div class="flex h-full w-full items-center justify-center bg-muted px-6 text-center text-sm text-muted-foreground">
                Griechischer Verein Hellas
            </div>
        {/if}
    </div>

    <div class="space-y-3 p-5">
        <div class="text-sm font-medium text-muted-foreground">
            {event.date}
            {#if event.time}
                · {event.time}
            {/if}
        </div>

        <h3 class="line-clamp-2 text-lg font-semibold">
            {title}
        </h3>

        {#if description}
            <p class="line-clamp-3 text-sm text-muted-foreground">
                {@html description}
            </p>
        {/if}

        <div class="pt-1 text-sm font-semibold text-primary">
            {$t('events.readMore')}
        </div>
    </div>
</a>