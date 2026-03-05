<script lang="ts">
    import {t, locale} from '$lib/i18n';

    /** @type {import('./$types').PageProps} */
    let {data} = $props();

    // Svelte 5: Use $derived to react to locale changes
    let lang = $derived($locale);
</script>

<h1 class="text-3xl font-bold mb-6">{$t('links.headline')}</h1>

<ul class="space-y-4 list-disc list-inside">
    {#each data.links as link}
        <li>
            <a
                    href={link.url}
                    target="_blank"
                    rel="noopener"
                    class="text-primary hover:underline"
            >
                {link.name[lang] || link.name.el || link.name}
            </a>
        </li>
    {/each}
</ul>