<script lang="ts">
    import {t} from '$lib/i18n';
    import LinkForm from '$lib/components/cms/LinkForm.svelte';

    type Lang = 'el' | 'de';

    type LinkItem = {
        id: number;
        name: Partial<Record<Lang, string>>;
        descriptionHtml?: Partial<Record<Lang, string>>;
        url: string;
        logo?: string;
        logoVariants?: {
            webp?: string;
            jpg?: string;
        };
    };

    let {data}: {data: {item: LinkItem}} = $props();
</script>

<svelte:head>
    <title>{$t('admin.links.editTitle')} | Griechischer Verein Hellas</title>
</svelte:head>

<LinkForm
        mode="edit"
        submitTo="?/save"
        initialItem={data.item}
/>