<script>
  import { t } from '../i18n';
  export let event;
  export let lang = 'el';
</script>

<a href={`/events/${event.slug}`} class="block bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition">
  {#if event.image}
    <img src={event.image} alt={event.title[lang]} class="w-full h-48 object-cover" />
  {/if}
  <div class="p-4">
    <h3 class="font-semibold text-lg mb-2">{event.title[lang]}</h3>
    <p class="text-sm text-gray-600 mb-2">{new Date(event.date).toLocaleDateString(lang === 'de' ? 'de-CH' : 'el-GR')}</p>
    <p class="text-sm text-gray-700 line-clamp-3">{event.excerpt[lang]}</p>
    <div class="mt-4 text-primary font-semibold">{$t('events.readMore')}</div>
  </div>
</a>