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
        sources = {}
    }: {
        type?: 'image' | 'video' | 'audio';
        src?: string;
        alt?: string;
        mediaClass?: string;
        containerClass?: string;
        poster?: string;
        sources?: Sources;
    } = $props();

    let loaded = $state(false);
    let failed = $state(false);
    let activeSrc = $state('');
    let retriedPlainSrc = $state(false);

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
            activeSrc = '';

            requestAnimationFrame(() => {
                activeSrc = src;
            });

            return;
        }

        loaded = true;
        failed = true;
    }

    function mediaEvents(
        node: HTMLImageElement | HTMLVideoElement | HTMLAudioElement
    ): { destroy: () => void } {
        const loadEvent = node.tagName === 'IMG' ? 'load' : 'loadeddata';

        node.addEventListener(loadEvent, markLoaded);
        node.addEventListener('error', markFailed);

        return {
            destroy: () => {
                node.removeEventListener(loadEvent, markLoaded);
                node.removeEventListener('error', markFailed);
            }
        };
    }

    $effect(() => {
        loaded = false;
        failed = false;
        activeSrc = '';
        retriedPlainSrc = false;

        if (!src) {
            loaded = true;
            return;
        }

        requestAnimationFrame(() => {
            activeSrc = src;
        });
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
        <div class="flex min-h-40 items-center justify-center p-4 text-sm text-slate-500">
            Media unavailable
        </div>
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
                        sizes="(max-width: 768px) 100vw, 33vw"
                />
            {/if}

            {#if toSrcSet(sources.jpg || sources.jpeg)}
                <source
                        srcset={toSrcSet(sources.jpg || sources.jpeg)}
                        type="image/jpeg"
                        sizes="(max-width: 768px) 100vw, 33vw"
                />
            {/if}

            {#if toSrcSet(sources.png)}
                <source
                        srcset={toSrcSet(sources.png)}
                        type="image/png"
                        sizes="(max-width: 768px) 100vw, 33vw"
                />
            {/if}

            <img
                    src={activeSrc}
                    {alt}
                    class={`w-full ${mediaClass}`}
                    loading="lazy"
                    decoding="async"
                    use:mediaEvents
            />
        </picture>
    {:else}
        <img
                src={activeSrc}
                {alt}
                class={`w-full ${mediaClass}`}
                loading="lazy"
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