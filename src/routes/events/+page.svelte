<script lang="ts">
    import {t, locale} from '$lib/i18n';
    import EventCard from '$lib/components/EventCard.svelte';

    /** @type {import('./$types').PageProps} */
    let {data} = $props();

    // Svelte 5: Use $derived to ensure lang updates reactively with the locale store
    let lang = $derived($locale ?? 'el');
    let upcoming = $derived(data?.upcoming ?? []);
    let past = $derived(data?.past ?? []);
</script>

<h1 class="text-3xl font-bold mb-6">{$t('events.headline')}</h1>

<section class="mb-12">
    <h2 class="text-2xl font-semibold mb-4">{$t('events.upcoming')}</h2>
    {#if upcoming.length > 0}
        <div class="grid md:grid-cols-3 gap-6">
            {#each upcoming as event}
                <EventCard {event} {lang}/>
            {/each}
        </div>
    {:else}
        <p class="text-gray-500">
            Keine bevorstehenden Veranstaltungen / Δεν υπάρχουν επερχόμενες εκδηλώσεις.
        </p>
    {/if}
</section>

<section>
    <h2 class="text-2xl font-semibold mb-4">{$t('events.past')}</h2>
    {#if past.length > 0}
        <div class="grid md:grid-cols-3 gap-6">
            {#each past as event}
                <EventCard {event} {lang}/>
            {/each}
        </div>
    {:else}
        <p class="text-gray-500">
            Keine vergangenen Veranstaltungen / Δεν υπάρχουν παρελθόντα γεγονότα.
        </p>
    {/if}
</section>