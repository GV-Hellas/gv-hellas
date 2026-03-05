<script>
  import { onMount } from 'svelte';

  let { type = 'image', src, alt = '', mediaClass = '', containerClass = '', poster = '' } = $props();

  let loaded = $state(false);
  let shouldLoad = $state(false);
  let hostEl = $state();

  let activeSrc = $derived(shouldLoad ? src : '');

  $effect(() => {
    src;
    loaded = false;
    shouldLoad = false;
  });

  onMount(() => {
    if (!hostEl) {
      shouldLoad = true;
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          shouldLoad = true;
          observer.disconnect();
        }
      },
      { rootMargin: '250px 0px' }
    );

    observer.observe(hostEl);

    return () => observer.disconnect();
  });
</script>

<div bind:this={hostEl} class={`relative overflow-hidden ${containerClass}`}>
  <div
    class={`skeleton-shimmer absolute inset-0 z-10 pointer-events-none transition-opacity duration-200 ${loaded ? 'opacity-0' : 'opacity-100'}`}
    aria-hidden="true"
  ></div>

  {#if type === 'video'}
    <video
      controls
      preload="metadata"
      poster={poster}
      class={`w-full ${mediaClass}`}
      src={activeSrc}
      onloadeddata={() => (loaded = true)}
    >
      <track kind="captions" src="" label="No captions available" />
      Your browser does not support the video tag.
    </video>
  {:else}
    <img
      src={activeSrc}
      alt={alt}
      class={`w-full ${mediaClass}`}
      loading="lazy"
      decoding="async"
      onload={() => (loaded = true)}
    />
  {/if}
</div>
