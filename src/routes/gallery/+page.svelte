<script lang="ts">
  import { t } from '$lib/i18n';

  // Svelte 5: Use $props() to access data from +page.js
  let { data } = $props();
</script>

<h1 class="text-3xl font-bold mb-6">{$t('gallery.headline')}</h1>

<div class="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
  {#each data.items as item}
    {#if item.type === 'image'}
      <div class="overflow-hidden rounded shadow">
        <img src={item.src} alt={item.alt} class="w-full h-64 object-cover" />
      </div>
    {:else if item.type === 'video'}
      <div class="aspect-w-16 aspect-h-9">
        <video controls class="w-full h-full">
          <source src={item.src} type="video/mp4">
          <track kind="captions" src="" label="No captions available">
          Your browser does not support the video tag.
        </video>
      </div>
    {/if}
  {/each}
</div>