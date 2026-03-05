<script>
  let {
    type = 'image',
    src,
    alt = '',
    mediaClass = '',
    containerClass = '',
    poster = '',
    sources = { webp: [], jpg: [] }
  } = $props();

  let loaded = $state(false);
  let activeSrc = $state('');

  function startLoading() {
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

  function toSrcSet(items = []) {
    return items.map((i) => `${i.src} ${i.width}w`).join(', ');
  }
</script>

<div class={`relative overflow-hidden ${containerClass}`}>
  <div class={`skeleton-shimmer absolute inset-0 z-10 pointer-events-none transition-opacity duration-200 ${loaded ? 'opacity-0' : 'opacity-100'}`} aria-hidden="true"></div>

  {#if type === 'video'}
    <video controls preload="metadata" poster={poster} class={`w-full ${mediaClass}`} src={activeSrc} onloadeddata={() => (loaded = true)}>
      <track kind="captions" src="" label="No captions available" />
      Your browser does not support the video tag.
    </video>
  {:else}
    <picture>
      {#if sources?.webp?.length}
        <source srcset={toSrcSet(sources.webp)} type="image/webp" sizes="(max-width: 768px) 100vw, 50vw" />
      {/if}
      {#if sources?.jpg?.length}
        <source srcset={toSrcSet(sources.jpg)} type="image/jpeg" sizes="(max-width: 768px) 100vw, 50vw" />
      {/if}
      <img src={activeSrc} alt={alt} class={`w-full ${mediaClass}`} loading="lazy" decoding="async" onload={() => (loaded = true)} />
    </picture>
  {/if}
</div>
