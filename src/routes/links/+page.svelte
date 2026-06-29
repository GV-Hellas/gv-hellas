<script lang="ts">
    import {t, locale} from '$lib/i18n';
    import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
    import LinkIcon from '@lucide/svelte/icons/link';

    type Lang = 'el' | 'de';
    type LocalizedText = Partial<Record<Lang, string>> | string | undefined;

    type LinkItem = {
        id?: number;
        name: Partial<Record<Lang, string>>;
        descriptionHtml?: Partial<Record<Lang, string>>;
        url: string;
        logo?: string;
        logoVariants?: {
            webp?: string;
            jpg?: string;
        };
    };

    let {data}: { data?: { links?: LinkItem[] } } = $props();

    let lang = $derived((($locale === 'de' ? 'de' : 'el') as Lang));
    let links = $derived((data?.links ?? []).filter((link) => Boolean(link.url)));

    function localized(value: LocalizedText) {
        if (!value) return '';
        if (typeof value === 'string') return value;

        return value[lang] || value.el || value.de || '';
    }

    function logoSrc(link: LinkItem) {
        return link.logoVariants?.webp || link.logo || link.logoVariants?.jpg || '';
    }

    function title(link: LinkItem) {
        return localized(link.name) || link.url;
    }
</script>

<svelte:head>
    <title>{$t('links.headline')} - Griechischer Verein Hellas</title>
</svelte:head>

<section class="mx-auto max-w-5xl">
    <header class="mb-8">
        <h1 class="text-3xl font-bold">
            {$t('links.headline')}
        </h1>

        <p class="mt-2 max-w-2xl text-sm text-slate-500">
            {$t('links.subtitle')}
        </p>
    </header>

    {#if links.length}
        <div class="grid gap-4 sm:grid-cols-2">
            {#each links as link (link.id ?? link.url)}
                <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                    <div class="flex items-start gap-4">
                        {#if logoSrc(link)}
                            <img
                                    src={logoSrc(link)}
                                    alt={title(link)}
                                    loading="lazy"
                                    class="size-16 shrink-0 rounded-xl border border-slate-100 bg-white object-contain p-1"
                            />
                        {:else}
                            <div class="flex size-16 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                                <LinkIcon class="size-6"/>
                            </div>
                        {/if}

                        <div class="min-w-0 flex-1">
                            <a
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    class="group inline-flex max-w-full items-center gap-1.5 text-lg font-semibold text-primary hover:underline"
                            >
                                <span class="truncate">
                                    {title(link)}
                                </span>

                                <ExternalLinkIcon class="size-4 shrink-0 transition group-hover:translate-x-0.5"/>
                            </a>

                            {#if localized(link.descriptionHtml)}
                                <div class="mt-2 line-clamp-4 text-sm leading-6 text-slate-600">
                                    {@html localized(link.descriptionHtml)}
                                </div>
                            {/if}

                            <p class="mt-3 truncate text-xs text-slate-400">
                                {link.url}
                            </p>
                        </div>
                    </div>
                </article>
            {/each}
        </div>
    {:else}
        <div class="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
            <div class="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
                <LinkIcon class="size-6"/>
            </div>

            <p class="font-medium text-slate-700">
                {$t('links.empty')}
            </p>
        </div>
    {/if}
</section>