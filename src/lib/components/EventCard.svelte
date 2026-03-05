<script>
  import { t } from '$lib/i18n';

  let { event, lang = 'el' } = $props();
</script>

<a
  href={`/events/${event.slug}`}
  class="group block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
>
  {#if event.image}
    <img src={event.image} alt={event.title[lang]} class="h-52 w-full object-cover" loading="lazy" />
  {/if}
  <div class="p-5">
    <p class="text-xs font-semibold uppercase tracking-wide text-primary">
      {new Date(event.date).toLocaleDateString(lang === 'de' ? 'de-CH' : 'el-GR')}
    </p>
    <h3 class="mt-2 text-lg font-semibold text-slate-900">{event.title[lang]}</h3>
    <p class="mt-2 text-sm text-slate-600">{event.excerpt[lang]}</p>
    <div class="mt-4 text-sm font-semibold text-primary group-hover:underline">{$t('events.readMore')} →</div>
  </div>
</a>
