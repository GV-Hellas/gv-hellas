<script lang="ts">
  import { t } from '$lib/i18n';
  import MediaSkeleton from '$lib/components/MediaSkeleton.svelte';

  let { data } = $props();
  let items = $derived(data?.items ?? []);
</script>

<h1 class="mb-6 text-3xl font-bold">{$t('gallery.headline')}</h1>

<div class="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
  {#each items as item}
    {#if item.type === 'image'}
      <MediaSkeleton
        src={item.src}
        alt={item.alt}
        containerClass="rounded-xl border border-slate-200"
        mediaClass="h-64 object-cover"
      />
    {:else if item.type === 'video'}
      <MediaSkeleton
        type="video"
        src={item.src}
        poster={item.poster || ''}
        containerClass="overflow-hidden rounded-xl border border-slate-200"
        mediaClass="aspect-video bg-black"
      />
    {/if}
  {/each}
</div>
