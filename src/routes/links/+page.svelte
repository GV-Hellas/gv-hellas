<script lang="ts">
    import {t, locale} from '$lib/i18n';

    let {data} = $props();
    let lang = $derived(($locale || 'el') as string);
</script>

<svelte:head>
    <title>{$t('links.headline')} - GV Hellas</title>
</svelte:head>

<h1 class="mb-6 text-3xl font-bold">{$t('links.headline')}</h1>

<ul class="space-y-4">
    {#each data.links as link}
        <li class="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3">
            {#if link.logo}<img src={link.logo} alt="logo" class="h-10 w-10 rounded object-cover"/>{/if}
            <a href={link.url} target="_blank" rel="noopener" class="text-primary-dark hover:underline">
                {link.name[lang] || link.name.el || link.name}
            </a>
        </li>
    {/each}
</ul>
