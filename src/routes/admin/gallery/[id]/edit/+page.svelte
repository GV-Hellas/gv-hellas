<script lang="ts">
    import {t} from '$lib/i18n';
    import GalleryForm from '$lib/components/cms/GalleryForm.svelte';

    type GalleryItem = {
        id: string;
        type: 'image' | 'video';
        src480: string;
        src960: string;
        videoSrc: string;
        alt: string;
        tags: string[];
        width: number | null;
        height: number | null;
    };

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
        data: {item: GalleryItem; tags: string[]};
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
