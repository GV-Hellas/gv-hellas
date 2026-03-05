<script lang="ts">
  import { t, locale } from '$lib/i18n';
  import MediaSkeleton from '$lib/components/MediaSkeleton.svelte';

  /** @type {import('./$types').PageProps} */
  let { data } = $props();

  // Svelte 5: Use $derived to ensure lang updates reactively with the locale store
  let lang = $derived($locale);

  // Svelte 5: Access the event from the destructured data prop
  let event = $derived(data.event);
</script>

{#if event}
  <article class="max-w-4xl mx-auto">
    <h1 class="text-3xl font-bold mb-4">{event.title[lang]}</h1>

    <p class="text-sm text-gray-500 mb-4">
      {new Date(event.date).toLocaleDateString(lang === 'de' ? 'de-CH' : 'el-GR')}
    </p>

    {#if event.image}
      <MediaSkeleton
        src={event.image}
        sources={event.imageVariants}
        alt={event.title[lang]}
        containerClass="mb-6 rounded-xl border border-slate-200"
        mediaClass="max-h-96 object-cover"
      />
    {/if}

    <div class="prose max-w-none">
      {@html event.content[lang]}
    </div>
    {#if event.mediaBlocks?.length}
      <section class="my-6 space-y-4">
        {#each event.mediaBlocks as block}
          {#if block.type === 'image'}
            <img src={block.src} alt={block.alt || ''} class="w-full rounded-xl border border-slate-200" />
          {:else if block.type === 'video'}
            <video controls class="w-full rounded-xl border border-slate-200"><source src={block.src} /></video>
          {:else if block.type === 'carousel'}
            <div class="grid gap-3 md:grid-cols-2">
              {#each block.items || [] as item}
                {#if item.type === 'video'}
                  <video controls class="w-full rounded-xl border border-slate-200"><source src={item.src} /></video>
                {:else}
                  <img src={item.src} alt={item.alt || ''} class="w-full rounded-xl border border-slate-200" />
                {/if}
              {/each}
            </div>
          {/if}
        {/each}
      </section>
    {/if}

  </article>
{:else}
  <div class="text-center py-12">
    <p class="text-xl text-gray-600">Event not found / Η εκδήλωση δεν βρέθηκε.</p>
    <a href="/events" class="text-primary hover:underline mt-4 inline-block">
      {$t('events.headline')}
    </a>
  </div>
{/if}