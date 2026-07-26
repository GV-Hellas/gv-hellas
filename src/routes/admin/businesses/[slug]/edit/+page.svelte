<script lang="ts">
    import {t} from '$lib/i18n';
    import type {BusinessPayload} from '$lib/cms/business/types';
    import BusinessForm from '$lib/components/cms/BusinessForm.svelte';

    let {data}: {data: {business: BusinessPayload}} = $props();
</script>

<svelte:head>
    <title>{$t('admin.businesses.form.editBusiness')} | Griechischer Verein Hellas</title>
</svelte:head>

<BusinessForm
    mode="edit"
    submitTo="?/save"
    initialBusiness={data.business}
/>
