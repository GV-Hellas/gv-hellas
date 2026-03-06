<script>
  import { t } from '$lib/i18n';
  let { data } = $props();
</script>

<h1 class="mb-6 text-3xl font-bold">{$t('businesses.headline')}</h1>
<p class="mb-6">{$t('businesses.thanks')}</p>

<ul class="grid gap-3 sm:grid-cols-2">
  {#each data.businesses as biz}
    <li class="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3">
      {#if biz.logo}<img src={biz.logo} alt={biz.name} class="h-10 w-10 rounded object-cover" />{/if}
      <a href={biz.url} target="_blank" rel="noopener" class="text-primary hover:underline">{biz.name}</a>
    </li>
  {/each}
</ul>
