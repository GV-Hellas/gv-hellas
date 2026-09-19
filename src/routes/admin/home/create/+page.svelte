<script lang="ts">
    import {t} from '$lib/i18n';
    import HomepageSlideForm from '$lib/components/cms/HomepageSlideForm.svelte';

    type ActionResponse = {
        ok?: boolean;
        id?: number;
        errorKey?: string;
        message?: string;
    };

    let {form}: {form?: ActionResponse | null} = $props();
</script>

<svelte:head>
    <title>{$t('admin.homepage.createTitle')} | Griechischer Verein Hellas</title>
</svelte:head>

<HomepageSlideForm mode="create" {form} />
