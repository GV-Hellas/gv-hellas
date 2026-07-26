<script lang="ts">
    import {t} from '$lib/i18n';
    import GalleryForm from '$lib/components/cms/GalleryForm.svelte';

    type ActionResponse = {
        ok?: boolean;
        id?: string;
        errorKey?: string;
        message?: string;
    };

    let {
        data,
        form
    }: {
        data: {tags: string[]};
        form?: ActionResponse | null;
    } = $props();
</script>

<svelte:head>
    <title>{$t('admin.gallery.createTitle')} | Griechischer Verein Hellas</title>
</svelte:head>

<GalleryForm
    mode="create"
    existingTags={data.tags}
    {form}
/>
