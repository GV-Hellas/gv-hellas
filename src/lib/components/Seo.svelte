<script lang="ts">
    import {page} from '$app/state';

    const SITE_NAME = 'Griechischer Verein Hellas';
    const SITE_URL = 'https://gv-hellas.ch';
    const DEFAULT_IMAGE = `${SITE_URL}/images/logo.png`;

    let {
        title,
        description,
        image = DEFAULT_IMAGE,
        type = 'website',
        noindex = false
    }: {
        title: string;
        description: string;
        image?: string;
        type?: 'website' | 'article' | 'profile';
        noindex?: boolean;
    } = $props();

    const normalizedTitle = $derived(title.trim() || SITE_NAME);
    const fullTitle = $derived(
        normalizedTitle === SITE_NAME || normalizedTitle.includes(SITE_NAME)
            ? normalizedTitle
            : `${normalizedTitle} | ${SITE_NAME}`
    );
    const normalizedDescription = $derived(description.replace(/\s+/g, ' ').trim().slice(0, 180));
    const canonical = $derived(new URL(page.url.pathname || '/', SITE_URL).toString());
    const socialImage = $derived(new URL(image || DEFAULT_IMAGE, SITE_URL).toString());
</script>

<svelte:head>
    <title>{fullTitle}</title>
    <meta name="description" content={normalizedDescription} />
    <link rel="canonical" href={canonical} />

    <meta property="og:site_name" content={SITE_NAME} />
    <meta property="og:type" content={type} />
    <meta property="og:title" content={fullTitle} />
    <meta property="og:description" content={normalizedDescription} />
    <meta property="og:url" content={canonical} />
    <meta property="og:image" content={socialImage} />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={fullTitle} />
    <meta name="twitter:description" content={normalizedDescription} />
    <meta name="twitter:image" content={socialImage} />

    {#if noindex}
        <meta name="robots" content="noindex, nofollow" />
    {:else}
        <meta name="robots" content="index, follow, max-image-preview:large" />
    {/if}
</svelte:head>
