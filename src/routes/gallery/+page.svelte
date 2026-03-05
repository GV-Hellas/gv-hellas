<script lang="ts">
  import { t } from '$lib/i18n';
  import MediaSkeleton from '$lib/components/MediaSkeleton.svelte';

  let { data } = $props();
  let items = $derived(data?.items ?? []);
  let tags = $derived(Array.from(new Set(items.flatMap((item) => item.tags || []))).sort());
  let activeTag = $state('all');
  let filtered = $derived(activeTag === 'all' ? items : items.filter((item) => (item.tags || []).includes(activeTag)));
</script>

<h1 class="mb-6 text-3xl font-bold">{$t('gallery.headline')}</h1>

<div class="mb-5 flex flex-wrap gap-2">
  <button class={`rounded-full px-3 py-1 text-sm ${activeTag === 'all' ? 'bg-primary text-white' : 'bg-slate-200'}`} onclick={() => (activeTag = 'all')}>All</button>
  {#each tags as tag}
    <button class={`rounded-full px-3 py-1 text-sm ${activeTag === tag ? 'bg-primary text-white' : 'bg-slate-200'}`} onclick={() => (activeTag = tag)}>{tag}</button>
  {/each}
</div>

<div class="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
  {#each filtered as item}
    {#if item.type === 'image'}
      <MediaSkeleton src={item.src} sources={item.srcVariants} alt={item.alt} containerClass="rounded-xl border border-slate-200" mediaClass="h-64 object-cover" />
    {:else if item.type === 'video'}
      <MediaSkeleton type="video" src={item.src} poster={item.poster || ''} containerClass="overflow-hidden rounded-xl border border-slate-200" mediaClass="aspect-video bg-black" />
    {/if}
  {/each}
</div>
