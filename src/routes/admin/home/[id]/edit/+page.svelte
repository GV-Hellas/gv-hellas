<script lang="ts">
    import {t} from '$lib/i18n';
    import type {HomepageSlide} from '$lib/cms/home/types';
    import HomepageSlideForm from '$lib/components/cms/HomepageSlideForm.svelte';

    type ActionResponse = {
        ok?: boolean;
        id?: number;
        errorKey?: string;
        message?: string;
    };

    let {
        data,
        form
    }: {
        data: {item: HomepageSlide};
        form?: ActionResponse | null;
    } = $props();
</script>

<svelte:head>
    <title>{$t('admin.homepage.editTitle')} | Griechischer Verein Hellas</title>
</svelte:head>

<HomepageSlideForm mode="edit" initialItem={data.item} {form} />
