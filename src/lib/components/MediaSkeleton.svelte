<script>
  let {
    type = 'image',
    src,
    alt = '',
    mediaClass = '',
    containerClass = '',
    poster = ''
  } = $props();

  let loaded = $state(false);
</script>

<div class={`relative overflow-hidden ${containerClass}`}>
  {#if !loaded}
    <div class="skeleton-shimmer absolute inset-0 z-10" aria-hidden="true"></div>
  {/if}

  {#if type === 'video'}
    <video
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
      src={src}
      alt={alt}
      class={`w-full ${mediaClass}`}
      loading="lazy"
      decoding="async"
      onload={() => (loaded = true)}
    />
  {/if}
</div>
