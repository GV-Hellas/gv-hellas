<script lang="ts">
    import {t, locale} from '$lib/i18n';

    type Lang = 'el' | 'de';

    type LinkItem = {
        id?: number;
        name: {
            el?: string;
            de?: string;
        };
        descriptionHtml?: {
            el?: string;
            de?: string;
        };
        url: string;
        logo?: string;
        logoVariants?: {
            webp?: string;
            jpg?: string;
        };
    };

    let {data}: {data?: {links?: LinkItem[]}} = $props();

    let lang = $derived((($locale === 'de' ? 'de' : 'el') as Lang));
    let links = $derived(data?.links ?? []);

    function localized(value: LinkItem['name'] | LinkItem['descriptionHtml']) {
        return value?.[lang] || value?.el || value?.de || '';
    }

    function logoSrc(link: LinkItem) {
        return link.logoVariants?.webp || link.logo || link.logoVariants?.jpg || '';
    }
</script>

<svelte:head>
    <title>{$t('links.headline')} - Griechischer Verein Hellas</title>
</svelte:head>

<section class="mx-auto max-w-4xl">
    <h1 class="mb-6 text-3xl font-bold">
        {$t('links.headline')}
    </h1>

    {#if links.length}
        <ul class="space-y-4">
            {#each links as link (link.id ?? link.url)}
                <li class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div class="flex items-start gap-4">
                        {#if logoSrc(link)}
                            <img
                                    src={logoSrc(link)}
                                    alt={localized(link.name) || 'Logo'}
                                    loading="lazy"
                                    class="h-14 w-14 shrink-0 rounded-lg object-contain"
                            />
                        {:else}
                            <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm font-semibold text-slate-500">
                                GV
                            </div>
                        {/if}

                        <div class="min-w-0 flex-1">
                            <a
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    class="text-lg font-semibold text-primary hover:underline"
                            >
                                {localized(link.name) || link.url}
                            </a>

                            {#if localized(link.descriptionHtml)}
                                <div class="mt-1 text-sm text-slate-600">
                                    {@html localized(link.descriptionHtml)}
                                </div>
                            {/if}

                            <p class="mt-2 truncate text-xs text-slate-400">
                                {link.url}
                            </p>
                        </div>
                    </div>
                </li>
            {/each}
        </ul>
    {:else}
        <p class="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
            {lang === 'de' ? 'Keine Links vorhanden.' : 'Δεν υπάρχουν σύνδεσμοι.'}
        </p>
    {/if}
</section>