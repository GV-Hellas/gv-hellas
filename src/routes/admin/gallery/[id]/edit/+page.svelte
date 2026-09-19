<script lang="ts">
    import {t} from '$lib/i18n';
    import GalleryForm from '$lib/components/cms/GalleryForm.svelte';
    import type {GalleryItem, GalleryTag} from '$lib/cms/gallery/types';

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
        data: {item: GalleryItem; tags: GalleryTag[]};
        form?: ActionResponse | null;
    } = $props();
</script>

<svelte:head>
    <title>{$t('admin.gallery.editTitle')} | Griechischer Verein Hellas</title>
</svelte:head>

<GalleryForm
    mode="edit"
    initialItem={data.item}
    existingTags={data.tags}
    {form}
/>
