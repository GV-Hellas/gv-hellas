<script lang="ts">
    import { t, locale } from '$lib/i18n';
    import Slider from '$lib/components/Slider.svelte';
    import EventCard from '$lib/components/EventCard.svelte';

    let { data } = $props();

    // Use $t as a function directly.
    // Svelte 5 will track the dependency on the store automatically.
    let slides = $derived([
        {
            image: '/images/hero-1.jpg',
            title: $t('home.welcomeTitle'),
            subtitle: $t('home.welcomeSubtitle')
        },
        {
            image: '/images/hero-2.jpg',
            title: $t('home.aboutHeadline'),
            subtitle: $t('home.aboutText')
        }
    ]);

    let lang = $derived($locale ?? undefined);
</script>

<section>
    <Slider {slides} interval={6000}/>
</section>

<section class="my-12">
    <h2 class="text-2xl font-bold mb-4">{$t('home.aboutHeadline')}</h2>
    <p>{$t('home.aboutText')}</p>
</section>

<section class="my-12">
    <h2 class="text-2xl font-bold mb-4">{$t('events.headline')}</h2>
    <div class="grid md:grid-cols-3 gap-6">
        {#each data.events as event}
            <EventCard {event} lang={lang}/>
        {/each}
    </div>
</section>

<section class="my-12">
    <h2 class="text-2xl font-bold mb-4">{$t('home.activitiesHeadline')}</h2>
    <ul class="list-disc list-inside space-y-2">
        <li>Bräuche und Traditionen / Ήθη και Έθιμα</li>
        <li>Traditionelle Tänze / Παραδοσιακοί Χοροί</li>
        <li>Essen und Tradition / Φαγητό και Παράδοση</li>
        <li>Griechische Sprache / Ελληνική Γλώσσα</li>
        <li>Religion / Θρησκεία</li>
    </ul>
</section>

<section class="my-12">
    <h2 class="text-2xl font-bold mb-4">{$t('home.sponsorsHeadline')}</h2>
    <div class="flex flex-wrap gap-4 items-center">
        <a href="https://ssr-rothrist.ch" target="_blank" rel="noopener" class="underline">SSR Rothrist</a>
        <a href="https://physiomurgenthal.ch" target="_blank" rel="noopener" class="underline">Physio Murgenthal</a>
        <a href="https://zahnarztaarburgoftringen.ch" target="_blank" rel="noopener" class="underline">Zahnarzt
            Aarburg/Oftringen</a>
        <a href="https://zahnarztpraxisturbenthal.ch" target="_blank" rel="noopener" class="underline">Zahnarzt
            Turbenthal</a>
    </div>
</section>