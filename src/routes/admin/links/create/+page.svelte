<script lang="ts">
    import {t} from '$lib/i18n';
    import LinkForm from '$lib/components/cms/LinkForm.svelte';
</script>

<svelte:head>
    <title>{$t('admin.links.createTitle')} | Griechischer Verein Hellas</title>
</svelte:head>

<LinkForm mode="create" submitTo="?/save" />