<script lang="ts">
    import {t, locale} from '$lib/i18n';
    import Slider from '$lib/components/Slider.svelte';
    import EventCard from '$lib/components/EventCard.svelte';
    import Seo from '$lib/components/Seo.svelte';
    import SponsorInquiryDialog from '$lib/components/SponsorInquiryDialog.svelte';
    import type {Lang, StoredEvent} from '$lib/cms/events/types';
    import type {SponsorType, StoredBusiness} from '$lib/cms/business/types';
    import type {HomepageSlide} from '$lib/cms/home/types';

    import CalendarDaysIcon from '@lucide/svelte/icons/calendar-days';
    import MapPinIcon from '@lucide/svelte/icons/map-pin';
    import MedalIcon from '@lucide/svelte/icons/medal';

    let {data} = $props();

    type HeroSlide = {
        image: string;
        imageVariants?: {
            webp?: {src: string; width: number}[];
        };
        fallbackImage?: string;
        alt?: string;
        title?: string;
        subtitle?: string;
        badge?: string;
        href?: string;
        ctaLabel?: string;
    };

    const emergencyHeroSlides: HomepageSlide[] = [
        {
            id: -1,
            enabled: true,
            sortOrder: 10,
            title: {
                el: 'Καλώς ήρθατε στην ιστοσελίδα μας!',
                de: 'Willkommen auf unserer Webseite!'
            },
            description: {
                el: 'Σύλλογος ομογενών Ελλήνων Rothrist',
                de: 'Griechischer Verein der Auswanderer von Rothrist'
            },
            alt: {
                el: 'Ελληνικός Σύλλογος Hellas στο Rothrist',
                de: 'Griechischer Verein Hellas in Rothrist'
            },
            image480: '/uploads/img-69cd9f9a21-480.webp',
            image960: '/uploads/img-69cd9f9a21-960.webp',
            image1920: '/uploads/img-69cd9f9a21-orig.webp',
            imageFallback: '/uploads/img-69cd9f9a21-orig.jpg',
            createdAt: '',
            updatedAt: ''
        },
        {
            id: -2,
            enabled: true,
            sortOrder: 20,
            title: {
                el: 'Σύλλογος ομογενών του Rothrist',
                de: 'Verein der Auslandgriechen von Rothrist'
            },
            description: {
                el: 'Ιδρυμένος το 2019, ο σύλλογός μας διατηρεί και προωθεί τις ελληνικές παραδόσεις, τη γλώσσα και τον πολιτισμό στην Ελβετία.',
                de: 'Gegründet 2019 pflegt und fördert unser Verein die griechischen Traditionen, Sprache und Kultur in der Schweiz.'
            },
            alt: {
                el: 'Δράσεις του Ελληνικού Συλλόγου Hellas',
                de: 'Aktivitäten des Griechischen Vereins Hellas'
            },
            image480: '/uploads/img-87c77443a0-480.webp',
            image960: '/uploads/img-87c77443a0-960.webp',
            image1920: '/uploads/img-87c77443a0-orig.webp',
            imageFallback: '/uploads/img-87c77443a0-orig.jpg',
            createdAt: '',
            updatedAt: ''
        }
    ];

    let lang: Lang = $derived(($locale || 'el') as Lang);
    let events: StoredEvent[] = $derived(data?.events ?? []);
    let activeEvent: StoredEvent | null = $derived(data?.activeEvent ?? null);
    let sponsors: StoredBusiness[] = $derived(data?.sponsors ?? []);
    let configuredHeroSlides: HomepageSlide[] = $derived(
        data?.heroSlides?.length ? data.heroSlides : emergencyHeroSlides
    );

    function localized(value?: Partial<Record<Lang, string>> | null) {
        return value?.[lang] || value?.el || value?.de || '';
    }

    function plainText(value: string) {
        return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    }

    function eventImage(event: StoredEvent | null) {
        if (!event) return '';

        for (const section of event.sections || []) {
            const image = section.media?.find((item) => item.type === 'image' && item.url);
            if (image?.url) return image.url;
        }

        return '';
    }

    function formatEventDate(event: StoredEvent) {
        if (!event.date) return '';

        const date = new Date(`${event.date}T00:00:00`);
        const formatted = Number.isNaN(date.getTime())
            ? event.date
            : new Intl.DateTimeFormat(lang === 'de' ? 'de-CH' : 'el-GR', {
                dateStyle: 'long'
            }).format(date);

        const time = event.time
            ? `${event.time}${event.endTime ? `–${event.endTime}` : ''}`
            : '';

        return [formatted, time].filter(Boolean).join(' · ');
    }

    function sponsorMedalClass(type: SponsorType) {
        if (type === 'gold') return 'text-amber-500';
        if (type === 'silver') return 'text-slate-400';
        return 'text-orange-600';
    }

    function sponsorLabel(type: SponsorType) {
        return $t(`admin.businesses.sponsorTypes.${type}`);
    }

    function slideImage(slide: HomepageSlide) {
        return slide.image1920 || slide.image960 || slide.image480 || slide.imageFallback;
    }

    function slideVariants(slide: HomepageSlide) {
        const variants = [
            slide.image480 ? {src: slide.image480, width: 480} : null,
            slide.image960 ? {src: slide.image960, width: 960} : null,
            slide.image1920 ? {src: slide.image1920, width: 1920} : null
        ].filter(Boolean) as {src: string; width: number}[];

        return variants.length ? {webp: variants} : undefined;
    }

    let cmsSlides: HeroSlide[] = $derived(
        configuredHeroSlides.map((slide) => ({
            image: slideImage(slide),
            imageVariants: slideVariants(slide),
            fallbackImage: slide.imageFallback || slideImage(slide),
            alt: localized(slide.alt) || localized(slide.title),
            title: localized(slide.title),
            subtitle: localized(slide.description)
        }))
    );

    let firstConfiguredSlide = $derived(cmsSlides[0]);

    let slides: HeroSlide[] = $derived([
        ...(activeEvent
            ? [
                {
                    image: eventImage(activeEvent) || firstConfiguredSlide?.image || '',
                    imageVariants: eventImage(activeEvent) ? undefined : firstConfiguredSlide?.imageVariants,
                    fallbackImage: firstConfiguredSlide?.fallbackImage || firstConfiguredSlide?.image || '',
                    alt: localized(activeEvent.title),
                    title: localized(activeEvent.title),
                    subtitle: [formatEventDate(activeEvent), activeEvent.location].filter(Boolean).join(' · '),
                    badge: $t('home.activeEvent'),
                    href: `/events/${encodeURIComponent(activeEvent.slug)}`,
                    ctaLabel: $t('events.readMore')
                }
            ]
            : []),
        ...cmsSlides
    ]);

    let firstSlide = $derived(slides[0]);

    function heroSrcSet(slide: HeroSlide | undefined) {
        const source = slide?.imageVariants?.webp;
        if (!Array.isArray(source)) return '';
        return source.map((item) => `${item.src} ${item.width}w`).join(', ');
    }

    const seoDescription = $derived(
        lang === 'de'
            ? 'Der Griechische Verein Hellas in der Schweiz verbindet die griechische Gemeinschaft mit Veranstaltungen, Kultur, Informationen und Dienstleistungen.'
            : 'Ο Ελληνικός Σύλλογος Hellas στην Ελβετία ενώνει την ελληνική κοινότητα με εκδηλώσεις, πολιτιστικές δράσεις, πληροφορίες και υπηρεσίες.'
    );
</script>

<Seo title="Griechischer Verein Hellas" description={seoDescription} />

<svelte:head>
    {#if firstSlide?.image}
        <link
            rel="preload"
            as="image"
            href={firstSlide.image}
            imagesrcset={heroSrcSet(firstSlide) || undefined}
            imagesizes="100vw"
            fetchpriority="high"
        />
    {/if}
</svelte:head>

<section>
    <Slider {slides} interval={6500}/>
</section>

{#if activeEvent}
    <section class="my-9 border-y border-primary/30 bg-linear-to-r from-primary/10 via-white to-blue-50">
        <div class="grid gap-6 px-2 py-7 md:grid-cols-[1fr_auto] md:items-center md:px-6 md:py-8">
            <div>
                <p class="text-sm font-black uppercase tracking-[0.18em] text-primary">
                    {$t('home.activeEvent')}
                </p>
                <h2 class="mt-2 text-2xl font-bold text-slate-950 md:text-3xl">
                    {localized(activeEvent.title)}
                </h2>
                {#if plainText(localized(activeEvent.description))}
                    <p class="mt-2 max-w-3xl text-slate-600">
                        {plainText(localized(activeEvent.description))}
                    </p>
                {/if}
                <div class="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-slate-700">
                    <span class="inline-flex items-center gap-2">
                        <CalendarDaysIcon class="size-4 text-primary" />
                        {formatEventDate(activeEvent)}
                    </span>
                    {#if activeEvent.location}
                        <span class="inline-flex items-center gap-2">
                            <MapPinIcon class="size-4 text-primary" />
                            {activeEvent.location}
                        </span>
                    {/if}
                </div>
            </div>
            <a
                href={`/events/${encodeURIComponent(activeEvent.slug)}`}
                class="inline-flex h-11 items-center justify-center rounded-md bg-primary px-5 font-bold text-primary-foreground shadow-sm transition hover:bg-primary/90"
            >
                {$t('events.readMore')}
            </a>
        </div>
    </section>
{/if}

<section class="my-12 border-l-4 border-primary bg-white/70 px-6 py-7 md:px-8">
    <h2 class="text-2xl font-bold text-slate-900">{$t('home.aboutHeadline')}</h2>
    <p class="mt-3 max-w-3xl text-slate-600">{$t('home.aboutText')}</p>
</section>

<section class="my-12">
    <div class="mb-5 flex items-end justify-between gap-4">
        <div>
            <h2 class="text-2xl font-bold text-slate-900">{$t('events.headline')}</h2>
            <p class="mt-1 text-sm text-slate-500">{$t('home.recentEventsHint')}</p>
        </div>
        <a href="/events" class="text-sm font-semibold text-primary hover:underline">{$t('events.readMore')}</a>
    </div>
    <div class="grid gap-6 md:grid-cols-3">
        {#each events as event (event.slug)}
            <EventCard {event} {lang} featured={event.slug === activeEvent?.slug}/>
        {/each}
    </div>
</section>

<section class="my-12 border-y border-slate-200 bg-white/60 px-2 py-8 md:px-8">
    <h2 class="text-2xl font-bold text-slate-900">{$t('home.activitiesHeadline')}</h2>
    <p class="mt-4 text-slate-700">{$t('home.activitiesIntro')}</p>
    <ul class="mt-4 grid gap-3 text-slate-700 sm:grid-cols-2">
        <li>• Ήθη και Έθιμα / Bräuche und Traditionen</li>
        <li>• Παραδοσιακοί Χοροί / Traditionelle Tänze</li>
        <li>• Φαγητό και Παράδοση / Essen und Tradition</li>
        <li>• Ελληνική Γλώσσα / Griechische Sprache</li>
        <li>• Θρησκεία / Religion</li>
    </ul>
</section>

<section class="my-12 border-t border-slate-300 pt-8">
    <div class="max-w-3xl">
        <h2 class="text-2xl font-bold text-slate-900">{$t('home.sponsorsHeadline')}</h2>
        <p class="mt-2 text-slate-600">{$t('home.sponsorsIntro')}</p>
    </div>

    <div class="mt-7 grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
        {#each sponsors as business (business.id)}
            <a
                href={`/businesses/${encodeURIComponent(business.slug)}`}
                class="group relative flex min-h-48 flex-col items-center justify-center border-b border-slate-200 px-4 py-5 text-center transition hover:border-primary/50"
            >
                <span
                    class={`absolute right-2 top-2 ${sponsorMedalClass(business.sponsorType)}`}
                    title={sponsorLabel(business.sponsorType)}
                    aria-label={sponsorLabel(business.sponsorType)}
                >
                    <MedalIcon class="size-7" />
                </span>

                {#if business.logo}
                    <img
                        src={business.logo}
                        alt={business.name}
                        class="h-28 w-full max-w-56 object-contain transition-transform duration-200 group-hover:scale-[1.03]"
                        loading="lazy"
                    />
                {:else}
                    <div class="flex h-28 items-center justify-center text-5xl font-black text-slate-300">
                        {business.name?.slice(0, 1).toUpperCase() || '—'}
                    </div>
                {/if}

                <h3 class="mt-4 line-clamp-2 font-bold text-slate-900 group-hover:text-primary">
                    {business.name}
                </h3>
            </a>
        {/each}

        <SponsorInquiryDialog />
    </div>
</section>
