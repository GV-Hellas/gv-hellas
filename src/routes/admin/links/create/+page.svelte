<script lang="ts">
    import LinkForm from '$lib/components/cms/LinkForm.svelte';
</script>

<svelte:head>
    <title>Create link | Griechischer Verein Hellas</title>
</svelte:head>

<LinkForm mode="create" submitTo="?/save" />