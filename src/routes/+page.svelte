<script lang="ts">
    import { t, locale } from '$lib/i18n';
    import Slider from '$lib/components/Slider.svelte';
    import EventCard from '$lib/components/EventCard.svelte';

    let { data } = $props();

  const heroImages = [
    'https://gv-hellas.ch/wp-content/uploads/2024/06/hero-1.jpg',
    'https://gv-hellas.ch/wp-content/uploads/2024/06/hero-2.jpg'
  ];

  let slides = $derived([
    {
      image: heroImages[0],
      title: $t('home.welcomeTitle'),
      subtitle: $t('home.welcomeSubtitle')
    },
    {
      image: heroImages[1],
      title: $t('home.aboutHeadline'),
      subtitle: $t('home.aboutText')
    }
  ]);

  let lang = $derived($locale ?? 'el');
  let events = $derived(data?.events ?? []);
</script>

<section>
  <Slider {slides} interval={6500} />
</section>

<section class="my-12 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
  <h2 class="text-2xl font-bold text-slate-900">{$t('home.aboutHeadline')}</h2>
  <p class="mt-3 max-w-3xl text-slate-600">{$t('home.aboutText')}</p>
</section>

<section class="my-12">
  <div class="mb-5 flex items-end justify-between gap-4">
    <h2 class="text-2xl font-bold text-slate-900">{$t('events.headline')}</h2>
    <a href="/events" class="text-sm font-semibold text-primary-dark hover:underline">{$t('events.readMore')}</a>
  </div>
  <div class="grid gap-6 md:grid-cols-3">
    {#each events as event}
      <EventCard {event} {lang} />
    {/each}
  </div>
</section>

<section class="my-12 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
  <h2 class="text-2xl font-bold text-slate-900">{$t('home.activitiesHeadline')}</h2>
  <p class="mt-4 text-slate-700">{$t('home.activitiesIntro')}</p>
  <ul class="mt-4 space-y-3 text-slate-700">
    <li>• Ήθη και Έθιμα / Bräuche und Traditionen</li>
    <li>• Παραδοσιακοί Χοροί / Traditionelle Tänze</li>
    <li>• Φαγητό και Παράδοση / Essen und Tradition</li>
    <li>• Ελληνική Γλώσσα / Griechische Sprache</li>
    <li>• Θρησκεία / Religion</li>
  </ul>
</section>

<section class="my-12 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
  <h2 class="text-2xl font-bold text-slate-900">{$t('home.sponsorsHeadline')}</h2>
  <div class="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
    <a href="https://ssr-rothrist.ch" target="_blank" rel="noopener" class="rounded-xl border border-slate-200 px-4 py-3 font-medium text-primary-dark hover:bg-slate-50">SSR Rothrist</a>
    <a href="https://physiomurgenthal.ch" target="_blank" rel="noopener" class="rounded-xl border border-slate-200 px-4 py-3 font-medium text-primary-dark hover:bg-slate-50">Physio Murgenthal</a>
    <a href="https://zahnarztaarburgoftringen.ch" target="_blank" rel="noopener" class="rounded-xl border border-slate-200 px-4 py-3 font-medium text-primary-dark hover:bg-slate-50">Zahnarzt Aarburg/Oftringen</a>
    <a href="https://zahnarztpraxisturbenthal.ch" target="_blank" rel="noopener" class="rounded-xl border border-slate-200 px-4 py-3 font-medium text-primary-dark hover:bg-slate-50">Zahnarzt Turbenthal</a>
  </div>
</section>
