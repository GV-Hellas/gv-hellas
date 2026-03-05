<script lang="ts">
  import { t, locale } from '$lib/i18n';

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
      <div class="mb-6 overflow-hidden rounded shadow-lg">
        <img
                src={event.image}
                alt={event.title[lang]}
                class="w-full max-h-96 object-cover"
        />
      </div>
    {/if}

    <div class="prose max-w-none">
      {@html event.content[lang]}
    </div>
  </article>
{:else}
  <div class="text-center py-12">
    <p class="text-xl text-gray-600">Event not found / Η εκδήλωση δεν βρέθηκε.</p>
    <a href="/events" class="text-primary hover:underline mt-4 inline-block">
      {$t('events.headline')}
    </a>
  </div>
{/if}