<script>
  let { type = 'image', src, alt = '', mediaClass = '', containerClass = '', poster = '' } = $props();

  let loaded = $state(false);
  let imageEl = $state();
  let videoEl = $state();

  $effect(() => {
    src;
    loaded = false;
  });

  $effect(() => {
    if (type === 'image' && imageEl?.complete) {
      loaded = true;
    }
  });

  $effect(() => {
    if (type === 'video' && videoEl?.readyState >= 2) {
      loaded = true;
    }
  });
</script>

<div class={`relative overflow-hidden ${containerClass}`}>
  <div
    class={`skeleton-shimmer absolute inset-0 z-10 pointer-events-none transition-opacity duration-250 ${loaded ? 'opacity-0' : 'opacity-100'}`}
    aria-hidden="true"
  ></div>

  {#if type === 'video'}
    <video
      bind:this={videoEl}
      controls
      preload="metadata"
      poster={poster}
      class={`w-full ${mediaClass}`}
      onloadeddata={() => (loaded = true)}
    >
      <source src={src} type="video/mp4" />
      <track kind="captions" src="" label="No captions available" />
      Your browser does not support the video tag.
    </video>
  {:else}
    <img
      bind:this={imageEl}
      src={src}
      alt={alt}
      class={`w-full ${mediaClass}`}
      loading="lazy"
      decoding="async"
      onload={() => (loaded = true)}
    />
  {/if}
</div>
