<script>
  import { t } from '$lib/i18n';
  export let data;
</script>

<h1 class="text-3xl font-bold mb-6">{$t('businesses.headline')}</h1>
<p class="mb-6">{$t('businesses.thanks')}</p>

<ul class="space-y-2">
  {#each data.businesses as biz}
    <li>
      <a href={biz.url} target="_blank" rel="noopener" class="text-primary hover:underline">
        {biz.name}
      </a>
    </li>
  {/each}
</ul>