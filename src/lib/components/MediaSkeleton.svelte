<script>
  let { type = 'image', src, alt = '', mediaClass = '', containerClass = '', poster = '' } = $props();

  let loaded = $state(false);
  let activeSrc = $state('');

  function startLoading() {
    // defer assigning src so skeleton renders first, then browser fetch starts
    requestAnimationFrame(() => {
      activeSrc = src || '';
    });
  }

  $effect(() => {
    src;
    loaded = false;
    activeSrc = '';
    startLoading();
  });
</script>

<div class={`relative overflow-hidden ${containerClass}`}>
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
