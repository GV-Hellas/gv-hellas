<script>
  import { t } from '$lib/i18n';
  let { data } = $props();
</script>

<h1 class="mb-6 text-3xl font-bold">{$t('equipment.headline')}</h1>

{#if !data.equipment?.length}
  <p>{$t('equipment.description')}</p>
{:else}
  <div class="grid gap-4 md:grid-cols-2">
    {#each data.equipment as item}
      <article class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 class="text-xl font-semibold">{item.name}</h2>
        <p class="mt-1 text-sm text-slate-600">{item.brand} {item.modelYear}</p>
        <p class="mt-2 text-sm">{item.description}</p>
        <p class="mt-3 font-semibold">CHF {item.pricePerDay} / day</p>
      </article>
    {/each}
  </div>
{/if}
