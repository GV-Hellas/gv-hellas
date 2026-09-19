<script lang="ts">
    import {onDestroy, onMount} from 'svelte';
    import MediaSkeleton from '$lib/components/MediaSkeleton.svelte';
    import {t} from '$lib/i18n';

    import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
    import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';

    type SourceVariant = {src: string; width?: number};
    type SourceInput = string | SourceVariant | SourceVariant[] | null | undefined;
    type SlideSources = {
        webp?: SourceInput;
        jpg?: SourceInput;
        jpeg?: SourceInput;
        png?: SourceInput;
    };

    type Slide = {
        image: string;
        imageVariants?: SlideSources;
        fallbackImage?: string;
        alt?: string;
        title?: string;
        subtitle?: string;
        badge?: string;
        href?: string;
        ctaLabel?: string;
    };

    let {slides = [], interval = 5000} = $props<{
        slides?: Slide[];
        interval?: number;
    }>();

    let normalizedSlides = $derived((slides ?? []).filter((slide) => slide?.image));

    let index = $state(0);
    let timer: ReturnType<typeof setInterval> | undefined;

    function stopTimer() {
        if (timer) {
            clearInterval(timer);
            timer = undefined;
        }
    }

    function startTimer() {
        stopTimer();

        if (normalizedSlides.length < 2) return;

        timer = setInterval(() => {
            index = (index + 1) % normalizedSlides.length;
        }, interval);
    }

    function goTo(nextIndex: number) {
        const count = normalizedSlides.length;
        if (!count) return;

        index = (nextIndex + count) % count;
        startTimer();
    }

    function previous() {
        goTo(index - 1);
    }

    function next() {
        goTo(index + 1);
    }

    onMount(startTimer);
    onDestroy(stopTimer);

    $effect(() => {
        if (index >= normalizedSlides.length) {
            index = 0;
        }
    });
</script>

<div class="relative h-[22rem] overflow-hidden rounded-xl shadow-xl md:h-auto md:aspect-[16/7]">
    {#each normalizedSlides as slide, i}
        <div
            class={`absolute inset-0 transition-opacity duration-700 ${i === index ? 'z-10 opacity-100' : 'pointer-events-none opacity-0'}`}
            aria-hidden={i !== index}
        >
            <MediaSkeleton
                src={slide.image}
                sources={slide.imageVariants}
                fallbackSrc={slide.fallbackImage || ''}
                errorText=""
                alt={slide.alt || slide.title || 'Griechischer Verein Hellas'}
                mediaClass="h-full object-cover"
                containerClass="h-full bg-linear-to-br from-blue-950 via-blue-800 to-blue-600"
                loading={i === 0 ? 'eager' : 'lazy'}
                fetchPriority={i === 0 ? 'high' : 'low'}
                sizes="100vw"
            />

            <div class="absolute inset-0 bg-gradient-to-tr from-slate-950/75 via-slate-900/40 to-blue-600/20"></div>

            <div class="absolute inset-0 flex items-end py-6 pl-20 pr-16 md:py-10 md:pl-24 md:pr-24">
                <div class="max-w-2xl text-white">
                    {#if slide.badge}
                        <div class="mb-3 inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.15em] text-white backdrop-blur-sm">
                            {slide.badge}
                        </div>
                    {/if}

                    {#if slide.title}
                        <h2 class="text-2xl font-bold leading-tight md:text-5xl">{slide.title}</h2>
                    {/if}

                    {#if slide.subtitle}
                        <p class="mt-3 text-sm text-slate-100 md:text-lg">{slide.subtitle}</p>
                    {/if}

                    {#if slide.href}
                        <a
                            href={slide.href}
                            class="mt-5 inline-flex rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-950 shadow-sm transition hover:bg-slate-100"
                        >
                            {slide.ctaLabel || $t('events.readMore')}
                        </a>
                    {/if}
                </div>
            </div>
        </div>
    {/each}

    {#if normalizedSlides.length > 1}
        <button
            type="button"
            class="absolute left-3 top-1/2 z-20 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-slate-950/35 text-white shadow-lg backdrop-blur-sm transition hover:bg-slate-950/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white md:left-5"
            onclick={previous}
            aria-label={$t('common.previous')}
        >
            <ChevronLeftIcon class="size-6" />
        </button>

        <button
            type="button"
            class="absolute right-3 top-1/2 z-20 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-slate-950/35 text-white shadow-lg backdrop-blur-sm transition hover:bg-slate-950/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white md:right-5"
            onclick={next}
            aria-label={$t('common.next')}
        >
            <ChevronRightIcon class="size-6" />
        </button>

        <div class="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2">
            {#each normalizedSlides as _, i}
                <button
                    type="button"
                    class={`h-2.5 w-2.5 rounded-full transition ${i === index ? 'bg-white' : 'bg-white/40 hover:bg-white/70'}`}
                    onclick={() => goTo(i)}
                    aria-label={`${$t('common.slide')} ${i + 1}`}
                    aria-current={i === index ? 'true' : undefined}
                ></button>
            {/each}
        </div>
    {/if}
</div>
