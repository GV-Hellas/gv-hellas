<script lang="ts">
    import LinkForm from '$lib/components/cms/LinkForm.svelte';

    let {data} = $props();
</script>

<svelte:head>
    <title>Edit link | Griechischer Verein Hellas</title>
</svelte:head>

<LinkForm
        mode="edit"
        submitTo="?/save"
        initialItem={data.item}
/>