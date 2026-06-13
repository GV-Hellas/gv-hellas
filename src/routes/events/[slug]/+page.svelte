<script lang="ts">
    import {t, locale} from '$lib/i18n';

    let {data} = $props();

    let lang = $derived(($locale || 'el') as string);
    let event = $derived(data.event);

    function titleOf(event: any) {
        return event?.title?.[lang] || event?.title?.el || event?.title?.de || '';
    }

    function descriptionOf(event: any) {
        return event?.description?.[lang] || event?.description?.el || event?.description?.de || '';
    }

    function htmlOf(value: any) {
        return value?.[lang] || value?.el || value?.de || '';
    }

    function mediaAlt(media: any) {
        return media?.alt?.[lang] || media?.alt?.el || media?.filename || titleOf(event);
    }

    function formatDate(event: any) {
        if (!event?.date) return '';

        const date = new Date(`${event.date}T${event.time || '00:00'}`);

        if (Number.isNaN(date.getTime())) return event.date;

        return new Intl.DateTimeFormat(lang === 'de' ? 'de-CH' : 'el-GR', {
            dateStyle: 'long',
            timeStyle: event.time ? 'short' : undefined
        }).format(date);
    }

    function price(value: number | null | undefined) {
        if (value === null || value === undefined) return '';
        if (Number(value) === 0) return lang === 'de' ? 'Kostenlos' : 'Δωρεάν';
        return `CHF ${Number(value).toFixed(2)}`;
    }
</script>

{#if event}
    <article class="mx-auto max-w-4xl">
        <header class="mb-8">
            <p class="mb-3 text-sm font-semibold uppercase tracking-wide text-primary-dark">
                {event.category}
            </p>

            <h1 class="mb-4 text-4xl font-bold tracking-tight">
                {titleOf(event)}
            </h1>

            {#if descriptionOf(event)}
                <p class="max-w-3xl text-lg text-slate-600">
                    {descriptionOf(event)}
                </p>
            {/if}

            <dl class="mt-6 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm sm:grid-cols-2">
                <div>
                    <dt class="font-semibold text-slate-500">{lang === 'de' ? 'Datum' : 'Ημερομηνία'}</dt>
                    <dd>{formatDate(event)}</dd>
                </div>

                {#if event.location}
                    <div>
                        <dt class="font-semibold text-slate-500">{lang === 'de' ? 'Ort' : 'Τοποθεσία'}</dt>
                        <dd>{event.location}</dd>
                    </div>
                {/if}

                {#if price(event.priceMembers)}
                    <div>
                        <dt class="font-semibold text-slate-500">{lang === 'de' ? 'Mitglieder' : 'Μέλη'}</dt>
                        <dd>{price(event.priceMembers)}</dd>
                    </div>
                {/if}

                {#if price(event.pricePublic)}
                    <div>
                        <dt class="font-semibold text-slate-500">{lang === 'de' ? 'Nichtmitglieder' : 'Κοινό'}</dt>
                        <dd>{price(event.pricePublic)}</dd>
                    </div>
                {/if}
            </dl>
        </header>

        <div class="event-body">
            {#each event.sections || [] as section}
                {#if htmlOf(section.beforeHtml)}
                    <div class="prose max-w-none">
                        {@html htmlOf(section.beforeHtml)}
                    </div>
                {/if}

                {#if section.media?.length === 1}
                    {@const media = section.media[0]}

                    {#if media.type === 'image'}
                        <img
                                src={media.url}
                                alt={mediaAlt(media)}
                                class="w-full rounded-xl border border-slate-200"
                                loading="lazy"
                        />
                    {:else if media.type === 'video'}
                        <video controls class="w-full rounded-xl border border-slate-200">
                            <source src={media.url} type={media.mimeType || undefined}/>
                        </video>
                    {:else if media.type === 'audio'}
                        <audio controls class="w-full">
                            <source src={media.url} type={media.mimeType || undefined}/>
                        </audio>
                    {/if}
                {:else if section.media?.length > 1}
                    <div class="grid gap-3 md:grid-cols-2">
                        {#each section.media as media}
                            {#if media.type === 'image'}
                                <img
                                        src={media.url}
                                        alt={mediaAlt(media)}
                                        class="w-full rounded-xl border border-slate-200"
                                        loading="lazy"
                                />
                            {:else if media.type === 'video'}
                                <video controls class="w-full rounded-xl border border-slate-200">
                                    <source src={media.url} type={media.mimeType || undefined}/>
                                </video>
                            {:else if media.type === 'audio'}
                                <div class="rounded-xl border border-slate-200 p-4">
                                    <audio controls class="w-full">
                                        <source src={media.url} type={media.mimeType || undefined}/>
                                    </audio>
                                </div>
                            {/if}
                        {/each}
                    </div>
                {/if}

                {#if htmlOf(section.afterHtml)}
                    <div class="prose max-w-none">
                        {@html htmlOf(section.afterHtml)}
                    </div>
                {/if}
            {/each}
        </div>
    </article>
{:else}
    <div class="py-12 text-center">
        <p class="text-xl text-gray-600">
            Event not found / Η εκδήλωση δεν βρέθηκε.
        </p>

        <a href="/events" class="mt-4 inline-block text-primary-dark hover:underline">
            {$t('events.headline')}
        </a>
    </div>
{/if}

<style>
    .event-body {
        display: grid;
        gap: 0;
    }

    .event-body :global(.prose p:empty) {
        display: none;
    }

    .event-body :global(.prose p) {
        margin-block: 0.75rem;
    }

    .event-body img,
    .event-body video {
        margin-block: 0.75rem;
    }

    .event-body audio {
        margin-block: 0.75rem;
    }
</style>