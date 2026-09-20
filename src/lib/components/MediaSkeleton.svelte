<script lang="ts">
    type SourceVariant = {
        src: string;
        width?: number;
    };

    type SourceInput = string | SourceVariant | SourceVariant[] | undefined | null;

    type Sources = {
        webp?: SourceInput;
        jpg?: SourceInput;
        jpeg?: SourceInput;
        png?: SourceInput;
    };

    let {
        type = 'image',
        src = '',
        alt = '',
        mediaClass = '',
        containerClass = '',
        poster = '',
        sources = {},
        fallbackSrc = '',
        errorText = 'Media unavailable',
        loading = 'lazy',
        fetchPriority = 'auto',
        sizes = '(max-width: 768px) 100vw, 33vw'
    }: {
        type?: 'image' | 'video' | 'audio';
        src?: string;
        alt?: string;
        mediaClass?: string;
        containerClass?: string;
        poster?: string;
        sources?: Sources;
        fallbackSrc?: string;
        errorText?: string;
        loading?: 'eager' | 'lazy';
        fetchPriority?: 'high' | 'low' | 'auto';
        sizes?: string;
    } = $props();

    let loaded = $state(false);
    let failed = $state(false);
    // Keep the real source in the SSR HTML. If this starts as an empty string,
    // a <picture> source can finish loading before hydration and its load event
    // is then missed, leaving the skeleton over an otherwise valid image.
    function initialSrc() {
        return src;
    }

    let activeSrc = $state(initialSrc());
    let retriedPlainSrc = $state(false);
    let retriedFallback = $state(false);

    function normalize(input: SourceInput): SourceVariant[] {
        if (!input) return [];
        if (typeof input === 'string') return input ? [{ src: input }] : [];
        if (Array.isArray(input)) return input.filter((i) => Boolean(i?.src));
        if (input.src) return [input];
        return [];
    }

    function toSrcSet(input: SourceInput) {
        return normalize(input)
            .map((i) => (i.width ? `${i.src} ${i.width}w` : i.src))
            .join(', ');
    }

    function hasPictureSources() {
        return Boolean(
            toSrcSet(sources.webp) ||
            toSrcSet(sources.jpg || sources.jpeg) ||
            toSrcSet(sources.png)
        );
    }

    function markLoaded() {
        loaded = true;
        failed = false;
    }

    function markFailed() {
        // If a <source> variant failed, retry the plain src without <picture>.
        if (type === 'image' && hasPictureSources() && !retriedPlainSrc && src) {
            retriedPlainSrc = true;
            loaded = false;
            failed = false;
            activeSrc = src;
            return;
        }

        // Hero/media sources can disappear independently. Retry a slide-local fallback
        // rather than allowing one broken asset to leave the slide unusable.
        if (type === 'image' && fallbackSrc && fallbackSrc !== activeSrc && !retriedFallback) {
            retriedFallback = true;
            retriedPlainSrc = true;
            loaded = false;
            failed = false;
            activeSrc = fallbackSrc;
            return;
        }

        loaded = true;
        failed = true;
    }

    function mediaEvents(
        node: HTMLImageElement | HTMLVideoElement | HTMLAudioElement
    ): { destroy: () => void } {
        const loadEvent = node.tagName === 'IMG' ? 'load' : 'loadeddata';
        let destroyed = false;

        node.addEventListener(loadEvent, markLoaded);
        node.addEventListener('error', markFailed);

        // On a full SSR page load the browser may fetch a <picture> source before
        // Svelte hydrates and attaches this listener. Detect that already-complete
        // state explicitly so the skeleton cannot remain on top forever.
        if (node instanceof HTMLImageElement) {
            queueMicrotask(() => {
                if (destroyed || !node.complete) return;

                if (node.naturalWidth > 0) {
                    markLoaded();
                } else if (node.currentSrc || node.src) {
                    markFailed();
                }
            });
        }

        return {
            destroy: () => {
                destroyed = true;
                node.removeEventListener(loadEvent, markLoaded);
                node.removeEventListener('error', markFailed);
            }
        };
    }

    let lastMediaIdentity = '';

    function mediaIdentity() {
        // Parent components may recreate the `sources` object when unrelated
        // reactive data changes (for example when the locale changes). Compare
        // the actual URLs instead of the object identity so an already-loaded
        // image does not go back to its skeleton state unnecessarily.
        return [
            type,
            src,
            fallbackSrc,
            poster,
            toSrcSet(sources.webp),
            toSrcSet(sources.jpg || sources.jpeg),
            toSrcSet(sources.png)
        ].join('\u0001');
    }

    $effect(() => {
        const nextMediaIdentity = mediaIdentity();

        if (nextMediaIdentity === lastMediaIdentity) return;
        lastMediaIdentity = nextMediaIdentity;

        loaded = false;
        failed = false;
        activeSrc = src;
        retriedPlainSrc = false;
        retriedFallback = false;

        if (!src) {
            loaded = true;
        }
    });
</script>

<div class={`relative overflow-hidden bg-slate-100 ${containerClass}`}>
    {#if !loaded && !failed}
        <div
                class="skeleton-shimmer pointer-events-none absolute inset-0 z-10 transition-opacity duration-200"
                aria-hidden="true"
        ></div>
    {/if}

    {#if failed}
        {#if errorText}
            <div class="flex min-h-40 items-center justify-center p-4 text-sm text-slate-500">
                {errorText}
            </div>
        {/if}
    {:else if type === 'video'}
        <!-- svelte-ignore a11y_media_has_caption -->
        <video
                controls
                preload="metadata"
                poster={poster}
                class={`w-full ${mediaClass}`}
                src={activeSrc}
                use:mediaEvents
        >
            Your browser does not support the video tag.
        </video>
    {:else if type === 'audio'}
        <div class={`flex min-h-24 items-center bg-white p-4 ${mediaClass}`}>
            <audio
                    controls
                    preload="metadata"
                    class="w-full"
                    src={activeSrc}
                    use:mediaEvents
            >
                Your browser does not support the audio tag.
            </audio>
        </div>
    {:else if hasPictureSources() && !retriedPlainSrc}
        <picture>
            {#if toSrcSet(sources.webp)}
                <source
                        srcset={toSrcSet(sources.webp)}
                        type="image/webp"
                        {sizes}
                />
            {/if}

            {#if toSrcSet(sources.jpg || sources.jpeg)}
                <source
                        srcset={toSrcSet(sources.jpg || sources.jpeg)}
                        type="image/jpeg"
                        {sizes}
                />
            {/if}

            {#if toSrcSet(sources.png)}
                <source
                        srcset={toSrcSet(sources.png)}
                        type="image/png"
                        {sizes}
                />
            {/if}

            <img
                    src={activeSrc}
                    {alt}
                    class={`w-full ${mediaClass}`}
                    {loading}
                    fetchpriority={fetchPriority}
                    decoding="async"
                    use:mediaEvents
            />
        </picture>
    {:else}
        <img
                src={activeSrc}
                {alt}
                class={`w-full ${mediaClass}`}
                {loading}
                fetchpriority={fetchPriority}
                decoding="async"
                use:mediaEvents
        />
    {/if}
</div>

<style>
    .skeleton-shimmer {
        background: linear-gradient(
                90deg,
                rgba(241, 245, 249, 0.8) 0%,
                rgba(226, 232, 240, 0.95) 50%,
                rgba(241, 245, 249, 0.8) 100%
        );
        background-size: 200% 100%;
        animation: shimmer 1.2s ease-in-out infinite;
    }

    @keyframes shimmer {
        from {
            background-position: 200% 0;
        }
        to {
            background-position: -200% 0;
        }
    }
</style>